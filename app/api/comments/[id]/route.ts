// ============================================================
// Smart Konstruksi — Comment Detail API
// DELETE /api/comments/[id] — delete own comment or admin-level
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

const ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

// DELETE /api/comments/[id] — author or admin-level roles only
export const DELETE = withAuth(async (request, { user }) => {
  try {
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop();
    if (!id) return apiError(new Error("Comment ID is required"));

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!comment) return apiError(new Error("Comment not found"));

    const isAuthor = comment.authorId === user.id;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isAuthor && !isAdmin) {
      return apiError(new Error("Not authorized to delete this comment"));
    }

    await prisma.comment.delete({ where: { id } });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
});
