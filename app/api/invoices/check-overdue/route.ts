// ============================================================
// Smart Konstruksi — Auto Overdue Detection
// GET /api/invoices/check-overdue — Check & update overdue invoices
// ============================================================
// Usage:
//   - Manual:   GET /api/invoices/check-overdue (requires SUPER_ADMIN or FINANCE)
//   - Cron job: curl -X GET https://your-domain.com/api/invoices/check-overdue
//     using HERMES_API_KEY or a scheduled task
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

export const GET = withPermission(
  "invoice:read",
  async (request, { user }) => {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // Find all SENT invoices past their due date
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          status: "SENT",
          dueDate: { lt: now },
          deletedAt: null,
        },
        select: { id: true, invoiceNo: true, dueDate: true, projectId: true },
      });

      if (overdueInvoices.length === 0) {
        return apiSuccess({
          message: "No overdue invoices found",
          updated: 0,
        });
      }

      // Update all to OVERDUE
      const ids = overdueInvoices.map((inv) => inv.id);
      await prisma.invoice.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "OVERDUE",
          updatedBy: user.id,
        },
      });

      return apiSuccess({
        message: `${overdueInvoices.length} invoice(s) marked as overdue`,
        updated: overdueInvoices.length,
        invoices: overdueInvoices.map((inv) => ({
          invoiceNo: inv.invoiceNo,
          dueDate: inv.dueDate,
        })),
      });
    } catch (error) {
      console.error("Overdue check error:", error);
      return apiError(error);
    }
  }
);
