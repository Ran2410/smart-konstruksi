// ============================================================
// Smart Konstruksi — RBAC Barrel Export
// Import dari sini: import { ... } from "@/lib/rbac"
// ============================================================

// Permissions
export {
  PERMISSIONS,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissions,
} from "./permissions";

// Config
export {
  ROUTE_ACCESS,
  canAccessRoutePath,
  getAccessibleRoutes,
} from "./config";

// Guard
export {
  canAccessRoute,
  getAllowedRoutes,
  checkPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  getScopeLevel,
  canAccessBranch,
  canAccessProject,
  canAccessInvoice,
  ForbiddenError,
  UnauthorizedError,
  apiError,
} from "./guard";
