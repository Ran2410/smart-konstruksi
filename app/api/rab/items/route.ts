// ============================================================
// Smart Konstruksi — RAB Items API (Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiCreated } from "@/lib/api/with-auth";
import { apiError, canAccessRAB, ForbiddenError } from "@/lib/rbac/guard";
import { createRABItemSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// POST /api/rab/items — Create RAB item (rab:update)
export const POST = withPermission(
  "rab:update",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = validateOrRespond(createRABItemSchema, body);
      if (parsed instanceof Response) return parsed;

      const { rabId, section, name, unit, qty, unitPrice } = parsed;

      // Verify RAB exists and is DRAFT
      const rab = await prisma.rAB.findFirst({
        where: { id: rabId, deletedAt: null },
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

      if (rab.status !== "DRAFT") {
        return Response.json(
          { error: "Can only add items to DRAFT RAB", code: "INVALID_STATUS" },
          { status: 400 }
        );
      }

      const total = (qty * unitPrice).toFixed(2);

      const item = await prisma.rABItem.create({
        data: {
          rabId,
          section,
          name,
          unit,
          qty: qty,
          unitPrice: unitPrice,
          total: total,
          createdBy: user.id,
        },
      });

      // Recalculate RAB total
      const items = await prisma.rABItem.findMany({ where: { rabId } });
      const newTotal = items.reduce((sum, i) => sum + Number(i.total), 0);

      await prisma.rAB.update({
        where: { id: rabId },
        data: { total: newTotal.toFixed(2) },
      });

      return apiCreated(item);
    } catch (error) {
      return apiError(error);
    }
  }
);
