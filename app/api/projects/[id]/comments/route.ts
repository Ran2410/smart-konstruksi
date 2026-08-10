// ============================================================
// Smart Konstruksi — Project Comments API
// GET  /api/projects/[id]/comments — list comments (project or report-level)
// POST /api/projects/[id]/comments — create comment (scope checked)
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess, apiCreated } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { notifyMany } from "@/lib/notify";

// Helper: extract projectId from URL path /api/projects/[id]/comments
function extractProjectId(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[3] || "";
}

/**
 * Scope check — who may read/write comments on a project:
 * - Global roles (SUPER_ADMIN, OWNER): yes
 * - Branch roles: own branch
 * - Client / Home Owner: their own project
 * - Project roles: must be a project member
 */
async function canAccessProject(
  user: { id: string; role: string; branchId: string | null },
  projectId: string
): Promise<boolean> {
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      branchId: true,
      client: { select: { userId: true } },
    },
  });
  if (!project) return false;

  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    return user.branchId === project.branchId;
  }

  if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
    return project.client?.userId === user.id;
  }

  // Project-scoped roles: membership
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  return !!member;
}

const COMMENT_SELECT = {
  id: true,
  content: true,
  reportId: true,
  createdAt: true,
  author: {
    select: { id: true, name: true, email: true, avatar: true, role: true },
  },
  report: {
    select: { id: true, reportDate: true, percentage: true },
  },
} as const;

// GET /api/projects/[id]/comments?reportId=... — list comments
export const GET = withAuth(async (request, { user }) => {
  try {
    const projectId = extractProjectId(request.url);
    if (!projectId) return apiError(new Error("Project ID is required"));

    const hasAccess = await canAccessProject(user, projectId);
    if (!hasAccess) return apiError(new Error("Access denied"));

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("reportId") || undefined;

    const comments = await prisma.comment.findMany({
      where: {
        projectId,
        ...(reportId ? { reportId } : {}),
      },
      select: COMMENT_SELECT,
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({ data: comments });
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/projects/[id]/comments — create comment + notify stakeholders
export const POST = withAuth(async (request, { user }) => {
  try {
    const projectId = extractProjectId(request.url);
    if (!projectId) return apiError(new Error("Project ID is required"));

    const hasAccess = await canAccessProject(user, projectId);
    if (!hasAccess) return apiError(new Error("Access denied"));

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const reportId = typeof body?.reportId === "string" && body.reportId ? body.reportId : null;

    if (!content) return apiError(new Error("Comment content is required"));
    if (content.length > 1000) return apiError(new Error("Comment is too long (max 1000 characters)"));

    // If report-scoped, verify the report belongs to this project
    if (reportId) {
      const report = await prisma.progressReport.findFirst({
        where: { id: reportId, projectId },
        select: { id: true },
      });
      if (!report) return apiError(new Error("Report not found in this project"));
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        projectId,
        reportId,
        authorId: user.id,
        createdBy: user.id,
      },
      select: COMMENT_SELECT,
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        projectId,
        type: "COMMENT_CREATED",
        title: "Comment Added",
        message: `${user.name} commented on ${reportId ? "a progress report" : "the project"}`,
        metadata: { commentId: comment.id, reportId },
      },
    }).catch(() => {});

    // Notify stakeholders (PM, site manager, client, report author) — skip the commenter
    const projectBrief = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        name: true,
        projectManagerId: true,
        siteManagerId: true,
        client: { select: { userId: true } },
      },
    });

    let reportAuthorId: string | null = null;
    if (reportId) {
      const report = await prisma.progressReport.findUnique({
        where: { id: reportId },
        select: { reporterId: true },
      });
      reportAuthorId = report?.reporterId || null;
    }

    const recipients = [
      projectBrief?.projectManagerId,
      projectBrief?.siteManagerId,
      projectBrief?.client?.userId,
      reportAuthorId,
    ].filter((rid): rid is string => !!rid && rid !== user.id);

    await notifyMany(
      recipients.map((rid) => ({
        userId: rid,
        type: "COMMENT",
        title: `New Comment on ${projectBrief?.name || "Project"}`,
        message: `${user.name}: ${content.slice(0, 100)}${content.length > 100 ? "…" : ""}`,
        link: `/dashboard/projects/${projectId}`,
      }))
    );

    return apiCreated({ data: comment });
  } catch (error) {
    return apiError(error);
  }
});
