// ============================================================
// Smart Konstruksi — File Serve API
// GET /api/files/[id] — Authorized file download
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { canAccessProject } from "@/lib/rbac/guard";
import { readFile } from "fs/promises";
import path from "path";

// Helper: extract [id] from URL path
function extractId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[3] || "";
}

// Files are stored OUTSIDE public/ so Next.js never serves them statically.
// Legacy uploads from before the fix may still live under public/uploads/reports.
const UPLOAD_DIRS = [
  path.join(process.cwd(), "uploads", "reports"),
  path.join(process.cwd(), "public", "uploads", "reports"),
];

// GET /api/files/[id] — Serve the file after an ownership/project check
export const GET = withAuth(async (request, { user }) => {
  try {
    const id = extractId(request.url);
    if (!id) {
      return apiError(new Error("File ID is required"));
    }

    const file = await prisma.file.findFirst({
      where: { id },
      select: {
        url: true,
        mimeType: true,
        filename: true,
        uploaderId: true,
        projectId: true,
        reportId: true,
      },
    });

    if (!file) {
      return apiError(new Error("File not found"));
    }

    // ── Authorization ─────────────────────────────────────
    const isGlobal = user.role === "SUPER_ADMIN" || user.role === "OWNER";
    const isUploader = file.uploaderId === user.id;

    if (!isGlobal && !isUploader) {
      // Resolve project from the file record (or via its report)
      let projectId = file.projectId;
      if (!projectId && file.reportId) {
        const report = await prisma.progressReport.findUnique({
          where: { id: file.reportId },
          select: { projectId: true },
        });
        projectId = report?.projectId ?? null;
      }

      let allowed = false;
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { branchId: true, clientId: true },
        });
        if (project) {
          const isMember = Boolean(
            await prisma.projectMember.findUnique({
              where: {
                projectId_userId: { projectId, userId: user.id },
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
    }

    // ── Serve file from disk ─────────────────────────────
    const filename = file.url.split("/").pop() || "";
    let buffer: Buffer | null = null;
    let resolvedPath = "";

    for (const dir of UPLOAD_DIRS) {
      const candidate = path.join(dir, filename);
      try {
        buffer = await readFile(candidate);
        resolvedPath = candidate;
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
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(
          file.filename || filename
        )}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return apiError(error);
  }
});
