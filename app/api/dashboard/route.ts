import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Role alias mapping
const ROLE_ALIASES = {
  OWNER: "SUPER_ADMIN",
  INTERIOR_DESIGNER: "ARSITEK",
  KONSULTAN: "ARSITEK",
  HOME_OWNER: "CLIENT",
};

function resolveRole(role) {
  return ROLE_ALIASES[role] || role;
}

function timeAgo(date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  return `${weeks} minggu lalu`;
}

function formatRupiah(val) {
  const num = Number(val);
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`;
  return `Rp ${num}`;
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const rawRole = session.user.role;
  const role = resolveRole(rawRole);

  try {
    const data = await buildDashboardData(role, userId, rawRole);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function buildDashboardData(role, userId, rawRole) {
  switch (role) {
    case "SUPER_ADMIN":
      return buildSuperAdminDashboard(userId);
    case "BRANCH_MANAGER":
      return buildBranchManagerDashboard(userId);
    case "PROJECT_MANAGER":
      return buildProjectManagerDashboard(userId);
    case "SITE_MANAGER":
      return buildSiteManagerDashboard(userId);
    case "CLIENT":
      return buildClientDashboard(userId);
    case "FINANCE":
      return buildFinanceDashboard(userId);
    case "ADMIN_KANTOR":
      return buildAdminKantorDashboard(userId);
    case "ARSITEK":
      return buildArsitekDashboard(userId);
    case "QC_INSPECTOR":
      return buildQCInspectorDashboard(userId);
    case "K3_OFFICER":
      return buildK3Dashboard(userId);
    case "VENDOR":
      return buildVendorDashboard(userId);
    case "ESTIMATOR":
      return buildEstimatorDashboard(userId);
    default:
      return buildSuperAdminDashboard(userId);
  }
}

// ═══════════════════════════════════════════════════════════════
// SUPER_ADMIN / OWNER
// ═══════════════════════════════════════════════════════════════
async function buildSuperAdminDashboard(userId) {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTeam,
    pendingApprovals,
    totalRevenue,
    unpaidInvoices,
    recentActivity,
    projectProgress,
    overdueTasks,
    completedTasks,
    totalBranches,
  ] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { status: "IN_PROGRESS", deletedAt: null } }),
    prisma.project.count({ where: { status: "COMPLETED", deletedAt: null } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.approval.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { amount: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, status: { not: "COMPLETED" } },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.task.count({ where: { status: "BLOCKED" } }),
    prisma.task.count({ where: { status: "DONE" } }),
    prisma.branch.count(),
  ]);

  const totalBudget = await prisma.project.aggregate({
    where: { deletedAt: null },
    _sum: { budget: true },
  });

  return {
    greeting: "System Overview",
    subtitle: `Berikut ringkasan sistem hari ini.`,
    stats: [
      {
        icon: "apartment",
        value: String(totalProjects),
        label: "Total Projects",
        change: `${activeProjects} aktif`,
        up: true,
      },
      {
        icon: "paid",
        value: formatRupiah(totalRevenue._sum.amount || 0),
        label: "Total Revenue",
        change: `${formatRupiah(totalBudget._sum.budget || 0)} budget`,
        up: true,
      },
      {
        icon: "pending_actions",
        value: String(pendingApprovals),
        label: "Pending Approvals",
        change: pendingApprovals > 0 ? "perlu review" : "all clear",
        up: pendingApprovals === 0,
      },
      {
        icon: "group",
        value: String(totalTeam),
        label: "Team Members",
        change: `${completedProjects} project selesai`,
        up: true,
      },
    ],
    quickStats: [
      {
        icon: "task_alt",
        label: "Completed Tasks",
        status: String(completedTasks),
        color: "#22C55E",
        statusColor: "#22C55E",
      },
      {
        icon: "warning",
        label: "Blocked Tasks",
        status: String(overdueTasks),
        color: "#EF4444",
        statusColor: "#EF4444",
      },
      {
        icon: "receipt_long",
        label: "Unpaid Invoices",
        status: formatRupiah(unpaidInvoices._sum.amount || 0),
        color: "#F59E0B",
        statusColor: "#F59E0B",
      },
      {
        icon: "domain",
        label: "Active Branches",
        status: String(totalBranches),
        color: "#22C55E",
        statusColor: "#22C55E",
      },
    ],
    activity: recentActivity.map((a) => ({
      icon: a.type === "PROJECT_CREATED" ? "check_circle" : a.type === "APPROVAL" ? "pending" : a.type === "USER" ? "person_add" : "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: a.type === "PROJECT_CREATED" ? "#22C55E" : a.type === "APPROVAL" ? "#F59E0B" : "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: p.status === "IN_PROGRESS" ? "#22C55E" : p.status === "ON_HOLD" ? "#F59E0B" : "#6B7280",
    })),
    chartData: await buildChartData(),
  };
}

// ═══════════════════════════════════════════════════════════════
// BRANCH_MANAGER
// ═══════════════════════════════════════════════════════════════
async function buildBranchManagerDashboard(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { branchId: true } });
  const branchFilter = user?.branchId ? { branchId: user.branchId } : {};

  const [projects, team, pendingApprovals, branchRevenue, recentActivity, projectProgress] = await Promise.all([
    prisma.project.count({ where: { ...branchFilter, deletedAt: null } }),
    prisma.user.count({ where: { ...branchFilter, isActive: true } }),
    prisma.approval.count({ where: { status: "PENDING", project: branchFilter } }),
    prisma.payment.aggregate({ where: { invoice: { project: branchFilter } }, _sum: { amount: true } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { ...branchFilter, deletedAt: null, status: { not: "COMPLETED" } },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Branch Dashboard",
    subtitle: `Overview cabang Anda.`,
    stats: [
      { icon: "apartment", value: String(projects), label: "My Projects", change: "semua aktif", up: true },
      { icon: "paid", value: formatRupiah(branchRevenue._sum.amount || 0), label: "Branch Revenue", change: "+8.3%", up: true },
      { icon: "pending_actions", value: String(pendingApprovals), label: "Pending Approvals", change: pendingApprovals > 0 ? "perlu review" : "all clear", up: pendingApprovals === 0 },
      { icon: "group", value: String(team), label: "Branch Team", change: "stable", up: true },
    ],
    quickStats: [
      { icon: "task_alt", label: "Total Projects", status: String(projects), color: "#22C55E", statusColor: "#22C55E" },
      { icon: "pending", label: "Pending Approvals", status: String(pendingApprovals), color: "#F59E0B", statusColor: "#F59E0B" },
    ],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: p.status === "IN_PROGRESS" ? "#22C55E" : p.status === "ON_HOLD" ? "#F59E0B" : "#6B7280",
    })),
    chartData: await buildChartData({ branchId: user?.branchId }),
  };
}

// ═══════════════════════════════════════════════════════════════
// PROJECT_MANAGER
// ═══════════════════════════════════════════════════════════════
async function buildProjectManagerDashboard(userId) {
  const [myProjects, openTasks, teamMembers, nextDeadline, completedToday, recentActivity, projectProgress] = await Promise.all([
    prisma.project.count({ where: { projectManagerId: userId, deletedAt: null } }),
    prisma.task.count({ where: { status: { in: ["TODO", "IN_PROGRESS"] }, project: { projectManagerId: userId } } }),
    prisma.projectMember.count({ where: { project: { projectManagerId: userId } } }),
    prisma.task.findFirst({
      where: { status: { in: ["TODO", "IN_PROGRESS"] }, project: { projectManagerId: userId } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true },
    }),
    prisma.task.count({ where: { status: "DONE", project: { projectManagerId: userId }, completedAt: { gte: startOfDay() } } }),
    prisma.activityLog.findMany({
      where: { project: { projectManagerId: userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { projectManagerId: userId, deletedAt: null, status: { not: "COMPLETED" } },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const daysUntilDeadline = nextDeadline?.dueDate
    ? Math.ceil((new Date(nextDeadline.dueDate).getTime() - Date.now()) / 86400000)
    : "-";

  return {
    greeting: "My Projects",
    subtitle: `Manage your projects.`,
    stats: [
      { icon: "apartment", value: String(myProjects), label: "My Projects", change: "all active", up: true },
      { icon: "task_alt", value: String(openTasks), label: "Open Tasks", change: "terbuka", up: true },
      { icon: "group", value: String(teamMembers), label: "Team Members", change: "stable", up: true },
      { icon: "calendar_today", value: typeof daysUntilDeadline === "number" ? `${daysUntilDeadline}d` : "-", label: "Next Deadline", change: "on track", up: true },
    ],
    quickStats: [
      { icon: "check_circle", label: "Completed Today", status: `${completedToday} tasks`, color: "#22C55E", statusColor: "#22C55E" },
      { icon: "pending_actions", label: "Open Tasks", status: String(openTasks), color: "#F59E0B", statusColor: "#F59E0B" },
    ],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: p.status === "IN_PROGRESS" ? "#22C55E" : p.status === "ON_HOLD" ? "#F59E0B" : "#6B7280",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// SITE_MANAGER / MANDOR
// ═══════════════════════════════════════════════════════════════
async function buildSiteManagerDashboard(userId) {
  const [todayTasks, workersPresent, materialsNeeded, recentActivity, projectProgress] = await Promise.all([
    prisma.task.count({ where: { assigneeId: userId, startDate: { lte: new Date() }, dueDate: { gte: startOfDay() } } }),
    prisma.attendance.count({ where: { userId, checkIn: { gte: startOfDay() } } }),
    prisma.material.count({ where: { status: "ORDERED", project: { siteManagerId: userId } } }),
    prisma.activityLog.findMany({
      where: { project: { siteManagerId: userId } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { siteManagerId: userId, deletedAt: null, status: { not: "COMPLETED" } },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Today's Field Work",
    subtitle: `Overview lapangan hari ini.`,
    stats: [
      { icon: "task_alt", value: String(todayTasks), label: "Today's Tasks", change: "hari ini", up: true },
      { icon: "groups", value: String(workersPresent), label: "Workers Present", change: "hadir", up: true },
      { icon: "inventory_2", value: String(materialsNeeded), label: "Materials Needed", change: materialsNeeded > 0 ? "pending order" : "all set", up: materialsNeeded === 0 },
      { icon: "description", value: "1", label: "Report Due", change: "daily report", up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════════════════════════
async function buildClientDashboard(userId) {
  const clientProfile = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });

  const clientFilter = clientProfile ? { clientId: clientProfile.id } : {};

  const [myProjects, docs, messages, recentActivity, projectProgress, recentReports] = await Promise.all([
    prisma.project.count({ where: { ...clientFilter, deletedAt: null } }),
    prisma.file.count({ where: { project: clientFilter } }),
    prisma.message.count({ where: { receiverId: userId } }),
    prisma.activityLog.findMany({
      where: { project: clientFilter },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { ...clientFilter, deletedAt: null },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.progressReport.findMany({
      where: { project: clientFilter },
      orderBy: { reportDate: "desc" },
      take: 3,
      select: { percentage: true, description: true, reportDate: true, reporter: { select: { name: true } } },
    }),
  ]);

  const overallProgress = projectProgress.length > 0
    ? Math.round(projectProgress.reduce((sum, p) => sum + p.progress, 0) / projectProgress.length)
    : 0;

  return {
    greeting: "My Projects",
    subtitle: `Overview proyek Anda.`,
    stats: [
      { icon: "apartment", value: String(myProjects), label: "Active Project", change: "on track", up: true },
      { icon: "timeline", value: `${overallProgress}%`, label: "Overall Progress", change: "+5% this month", up: true },
      { icon: "description", value: String(docs), label: "Documents", change: docs > 0 ? `${docs} docs` : "no docs", up: true },
      { icon: "chat", value: String(messages), label: "Messages", change: messages > 0 ? "unread" : "empty", up: true },
    ],
    quickStats: recentReports.map((r) => ({
      icon: "check_circle",
      label: r.reporter.name,
      status: `${r.percentage}% — ${r.description.slice(0, 30)}`,
      color: "#22C55E",
      statusColor: "#22C55E",
    })),
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// FINANCE
// ═══════════════════════════════════════════════════════════════
async function buildFinanceDashboard(userId) {
  const [totalRevenue, pendingInvoices, paidInvoices, overdueInvoices, recentActivity] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.invoice.count({ where: { status: "SENT" } }),
    prisma.invoice.count({ where: { status: "PAID" } }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const totalBudget = await prisma.project.aggregate({ where: { deletedAt: null }, _sum: { budget: true } });
  const outstanding = await prisma.invoice.aggregate({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    _sum: { amount: true },
  });

  return {
    greeting: "Financial Overview",
    subtitle: `Overview keuangan.`,
    stats: [
      { icon: "paid", value: formatRupiah(totalRevenue._sum.amount || 0), label: "Total Revenue", change: `${paidInvoices} paid`, up: true },
      { icon: "receipt_long", value: String(pendingInvoices + overdueInvoices), label: "Pending Invoices", change: formatRupiah(outstanding._sum.amount || 0), up: false },
      { icon: "account_balance", value: formatRupiah(totalRevenue._sum.amount || 0), label: "Payments Received", change: `${paidInvoices} paid`, up: true },
      { icon: "warning", value: String(overdueInvoices), label: "Overdue Invoices", change: overdueInvoices > 0 ? "perlu follow up" : "all clear", up: overdueInvoices === 0 },
    ],
    quickStats: [
      { icon: "check_circle", label: "Paid Invoices", status: String(paidInvoices), color: "#22C55E", statusColor: "#22C55E" },
      { icon: "pending", label: "Awaiting Payment", status: String(pendingInvoices), color: "#F59E0B", statusColor: "#F59E0B" },
      { icon: "warning", label: "Overdue", status: String(overdueInvoices), color: "#EF4444", statusColor: "#EF4444" },
    ],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: [],
    chartData: await buildChartData(),
  };
}

// ═══════════════════════════════════════════════════════════════
// ADMIN_KANTOR
// ═══════════════════════════════════════════════════════════════
async function buildAdminKantorDashboard(userId) {
  const [activeProjects, totalDocs, totalInvoices, recentActivity] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null, status: "IN_PROGRESS" } }),
    prisma.file.count({}),
    prisma.invoice.count({}),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    greeting: "Office Operations",
    subtitle: `Overview operasional kantor.`,
    stats: [
      { icon: "apartment", value: String(activeProjects), label: "Active Projects", change: "semua aktif", up: true },
      { icon: "description", value: String(totalDocs), label: "Documents", change: `${totalDocs} docs`, up: true },
      { icon: "receipt_long", value: String(totalInvoices), label: "Invoices", change: `${totalInvoices} total`, up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// ARSITEK
// ═══════════════════════════════════════════════════════════════
async function buildArsitekDashboard(userId) {
  const [myDesigns, recentActivity, projectProgress] = await Promise.all([
    prisma.file.count({ where: { uploaderId: userId, mimeType: { contains: "image" } } }),
    prisma.activityLog.findMany({
      where: { project: { members: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { members: { some: { userId } }, deletedAt: null },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Design Hub",
    subtitle: `Overview desain Anda.`,
    stats: [
      { icon: "draw", value: String(myDesigns), label: "My Designs", change: `${myDesigns} total`, up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// QC_INSPECTOR
// ═══════════════════════════════════════════════════════════════
async function buildQCInspectorDashboard(userId) {
  const [pendingApprovals, approvedApprovals, rejectedApprovals, recentActivity, projectProgress] = await Promise.all([
    prisma.approval.count({ where: { approverId: userId, status: "PENDING", type: "DESIGN" } }),
    prisma.approval.count({ where: { approverId: userId, status: "APPROVED" } }),
    prisma.approval.count({ where: { approverId: userId, status: "REJECTED" } }),
    prisma.activityLog.findMany({
      where: { project: { members: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { members: { some: { userId } }, deletedAt: null },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Quality Control",
    subtitle: `Overview inspeksi.`,
    stats: [
      { icon: "fact_check", value: String(pendingApprovals), label: "Pending Inspections", change: `${pendingApprovals} today`, up: true },
      { icon: "check_circle", value: String(approvedApprovals), label: "Approved", change: "this month", up: true },
      { icon: "warning", value: String(rejectedApprovals), label: "Rejected", change: rejectedApprovals > 0 ? "perlu tindak lanjut" : "all clear", up: rejectedApprovals === 0 },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// K3_OFFICER
// ═══════════════════════════════════════════════════════════════
async function buildK3Dashboard(userId) {
  const [totalTasks, completedTasks, recentActivity, projectProgress] = await Promise.all([
    prisma.task.count({ where: { project: { members: { some: { userId } } } } }),
    prisma.task.count({ where: { status: "DONE", project: { members: { some: { userId } } } } }),
    prisma.activityLog.findMany({
      where: { project: { members: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { members: { some: { userId } }, deletedAt: null },
      select: { name: true, progress: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Safety Dashboard",
    subtitle: `Overview keselamatan.`,
    stats: [
      { icon: "health_and_safety", value: String(completedTasks), label: "Tasks Completed", change: "this month", up: true },
      { icon: "task_alt", value: String(totalTasks), label: "Total Tasks", change: "all projects", up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// VENDOR
// ═══════════════════════════════════════════════════════════════
async function buildVendorDashboard(userId) {
  const [activeOrders, deliveredOrders, pendingOrders, totalPayments, recentActivity] = await Promise.all([
    prisma.material.count({ where: { vendor: { userId }, status: { in: ["ORDERED", "SHIPPED"] } } }),
    prisma.material.count({ where: { vendor: { userId }, status: "DELIVERED" } }),
    prisma.material.count({ where: { vendor: { userId }, status: "ORDERED" } }),
    prisma.payment.aggregate({ where: { invoice: { project: { materials: { some: { vendor: { userId } } } } } }, _sum: { amount: true } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    greeting: "My Orders",
    subtitle: `Overview pesanan Anda.`,
    stats: [
      { icon: "shopping_cart", value: String(activeOrders), label: "Active Orders", change: `${pendingOrders} pending`, up: true },
      { icon: "check_circle", value: String(deliveredOrders), label: "Delivered", change: "this month", up: true },
      { icon: "payments", value: formatRupiah(totalPayments._sum.amount || 0), label: "Total Payments", change: "received", up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// ESTIMATOR
// ═══════════════════════════════════════════════════════════════
async function buildEstimatorDashboard(userId) {
  const [totalProjects, recentActivity, projectProgress] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.project.findMany({
      where: { deletedAt: null },
      select: { name: true, progress: true, status: true, budget: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    greeting: "Estimation Dashboard",
    subtitle: `Overview estimasi.`,
    stats: [
      { icon: "calculate", value: String(totalProjects), label: "Projects to Estimate", change: `${totalProjects} total`, up: true },
    ],
    quickStats: [],
    activity: recentActivity.map((a) => ({
      icon: "info",
      text: a.title || a.message || "No description",
      time: timeAgo(a.createdAt),
      color: "#6B7280",
    })),
    progress: projectProgress.map((p) => ({
      label: p.name,
      value: p.progress,
      color: "#22C55E",
    })),
  };
}

/**
 * Build chart data — combines revenue trend (day/week/month) + weekly profit.
 */
async function buildChartData(projectFilter: { projectId?: string; branchId?: string } = {}) {
  const [monthly, weekly, daily, profitThisWeek, profitLastWeek, profitThisMonth] = await Promise.all([
    buildRevenueTrendData(projectFilter),
    buildRevenueTrendWeeklyData(projectFilter),
    buildRevenueTrendDailyData(projectFilter),
    buildWeeklyProfitData(projectFilter, 0),
    buildWeeklyProfitData(projectFilter, -1),
    buildWeeklyProfitDataThisMonth(projectFilter),
  ]);
  return {
    revenueTrend: { monthly, weekly, daily },
    weeklyProfit: { thisWeek: profitThisWeek, lastWeek: profitLastWeek, thisMonth: profitThisMonth },
  };
}

/**
 * Revenue trend — weekly aggregation (last 12 weeks).
 */
async function buildRevenueTrendWeeklyData(projectFilter: { projectId?: string; branchId?: string } = {}) {
  const now = new Date();
  const weeks: Array<{ name: string; startDate: Date; endDate: Date }> = [];

  for (let i = 11; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59);
    const weekNum = 52 - i;
    weeks.push({ name: `W${weekNum}`, startDate: start, endDate: end });
  }

  const results = await Promise.all(
    weeks.map(async (w) => {
      const where = {
        paidAt: { gte: w.startDate, lte: w.endDate },
        ...(projectFilter.projectId ? { invoice: { projectId: projectFilter.projectId } } : {}),
        ...(projectFilter.branchId ? { invoice: { project: { branchId: projectFilter.branchId } } } : {}),
      };
      const agg = await prisma.payment.aggregate({ where, _sum: { amount: true } });
      return Number(agg._sum.amount || 0);
    })
  );

  const hasRealData = results.some((v) => v > 0);
  if (!hasRealData) {
    return weeks.map((w, i) => ({
      name: w.name,
      revenue: Math.floor(20 + Math.random() * 30 + i * 2),
      sales: Math.floor(15 + Math.random() * 25 + i * 2),
    }));
  }

  return weeks.map((w, i) => ({
    name: w.name,
    revenue: Math.round(results[i] / 1_000_000),
    sales: Math.round(results[i] * 0.85 / 1_000_000),
  }));
}

/**
 * Revenue trend — daily aggregation (last 14 days).
 */
async function buildRevenueTrendDailyData(projectFilter: { projectId?: string; branchId?: string } = {}) {
  const now = new Date();
  const days: Array<{ name: string; startDate: Date; endDate: Date }> = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const start = new Date(d);
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59);
    const dayName = d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
    days.push({ name: dayName, startDate: start, endDate: end });
  }

  const results = await Promise.all(
    days.map(async (d) => {
      const where = {
        paidAt: { gte: d.startDate, lte: d.endDate },
        ...(projectFilter.projectId ? { invoice: { projectId: projectFilter.projectId } } : {}),
        ...(projectFilter.branchId ? { invoice: { project: { branchId: projectFilter.branchId } } } : {}),
      };
      const agg = await prisma.payment.aggregate({ where, _sum: { amount: true } });
      return Number(agg._sum.amount || 0);
    })
  );

  const hasRealData = results.some((v) => v > 0);
  if (!hasRealData) {
    return days.map((d, i) => ({
      name: d.name,
      revenue: Math.floor(5 + Math.random() * 15 + i),
      sales: Math.floor(3 + Math.random() * 12 + i),
    }));
  }

  return days.map((d, i) => ({
    name: d.name,
    revenue: Math.round(results[i] / 1_000_000),
    sales: Math.round(results[i] * 0.85 / 1_000_000),
  }));
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ═══════════════════════════════════════════════════════════════
// CHART DATA BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Revenue trend — monthly aggregation from real payments.
 * Falls back to mock if no payments exist.
 */
async function buildRevenueTrendData(projectFilter: { projectId?: string; branchId?: string } = {}) {
  const now = new Date();
  const months = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Get last 12 months
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      name: monthNames[d.getMonth()],
      startDate: new Date(d.getFullYear(), d.getMonth(), 1),
      endDate: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  // Query real payments per month
  const results = await Promise.all(
    months.map(async (m) => {
      const where = {
        paidAt: { gte: m.startDate, lte: m.endDate },
        ...(projectFilter.projectId ? { invoice: { projectId: projectFilter.projectId } } : {}),
        ...(projectFilter.branchId ? { invoice: { project: { branchId: projectFilter.branchId } } } : {}),
      };
      const agg = await prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      });
      return Number(agg._sum.amount || 0);
    })
  );

  const hasRealData = results.some((v) => v > 0);

  if (!hasRealData) {
    // Mock fallback
    return months.map((m, i) => ({
      name: m.name,
      revenue: Math.floor(40 + Math.random() * 60 + i * 5),
      sales: Math.floor(30 + Math.random() * 50 + i * 4),
    }));
  }

  return months.map((m, i) => ({
    name: m.name,
    revenue: Math.round(results[i] / 1_000_000), // in millions
    sales: Math.round(results[i] * 0.85 / 1_000_000), // estimated sales = 85% of revenue
  }));
}

/**
 * Weekly profit — daily aggregation from real payments for a specific week.
 * weekOffset: 0 = this week, -1 = last week, etc.
 */
async function buildWeeklyProfitData(projectFilter: { projectId?: string; branchId?: string } = {}, weekOffset: number = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const results = [];

  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(startOfWeek.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59);

    const where = {
      paidAt: { gte: dayStart, lte: dayEnd },
      ...(projectFilter.projectId ? { invoice: { projectId: projectFilter.projectId } } : {}),
      ...(projectFilter.branchId ? { invoice: { project: { branchId: projectFilter.branchId } } } : {}),
    };
    const agg = await prisma.payment.aggregate({
      where,
      _sum: { amount: true },
    });
    results.push(Number(agg._sum.amount || 0));
  }

  const hasRealData = results.some((v) => v > 0);

  return dayNames.map((d, i) => ({
    name: d,
    sales: hasRealData ? Math.round(results[i] / 1_000_000) : 0,
    revenue: hasRealData ? Math.round(results[i] * 1.1 / 1_000_000) : 0,
  }));
}

/**
 * Weekly profit — aggregated by week of the current month (W1-W5).
 */
async function buildWeeklyProfitDataThisMonth(projectFilter: { projectId?: string; branchId?: string } = {}) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const weeks: Array<{ name: string; startDate: Date; endDate: Date }> = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let current = new Date(firstDay);
  let weekNum = 1;
  while (current <= lastDay) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    if (weekEnd > lastDay) weekEnd.setTime(lastDay.getTime());
    weekEnd.setHours(23, 59, 59);

    weeks.push({ name: `W${weekNum}`, startDate: weekStart, endDate: weekEnd });
    current.setDate(current.getDate() + 7);
    weekNum++;
  }

  const monthResults = await Promise.all(
    weeks.map(async (w) => {
      const where = {
        paidAt: { gte: w.startDate, lte: w.endDate },
        ...(projectFilter.projectId ? { invoice: { projectId: projectFilter.projectId } } : {}),
        ...(projectFilter.branchId ? { invoice: { project: { branchId: projectFilter.branchId } } } : {}),
      };
      const agg = await prisma.payment.aggregate({ where, _sum: { amount: true } });
      return Number(agg._sum.amount || 0);
    })
  );

  const hasMonthData = monthResults.some((v) => v > 0);

  return weeks.map((w, i) => ({
    name: w.name,
    sales: hasMonthData ? Math.round(monthResults[i] / 1_000_000) : 0,
    revenue: hasMonthData ? Math.round(monthResults[i] * 1.1 / 1_000_000) : 0,
  }));
}
