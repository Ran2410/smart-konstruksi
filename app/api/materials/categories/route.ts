// ============================================================
// Smart Konstruksi — Material Categories API (List + Create)
// GET /api/materials/categories — List categories
// POST /api/materials/categories — Create category
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { createMaterialCategorySchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// GET /api/materials/categories
export const GET = withPermission("material:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [categories, total] = await Promise.all([
      prisma.materialCategory.findMany({
        where,
        include: { _count: { select: { materials: true } } },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.materialCategory.count({ where }),
    ]);

    return apiPaginated(categories, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/materials/categories
export const POST = withPermission("material:create", async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = validateOrRespond(createMaterialCategorySchema, body);
    if (parsed instanceof Response) return parsed;

    // Check uniqueness
    const existing = await prisma.materialCategory.findFirst({
      where: {
        name: { equals: parsed.name.trim(), mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      return apiError(new Error("Category name already exists"));
    }

    const category = await prisma.materialCategory.create({
      data: {
        name: parsed.name.trim(),
        description: parsed.description || null,
        createdBy: user.id,
      },
    });

    return apiCreated(category);
  } catch (error) {
    return apiError(error);
  }
});
