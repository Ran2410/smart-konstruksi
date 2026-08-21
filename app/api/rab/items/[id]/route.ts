// ============================================================
// Smart Konstruksi — RAB Items API (Update, Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError, canAccessRAB, ForbiddenError } from "@/lib/rbac/guard";
import { updateRABItemSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// Helper: recalculate RAB total from items
async function recalcRABTotal(rabId: string) {
  const items = await prisma.rABItem.findMany({ where: { rabId } });
  const newTotal = items.reduce((sum, i) => sum + Number(i.total), 0);
  await prisma.rAB.update({
    where: { id: rabId },
    data: { total: newTotal.toFixed(2) },
  });
}

// PUT /api/rab/items/[id] — Update RAB item
export const PUT = withPermission(
  "rab:update",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("Item ID is required"));

      const existing = await prisma.rABItem.findUnique({ where: { id } });
      if (!existing) {
        return Response.json(
          { error: "RAB item not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Verify RAB is DRAFT
      const rab = await prisma.rAB.findFirst({
        where: { id: existing.rabId, deletedAt: null },
        include: { lead: { select: { branchId: true, assignedTo: true } } },
      });
      if (!rab) {
        return Response.json(
          { error: "RAB not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (!canAccessRAB(user.role, user.branchId, rab.lead.branchId)) {
        return apiError(new ForbiddenError("You don't have permission to modify this RAB"));
      }

      if (rab.status !== "DRAFT" && !["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        return Response.json(
          { error: "Can only edit items in DRAFT RAB", code: "INVALID_STATUS" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = validateOrRespond(updateRABItemSchema, body);
      if (parsed instanceof Response) return parsed;

      const updateData: any = {};
      if (parsed.section !== undefined) updateData.section = parsed.section;
      if (parsed.name !== undefined) updateData.name = parsed.name;
      if (parsed.unit !== undefined) updateData.unit = parsed.unit;
      if (parsed.qty !== undefined) updateData.qty = parsed.qty;
      if (parsed.unitPrice !== undefined) updateData.unitPrice = parsed.unitPrice;

      // Recalculate total if qty or unitPrice changed
      const finalQty = parsed.qty ?? Number(existing.qty);
      const finalPrice = parsed.unitPrice ?? Number(existing.unitPrice);
      updateData.total = (finalQty * finalPrice).toFixed(2);

      const item = await prisma.rABItem.update({
        where: { id },
        data: updateData,
      });

      // Recalc RAB total
      await recalcRABTotal(existing.rabId);

      return apiSuccess(item);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/rab/items/[id] — Delete RAB item
export const DELETE = withPermission(
  "rab:update",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("Item ID is required"));

      const existing = await prisma.rABItem.findUnique({ where: { id } });
      if (!existing) {
        return Response.json(
          { error: "RAB item not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Verify RAB is DRAFT
      const rab = await prisma.rAB.findFirst({
        where: { id: existing.rabId, deletedAt: null },
        include: { lead: { select: { branchId: true, assignedTo: true } } },
      });
      if (!rab) {
        return Response.json(
          { error: "RAB not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (!canAccessRAB(user.role, user.branchId, rab.lead.branchId)) {
        return apiError(new ForbiddenError("You don't have permission to modify this RAB"));
      }

      if (rab.status !== "DRAFT" && !["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        return Response.json(
          { error: "Can only delete items from DRAFT RAB", code: "INVALID_STATUS" },
          { status: 400 }
        );
      }

      await prisma.rABItem.delete({ where: { id } });

      // Recalc RAB total
      await recalcRABTotal(existing.rabId);

      return apiSuccess({ message: "RAB item deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
