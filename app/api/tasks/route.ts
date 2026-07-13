// ============================================================
// Smart Konstruksi — Tasks API
// GET /api/tasks — List tasks (with scope filtering)
// POST /api/tasks — Create task (project members + admins)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  withAuth,
  AuthenticatedUser,
  HandlerContext,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { ForbiddenError } from "@/lib/rbac/guard";
import { createTaskSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// ==================== CONSTANTS ====================

const PROJECT_ROLES = [
  "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER",
  "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
  "INTERIOR_DESIGNER", "KONSULTAN",
];

const TASK_CREATE_GLOBAL_ROLES = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

// ==================== SCOPE FILTER ====================

/**
 * Build scope filter for tasks.
 * Tasks relate to project → branch, and project → members.
 */
function buildTaskScopeFilter(user: AuthenticatedUser) {
  // Global roles see everything
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return {};
  }

  // Branch-scoped roles: filter by project's branch
  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    if (user.branchId) {
      return { project: { branchId: user.branchId } };
    }
    return {};
  }

  // Project-scoped roles: only their assigned projects
  if (PROJECT_ROLES.includes(user.role)) {
    return {
      project: { members: { some: { userId: user.id } } },
    };
  }

  // Own-scope roles: tasks from their projects
  if (["CLIENT", "VENDOR", "HOME_OWNER"].includes(user.role)) {
    return {
      project: { client: { userId: user.id } },
    };
  }

  return {};
}

// ==================== HELPERS ====================

/**
 * Check if user can create tasks.
 * SUPER_ADMIN, OWNER, BRANCH_MANAGER always allowed.
 * PROJECT_MANAGER and other project roles need project membership.
 */
async function authorizeTaskCreation(
  user: AuthenticatedUser,
  projectId: string
): Promise<void> {
  // Global/branch roles
  if (TASK_CREATE_GLOBAL_ROLES.includes(user.role)) {
    // BRANCH_MANAGER: verify project is in their branch
    if (user.role === "BRANCH_MANAGER") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { branchId: true },
      });
      if (!project) {
        throw new ForbiddenError("Project not found");
      }
      if (user.branchId && project.branchId !== user.branchId) {
        throw new ForbiddenError(
          "Not authorized to create tasks for this project"
        );
      }
    }
    return;
  }

  // Project-scoped roles: must be a member
  if (PROJECT_ROLES.includes(user.role)) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });
    if (!member) {
      throw new ForbiddenError("Not a member of this project");
    }
    return;
  }

  throw new ForbiddenError("Role not authorized to create tasks");
}

// ==================== GET /api/tasks ====================

export const GET = withPermission(
  "task:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = parsePagination(searchParams);

      const projectId = searchParams.get("projectId") || undefined;
      const assigneeId = searchParams.get("assigneeId") || undefined;
      const status = searchParams.get("status") || undefined;
      const priority = searchParams.get("priority") || undefined;
      const search = searchParams.get("search") || undefined;

      // Build where clause
      const scopeFilter = buildTaskScopeFilter(user);
      const where: Record<string, unknown> = {
        ...scopeFilter,
        deletedAt: null, // Exclude soft-deleted tasks
        ...(projectId && { projectId }),
        ...(assigneeId && { assigneeId }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { project: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
          include: {
            project: {
              select: { id: true, name: true, code: true },
            },
            assignee: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        }),
        prisma.task.count({ where }),
      ]);

      return apiPaginated(tasks, total, page, limit);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== POST /api/tasks ====================

export const POST = withAuth(
  async (request: Request, ctx: HandlerContext) => {
    try {
      const { user } = ctx;
      const body = await request.json();
      const parsed = validateOrRespond(createTaskSchema, body);
      if (parsed instanceof Response) return parsed;

      const { title, description, projectId, assigneeId, startDate, dueDate, priority } = parsed;

      // Authorize task creation
      await authorizeTaskCreation(user, projectId);

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, deletedAt: true },
      });

      if (!project || project.deletedAt) {
        return apiError(new Error("Project not found"));
      }

      // Validate assignee if provided
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assigneeId },
          select: { id: true, isActive: true },
        });
        if (!assignee || !assignee.isActive) {
          return apiError(new Error("Assignee not found or inactive"));
        }
      }

      // Create task
      const task = await prisma.task.create({
        data: {
          title,
          description: description || null,
          projectId,
          assigneeId: assigneeId || null,
          startDate: new Date(startDate),
          dueDate: new Date(dueDate),
          priority,
          createdBy: user.id,
        },
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          projectId,
          type: "TASK_CREATED",
          title: "Task Created",
          message: `Task "${title}" created in project ${project.name}`,
          metadata: { taskId: task.id, title },
        },
      });

      return apiCreated(task);
    } catch (error) {
      return apiError(error);
    }
  }
);
