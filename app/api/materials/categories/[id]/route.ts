// ============================================================
// Smart Konstruksi — Material Category Detail API
// GET /api/materials/categories/[id] — Get category
// PUT /api/materials/categories/[id] — Update category
// DELETE /api/materials/categories/[id] — Soft delete category
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateMaterialCategorySchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

export const GET = withPermission("material:read", async (request) => {
  try {
    const id = extractIdFromPath(request.url);
    const category = await prisma.materialCategory.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { materials: true } } },
    });

    if (!category) return apiError(new Error("Category not found"));
    return apiSuccess(category);
  } catch (error) {
    return apiError(error);
  }
});

export const PUT = withPermission("material:update", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.materialCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Category not found"));

    const body = await request.json();
    const parsed = validateOrRespond(updateMaterialCategorySchema, body);
    if (parsed instanceof Response) return parsed;

    const updateData: Record<string, unknown> = { updatedBy: user.id };
    if (parsed.name !== undefined) {
      // Check uniqueness if name changed
      const dup = await prisma.materialCategory.findFirst({
        where: { name: { equals: parsed.name.trim(), mode: "insensitive" }, id: { not: id }, deletedAt: null },
      });
      if (dup) return apiError(new Error("Category name already exists"));
      updateData.name = parsed.name.trim();
    }
    if (parsed.description !== undefined) updateData.description = parsed.description || null;

    const category = await prisma.materialCategory.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess(category);
  } catch (error) {
    return apiError(error);
  }
});

export const DELETE = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.materialCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Category not found"));

    // Check if category has materials
    const itemCount = await prisma.materialCategory.findFirst({
      where: { id },
      include: { _count: { select: { materials: true } } },
    });

    if (itemCount && itemCount._count.materials > 0) {
      return apiError(new Error("Cannot delete category with existing materials. Remove them first."));
    }

    await prisma.materialCategory.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    return apiNoContent();
  } catch (error) {
    return apiError(error);
  }
});
