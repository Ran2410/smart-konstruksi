// ============================================================
// Smart Konstruksi — Progress Reports API
// GET  /api/projects/[id]/progress-reports — List reports
// POST /api/projects/[id]/progress-reports — Create report
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract projectId from URL path /api/projects/[id]/progress-reports
function extractProjectId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[3] || "";
}

// GET /api/projects/[id]/progress-reports — List progress reports
export const GET = withPermission(
  "project:read",
  async (request) => {
    try {
      const projectId = extractProjectId(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      const { searchParams } = new URL(request.url);
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
      const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        prisma.progressReport.findMany({
          where: { projectId, deletedAt: null },
          orderBy: { reportDate: "desc" },
          skip,
          take: limit,
          include: {
            reporter: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            _count: {
              select: { photos: true },
            },
          },
        }),
        prisma.progressReport.count({
          where: { projectId, deletedAt: null },
        }),
      ]);

      return Response.json({
        data: reports,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return apiError(error);
    }
  }
);

// POST /api/projects/[id]/progress-reports — Create a progress report
export const POST = withPermission(
  "report:create",
  async (request, { user }) => {
    try {
      const projectId = extractProjectId(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      // Verify project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, deletedAt: null },
      });

      if (!project) {
        return apiError(new Error("Project not found"));
      }

      const body = await request.json();
      const {
        percentage,
        description,
        reportDate,
        weather,
        latitude,
        longitude,
      } = body;

      // Validate required fields
      if (percentage === undefined || percentage === null) {
        return apiError(new Error("Percentage is required"));
      }

      if (!description?.trim()) {
        return apiError(new Error("Description is required"));
      }

      const percentageVal = Math.min(100, Math.max(0, Number(percentage)));

      // Create the report
      const report = await prisma.progressReport.create({
        data: {
          projectId,
          reporterId: user.id,
          reportDate: reportDate ? new Date(reportDate) : new Date(),
          percentage: percentageVal,
          description: description.trim(),
          weather: weather || null,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
          createdBy: user.id,
        },
        include: {
          reporter: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      // Auto-update project progress with latest report percentage
      await prisma.project.update({
        where: { id: projectId },
        data: {
          progress: percentageVal,
          updatedBy: user.id,
        },
      });

      return apiSuccess(report);
    } catch (error) {
      return apiError(error);
    }
  }
);
