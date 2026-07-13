// ============================================================
// Smart Konstruksi — RBAC Guard Functions
// Route guards, Permission guards, Scope guards
// ============================================================

import { Role } from "@prisma/client";
import { canAccessRoutePath, getAccessibleRoutes } from "./config";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "./permissions";

// ==================== ROLE HIERARCHY ====================

// Roles that have global scope (can access ALL data)
const GLOBAL_ROLES: Role[] = ["SUPER_ADMIN", "OWNER"];

// Roles that have branch scope
const BRANCH_ROLES: Role[] = [
  "BRANCH_MANAGER",
  "ADMIN_KANTOR",
  "FINANCE",
];

// Roles that have project scope (assigned projects only)
const PROJECT_ROLES: Role[] = [
  "PROJECT_MANAGER",
  "ESTIMATOR",
  "SITE_MANAGER",
  "ARSITEK",
  "QC_INSPECTOR",
  "K3_OFFICER",
  "INTERIOR_DESIGNER",
  "KONSULTAN",
];

// Roles that have own scope (own data only)
const OWN_ROLES: Role[] = ["CLIENT", "VENDOR", "HOME_OWNER"];

// ==================== ROUTE GUARDS ====================

/**
 * Check if a role can access a specific route path
 * Used by middleware for page-level protection
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  return canAccessRoutePath(role, pathname);
}

/**
 * Get all accessible routes for a role
 * Used for sidebar menu rendering
 */
export function getAllowedRoutes(role: Role): string[] {
  return getAccessibleRoutes(role);
}

// ==================== PERMISSION GUARDS ====================

/**
 * Check if role has a specific permission
 * Returns boolean (safe for conditional rendering)
 */
export function checkPermission(role: Role, permission: string): boolean {
  return hasPermission(role, permission);
}

/**
 * Require specific permission — throws if not allowed
 * Use in API route handlers
 */
export function requirePermission(role: Role, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(
      `Role ${role} lacks required permission: ${permission}`
    );
  }
}

/**
 * Require ANY of the listed permissions — throws if none match
 */
export function requireAnyPermission(role: Role, permissions: string[]): void {
  if (!hasAnyPermission(role, permissions)) {
    throw new ForbiddenError(
      `Role ${role} lacks any of: ${permissions.join(", ")}`
    );
  }
}

/**
 * Require ALL of the listed permissions — throws if any missing
 */
export function requireAllPermissions(
  role: Role,
  permissions: string[]
): void {
  if (!hasAllPermissions(role, permissions)) {
    throw new ForbiddenError(
      `Role ${role} missing permissions: ${permissions.join(", ")}`
    );
  }
}

// ==================== SCOPE GUARDS ====================

/**
 * Determine the scope level of a role
 */
export function getScopeLevel(
  role: Role
): "global" | "branch" | "project" | "own" {
  if (GLOBAL_ROLES.includes(role)) return "global";
  if (BRANCH_ROLES.includes(role)) return "branch";
  if (PROJECT_ROLES.includes(role)) return "project";
  if (OWN_ROLES.includes(role)) return "own";
  return "own"; // default: most restrictive
}

/**
 * Check if user can access a specific branch
 * - Global roles: always yes
 * - Branch roles: only own branch
 * - Project/Own roles: no direct branch access
 */
export function canAccessBranch(
  userRole: Role,
  userBranchId: string | null,
  targetBranchId: string
): boolean {
  // Global roles can access all branches
  if (GLOBAL_ROLES.includes(userRole)) {
    return true;
  }

  // Branch roles can only access their own branch
  if (BRANCH_ROLES.includes(userRole)) {
    return userBranchId === targetBranchId;
  }

  // Project/Own roles: no direct branch access
  // (they access via project membership)
  return false;
}

/**
 * Check if user can access a specific project
 * - Global roles: always yes
 * - Branch roles: only projects in their branch
 * - Project roles: only assigned projects
 * - Own roles: only own project (client's project)
 */
export function canAccessProject(
  userRole: Role,
  userBranchId: string | null,
  projectBranchId: string,
  isProjectMember: boolean,
  isOwnProject: boolean
): boolean {
  // Global roles
  if (GLOBAL_ROLES.includes(userRole)) {
    return true;
  }

  // Branch roles: check branch match
  if (BRANCH_ROLES.includes(userRole)) {
    return userBranchId === projectBranchId;
  }

  // Project roles: check membership
  if (PROJECT_ROLES.includes(userRole)) {
    return isProjectMember;
  }

  // Own roles: check ownership
  if (OWN_ROLES.includes(userRole)) {
    return isOwnProject;
  }

  return false;
}

/**
 * Check if user can access a specific invoice
 * - Global roles: always yes
 * - Branch roles: only invoices in their branch (via project)
 * - Admin Kantor: can create/view (branch scope)
 * - Finance: can verify (branch scope)
 * - Client: only own invoices
 */
export function canAccessInvoice(
  userRole: Role,
  userBranchId: string | null,
  invoiceProjectBranchId: string,
  isOwnInvoice: boolean
): boolean {
  if (GLOBAL_ROLES.includes(userRole)) return true;

  if (BRANCH_ROLES.includes(userRole)) {
    return userBranchId === invoiceProjectBranchId;
  }

  if (userRole === "CLIENT") {
    return isOwnInvoice;
  }

  return false;
}

// ==================== API RESPONSE HELPERS ====================

/**
 * Custom ForbiddenError for API route handlers
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Custom UnauthorizedError for API route handlers
 */
export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Check if we're in development mode
 */
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Standard error response for API routes
 * - Development: shows real error messages (debug-friendly)
 * - Production: sanitizes messages to prevent info leakage
 */
export function apiError(error: unknown): Response {
  if (error instanceof ForbiddenError) {
    return Response.json(
      {
        error: "Forbidden",
        message: isDev() ? error.message : "You don't have permission to perform this action",
      },
      { status: 403 }
    );
  }
  if (error instanceof UnauthorizedError) {
    return Response.json(
      {
        error: "Unauthorized",
        message: isDev() ? error.message : "Authentication required",
      },
      { status: 401 }
    );
  }
  // Log all unexpected errors for debugging (always)
  console.error("[API Error]", error instanceof Error ? error.message : error);
  if (!isDev() && error instanceof Error) {
    // Log stack trace only in dev, but capture in prod logs
    console.error("[API Error Stack]", error.stack);
  }
  return Response.json(
    {
      error: "Internal Server Error",
      message: isDev() && error instanceof Error ? error.message : "An unexpected error occurred",
    },
    { status: 500 }
  );
}
