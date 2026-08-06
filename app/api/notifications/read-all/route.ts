// ============================================================
// Smart Konstruksi — Mark All Notifications Read
// POST /api/notifications/read-all
// Static segment (not [id]) so it wins route resolution.
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// POST /api/notifications/read-all — mark every notification of the user as read
export const POST = withAuth(async (_request, { user }) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return apiSuccess({ updated: result.count });
  } catch (error) {
    return apiError(error);
  }
});
