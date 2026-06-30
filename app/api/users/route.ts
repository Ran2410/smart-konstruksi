// ============================================================
// Smart Konstruksi — Users API (List + Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  withPermission,
  parsePagination,
  buildScopeFilter,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/users — List users (user:read)
// SUPER_ADMIN/OWNER/BRANCH_MANAGER can list
export const GET = withPermission("user:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const branchId = searchParams.get("branchId") || "";
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...buildScopeFilter(user, { branchField: "branchId" }),
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Branch filter (only for global roles)
    if (
      branchId &&
      (user.role === "SUPER_ADMIN" || user.role === "OWNER")
    ) {
      where.branchId = branchId;
    }

    // Active filter
    if (isActive !== null && isActive !== undefined && isActive !== "") {
      where.isActive = isActive === "true";
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return apiPaginated(users, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/users — Create user (user:create)
// Only SUPER_ADMIN/OWNER can create users
export const POST = withPermission(
  "user:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const { email, name, password, role, branchId, phone, avatar } = body;

      // Validate required fields
      if (!email || typeof email !== "string" || email.trim().length === 0) {
        return apiError(new Error("Email is required"));
      }
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return apiError(new Error("Name is required"));
      }
      if (!password || typeof password !== "string" || password.length < 6) {
        return apiError(new Error("Password must be at least 6 characters"));
      }
      if (!role) {
        return apiError(new Error("Role is required"));
      }

      // Check email uniqueness
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          deletedAt: null,
        },
      });

      if (existingUser) {
        return apiError(new Error("Email already registered"));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = await prisma.user.create({
        data: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          password: hashedPassword,
          role,
          branchId: branchId || null,
          phone: phone || null,
          avatar: avatar || null,
          isActive: true,
          createdBy: user.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          avatar: true,
          isActive: true,
          branchId: true,
          createdAt: true,
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      return apiCreated(newUser);
    } catch (error) {
      return apiError(error);
    }
  }
);
