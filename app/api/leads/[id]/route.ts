// ============================================================
// Smart Konstruksi — Lead API (Detail / Update / Soft Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { Prisma } from "@prisma/client";
import { createLeadSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";
import { logAudit, stripAuditData, pickAuditFields } from "@/lib/audit-log";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/leads/[id] — Get lead detail (lead:read)
export const GET = withPermission(
  "lead:read",
  async (request, { user }) => {
    try {
      const leadId = extractIdFromPath(request.url);

      if (!leadId) {
        return apiError(new Error("Lead ID is required"));
      }

      const lead = await prisma.lead.findFirst({
        where: {
          id: leadId,
          deletedAt: null,
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      if (!lead) {
        return apiError(new Error("Lead not found"));
      }

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  }
);

// PUT /api/leads/[id] — Update lead (lead:update)
export const PUT = withPermission(
  "lead:update",
  async (request, { user }) => {
    try {
      const leadId = extractIdFromPath(request.url);

      if (!leadId) {
        return apiError(new Error("Lead ID is required"));
      }

      const existing = await prisma.lead.findFirst({
        where: { id: leadId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Lead not found"));
      }

      const body = await request.json();
      const parsed = validateOrRespond(createLeadSchema.partial(), body);
      if (parsed instanceof Response) return parsed;

      const { name, company, phone, email, source, status, type, budgetMin, budgetMax, location, notes, assignedTo, branchId } = parsed;

      // Build update data — only include fields that are provided
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (name !== undefined) updateData.name = name.trim();
      if (company !== undefined) updateData.company = company || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (email !== undefined) updateData.email = email || null;
      if (source !== undefined) updateData.source = source || null;
      if (status !== undefined) updateData.status = status;
      if (type !== undefined) updateData.type = type || null;
      if (budgetMin !== undefined) updateData.budgetMin = new Prisma.Decimal(budgetMin);
      if (budgetMax !== undefined) updateData.budgetMax = new Prisma.Decimal(budgetMax);
      if (location !== undefined) updateData.location = location || null;
      if (notes !== undefined) updateData.notes = notes || null;
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
      if (branchId !== undefined) updateData.branchId = branchId || null;

      const lead = await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      // Audit log
      await logAudit(user.id, "UPDATE", "Lead", leadId, stripAuditData(existing), pickAuditFields(lead, ['name', 'company', 'status', 'type', 'phone', 'email']));

      return apiSuccess(lead);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/leads/[id] — Soft delete lead (lead:delete)
export const DELETE = withPermission(
  "lead:delete",
  async (request, { user }) => {
    try {
      const leadId = extractIdFromPath(request.url);

      if (!leadId) {
        return apiError(new Error("Lead ID is required"));
      }

      const existing = await prisma.lead.findFirst({
        where: { id: leadId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Lead not found"));
      }

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      // Audit log
      await logAudit(user.id, "DELETE", "Lead", leadId, stripAuditData(existing), null);

      return apiSuccess({ message: "Lead deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
