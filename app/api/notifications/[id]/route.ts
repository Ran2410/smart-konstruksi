// ============================================================
// Smart Konstruksi — Notification Detail API
// PUT /api/notifications/[id] — mark single notification as read
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// PUT /api/notifications/[id] — mark as read (ownership enforced)
export const PUT = withAuth(async (request, { user }) => {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop();

    if (!id) {
      return apiError(new Error("Notification ID is required"));
    }

    // Ownership check: only the owner can mark their notification
    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return apiError(new Error("Notification not found"));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });

    return apiSuccess({ data: updated });
  } catch (error) {
    return apiError(error);
  }
});
