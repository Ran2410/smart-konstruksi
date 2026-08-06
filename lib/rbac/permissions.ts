// ============================================================
// Smart Konstruksi — RBAC Permission Matrix
// 16 Roles | Granular Permissions
// ============================================================

import { Role } from "@prisma/client";

// Permission format: "resource:action"
// Resources: user, branch, project, material, invoice, payment,
//            approval, report, task, file, attendance, rab,
//            design, qc, safety, po, warranty, feedback
// Actions:   create, read, update, delete, verify, approve, reject, confirm, reconcile, manage

export const PERMISSIONS: Record<Role, string[]> = {
  // ========== TIER 1: GLOBAL ==========

  SUPER_ADMIN: [
    // User Management
    "user:create", "user:read", "user:update", "user:delete",
    // Branch Management
    "branch:create", "branch:read", "branch:update", "branch:delete",
    // Settings & Audit
    "settings:read", "settings:manage", "audit:read",
    // Project
    "project:create", "project:read", "project:update", "project:delete",
    // Material
    "material:create", "material:read", "material:update", "material:delete",
    // Financial
    "invoice:create", "invoice:read", "invoice:update", "invoice:verify",
    "payment:create", "payment:read", "payment:verify", "payment:reconcile",
    // Approval
    "approval:create", "approval:read", "approval:approve", "approval:reject",
    // Report
    "report:create", "report:read", "report:update", "report:approve",
    // Task
    "task:create", "task:read", "task:update", "task:delete",
    // File
    "file:upload", "file:read", "file:delete",
    // Attendance
    "attendance:create", "attendance:read",
    // RAB
    "rab:create", "rab:read", "rab:update",
    // Design
    "design:create", "design:read", "design:update",
    // QC & Safety
    "qc:create", "qc:read", "qc:update",
    "safety:create", "safety:read", "safety:update",
    // PO
    "po:create", "po:read", "po:update",
    // Warranty
    "warranty:create", "warranty:read", "warranty:manage",
    // Feedback
    "feedback:create", "feedback:read",
    // Wildcard
    "*",
  ],

  OWNER: [
    // User Management
    "user:create", "user:read", "user:update",
    // Branch
    "branch:create", "branch:read", "branch:update",
    // Settings & Audit
    "settings:read", "settings:manage", "audit:read",
    // Comment
    "comment:create", "comment:read", "comment:delete",
    // Attendance
    "attendance:read",
    // Lead
    "lead:create", "lead:read", "lead:update", "lead:delete",
    // Project
    "project:create", "project:read", "project:update",
    // Material
    "material:read",
    // Financial
    "invoice:create", "invoice:read", "invoice:update", "invoice:verify",
    "payment:create", "payment:read", "payment:verify",
    // Approval
    "approval:read", "approval:approve",  // Deal nominal besar
    // Report
    "report:read",
    // Task
    "task:read",
    // File
    "file:upload", "file:read",
    // RAB
    "rab:read",
    // Design
    "design:read",
    // QC & Safety
    "qc:read", "safety:read",
    // PO
    "po:read",
    // Warranty
    "warranty:read", "warranty:manage",
  ],

  // ========== TIER 2: BRANCH ==========

  BRANCH_MANAGER: [
    // User (di branch sendiri)
    "user:create", "user:read", "user:update",
    // Settings & Audit
    "settings:read", "settings:manage", "audit:read",
    // Comment
    "comment:create", "comment:read", "comment:delete",
    // Attendance
    "attendance:read",
    // Lead
    "lead:create", "lead:read", "lead:update", "lead:delete",
    // Project
    "project:create", "project:read", "project:update",
    // Material
    "material:read",
    // Financial
    "invoice:create", "invoice:read", "invoice:update",
    // Approval
    "approval:read", "approval:approve",  // RAB + Design + Deal nominal tertentu
    // Report
    "report:read", "report:approve",
    // Task
    "task:read",
    // File
    "file:read",
    // RAB
    "rab:read",
    // Design
    "design:read",
    // QC & Safety
    "qc:read", "safety:read",
    // PO
    "po:read",
  ],

  // ========== TIER 3: PROJECT ==========

  PROJECT_MANAGER: [
    // Lead
    "lead:create", "lead:read", "lead:update",
    // Project
    "project:create", "project:read", "project:update",
    // Material
    "material:create", "material:read", "material:update",
    // Approval
    "approval:create", "approval:read",  // Progress report
    // Report
    "report:create", "report:read", "report:approve",
    // Task
    "task:create", "task:read", "task:update", "task:delete",
    // File
    "file:upload", "file:read",
    // Attendance
    "attendance:read",
    // Design
    "design:read",
    // QC & Safety
    "qc:read", "safety:read",
    // PO
    "po:read",
  ],

  ESTIMATOR: [
    // Project
    "project:read",
    // Material
    "material:create", "material:read", "material:update",
    // RAB
    "rab:create", "rab:read", "rab:update",
    // File
    "file:upload", "file:read",
  ],

  SITE_MANAGER: [
    // Project
    "project:read",
    // Material
    "material:create", "material:read", "material:confirm",
    // Report
    "report:create", "report:read",
    // Task
    "task:read", "task:update",
    // Attendance
    "attendance:create", "attendance:read",
    // File
    "file:upload", "file:read",
    // QC & Safety
    "qc:read", "safety:read",
  ],

  ADMIN_KANTOR: [
    // Lead
    "lead:create", "lead:read", "lead:update",
    // Project
    "project:read",
    // Material
    "material:create", "material:read", "material:update",
    // Financial
    "invoice:create", "invoice:read", "invoice:update",
    // PO
    "po:create", "po:read", "po:update",
    // Warranty
    "warranty:create", "warranty:read",
    // File
    "file:upload", "file:read", "file:delete",
    // Report
    "report:read",
  ],

  ARSITEK: [
    // Project
    "project:read",
    // Design
    "design:create", "design:read", "design:update",
    // File
    "file:upload", "file:read",
    // RAB
    "rab:read",
  ],

  QC_INSPECTOR: [
    // Project
    "project:read",
    // QC
    "qc:create", "qc:read", "qc:update",
    // Report
    "report:create", "report:read",
    // Task
    "task:read",
    // File
    "file:upload", "file:read",
  ],

  K3_OFFICER: [
    // Project
    "project:read",
    // Safety
    "safety:create", "safety:read", "safety:update",
    // Report
    "report:create", "report:read",
    // Task
    "task:read", "task:update",
    // File
    "file:upload", "file:read",
  ],

  INTERIOR_DESIGNER: [
    // Project
    "project:read",
    // Design
    "design:create", "design:read", "design:update",
    // File
    "file:upload", "file:read",
  ],

  KONSULTAN: [
    // Project
    "project:read",
    // RAB
    "rab:read",
    // File
    "file:read",
  ],

  // ========== TIER 4: EXTERNAL ==========

  FINANCE: [
    // Project
    "project:read",
    // Financial
    "invoice:read", "invoice:update", "invoice:verify",
    "payment:create", "payment:read", "payment:verify", "payment:reconcile",
    // Warranty
    "warranty:read", "warranty:manage",
    // Report
    "report:read",
    // File
    "file:read",
  ],

  CLIENT: [
    // Project (own only)
    "project:read",
    // Financial (own only)
    "invoice:read",
    // Report (own only)
    "report:read",
    // Feedback
    "feedback:create", "feedback:read",
    // Warranty
    "warranty:create",
    // File (own only)
    "file:read",
  ],

  VENDOR: [
    // Material (task-scoped)
    "material:read", "material:update",
    // PO
    "po:read",
  ],

  HOME_OWNER: [
    // Project (own only)
    "project:read",
    // Warranty
    "warranty:create",
  ],

  MANDOR: [
    // Project
    "project:read",
    // Report
    "report:create", "report:read",
    // Task
    "task:read", "task:update",
    // Material
    "material:read",
    // Transaction
    "transaction:read",
    // Attendance
    "attendance:create", "attendance:read",
    // File
    "file:upload", "file:read",
  ],

  SURVEYOR: [
    // Project
    "project:read",
    // Material
    "material:read",
    // RAB
    "rab:read",
    // Design
    "design:read",
    // File
    "file:upload", "file:read",
  ],

  LOGISTIK: [
    // Project
    "project:read",
    // Material
    "material:create", "material:read", "material:update",
    // Transaction
    "transaction:read",
    // PO
    "po:read",
    // File
    "file:read",
  ],
};

// ========== HELPER FUNCTIONS ==========

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes("*") || perms.includes(permission);
}

/**
 * Check if a role has ALL of the listed permissions
 */
export function hasAllPermissions(role: Role, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the listed permissions
 */
export function hasAnyPermission(role: Role, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: Role): string[] {
  return PERMISSIONS[role] || [];
}
