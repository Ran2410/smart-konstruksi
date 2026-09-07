// ============================================================
// Smart Konstruksi — Transaction Detail API
// GET /api/transactions/[id] — Get transaction
// DELETE /api/transactions/[id] — Rejected: ledger entries are immutable
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError, ForbiddenError } from "@/lib/rbac/guard";
import { userCanAccessProject } from "@/lib/rbac/resource-access";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
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

    return Response.json(
      {
        error: "Transactions are immutable",
        message: "Use the reversal action to correct this transaction without deleting its audit history.",
        code: "TRANSACTION_IMMUTABLE",
      },
      { status: 409 }
    );
  } catch (error) {
    return apiError(error);
  }
});
