// ============================================================
// Smart Konstruksi — Document Categories API
// POST /api/documents/categories - Create category
// GET /api/documents/categories - List categories
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// POST /api/documents/categories - Create category
export const POST = withPermission("file:upload", async (request, { user }) => {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return Response.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existing = await prisma.documentCategory.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return Response.json(
        { error: "Category name already exists" },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.documentCategory.create({
      data: {
        name: name.trim(),
        description,
        createdBy: user.id,
      },
    });

    return Response.json({ data: category }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
});

// GET /api/documents/categories - List categories
export const GET = withPermission("file:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const includeCount = searchParams.get("includeCount") === "true";

    if (includeCount) {
      // Include document count per category
      const categories = await prisma.documentCategory.findMany({
        where: { deletedAt: null },
        include: {
          _count: {
            select: { documents: true },
          },
        },
        orderBy: { name: "asc" },
      });

      const formatted = categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        documentCount: cat._count.documents,
        createdAt: cat.createdAt,
      }));

      return Response.json({ data: formatted });
    }

    // Simple list without counts
    const categories = await prisma.documentCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });

    return Response.json({ data: categories });
  } catch (error) {
    return apiError(error);
  }
});
