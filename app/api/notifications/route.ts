// ============================================================
// Smart Konstruksi — Notifications API
// GET /api/notifications — own notifications (paginated + unread count)
// (POST read-all lives in /api/notifications/read-all — a static
//  segment so it is not shadowed by the dynamic [id] route)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withAuth,
  parsePagination,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/notifications — any authenticated user, own scope only
// Query: page, limit, unreadOnly=true, type
export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || "";

    const where: Record<string, unknown> = { userId: user.id };
    if (unreadOnly) where.isRead = false;
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    return apiSuccess({
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    return apiError(error);
  }
});
