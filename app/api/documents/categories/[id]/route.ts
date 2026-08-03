// ============================================================
// Smart Konstruksi — Document Category Detail API
// GET /api/documents/categories/[id] - Get category detail
// PATCH /api/documents/categories/[id] - Update category
// DELETE /api/documents/categories/[id] - Delete category (soft)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/documents/categories/[id] - Get category detail
export const GET = withPermission("file:read", async (request, { user }) => {
  try {
    const categoryId = extractIdFromPath(request.url);

    if (!categoryId) {
      return Response.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const category = await prisma.documentCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!category) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return Response.json({
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        documentCount: category._count.documents,
        createdAt: category.createdAt,
      },
    });
  } catch (error) {
    return apiError(error);
  }
});

// PATCH /api/documents/categories/[id] - Update category
export const PATCH = withPermission("file:upload", async (request, { user }) => {
  try {
    const categoryId = extractIdFromPath(request.url);

    if (!categoryId) {
      return Response.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Check if category exists
    const existing = await prisma.documentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!existing) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if new name already exists (if changing name)
    if (name && name !== existing.name) {
      const duplicate = await prisma.documentCategory.findUnique({
        where: { name: name.trim() },
      });

      if (duplicate) {
        return Response.json(
          { error: "Category name already exists" },
          { status: 409 }
        );
      }
    }

    // Update category
    const updated = await prisma.documentCategory.update({
      where: { id: categoryId },
      data: {
        name: name ? name.trim() : undefined,
        description,
        updatedBy: user.id,
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return apiError(error);
  }
});

// DELETE /api/documents/categories/[id] - Delete category (soft)
export const DELETE = withPermission("file:delete", async (request, { user }) => {
  try {
    const categoryId = extractIdFromPath(request.url);

    if (!categoryId) {
      return Response.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existing = await prisma.documentCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    if (!existing) {
      return Response.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has documents
    if (existing._count.documents > 0) {
      return Response.json(
        {
          error: "Cannot delete category with documents",
          message: "Please reassign or delete documents in this category first",
          documentCount: existing._count.documents,
        },
        { status: 409 }
      );
    }

    // Soft delete
    await prisma.documentCategory.update({
      where: { id: categoryId },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });

    return Response.json({ message: "Category deleted successfully" });
  } catch (error) {
    return apiError(error);
  }
});
