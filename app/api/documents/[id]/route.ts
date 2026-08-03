// ============================================================
// Smart Konstruksi — Document Detail API
// GET /api/documents/[id] - Get document detail
// PATCH /api/documents/[id] - Update document metadata
// DELETE /api/documents/[id] - Delete document (soft)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { unlink } from "fs/promises";
import path from "path";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// GET /api/documents/[id] - Get document detail
export const GET = withPermission("file:read", async (request, { user }) => {
  try {
    const documentId = extractIdFromPath(request.url);

    if (!documentId) {
      return Response.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!document) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return Response.json({ data: document });
  } catch (error) {
    return apiError(error);
  }
});

// PATCH /api/documents/[id] - Update document metadata
export const PATCH = withPermission("file:upload", async (request, { user }) => {
  try {
    const documentId = extractIdFromPath(request.url);

    if (!documentId) {
      return Response.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      name,
      description,
      categoryId,
      isClientVisible,
      expiryDate,
      status,
    } = body;

    // Check if document exists
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Validate category if provided
    if (categoryId) {
      const category = await prisma.documentCategory.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return Response.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Update document
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        name,
        description,
        categoryId,
        isClientVisible,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status,
        updatedBy: user.id,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return apiError(error);
  }
});

// DELETE /api/documents/[id] - Delete document (soft delete by setting status to ARCHIVED)
export const DELETE = withPermission("file:delete", async (request, { user }) => {
  try {
    const documentId = extractIdFromPath(request.url);

    if (!documentId) {
      return Response.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Check if document exists
    const existing = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      return Response.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Soft delete: set status to ARCHIVED
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "ARCHIVED",
        updatedBy: user.id,
      },
    });

    // Optional: delete file from disk (commented out for safety)
    // const filePath = path.join(process.cwd(), "public", existing.fileUrl);
    // await unlink(filePath);

    return Response.json({ message: "Document archived successfully" });
  } catch (error) {
    return apiError(error);
  }
});
