// ============================================================
// Smart Konstruksi — Payment Detail API
// GET /api/payments/[id] — Get payment by ID
// PUT /api/payments/[id] — Update payment
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  AuthenticatedUser,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// ==================== SCOPE FILTER ====================

/**
 * Check if user has access to a specific payment via invoice → project scope.
 */
async function canAccessPayment(
  user: AuthenticatedUser,
  invoiceId: string
): Promise<boolean> {
  // Global roles see everything
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return true;
  }

  // Get invoice with project info
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      projectId: true,
      project: {
        select: {
          branchId: true,
          clientId: true,
        },
      },
    },
  });

  if (!invoice) return false;

  // Branch-scoped roles
  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    return user.branchId === invoice.project.branchId;
  }

  // Project-scoped roles: check membership
  const PROJECT_ROLES = [
    "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER",
    "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
    "INTERIOR_DESIGNER", "KONSULTAN",
  ];
  if (PROJECT_ROLES.includes(user.role)) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: invoice.projectId,
          userId: user.id,
        },
      },
    });
    return !!member;
  }

  // Own-scope roles: check client ownership
  if (["CLIENT", "VENDOR", "HOME_OWNER"].includes(user.role)) {
    if (user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return client?.id === invoice.project.clientId;
    }
    return false;
  }

  return false;
}

// ==================== GET /api/payments/[id] ====================

export const GET = withPermission(
  "payment:read",
  async (request, { user }) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();

      if (!id) {
        return apiError(new Error("Payment ID is required"));
      }

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNo: true,
              amount: true,
              status: true,
              issuedAt: true,
              dueDate: true,
              paidAt: true,
              project: {
                select: { id: true, name: true, code: true, branchId: true },
              },
            },
          },
          confirmedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!payment) {
        return apiError(new Error("Payment not found"));
      }

      // Scope check
      const hasAccess = await canAccessPayment(user, payment.invoiceId);
      if (!hasAccess) {
        return apiError(new Error("Access denied"));
      }

      return apiSuccess(payment);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== PUT /api/payments/[id] ====================

export const PUT = withPermission(
  "payment:create",
  async (request, { user }) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();

      if (!id) {
        return apiError(new Error("Payment ID is required"));
      }

      // Check payment exists
      const existingPayment = await prisma.payment.findUnique({
        where: { id },
        select: { id: true, invoiceId: true },
      });

      if (!existingPayment) {
        return apiError(new Error("Payment not found"));
      }

      // Scope check
      const hasAccess = await canAccessPayment(user, existingPayment.invoiceId);
      if (!hasAccess) {
        return apiError(new Error("Access denied"));
      }

      const body = await request.json();
      const { amount, method, proofUrl, paidAt, confirmedById } = body;

      // Build update data
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (amount !== undefined) {
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          return apiError(new Error("Amount must be a positive number"));
        }
        updateData.amount = amountNum;
      }

      if (method !== undefined) updateData.method = method;
      if (proofUrl !== undefined) updateData.proofUrl = proofUrl;
      if (paidAt !== undefined) updateData.paidAt = new Date(paidAt);

      // Confirmation fields (for verify/reconcile workflows)
      if (confirmedById !== undefined) {
        updateData.confirmedById = confirmedById;
        updateData.confirmedAt = new Date();
      }

      const payment = await prisma.payment.update({
        where: { id },
        data: updateData,
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
      });

      // If amount changed, re-check invoice payment status
      if (amount !== undefined) {
        const totalPaid = await prisma.payment.aggregate({
          where: { invoiceId: existingPayment.invoiceId },
          _sum: { amount: true },
        });

        const invoice = await prisma.invoice.findUnique({
          where: { id: existingPayment.invoiceId },
          select: { amount: true, status: true },
        });

        if (invoice) {
          const totalPaidAmount = Number(totalPaid._sum.amount || 0);
          const invoiceAmount = Number(invoice.amount);

          if (totalPaidAmount >= invoiceAmount && invoice.status !== "PAID") {
            await prisma.invoice.update({
              where: { id: existingPayment.invoiceId },
              data: { status: "PAID", paidAt: new Date() },
            });
          }
        }
      }

      return apiSuccess(payment);
    } catch (error) {
      return apiError(error);
    }
  }
);
