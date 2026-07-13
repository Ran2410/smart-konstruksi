// ============================================================
// Smart Konstruksi — Route Access Config
// Deklaratif: route → role mana yang boleh akses
// ============================================================

import { Role } from "@prisma/client";

// Wildcard "*" = semua role yang login boleh akses
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AccessRole = Role | "*";

// Using type assertion to allow "*" wildcard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ROUTE_ACCESS_DATA: Record<string, AccessRole[]> = {
  // ==================== PUBLIC ====================
  "/login": ["*"],
  "/register": ["*"],
  "/forgot-password": ["*"],

  // ==================== DASHBOARD (semua role) ====================
  "/dashboard": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN",
    "FINANCE", "CLIENT", "VENDOR", "HOME_OWNER",
  ],

  // ==================== USER MANAGEMENT ====================
  "/dashboard/users": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
  ],

  // ==================== BRANCH MANAGEMENT ====================
  "/dashboard/branches": [
    "SUPER_ADMIN",
    "OWNER",
  ],

  // ==================== PROJECTS ====================
  "/dashboard/projects": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "FINANCE", "CLIENT",
  ],

  // ==================== LEADS ====================
  "/dashboard/leads": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR",
  ],

  // ==================== MATERIALS ====================
  "/dashboard/materials": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "VENDOR",
  ],

  // ==================== FINANCIAL ====================
  "/dashboard/invoices": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE",
  ],

  "/dashboard/payments": [
    "SUPER_ADMIN", "OWNER", "FINANCE",
  ],

  // ==================== RAB ====================
  "/dashboard/rab": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
    "PROJECT_MANAGER", "ESTIMATOR", "KONSULTAN",
  ],

  // ==================== APPROVALS ====================
  "/dashboard/approvals": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "FINANCE",
  ],

  // ==================== REPORTS ====================
  "/dashboard/reports": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "FINANCE", "CLIENT",
  ],

  // ==================== TASKS ====================
  "/dashboard/tasks": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "SITE_MANAGER",
  ],

  // ==================== ATTENDANCE ====================
  "/dashboard/attendance": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "SITE_MANAGER",
  ],

  // ==================== QC ====================
  "/dashboard/qc": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
    "PROJECT_MANAGER", "QC_INSPECTOR",
  ],

  // ==================== SAFETY ====================
  "/dashboard/safety": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER",
    "PROJECT_MANAGER", "K3_OFFICER",
  ],

  // ==================== VENDORS ====================
  "/dashboard/vendors": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR",
  ],

  // ==================== DOCUMENTS ====================
  "/dashboard/documents": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ADMIN_KANTOR", "ARSITEK", "CLIENT",
  ],

  // ==================== SETTINGS ====================
  "/dashboard/settings": [
    "SUPER_ADMIN", "OWNER",
  ],

  // ==================== CLIENT PORTAL ====================
  "/dashboard/client-portal": [
    "CLIENT",
  ],

  // ==================== VENDOR PORTAL ====================
  "/dashboard/vendor-portal": [
    "VENDOR",
  ],

  // ==================== WARRANTY ====================
  "/dashboard/warranty": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR",
    "FINANCE", "SITE_MANAGER", "CLIENT", "HOME_OWNER",
  ],

  // ==================== NOTIFICATIONS ====================
  "/dashboard/notifications": ["*"],
};

export const ROUTE_ACCESS = ROUTE_ACCESS_DATA;

/**
 * Check if a role can access a specific pathname
 * Supports prefix matching: /dashboard/projects/123 → matches /dashboard/projects
 */
export function canAccessRoutePath(role: string, pathname: string): boolean {
  // Exact match
  if (ROUTE_ACCESS[pathname]) {
    const allowed = ROUTE_ACCESS[pathname];
    return allowed.includes("*") || allowed.includes(role as Role);
  }

  // Prefix match (longest match first)
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const prefix = "/" + segments.slice(0, i).join("/");
    if (ROUTE_ACCESS[prefix]) {
      const allowed = ROUTE_ACCESS[prefix];
      return allowed.includes("*") || allowed.includes(role as Role);
    }
  }

  // Default: allow dashboard sub-routes not explicitly defined
  if (pathname.startsWith("/dashboard")) {
    const dashboardAccess = ROUTE_ACCESS["/dashboard"];
    if (!dashboardAccess) return false;
    return dashboardAccess.includes("*") || dashboardAccess.includes(role as Role);
  }

  return false;
}

/**
 * Get all accessible routes for a role (for sidebar menu rendering)
 */
export function getAccessibleRoutes(role: Role): string[] {
  return Object.entries(ROUTE_ACCESS)
    .filter(([_, roles]) => roles.includes("*") || roles.includes(role))
    .map(([route]) => route);
}
