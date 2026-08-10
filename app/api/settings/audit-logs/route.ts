// ============================================================
// Smart Konstruksi — Audit Log Viewer API
// GET /api/settings/audit-logs — paginated audit trail
// Filters: action, entity, search (user name/email), from, to
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  parsePagination,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/settings/audit-logs — audit:read
// SUPER_ADMIN / OWNER / BRANCH_MANAGER
export const GET = withPermission("audit:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    if (action) where.action = action;
    if (entity) where.entity = { contains: entity, mode: "insensitive" };

    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    if (from || to) {
      where.createdAt = {
        ...(from && !isNaN(Date.parse(from)) ? { gte: new Date(from) } : {}),
        ...(to && !isNaN(Date.parse(to)) ? { lte: new Date(to) } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          oldData: true,
          newData: true,
          ipAddress: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return apiPaginated(logs, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});
