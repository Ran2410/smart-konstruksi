// ============================================================
// Smart Konstruksi — Payments API
// GET /api/payments — List payments (with scope filtering)
// POST /api/payments — Create payment (FINANCE / SUPER_ADMIN)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  AuthenticatedUser,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// ==================== SCOPE FILTER ====================

/**
 * Build scope filter for payments.
 * Payments don't have branchId/members directly — traverse through invoice → project.
 */
function buildPaymentScopeFilter(user: AuthenticatedUser) {
  // Global roles see everything
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return {};
  }

  // Branch-scoped roles: filter by invoice's project's branch
  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    if (user.branchId) {
      return { invoice: { project: { branchId: user.branchId } } };
    }
    return {};
  }

  // Project-scoped roles: filter by project membership via invoice
  const PROJECT_ROLES = [
    "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER",
    "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
    "INTERIOR_DESIGNER", "KONSULTAN",
  ];
  if (PROJECT_ROLES.includes(user.role)) {
    return {
      invoice: { project: { members: { some: { userId: user.id } } } },
    };
  }

  // Own-scope roles: only invoices from their projects
  if (["CLIENT", "VENDOR", "HOME_OWNER"].includes(user.role)) {
    return {
      invoice: { project: { client: { userId: user.id } } },
    };
  }

  return {};
}

// ==================== GET /api/payments ====================

export const GET = withPermission(
  "payment:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = parsePagination(searchParams);

      const invoiceId = searchParams.get("invoiceId") || undefined;
      const projectId = searchParams.get("projectId") || undefined;
      const search = searchParams.get("search") || undefined;

      // Build where clause
      const scopeFilter = buildPaymentScopeFilter(user);
      const where: Record<string, unknown> = {
        ...scopeFilter,
        ...(invoiceId && { invoiceId }),
        ...(projectId && { invoice: { projectId } }),
        ...(search && {
          OR: [
            { invoice: { invoiceNo: { contains: search, mode: "insensitive" } } },
            { invoice: { project: { name: { contains: search, mode: "insensitive" } } } },
          ],
        }),
      };

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNo: true,
                amount: true,
                status: true,
                project: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
            confirmedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
        prisma.payment.count({ where }),
      ]);

      return apiPaginated(payments, total, page, limit);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== POST /api/payments ====================

export const POST = withPermission(
  "payment:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const { invoiceId, amount, method, proofUrl, paidAt, notes } = body;

      // Validate required fields
      if (!invoiceId || !amount || !method) {
        return apiError(
          new Error("Missing required fields: invoiceId, amount, method")
        );
      }

      // Validate amount is a positive number
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return apiError(new Error("Amount must be a positive number"));
      }

      // Verify invoice exists and is not deleted
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        select: {
          id: true,
          amount: true,
          status: true,
          deletedAt: true,
          project: {
            select: { id: true, name: true, branchId: true },
          },
        },
      });

      if (!invoice || invoice.deletedAt) {
        return apiError(new Error("Invoice not found"));
      }

      // Scope check: branch-scoped users can only create payments for their branch
      if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
        if (user.branchId && invoice.project.branchId !== user.branchId) {
          return apiError(
            new Error("Not authorized to create payment for this invoice")
          );
        }
      }

      // Project-scoped users must be a project member
      const PROJECT_ROLES = [
        "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER",
        "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
        "INTERIOR_DESIGNER", "KONSULTAN",
      ];
      if (PROJECT_ROLES.includes(user.role)) {
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: invoice.project.id,
              userId: user.id,
            },
          },
        });
        if (!member) {
          return apiError(
            new Error("Not a member of this project")
          );
        }
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          amount: amountNum,
          method,
          proofUrl: proofUrl || null,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          createdBy: user.id,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              amount: true,
              status: true,
              project: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
      });

      // Check if invoice is now fully paid
      const totalPaid = await prisma.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });

      const totalPaidAmount = Number(totalPaid._sum.amount || 0);
      const invoiceAmount = Number(invoice.amount);

      if (totalPaidAmount >= invoiceAmount) {
        // Invoice fully paid — update status
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { status: "PAID", paidAt: new Date() },
        });
      }

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          projectId: invoice.project.id,
          type: "PAYMENT_CREATED",
          title: "Payment Created",
          message: `Payment of ${amount} created for invoice ${invoice.project.name}`,
          metadata: { paymentId: payment.id, invoiceId, amount: amountNum },
        },
      });

      return apiCreated(payment);
    } catch (error) {
      return apiError(error);
    }
  }
);
