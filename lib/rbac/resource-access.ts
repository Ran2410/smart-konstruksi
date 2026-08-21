import "server-only";

import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canAccessProject } from "./guard";

export type ScopedUser = {
  id: string;
  role: Role;
  branchId: string | null;
};

export function accessibleProjectWhere(user: ScopedUser): Prisma.ProjectWhereInput {
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") return {};

  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    return user.branchId ? { branchId: user.branchId } : { id: "__no_access__" };
  }

  if (["CLIENT", "HOME_OWNER"].includes(user.role)) {
    return { client: { userId: user.id } };
  }

  return { members: { some: { userId: user.id } } };
}

/**
 * Resolve project ownership and membership on the server, then apply the
 * central project scope policy. This is intentionally reusable by resources
 * (documents, transactions, etc.) that inherit access from a project.
 */
export async function userCanAccessProject(
  user: ScopedUser,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: {
      branchId: true,
      client: { select: { userId: true } },
      members: {
        where: { userId: user.id },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!project) return false;

  return canAccessProject(
    user.role,
    user.branchId,
    project.branchId,
    project.members.length > 0,
    project.client.userId === user.id
  );
}
