// ============================================================
// Smart Konstruksi — Financial Report API
// GET /api/reports/financial?from=2026-01-01&to=2026-12-31&branchId=xxx
//   - Receivables: Invoice vs Payment summary (piutang)
//   - Cash flow: Transaction IN/OUT per bulan
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

export const GET = withPermission("report:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const branchId = searchParams.get("branchId");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    // ── Scope filter (role-based) ──────────────────────────
    // Invoice di-scope via project.branchId / project members / client
    const scope: Record<string, unknown> = {};
    if (branchId) {
      scope.project = { branchId };
    } else if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
      // global — no filter
    } else if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
      if (user.branchId) scope.project = { branchId: user.branchId };
    } else if (["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN"].includes(user.role)) {
      scope.project = { members: { some: { userId: user.id } } };
    } else if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
      const clientProfile = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      scope.project = { clientId: clientProfile?.id || "__none__" };
    }

    const invoiceWhere: Record<string, unknown> = {
      deletedAt: null,
      ...(from || to ? { issuedAt: dateFilter } : {}),
      ...scope,
    };

    // ── Receivables: invoices + payments ───────────────────
    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: {
        project: { select: { id: true, name: true, code: true, client: { select: { companyName: true } } } },
        payments: { select: { amount: true, paidAt: true, confirmedAt: true } },
      },
      orderBy: { issuedAt: "desc" },
      take: 500,
    });

    const now = new Date();
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    const invoiceRows = invoices.map((inv) => {
      const paid = inv.payments.reduce(
        (sum, p) => sum + (p.confirmedAt || p.paidAt ? Number(p.amount) : 0),
        0
      );
      const outstanding = Math.max(0, Number(inv.amount) - paid);
      const isOverdue =
        inv.status !== "PAID" && inv.dueDate < now && outstanding > 0;

      totalInvoiced += Number(inv.amount);
      totalPaid += paid;
      totalOutstanding += outstanding;
      if (isOverdue) {
        overdueCount += 1;
        overdueAmount += outstanding;
      }

      return {
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        amount: Number(inv.amount),
        paid,
        outstanding,
        status: inv.status,
        isOverdue,
        issuedAt: inv.issuedAt.toISOString(),
        dueDate: inv.dueDate.toISOString(),
        projectName: inv.project?.name || "-",
        projectCode: inv.project?.code || "-",
        clientName: inv.project?.client?.companyName || "-",
      };
    });

    // ── Cash flow: Transaction IN/OUT per bulan ────────────
    // Scope via project relation (transactions optional project).
    // Build a project subquery that respects branch OR role scope.
    let projectScopeSql = "";
    if (branchId) {
      projectScopeSql = `AND "projectId" IN (SELECT id FROM "projects" WHERE "branchId" = '${branchId}')`;
    } else if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
      projectScopeSql = "";
    } else if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role) && user.branchId) {
      projectScopeSql = `AND "projectId" IN (SELECT id FROM "projects" WHERE "branchId" = '${user.branchId}')`;
    } else if (
      ["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN"].includes(user.role)
    ) {
      projectScopeSql = `AND "projectId" IN (SELECT "projectId" FROM "project_members" WHERE "userId" = '${user.id}')`;
    } else if (user.role === "CLIENT" || user.role === "HOME_OWNER") {
      const clientProfile = await prisma.client.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      projectScopeSql = `AND "projectId" IN (SELECT id FROM "projects" WHERE "clientId" = '${clientProfile?.id || "__none__"}')`;
    }

    const monthlyRaw = await prisma.$queryRawUnsafe<
      { month: string; type: string; total: number }[]
    >(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        type,
        COALESCE(SUM("totalCost"), 0) AS total
      FROM "transactions"
      WHERE 1=1
        AND "reversedAt" IS NULL
        AND "reversalOfId" IS NULL
        ${from ? `AND date >= '${from}'` : ""}
        ${to ? `AND date <= '${to}T23:59:59.999Z'` : ""}
        ${projectScopeSql}
      GROUP BY month, type
      ORDER BY month ASC
    `);

    const monthMap: Record<string, { month: string; IN: number; OUT: number }> = {};
    for (const row of monthlyRaw) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, IN: 0, OUT: 0 };
      if (row.type === "IN") monthMap[row.month].IN = Number(row.total);
      else if (row.type === "OUT") monthMap[row.month].OUT = Number(row.total);
    }
    const cashflow = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    const totalCashIn = cashflow.reduce((s, m) => s + m.IN, 0);
    const totalCashOut = cashflow.reduce((s, m) => s + m.OUT, 0);

    return apiSuccess({
      receivables: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        overdueCount,
        overdueAmount,
        invoiceCount: invoices.length,
        invoices: invoiceRows,
      },
      cashflow: {
        months: cashflow,
        totalIn: totalCashIn,
        totalOut: totalCashOut,
        net: totalCashIn - totalCashOut,
      },
      filters: { from, to, branchId },
    });
  } catch (error) {
    return apiError(error);
  }
});
