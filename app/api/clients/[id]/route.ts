// ============================================================
// Smart Konstruksi — Client API (Detail / Update / Soft Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError, ForbiddenError } from "@/lib/rbac/guard";
import { logAudit, stripAuditData, pickAuditFields } from "@/lib/audit-log";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/clients/[id] — Get client detail
export const GET = withPermission("project:read", async (request, { user }) => {
  try {
    const clientId = extractIdFromPath(request.url);

    if (!clientId) {
      return apiError(new Error("Client ID is required"));
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, deletedAt: null },
      select: {
        id: true,
        companyName: true,
        address: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
        },
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            progress: true,
            budget: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: {
            projects: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!client) {
      return apiError(new Error("Client not found"));
    }

    // Enforce object-level access control.
    // CLIENT / HOME_OWNER roles are "own-scoped": they may only ever read
    // their own client profile. All other roles with "project:read"
    // (branch / project / global) are entitled to client records.
    if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
      if (client.user.id !== user.id) {
        return apiError(
          new Error("You don't have permission to access this client")
        );
      }
    }

    return apiSuccess(client);
  } catch (error) {
    return apiError(error);
  }
});

// PUT /api/clients/[id] — Update client
export const PUT = withPermission(
  "user:update",
  async (request, { user }) => {
    try {
      const clientId = extractIdFromPath(request.url);

      if (!clientId) {
        return apiError(new Error("Client ID is required"));
      }

      const existing = await prisma.client.findFirst({
        where: { id: clientId, deletedAt: null },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          projects: {
            where: { deletedAt: null },
            select: { branchId: true },
          },
        },
      });

      if (!existing) {
        return apiError(new Error("Client not found"));
      }

      if (
        user.role === "BRANCH_MANAGER" &&
        existing.createdBy !== user.id &&
        !existing.projects.some((project) => project.branchId === user.branchId)
      ) {
        return apiError(new ForbiddenError("You cannot modify a client outside your branch"));
      }

      const body = await request.json();
      const { name, email, phone, companyName, address, isActive, password } = body;

      // Build update data
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (companyName !== undefined) updateData.companyName = companyName.trim();
      if (address !== undefined) updateData.address = address || null;

      // Update client record
      const updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: updateData,
      });

      // Update related user record if provided
      const userUpdateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (name !== undefined) userUpdateData.name = name.trim();
      if (email !== undefined) {
        // Check email uniqueness if changed
        if (email.trim().toLowerCase() !== existing.user.email) {
          const duplicate = await prisma.user.findFirst({
            where: {
              email: email.trim().toLowerCase(),
              deletedAt: null,
              id: { not: existing.user.id },
            },
          });
          if (duplicate) {
            return apiError(new Error("Email already registered"));
          }
        }
        userUpdateData.email = email.trim().toLowerCase();
      }
      if (phone !== undefined) userUpdateData.phone = phone || null;
      if (isActive !== undefined) userUpdateData.isActive = isActive;
      if (password && typeof password === "string" && password.length >= 8) {
        userUpdateData.password = await bcrypt.hash(password, 12);
      }

      if (Object.keys(userUpdateData).length > 1) { // more than just updatedBy
        await prisma.user.update({
          where: { id: existing.user.id },
          data: userUpdateData,
        });
      }

      // Fetch final result
      const result = await prisma.client.findFirst({
        where: { id: clientId },
        select: {
          id: true,
          companyName: true,
          address: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              projects: { where: { deletedAt: null } },
            },
          },
        },
      });

      // Audit log
      await logAudit(user.id, "UPDATE", "Client", clientId, stripAuditData(existing), pickAuditFields(result as Record<string, unknown>, ['companyName', 'contactPerson', 'phone', 'email']));

      return apiSuccess(result);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/clients/[id] — Soft delete client + user
export const DELETE = withPermission(
  "user:delete",
  async (request, { user }) => {
    try {
      const clientId = extractIdFromPath(request.url);

      if (!clientId) {
        return apiError(new Error("Client ID is required"));
      }

      const existing = await prisma.client.findFirst({
        where: { id: clientId, deletedAt: null },
        include: {
          user: { select: { id: true } },
          _count: { select: { projects: { where: { deletedAt: null } } } },
        },
      });

      if (!existing) {
        return apiError(new Error("Client not found"));
      }

      // Prevent deletion if client has active projects
      if (existing._count.projects > 0) {
        return apiError(
          new Error("Cannot delete client with active projects. Archive projects first.")
        );
      }

      // Soft delete both client and user
      await prisma.$transaction([
        prisma.client.update({
          where: { id: clientId },
          data: {
            deletedAt: new Date(),
            deletedBy: user.id,
          },
        }),
        prisma.user.update({
          where: { id: existing.user.id },
          data: {
            deletedAt: new Date(),
            deletedBy: user.id,
            isActive: false,
          },
        }),
      ]);

      // Audit log
      await logAudit(user.id, "DELETE", "Client", clientId, stripAuditData(existing), null);

      return apiSuccess({ message: "Client deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);

export const PATCH = PUT;
