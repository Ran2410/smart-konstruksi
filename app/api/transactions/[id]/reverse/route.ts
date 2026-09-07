// ============================================================
// Smart Konstruksi — Reverse an immutable stock transaction
// POST /api/transactions/[id]/reverse
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import { withPermission, apiCreated } from "@/lib/api/with-auth";
import { apiError, ForbiddenError } from "@/lib/rbac/guard";
import { userCanAccessProject } from "@/lib/rbac/resource-access";

function extractTransactionId(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[parts.length - 2] || "";
}

export const POST = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractTransactionId(request.url);
    const body = await request.json().catch(() => ({}));
    const reason = typeof body.reason === "string" ? body.reason.trim() : "Correction requested";

    if (!id) return Response.json({ error: "Transaction ID is required" }, { status: 400 });
    if (reason.length < 3 || reason.length > 500) {
      return Response.json({ error: "Reversal reason must be between 3 and 500 characters" }, { status: 400 });
    }

    const original = await prisma.transaction.findUnique({
      where: { id },
      include: { reversal: { select: { id: true } } },
    });
    if (!original) return Response.json({ error: "Transaction not found" }, { status: 404 });
    if (original.reversalOfId) {
      return Response.json({ error: "A reversal entry cannot be reversed" }, { status: 409 });
    }
    if (original.reversedAt || original.reversal) {
      return Response.json({ error: "Transaction has already been reversed" }, { status: 409 });
    }

    const canAccess = original.projectId
      ? await userCanAccessProject(user, original.projectId)
      : ["SUPER_ADMIN", "OWNER"].includes(user.role) || original.createdBy === user.id;
    if (!canAccess) {
      return apiError(new ForbiddenError("You don't have permission to reverse this transaction"));
    }

    const reversal = await prisma.$transaction(async (db) => {
      const material = await db.material.findFirst({
        where: { id: original.materialId, deletedAt: null },
      });
      if (!material) throw new Error("Material not found or archived");

      const currentStock = Number(material.stock);
      let newStock: number;
      let newAvgPrice = Number(material.avgPrice);

      if (original.type === "IN") {
        if (currentStock < original.qty) {
          throw new Error(`Cannot reverse receipt: only ${currentStock} ${material.unit} remains in stock`);
        }
        newStock = currentStock - original.qty;
        const remainingValue = currentStock * newAvgPrice - original.qty * Number(original.price ?? 0);
        newAvgPrice = newStock > 0 ? Math.max(0, remainingValue / newStock) : 0;
      } else {
        newStock = currentStock + original.qty;
      }

      const created = await db.transaction.create({
        data: {
          type: original.type === "IN" ? "OUT" : "IN",
          purpose: "ADJUSTMENT",
          materialId: original.materialId,
          qty: original.qty,
          price: original.price,
          totalCost: original.totalCost,
          projectId: original.projectId,
          date: new Date(),
          notes: `Reversal of transaction ${original.id}: ${reason}`,
          reversalOfId: original.id,
          reversalReason: reason,
          createdBy: user.id,
        },
        include: {
          material: { select: { id: true, name: true, unit: true } },
          project: { select: { id: true, name: true, code: true } },
        },
      });

      await db.transaction.update({
        where: { id: original.id },
        data: { reversedAt: new Date(), reversedBy: user.id, reversalReason: reason },
      });
      await db.material.update({
        where: { id: original.materialId },
        data: { stock: newStock, avgPrice: newAvgPrice, updatedBy: user.id },
      });

      if (original.type === "OUT" && original.projectId) {
        const cost = await db.transaction.aggregate({
          where: {
            projectId: original.projectId,
            type: "OUT",
            reversedAt: null,
            reversalOfId: null,
          },
          _sum: { totalCost: true },
        });
        await db.project.update({
          where: { id: original.projectId },
          data: { actualCost: cost._sum.totalCost ?? 0 },
        });
      }

      return created;
    });

    await logAudit(
      user.id,
      "UPDATE",
      "Transaction",
      original.id,
      pickAuditFields(original, ["type", "totalCost", "notes", "date", "purpose"]),
      { reversedAt: new Date().toISOString(), reversalId: reversal.id, reversalReason: reason }
    );

    return apiCreated({ data: reversal });
  } catch (error) {
    return apiError(error);
  }
});
