// ============================================================
// Smart Konstruksi — RAB Detail API (GET, PUT, DELETE)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError, checkPermission } from "@/lib/rbac/guard";
import { updateRABSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";
import { logAudit, pickAuditFields } from "@/lib/audit-log";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/rab/[id] — Get RAB detail with items
export const GET = withPermission(
  "rab:read",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("RAB ID is required"));

      const rab = await prisma.rAB.findFirst({
        where: { id, deletedAt: null },
        include: {
          lead: {
            select: { id: true, name: true, company: true, phone: true, email: true, location: true },
          },
          items: {
            orderBy: [{ section: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      if (!rab) {
        return Response.json(
          { error: "RAB not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      return apiSuccess(rab);
    } catch (error) {
      return apiError(error);
    }
  }
);

// PUT /api/rab/[id] — Update RAB
//   edit content / submit → rab:update
//   approve / reject → approval:approve / approval:reject
export const PUT = withPermission(
  "rab:read",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("RAB ID is required"));

      const existing = await prisma.rAB.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return Response.json(
          { error: "RAB not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Only DRAFT can be edited (or SUPER_ADMIN/OWNER bypass)
      if (existing.status !== "DRAFT" && !["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        return Response.json(
          { error: "Only DRAFT RAB can be edited", code: "INVALID_STATUS" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const parsed = validateOrRespond(updateRABSchema, body);
      if (parsed instanceof Response) return parsed;

      // ── Action-based permission check ──
      const isApproveOrReject = parsed.status === "APPROVED" || parsed.status === "REJECTED";

      if (isApproveOrReject) {
        // Approve/reject requires dedicated approval permissions
        if (parsed.status === "APPROVED" && !checkPermission(user.role, "approval:approve")) {
          return Response.json(
            { error: "Not authorized to approve RAB", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
        if (parsed.status === "REJECTED" && !checkPermission(user.role, "approval:reject")) {
          return Response.json(
            { error: "Not authorized to reject RAB", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
      } else if (!checkPermission(user.role, "rab:update")) {
        // Editing content or submitting for approval requires rab:update
        return Response.json(
          { error: "Not authorized to edit RAB", code: "FORBIDDEN" },
          { status: 403 }
        );
      }

      const updateData: any = {};
      if (parsed.title !== undefined) updateData.title = parsed.title;
      if (parsed.notes !== undefined) updateData.notes = parsed.notes;
      if (parsed.leadId !== undefined) updateData.leadId = parsed.leadId;
      if (parsed.marginPercent !== undefined) updateData.marginPercent = parsed.marginPercent;
      if (parsed.status !== undefined) {
        updateData.status = parsed.status;
        if (parsed.status === "PENDING_APPROVAL") {
          updateData.version = existing.version + 1;
        }
      }
      updateData.updatedBy = user.id;

      const rab = await prisma.rAB.update({
        where: { id },
        data: updateData,
        include: {
          lead: {
            select: { id: true, name: true, company: true },
          },
          items: {
            orderBy: [{ section: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      await logAudit(user.id, "UPDATE", "RAB", rab.id, pickAuditFields(existing, ['code', 'title', 'status', 'total', 'marginPercent']), pickAuditFields(rab, ['code', 'title', 'status', 'total', 'marginPercent']));

      return apiSuccess(rab);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/rab/[id] — Soft delete RAB
export const DELETE = withPermission(
  "rab:update",
  async (request, { user }) => {
    try {
      const id = extractIdFromPath(request.url);
      if (!id) return apiError(new Error("RAB ID is required"));

      const existing = await prisma.rAB.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existing) {
        return Response.json(
          { error: "RAB not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Only DRAFT can be deleted (or SUPER_ADMIN/OWNER)
      if (existing.status !== "DRAFT" && !["SUPER_ADMIN", "OWNER"].includes(user.role)) {
        return Response.json(
          { error: "Only DRAFT RAB can be deleted", code: "INVALID_STATUS" },
          { status: 400 }
        );
      }

      await prisma.rAB.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      await logAudit(user.id, "DELETE", "RAB", id, pickAuditFields(existing, ['code', 'title', 'status', 'total', 'marginPercent']), null);

      return apiSuccess({ message: "RAB deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
