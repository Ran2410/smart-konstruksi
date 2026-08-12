// ============================================================
// Smart Konstruksi — Document Detail API
// GET /api/documents/[id] - Get document detail
// PATCH /api/documents/[id] - Update document metadata
// DELETE /api/documents/[id] - Delete document (soft)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission } from "@/lib/api/with-auth";
import { apiError, canAccessProject } from "@/lib/rbac/guard";
import { readFile } from "fs/promises";
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

    // ── File download (`?download=1`) ─────────────────────
    // Serve the stored file only after verifying the caller can access
    // the document's project (or is the uploader / a global role).
    if (new URL(request.url).searchParams.get("download") === "1") {
      const isGlobal = user.role === "SUPER_ADMIN" || user.role === "OWNER";
      const isUploader = document.uploaderId === user.id;

      let allowed = isGlobal || isUploader;
      if (!allowed && document.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: document.projectId },
          select: { branchId: true, clientId: true },
        });
        if (project) {
          const isMember = Boolean(
            await prisma.projectMember.findUnique({
              where: {
                projectId_userId: {
                  projectId: document.projectId,
                  userId: user.id,
                },
              },
              select: { id: true },
            })
          );
          let isOwnProject = false;
          if (project.clientId) {
            const client = await prisma.client.findUnique({
              where: { id: project.clientId },
              select: { userId: true },
            });
            isOwnProject = client?.userId === user.id;
          }
          allowed = canAccessProject(
            user.role,
            user.branchId,
            project.branchId,
            isMember,
            isOwnProject
          );
        }
      }

      if (!allowed) {
        return apiError(new Error("Forbidden"));
      }

      const filename = document.fileUrl.split("/").pop() || "";
      const dirs = [
        path.join(process.cwd(), "uploads", "documents"),
        path.join(process.cwd(), "public", "uploads", "documents"),
      ];
      let buffer: Buffer | null = null;
      for (const dir of dirs) {
        try {
          buffer = await readFile(path.join(dir, filename));
          break;
        } catch {
          // try next directory
        }
      }
      if (!buffer) {
        return apiError(new Error("File not found on disk"));
      }

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": document.fileType
            ? `application/${document.fileType === "pdf" ? "pdf" : "octet-stream"}`
            : "application/octet-stream",
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            document.name || filename
          )}"`,
          "Cache-Control": "private, no-store",
        },
      });
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
