// ============================================================
// Smart Konstruksi — Branches API (List + Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withAuth,
  withPermission,
  parsePagination,
  buildScopeFilter,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { createBranchSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// GET /api/branches — List branches (branch:read)
// SUPER_ADMIN/OWNER see all, BRANCH_MANAGER sees own branch only
export const GET = withPermission("branch:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...buildScopeFilter(user, { branchField: "id" }),
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: {
          _count: { select: { users: true, projects: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.branch.count({ where }),
    ]);

    return apiPaginated(branches, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/branches — Create branch (branch:create)
export const POST = withPermission(
  "branch:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = validateOrRespond(createBranchSchema, body);
      if (parsed instanceof Response) return parsed;

      const { name, address, phone, email } = parsed;
      const isActive = body.isActive;

      // Check uniqueness
      const existing = await prisma.branch.findFirst({
        where: {
          name: name.trim(),
          deletedAt: null,
        },
      });

      if (existing) {
        return apiError(new Error("Branch name already exists"));
      }

      const branch = await prisma.branch.create({
        data: {
          name: name.trim(),
          address: address || null,
          phone: phone || null,
          email: email || null,
          isActive: isActive !== undefined ? isActive : true,
          createdBy: user.id,
        },
      });

      return apiCreated(branch);
    } catch (error) {
      return apiError(error);
    }
  }
);
