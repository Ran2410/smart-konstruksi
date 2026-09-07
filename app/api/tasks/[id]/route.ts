// ============================================================
// Smart Konstruksi — Task Detail API
// GET /api/tasks/[id] — Get task by ID
// PUT /api/tasks/[id] — Update task
// DELETE /api/tasks/[id] — Soft delete task
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  withAuth,
  AuthenticatedUser,
  HandlerContext,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import { apiError } from "@/lib/rbac/guard";
import { ForbiddenError } from "@/lib/rbac/guard";
import { updateTaskSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// ==================== CONSTANTS ====================

const PROJECT_ROLES = [
  "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER",
  "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
  "INTERIOR_DESIGNER", "KONSULTAN",
];

// ==================== HELPERS ====================

/**
 * Check if user has access to a specific task via project scope.
 */
async function canAccessTask(
  user: AuthenticatedUser,
  taskProjectId: string
): Promise<boolean> {
  // Global roles see everything
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return true;
  }

  const project = await prisma.project.findUnique({
    where: { id: taskProjectId },
    select: {
      branchId: true,
      clientId: true,
    },
  });

  if (!project) return false;

  // Branch-scoped roles
  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    return user.branchId === project.branchId;
  }

  // Project-scoped roles: check membership
  if (PROJECT_ROLES.includes(user.role)) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: taskProjectId,
          userId: user.id,
        },
      },
    });
    return !!member;
  }

  // Own-scope roles: client sees their own project's tasks
  if (["CLIENT", "VENDOR", "HOME_OWNER"].includes(user.role)) {
    if (user.role === "CLIENT") {
      const client = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      return client?.id === project.clientId;
    }
    return false;
  }

  return false;
}

/**
 * Check if user can update a specific task.
 */
async function canUpdateTask(
  user: AuthenticatedUser,
  taskProjectId: string,
  assigneeId: string | null
): Promise<boolean> {
  // Global roles
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return true;
  }

  // Branch manager
  if (user.role === "BRANCH_MANAGER") {
    const project = await prisma.project.findUnique({
      where: { id: taskProjectId },
      select: { branchId: true },
    });
    return project?.branchId === user.branchId;
  }

  // Project manager can update all tasks in their projects
  if (user.role === "PROJECT_MANAGER") {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: taskProjectId,
          userId: user.id,
        },
      },
    });
    return !!member;
  }

  // Site manager and other project roles can update tasks in their projects
  if (PROJECT_ROLES.includes(user.role)) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: taskProjectId,
          userId: user.id,
        },
      },
    });
    // They can update if they're a member, or if they're the assignee
    if (member) return true;
    if (assigneeId === user.id) return true;
    return false;
  }

  // Assignees can update their own tasks
  if (assigneeId === user.id) {
    return true;
  }

  return false;
}

// ==================== GET /api/tasks/[id] ====================

export const GET = withPermission(
  "task:read",
  async (request, { user }) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();

      if (!id) {
        return apiError(new Error("Task ID is required"));
      }

      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              progress: true,
            },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          checklists: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!task || task.deletedAt) {
        return apiError(new Error("Task not found"));
      }

      // Scope check
      const hasAccess = await canAccessTask(user, task.projectId);
      if (!hasAccess) {
        return apiError(new Error("Access denied"));
      }

      return apiSuccess(task);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== PUT /api/tasks/[id] ====================

export const PUT = withAuth(
  async (request: Request, ctx: HandlerContext) => {
    try {
      const { user } = ctx;
      const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();

      if (!id) {
        return apiError(new Error("Task ID is required"));
      }

      // Check task exists
      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: {
          id: true,
          projectId: true,
          assigneeId: true,
          deletedAt: true,
          status: true,
        },
      });

      if (!existingTask || existingTask.deletedAt) {
        return apiError(new Error("Task not found"));
      }

      // Update authorization check
      const hasAccess = await canUpdateTask(
        user,
        existingTask.projectId,
        existingTask.assigneeId
      );
      if (!hasAccess) {
        return apiError(new Error("Access denied"));
      }

      const body = await request.json();
      const parsed = validateOrRespond(updateTaskSchema, body);
      if (parsed instanceof Response) return parsed;

      const { title, description, assigneeId, status, priority, startDate, dueDate } = parsed;

      // Build update data
      const updateData: Record<string, unknown> = {
        updatedBy: user.id,
      };

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (assigneeId !== undefined) {
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
        updateData.assigneeId = assigneeId || null;
      }

      if (status !== undefined) {
        const validStatuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"];
        if (!validStatuses.includes(status)) {
          return apiError(new Error(`Invalid status: ${status}`));
        }
        updateData.status = status;

        // Auto-set completedAt when status changes to DONE
        if (status === "DONE" && existingTask.status !== "DONE") {
          updateData.completedAt = new Date();
        }

        // Clear completedAt if status changes away from DONE
        if (status !== "DONE" && existingTask.status === "DONE") {
          updateData.completedAt = null;
        }
      }

      if (priority !== undefined) {
        const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
        if (!validPriorities.includes(priority)) {
          return apiError(new Error(`Invalid priority: ${priority}`));
        }
        updateData.priority = priority;
      }

      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);

      const task = await prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          checklists: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      // Create activity log for status changes
      if (status && status !== existingTask.status) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            projectId: existingTask.projectId,
            type: "TASK_UPDATED",
            title: "Task Status Changed",
            message: `Task "${task.title}" status changed to ${status}`,
            metadata: {
              taskId: id,
              oldStatus: existingTask.status,
              newStatus: status,
            },
          },
        });
      }

      return apiSuccess(task);
    } catch (error) {
      return apiError(error);
    }
  }
);

// ==================== DELETE /api/tasks/[id] ====================

export const DELETE = withPermission(
  "task:delete",
  async (request, { user }) => {
    try {
      const { pathname } = new URL(request.url);
      const id = pathname.split("/").pop();

      if (!id) return apiError(new Error("Task ID is required"));

      const existingTask = await prisma.task.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          projectId: true,
          assigneeId: true,
          status: true,
          priority: true,
          deletedAt: true,
        },
      });

      if (!existingTask || existingTask.deletedAt) {
        return apiError(new Error("Task not found"));
      }

      if (!(await canUpdateTask(user, existingTask.projectId, existingTask.assigneeId))) {
        return apiError(new ForbiddenError("You don't have permission to delete this task"));
      }

      await prisma.task.update({
        where: { id },
        data: { deletedAt: new Date(), deletedBy: user.id, updatedBy: user.id },
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          projectId: existingTask.projectId,
          type: "TASK_UPDATED",
          title: "Task Deleted",
          message: `Task "${existingTask.title}" was archived`,
          metadata: { taskId: id, action: "DELETE" },
        },
      });

      await logAudit(
        user.id,
        "DELETE",
        "Task",
        id,
        pickAuditFields(existingTask, ["title", "projectId", "assigneeId", "status", "priority"]),
        null
      );

      return apiNoContent();
    } catch (error) {
      return apiError(error);
    }
  }
);
