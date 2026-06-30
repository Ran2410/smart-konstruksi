// ============================================================
// Smart Konstruksi — API Route Auth + RBAC Wrapper
// Higher-order functions for API route protection
// ============================================================

import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { requirePermission, requireAnyPermission, apiError } from "@/lib/rbac/guard";

// ==================== TYPES ====================

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  branchId: string | null;
};

export type HandlerContext = {
  user: AuthenticatedUser;
};

export type ApiHandler = (
  request: Request,
  ctx: HandlerContext
) => Promise<Response>;

// ==================== WRAPPERS ====================

/**
 * withAuth — Authenticate only (no permission check)
 * Use for routes that need any logged-in user
 *
 * Usage:
 *   export const GET = withAuth(async (request, { user }) => {
 *     return Response.json({ userId: user.id });
 *   });
 */
export function withAuth(handler: ApiHandler) {
  return async (request: Request): Promise<Response> => {
    try {
      const session = await auth();

      if (!session?.user) {
        return apiError(new Error("Unauthorized"));
      }

      const user = session.user as AuthenticatedUser;
      return await handler(request, { user });
    } catch (error) {
      return apiError(error);
    }
  };
}

/**
 * withPermission — Authenticate + require specific permission
 * Use for CRUD routes with single permission requirement
 *
 * Usage:
 *   export const GET = withPermission("branch:read", async (req, { user }) => { ... });
 *   export const POST = withPermission("branch:create", async (req, { user }) => { ... });
 */
export function withPermission(permission: string, handler: ApiHandler) {
  return withAuth(async (request, ctx) => {
    requirePermission(ctx.user.role, permission);
    return await handler(request, ctx);
  });
}

/**
 * withAnyPermission — Authenticate + require ANY of the listed permissions
 * Use for routes accessible by multiple role groups
 *
 * Usage:
 *   export const GET = withAnyPermission(
 *     ["project:read", "project:read:own"],
 *     async (req, { user }) => { ... }
 *   );
 */
export function withAnyPermission(permissions: string[], handler: ApiHandler) {
  return withAuth(async (request, ctx) => {
    requireAnyPermission(ctx.user.role, permissions);
    return await handler(request, ctx);
  });
}

// ==================== HELPERS ====================

/**
 * Parse pagination params from URL search params
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build Prisma where clause for scope-based filtering
 */
export function buildScopeFilter(
  user: AuthenticatedUser,
  options: {
    branchField?: string;
    ownerField?: string;
    memberField?: string;
    projectId?: string;
  } = {}
) {
  const { branchField = "branchId", ownerField = "userId" } = options;

  // Global roles see everything
  if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
    return {};
  }

  // Branch-scoped roles
  if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
    if (user.branchId) {
      return { [branchField]: user.branchId };
    }
    return {};
  }

  // Project-scoped roles — need project membership check
  if (["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN"].includes(user.role)) {
    return { members: { some: { userId: user.id } } };
  }

  // Own-scope roles
  if (["CLIENT", "VENDOR", "HOME_OWNER"].includes(user.role)) {
    return { [ownerField]: user.id };
  }

  return {};
}

/**
 * Standard success response
 */
export function apiSuccess(data: unknown, status: number = 200): Response {
  return Response.json(data, { status });
}

/**
 * Standard created response
 */
export function apiCreated(data: unknown): Response {
  return Response.json(data, { status: 201 });
}

/**
 * Standard no-content response
 */
export function apiNoContent(): Response {
  return new Response(null, { status: 204 });
}

/**
 * Standard paginated response
 */
export function apiPaginated(
  data: unknown[],
  total: number,
  page: number,
  limit: number
): Response {
  return Response.json({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
