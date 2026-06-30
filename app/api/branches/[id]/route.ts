// ============================================================
// Smart Konstruksi — Branch API (Detail / Update / Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/branches/[id] — Get branch detail (branch:read)
export const GET = withPermission("branch:read", async (request, { user }) => {
  try {
    const branchId = extractIdFromPath(request.url);

    if (!branchId) {
      return apiError(new Error("Branch ID is required"));
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        deletedAt: null,
      },
      include: {
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        _count: { select: { users: true, projects: true } },
      },
    });

    if (!branch) {
      return apiError(new Error("Branch not found"));
    }

    // Scope check: BRANCH_MANAGER can only see own branch
    if (
      user.role === "BRANCH_MANAGER" &&
      branch.id !== user.branchId
    ) {
      return apiError(new Error("Access denied to this branch"));
    }

    return apiSuccess(branch);
  } catch (error) {
    return apiError(error);
  }
});

// PUT /api/branches/[id] — Update branch (branch:update)
export const PUT = withPermission(
  "branch:update",
  async (request, { user }) => {
    try {
      const branchId = extractIdFromPath(request.url);

      if (!branchId) {
        return apiError(new Error("Branch ID is required"));
      }

      const existing = await prisma.branch.findFirst({
        where: { id: branchId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Branch not found"));
      }

      const body = await request.json();
      const { name, address, phone, email } = body;

      // Check name uniqueness if changed
      if (name && name.trim() !== existing.name) {
        const duplicate = await prisma.branch.findFirst({
          where: {
            name: name.trim(),
            deletedAt: null,
            id: { not: branchId },
          },
        });
        if (duplicate) {
          return apiError(new Error("Branch name already exists"));
        }
      }

      const branch = await prisma.branch.update({
        where: { id: branchId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          updatedBy: user.id,
        },
      });

      return apiSuccess(branch);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/branches/[id] — Soft delete branch (branch:delete)
export const DELETE = withPermission(
  "branch:delete",
  async (request, { user }) => {
    try {
      const branchId = extractIdFromPath(request.url);

      if (!branchId) {
        return apiError(new Error("Branch ID is required"));
      }

      const existing = await prisma.branch.findFirst({
        where: { id: branchId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Branch not found"));
      }

      // Check if branch has active users
      const activeUsers = await prisma.user.count({
        where: { branchId, deletedAt: null, isActive: true },
      });

      if (activeUsers > 0) {
        return apiError(
          new Error(
            `Cannot delete branch with ${activeUsers} active user(s). Reassign users first.`
          )
        );
      }

      await prisma.branch.update({
        where: { id: branchId },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      return apiSuccess({ message: "Branch deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
