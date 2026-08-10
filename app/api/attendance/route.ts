// ============================================================
// Smart Konstruksi — Attendance API
// GET /api/attendance — list attendance records (scope filtered)
// POST lives in /api/attendance/check-in and /check-out
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  parsePagination,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import type { AuthenticatedUser } from "@/lib/api/with-auth";
import { startOfDay, endOfDay } from "@/lib/attendance-time";

/**
 * Scope filter for attendance:
 * - Global roles: everything
 * - Branch roles: projects in their branch
 * - Project roles (PM, site manager): their assigned projects
 * - Workers (mandor): own records only
 */
function buildAttendanceScopeFilter(user: AuthenticatedUser) {
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") return {};

  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    if (user.branchId) return { project: { branchId: user.branchId } };
    return {};
  }

  if (["PROJECT_MANAGER", "SITE_MANAGER"].includes(user.role)) {
    return { project: { members: { some: { userId: user.id } } } };
  }

  // MANDOR and other workers: own records
  return { userId: user.id };
}

// GET /api/attendance — attendance:read
// Query: page, limit, projectId, date (YYYY-MM-DD), userId (global roles)
export const GET = withPermission("attendance:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const projectId = searchParams.get("projectId") || "";
    const date = searchParams.get("date") || "";
    const userId = searchParams.get("userId") || "";

    const where: Record<string, unknown> = {
      ...buildAttendanceScopeFilter(user),
    };

    if (projectId) where.projectId = projectId;

    if (date && !isNaN(Date.parse(date))) {
      const d = new Date(date);
      const from = new Date(d);
      from.setHours(0, 0, 0, 0);
      const to = new Date(d);
      to.setHours(23, 59, 59, 999);
      where.checkIn = { gte: from, lte: to };
    }

    // userId filter only for global roles (managers can't spy on arbitrary users)
    if (userId && (user.role === "SUPER_ADMIN" || user.role === "OWNER")) {
      where.userId = userId;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          latitude: true,
          longitude: true,
          notes: true,
          user: {
            select: { id: true, name: true, email: true, avatar: true, role: true },
          },
          project: {
            select: { id: true, name: true, code: true },
          },
        },
        orderBy: { checkIn: "desc" },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return apiPaginated(records, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});
