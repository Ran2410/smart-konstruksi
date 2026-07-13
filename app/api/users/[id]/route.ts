// ============================================================
// Smart Konstruksi — User API (Detail / Update / Soft Delete)
// ============================================================

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateUserSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/users/[id] — Get user detail (user:read)
export const GET = withPermission("user:read", async (request, { user }) => {
  try {
    const userId = extractIdFromPath(request.url);

    if (!userId) {
      return apiError(new Error("User ID is required"));
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        branchId: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!targetUser) {
      return apiError(new Error("User not found"));
    }

    // Scope check: BRANCH_MANAGER can only see own branch users
    if (user.role === "BRANCH_MANAGER") {
      if (targetUser.branchId !== user.branchId) {
        return apiError(new Error("Access denied to this user"));
      }
    }

    return apiSuccess(targetUser);
  } catch (error) {
    return apiError(error);
  }
});

// PUT /api/users/[id] — Update user (user:update)
export const PUT = withPermission(
  "user:update",
  async (request, { user }) => {
    try {
      const userId = extractIdFromPath(request.url);

      if (!userId) {
        return apiError(new Error("User ID is required"));
      }

      const existing = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("User not found"));
      }

      const body = await request.json();
      const parsed = validateOrRespond(updateUserSchema, body);
      if (parsed instanceof Response) return parsed;

      const { name, email, password, role, branchId, phone, avatar, isActive } = parsed;

      // Check email uniqueness if changed
      if (email && email.trim().toLowerCase() !== existing.email) {
        const duplicate = await prisma.user.findFirst({
          where: {
            email: email.trim().toLowerCase(),
            deletedAt: null,
            id: { not: userId },
          },
        });
        if (duplicate) {
          return apiError(new Error("Email already registered"));
        }
      }

      // Build update data — only include provided fields
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (name !== undefined) updateData.name = name.trim();
      if (email !== undefined) updateData.email = email.trim().toLowerCase();
      if (role !== undefined) updateData.role = role;
      if (branchId !== undefined) updateData.branchId = branchId || null;
      if (phone !== undefined) updateData.phone = phone || null;
      if (avatar !== undefined) updateData.avatar = avatar || null;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Hash password if provided
      if (password && typeof password === "string" && password.length >= 8) {
        updateData.password = await bcrypt.hash(password, 12);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isActive: true,
          lastLogin: true,
          branchId: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      return apiSuccess(updatedUser);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/users/[id] — Soft delete user (user:delete)
export const DELETE = withPermission(
  "user:delete",
  async (request, { user }) => {
    try {
      const targetUserId = extractIdFromPath(request.url);

      if (!targetUserId) {
        return apiError(new Error("User ID is required"));
      }

      // Prevent self-deletion
      if (targetUserId === user.id) {
        return apiError(new Error("Cannot delete your own account"));
      }

      const existing = await prisma.user.findFirst({
        where: { id: targetUserId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("User not found"));
      }

      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
          isActive: false,
        },
      });

      return apiSuccess({ message: "User deleted successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
