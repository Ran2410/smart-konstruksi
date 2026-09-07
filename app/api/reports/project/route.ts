// ============================================================
// Smart Konstruksi — Project & RAB Report API
// GET /api/reports/project?branchId=xxx
//   - Budget vs actual cost per project
//   - RAB pipeline (aggregate by status) + RAB list
//   - Progress timeline dari ProgressReport
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

export const GET = withPermission("report:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    // ── Scope filter (role-based) ──────────────────────────
    const scope: Record<string, unknown> = { deletedAt: null };
    if (branchId) {
      scope.branchId = branchId;
    } else if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
      // global
    } else if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
      if (user.branchId) scope.branchId = user.branchId;
    } else if (["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN", "MANDOR", "SURVEYOR", "LOGISTIK"].includes(user.role)) {
      scope.members = { some: { userId: user.id } };
    } else if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
      const clientProfile = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      scope.clientId = clientProfile?.id || "__none__";
    }

    // ── Projects with budget/actual ────────────────────────
    const projects = await prisma.project.findMany({
      where: scope,
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        progress: true,
        budget: true,
        actualCost: true,
        branch: { select: { name: true } },
        client: { select: { companyName: true } },
        _count: { select: { tasks: true, progressReports: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Actual spending: sum OUT transactions per project ──
    const projectIds = projects.map((p) => p.id);
    const spendingRaw = projectIds.length > 0
      ? await prisma.transaction.groupBy({
          by: ["projectId"],
          where: {
            projectId: { in: projectIds },
            type: "OUT",
            reversedAt: null,
            reversalOfId: null,
          },
          _sum: { totalCost: true, qty: true },
        })
      : [];
    const spendMap = Object.fromEntries(
      spendingRaw.map((s) => [s.projectId, { cost: Number(s._sum.totalCost || 0), qty: Number(s._sum.qty || 0) }])
    );

    // ── RAB pipeline (aggregate) ───────────────────────────
    const rabAgg = await prisma.rAB.groupBy({
      by: ["status"],
      _sum: { total: true },
      _count: true,
    });
    const rabByStatus: Record<string, { count: number; total: number }> = {};
    let rabTotal = 0;
    for (const r of rabAgg) {
      const total = Number(r._sum.total || 0);
      rabByStatus[r.status] = { count: r._count, total };
      rabTotal += total;
    }

    const rabs = await prisma.rAB.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        title: true,
        total: true,
        status: true,
        version: true,
        lead: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // ── Progress timeline (last 12 reports per project) ────
    const reports = await prisma.progressReport.findMany({
      where: { projectId: { in: projectIds }, deletedAt: null },
      select: { id: true, projectId: true, reportDate: true, percentage: true },
      orderBy: { reportDate: "asc" },
    });
    const reportMap: Record<string, { projectId: string; projectName: string; points: { date: string; percentage: number }[] }> = {};
    for (const rp of reports) {
      if (!reportMap[rp.projectId]) {
        const proj = projects.find((p) => p.id === rp.projectId);
        reportMap[rp.projectId] = {
          projectId: rp.projectId,
          projectName: proj?.name || "Unknown",
          points: [],
        };
      }
      reportMap[rp.projectId].points.push({
        date: rp.reportDate.toISOString().split("T")[0],
        percentage: rp.percentage,
      });
    }
    const progressSeries = Object.values(reportMap)
      .filter((s) => s.points.length > 0)
      .sort((a, b) => b.points.length - a.points.length);

    // ── Build project rows ─────────────────────────────────
    const rows = projects.map((p) => {
      const budget = Number(p.budget);
      const actual = Number(p.actualCost || 0);
      const spent = spendMap[p.id]?.cost || 0;
      const spendPct = budget > 0 ? (spent / budget) * 100 : 0;
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
        progress: p.progress,
        budget,
        actualCost: actual,
        spent,
        spendPct: Math.round(spendPct * 10) / 10,
        variance: budget - actual,
        branch: p.branch?.name || "-",
        client: p.client?.companyName || "-",
        taskCount: p._count.tasks,
        reportCount: p._count.progressReports,
      };
    });

    const totalBudget = rows.reduce((s, p) => s + p.budget, 0);
    const totalActual = rows.reduce((s, p) => s + p.actualCost, 0);
    const totalSpent = rows.reduce((s, p) => s + p.spent, 0);

    return apiSuccess({
      summary: {
        totalProjects: rows.length,
        totalBudget,
        totalActual,
        totalSpent,
        totalRAB: rabTotal,
        avgProgress: rows.length > 0
          ? Math.round(rows.reduce((s, p) => s + p.progress, 0) / rows.length)
          : 0,
      },
      rabByStatus,
      rabs,
      rows,
      progressSeries,
    });
  } catch (error) {
    return apiError(error);
  }
});
