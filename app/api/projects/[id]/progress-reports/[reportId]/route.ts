// ============================================================
// Smart Konstruksi — Progress Report Detail API
// PUT   /api/projects/[id]/progress-reports/[reportId] — Update report
// DELETE /api/projects/[id]/progress-reports/[reportId] — Soft delete
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract projectId and reportId from URL path
// URL: /api/projects/[id]/progress-reports/[reportId]
function extractIds(url: string): { projectId: string; reportId: string } {
  const pathParts = new URL(url).pathname.split("/");
  return {
    projectId: pathParts[3] || "",
    reportId: pathParts[5] || "",
  };
}

// PUT /api/projects/[id]/progress-reports/[reportId] — Update a progress report
export const PUT = withPermission(
  "report:create",
  async (request, { user }) => {
    try {
      const { projectId, reportId } = extractIds(request.url);

      if (!projectId || !reportId) {
        return apiError(new Error("Project ID and Report ID are required"));
      }

      // Verify report exists and belongs to the project
      const existing = await prisma.progressReport.findFirst({
        where: { id: reportId, projectId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Progress report not found"));
      }

      const body = await request.json();
      const { percentage, description, reportDate, weather, photoIds } = body;

      // Build update data — only include fields that are provided
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (percentage !== undefined) {
        updateData.percentage = Math.min(100, Math.max(0, Number(percentage)));
      }
      if (description !== undefined) {
        updateData.description = description.trim();
      }
      if (reportDate !== undefined) {
        updateData.reportDate = new Date(reportDate);
      }
      if (weather !== undefined) {
        updateData.weather = weather || null;
      }

      // Update report scalar fields
      await prisma.progressReport.update({
        where: { id: reportId },
        data: updateData,
      });

      // Handle photo connections if photoIds provided
      if (photoIds !== undefined && Array.isArray(photoIds)) {
        // Disconnect existing photos by nullifying their reportId
        await prisma.file.updateMany({
          where: { reportId: existing.id },
          data: { reportId: null },
        });

        // Connect new photos if any
        if (photoIds.length > 0) {
          const validPhotos = await prisma.file.findMany({
            where: { id: { in: photoIds } },
            select: { id: true },
          });

          const validIds = validPhotos.map((p) => p.id);
          const invalidIds = photoIds.filter(
            (id: string) => !validIds.includes(id)
          );

          if (invalidIds.length > 0) {
            return apiError(
              new Error(`Invalid photo IDs: ${invalidIds.join(", ")}`)
            );
          }

          await prisma.file.updateMany({
            where: { id: { in: validIds } },
            data: { reportId: existing.id },
          });
        }
      }

      // If percentage was updated, also update project.progress
      if (percentage !== undefined) {
        await prisma.project.update({
          where: { id: projectId },
          data: {
            progress: Math.min(100, Math.max(0, Number(percentage))),
            updatedBy: user.id,
          },
        });
      }

      // Return the updated report with all relations
      const report = await prisma.progressReport.findUnique({
        where: { id: reportId },
        include: {
          reporter: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          photos: {
            select: { id: true, url: true, filename: true, mimeType: true, size: true },
          },
        },
      });

      return apiSuccess(report);
    } catch (error) {
      return apiError(error);
    }
  }
);

// DELETE /api/projects/[id]/progress-reports/[reportId] — Soft delete a progress report
export const DELETE = withPermission(
  "report:create",
  async (request, { user }) => {
    try {
      const { projectId, reportId } = extractIds(request.url);

      if (!projectId || !reportId) {
        return apiError(new Error("Project ID and Report ID are required"));
      }

      // Verify report exists and belongs to the project
      const existing = await prisma.progressReport.findFirst({
        where: { id: reportId, projectId, deletedAt: null },
      });

      if (!existing) {
        return apiError(new Error("Progress report not found"));
      }

      // Soft delete
      await prisma.progressReport.update({
        where: { id: reportId },
        data: {
          deletedAt: new Date(),
          deletedBy: user.id,
        },
      });

      return apiNoContent();
    } catch (error) {
      return apiError(error);
    }
  }
);
