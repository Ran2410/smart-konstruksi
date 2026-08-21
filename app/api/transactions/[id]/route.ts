// ============================================================
// Smart Konstruksi — Transaction Detail API
// GET /api/transactions/[id] — Get transaction
// DELETE /api/transactions/[id] — Soft delete (reverse stock)
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError, ForbiddenError } from "@/lib/rbac/guard";
import { userCanAccessProject } from "@/lib/rbac/resource-access";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// Recalculate project actualCost from all OUT transactions
async function recalcProjectActualCost(projectId: string) {
  const agg = await prisma.transaction.aggregate({
    where: { projectId, type: "OUT" },
    _sum: { totalCost: true },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { actualCost: agg._sum.totalCost ?? 0 },
  });
}

export const GET = withPermission("material:read", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: {
        material: { select: { id: true, name: true, unit: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });
    if (!tx) return apiError(new Error("Transaction not found"));
    const canAccess = tx.projectId
      ? await userCanAccessProject(user, tx.projectId)
      : ["SUPER_ADMIN", "OWNER"].includes(user.role) || tx.createdBy === user.id;
    if (!canAccess) {
      return apiError(new ForbiddenError("You don't have permission to access this transaction"));
    }
    return apiSuccess(tx);
  } catch (error) {
    return apiError(error);
  }
});

export const DELETE = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return apiError(new Error("Transaction not found"));

    const canAccess = tx.projectId
      ? await userCanAccessProject(user, tx.projectId)
      : ["SUPER_ADMIN", "OWNER"].includes(user.role) || tx.createdBy === user.id;
    if (!canAccess) {
      return apiError(new ForbiddenError("You don't have permission to delete this transaction"));
    }

    // Reverse stock
    const material = await prisma.material.findFirst({
      where: { id: tx.materialId, deletedAt: null },
    });
    if (material) {
      const newStock = tx.type === "IN"
        ? Number(material.stock) - tx.qty
        : Number(material.stock) + tx.qty;

      await prisma.material.update({
        where: { id: tx.materialId },
        data: {
          stock: Math.max(0, newStock),
          updatedBy: user.id,
        },
      });
    }

    // Delete transaction
    await prisma.transaction.delete({ where: { id } });

    // Recalc project
    if (tx.type === "OUT" && tx.projectId) {
      await recalcProjectActualCost(tx.projectId);
    }

    // Audit log
    await logAudit(user.id, "DELETE", "Transaction", tx.id, pickAuditFields(tx, ['type', 'totalCost', 'notes', 'date', 'purpose']), null);

    return apiNoContent();
  } catch (error) {
    return apiError(error);
  }
});
