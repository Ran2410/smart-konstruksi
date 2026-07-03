// ============================================================
// Smart Konstruksi — Projects Stats API (KPI Cards)
// Returns aggregated project statistics for the dashboard
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/projects/stats — Get project statistics (project:read)
export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      // Build base where clause (scope filtering)
      const baseWhere: Record<string, unknown> = {
        deletedAt: null,
      };

      // Scope filtering (same as list endpoint)
      if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
        // Global: no filter
      } else if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
        if (user.branchId) baseWhere.branchId = user.branchId;
      } else if (["CLIENT", "HOME_OWNER"].includes(user.role)) {
        const clientProfile = await prisma.client.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (clientProfile) {
          baseWhere.clientId = clientProfile.id;
        } else {
          baseWhere.clientId = "__no_client__";
        }
      } else if (["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN", "MANDOR", "SURVEYOR", "LOGISTIK"].includes(user.role)) {
        baseWhere.members = { some: { userId: user.id } };
      }

      // Fetch all projects (for KPI computation)
      const projects = await prisma.project.findMany({
        where: baseWhere,
        select: {
          id: true,
          status: true,
          progress: true,
          budget: true,
          endDate: true,
        },
      });

      const now = new Date();
      const total = projects.length;
      const active = projects.filter((p) => p.status === "IN_PROGRESS").length;
      const completed = projects.filter((p) => p.status === "COMPLETED").length;
      const planning = projects.filter((p) => p.status === "PLANNING").length;
      const onHold = projects.filter((p) => p.status === "ON_HOLD").length;
      const cancelled = projects.filter((p) => p.status === "CANCELLED").length;

      // Total budget
      const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget), 0);

      // Average progress
      const avgProgress = total > 0
        ? Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / total)
        : 0;

      // Delayed projects (past end date but not completed)
      const delayed = projects.filter(
        (p) => p.endDate && new Date(p.endDate) < now && p.status !== "COMPLETED" && p.status !== "CANCELLED"
      ).length;

      return apiSuccess({
        total,
        active,
        completed,
        planning,
        onHold,
        cancelled,
        totalBudget,
        avgProgress,
        delayed,
      });
    } catch (error) {
      return apiError(error);
    }
  }
);
