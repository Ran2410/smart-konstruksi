// ============================================================
// Smart Konstruksi — Invoice Detail API (Get + Update)
// GET /api/invoices/[id] — Get invoice by ID
// PUT /api/invoices/[id] — Update invoice (with status transition validation)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

/**
 * Valid status transitions for invoices:
 * - DRAFT → SENT, PAID
 * - SENT → PAID, OVERDUE
 * - OVERDUE → PAID
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SENT", "PAID"],
  SENT: ["PAID", "OVERDUE"],
  OVERDUE: ["PAID"],
};

function isValidTransition(currentStatus: string, newStatus: string): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(newStatus) : false;
}

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// ==================== GET /api/invoices/[id] ====================
export const GET = withPermission("invoice:read", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);

    if (!id) {
      return apiError(new Error("Invoice ID is required"));
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            branchId: true,
            branch: { select: { id: true, name: true } },
            projectManager: { select: { id: true, name: true, email: true } },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            proofUrl: true,
            paidAt: true,
            confirmedBy: { select: { id: true, name: true } },
            confirmedAt: true,
          },
          orderBy: { paidAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return apiError(new Error("Invoice not found"));
    }

    // Calculate total paid amount
    const totalPaid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    return apiSuccess({
      ...invoice,
      totalPaid,
      remainingAmount: Number(invoice.amount) - totalPaid,
    });
  } catch (error) {
    return apiError(error);
  }
});

// ==================== PUT /api/invoices/[id] ====================
export const PUT = withPermission("invoice:update", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);

    if (!id) {
      return apiError(new Error("Invoice ID is required"));
    }

    // Check invoice exists
    const existing = await prisma.invoice.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return apiError(new Error("Invoice not found"));
    }

    const body = await request.json();

    // Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {
      updatedBy: user.id,
    };

    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.issuedAt !== undefined) updateData.issuedAt = new Date(body.issuedAt);
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);

    // Status transition validation
    if (body.status !== undefined && body.status !== existing.status) {
      if (!isValidTransition(existing.status, body.status)) {
        return apiError(
          new Error(
            `Invalid status transition: ${existing.status} → ${body.status}. ` +
              `Allowed transitions from ${existing.status}: ${VALID_TRANSITIONS[existing.status]?.join(", ") || "none"}`
          )
        );
      }
      updateData.status = body.status;

      // Auto-set paidAt when status changes to PAID
      if (body.status === "PAID") {
        updateData.paidAt = new Date();
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        payments: {
          select: { id: true, amount: true, method: true, paidAt: true },
        },
      },
    });

    return apiSuccess(invoice);
  } catch (error) {
    return apiError(error);
  }
});
