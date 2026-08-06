// ============================================================
// Smart Konstruksi — Notification Helper
// Create in-app notifications from any API route.
// Fire-and-forget: never breaks the main operation.
// ============================================================

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "TASK"
  | "PROGRESS"
  | "INVOICE"
  | "PAYMENT"
  | "APPROVAL"
  | "DOCUMENT"
  | "SYSTEM";

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

/**
 * Create a single notification for a user.
 * Never throws — failures are logged and swallowed.
 */
export async function createNotification(input: NotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link || null,
      },
    });
  } catch (error) {
    console.error("[Notification] create error:", error);
  }
}

/**
 * Create notifications for multiple recipients in parallel.
 * All failures are isolated via Promise.allSettled.
 */
export async function notifyMany(inputs: NotificationInput[]) {
  await Promise.allSettled(inputs.map((i) => createNotification(i)));
}

/**
 * Common icon/label mapping used by the UI (shared shape only —
 * actual rendering lives in the client components).
 */
export const NOTIFICATION_META: Record<string, { icon: string; color: string }> = {
  TASK: { icon: "task_alt", color: "#7c3aed" },
  PROGRESS: { icon: "trending_up", color: "#15803d" },
  INVOICE: { icon: "receipt_long", color: "#2563eb" },
  PAYMENT: { icon: "payments", color: "#0d9488" },
  APPROVAL: { icon: "fact_check", color: "#b45309" },
  DOCUMENT: { icon: "description", color: "#4f46e5" },
  SYSTEM: { icon: "notifications", color: "#6f7a72" },
};
