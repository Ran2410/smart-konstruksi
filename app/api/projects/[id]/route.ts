// ============================================================
// Smart Konstruksi — Project API (Detail / Update / Soft Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateProjectSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/projects/[id] — Get project detail (project:read)
export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      const projectId = extractIdFromPath(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          deletedAt: null,
        },
        include: {
          branch: { select: { id: true, name: true } },
          projectManager: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          siteManager: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          client: {
            select: { id: true, companyName: true },
          },
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              user: { select: { id: true, name: true, email: true, avatar: true } },
            },
          },
          _count: {
            select: {
              members: true,
              tasks: true,
              files: true,
              invoices: true,
              approvals: true,
            },
          },
        },
      });

      if (!project) {
        return apiError(new Error("Project not found"));
      }

      return apiSuccess(project);
    } catch (error) {
      return apiError(error);
    }
  }
);

// PUT /api/projects/[id] — Update project (project:update)
export const PUT = withPermission(
  "project:update",
  async (request, { user }) => {
    try {
      const projectId = extractIdFromPath(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      const existing = await prisma.project.findFirst({
        where: { id: projectId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Project not found"));
      }

      const body = await request.json();
      const parsed = validateOrRespond(updateProjectSchema, body);
      if (parsed instanceof Response) return parsed;

      const { name, description, address, startDate, endDate, budget, actualCost, progress, status, branchId, projectManagerId, siteManagerId, clientId } = parsed;

      // Build update data — only include fields that are provided
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description || null;
      if (address !== undefined) updateData.address = address.trim();
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
      if (budget !== undefined) updateData.budget = Number(budget);
      if (actualCost !== undefined) updateData.actualCost = actualCost ? Number(actualCost) : null;
      if (progress !== undefined) updateData.progress = Math.min(100, Math.max(0, Number(progress)));
      if (status !== undefined) updateData.status = status;
      if (branchId !== undefined) updateData.branchId = branchId;
      if (projectManagerId !== undefined) updateData.projectManagerId = projectManagerId;
      if (siteManagerId !== undefined) updateData.siteManagerId = siteManagerId || null;
      if (clientId !== undefined) updateData.clientId = clientId;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          branch: { select: { id: true, name: true } },
          projectManager: {
            select: { id: true, name: true, email: true },
          },
          siteManager: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Audit log
      await logAudit(user.id, "UPDATE", "Project", project.id, pickAuditFields(existing, ['name', 'code', 'status', 'budget', 'startDate', 'endDate']), pickAuditFields(project, ['name', 'code', 'status', 'budget', 'startDate', 'endDate']));

      return apiSuccess(project);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/projects/[id] — Soft delete project (project:delete)
export const DELETE = withPermission(
  "project:delete",
  async (request, { user }) => {
    try {
      const projectId = extractIdFromPath(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      const existing = await prisma.project.findFirst({
        where: { id: projectId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Project not found"));
      }

      await prisma.project.update({
        where: { id: projectId },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
          status: "CANCELLED",
        },
      });

      // Audit log
      await logAudit(user.id, "DELETE", "Project", existing.id, pickAuditFields(existing, ['name', 'code', 'status', 'budget', 'startDate', 'endDate']), null);

      return apiSuccess({ message: "Project deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
