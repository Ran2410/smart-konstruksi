// ============================================================
// Smart Konstruksi — Project Members API
// GET    /api/projects/[id]/members — List members
// POST   /api/projects/[id]/members — Add member
// DELETE /api/projects/[id]/members?userId=xxx — Remove member
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  AuthenticatedUser,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract projectId from URL path /api/projects/[id]/members
function extractProjectId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  // /api/projects/[id]/members → parts[3] = [id]
  return pathParts[3] || "";
}

// ==================== GET /api/projects/[id]/members ====================

export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      const projectId = extractProjectId(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      // Check project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, deletedAt: null },
        select: { id: true },
      });

      if (!project) {
        return apiError(new Error("Project not found"));
      }

      // Get members with user details
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      return apiSuccess(members);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== POST /api/projects/[id]/members ====================

export const POST = withPermission(
  "project:update",
  async (request, { user }) => {
    try {
      const projectId = extractProjectId(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      // Check project exists
      const project = await prisma.project.findFirst({
        where: { id: projectId, deletedAt: null },
        select: { id: true },
      });

      if (!project) {
        return apiError(new Error("Project not found"));
      }

      const body = await request.json();
      const { userId, role } = body;

      if (!userId || !role) {
        return apiError(new Error("userId and role are required"));
      }

      // Validate user exists
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { id: true, name: true },
      });

      if (!targetUser) {
        return apiError(new Error("User not found"));
      }

      // Check if already a member
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (existing) {
        return apiError(new Error("User is already a member of this project"));
      }

      // Create member
      const member = await prisma.projectMember.create({
        data: {
          projectId,
          userId,
          role,
          createdBy: user.id,
        },
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      return apiSuccess(member);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== DELETE /api/projects/[id]/members ====================

export const DELETE = withPermission(
  "project:update",
  async (request, { user }) => {
    try {
      const projectId = extractProjectId(request.url);

      if (!projectId) {
        return apiError(new Error("Project ID is required"));
      }

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");

      if (!userId) {
        return apiError(new Error("userId query param is required"));
      }

      // Find the member record
      const existing = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!existing) {
        return apiError(new Error("Member not found in this project"));
      }

      // Delete member
      await prisma.projectMember.delete({
        where: { id: existing.id },
      });

      return apiSuccess({ message: "Member removed successfully" });
    } catch (error) {
      return apiError(error);
    }
  }
);
