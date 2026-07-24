// ============================================================
// Smart Konstruksi — Audit Log Utility
// Import and call in any API route to log data changes
// ============================================================

import { prisma } from "@/lib/prisma";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

/**
 * Log an audit trail entry for any data change.
 *
 * Usage:
 *   await logAudit(user.id, "CREATE", "RAB", rab.id, null, { title, ... })
 *   await logAudit(user.id, "UPDATE", "Invoice", inv.id, oldData, newData)
 *   await logAudit(user.id, "DELETE", "Project", proj.id, oldData, null)
 */
export async function logAudit(
  userId: string,
  action: AuditAction,
  entity: string,
  entityId: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldData: (oldData ?? undefined) as any,
        newData: (newData ?? undefined) as any,
      },
    });
  } catch (error) {
    // Audit log should never break the main operation
    console.error("Audit log error:", error);
  }
}

/**
 * Strip sensitive / large fields from audit data to keep logs clean.
 */
export function stripAuditData(
  obj: Record<string, unknown> | null | undefined,
  sensitiveFields: string[] = ["password", "token", "secret", "deletedAt"],
): Record<string, unknown> | null {
  if (!obj) return null;
  const cleaned = { ...obj };
  for (const field of sensitiveFields) {
    delete cleaned[field];
  }
  // Remove nested relations
  for (const key of Object.keys(cleaned)) {
    if (key === "items" && Array.isArray(cleaned[key])) {
      // Keep items but reduce to IDs + names only
      cleaned[key] = (cleaned[key] as any[]).map((item: any) => ({
        id: item.id,
        name: item.name,
        section: item.section,
        total: item.total,
      }));
    }
    if (Array.isArray(cleaned[key])) {
      // For other arrays, just keep IDs
      cleaned[key] = (cleaned[key] as any[]).map((item: any) =>
        item.id ? { id: item.id } : item
      );
    }
    if (typeof cleaned[key] === "object" && cleaned[key] !== null && !Array.isArray(cleaned[key])) {
      // For nested objects with an id, just keep the id
      if ("id" in (cleaned[key] as any)) {
        cleaned[key] = { id: (cleaned[key] as any).id };
      }
    }
  }
  return cleaned;
}

/**
 * Pick only specific fields from an object for audit (saves space).
 */
export function pickAuditFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): Record<string, unknown> {
  const picked: Record<string, unknown> = {};
  for (const field of fields) {
    if (field in obj) {
      picked[field as string] = obj[field];
    }
  }
  return picked;
}
