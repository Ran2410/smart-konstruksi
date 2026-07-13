// ============================================================
// Smart Konstruksi — Zod Validation Schemas
// ============================================================
// Single source of truth for API input validation.
// Zod sudah di dependencies, tinggal pakai.
// ============================================================

import { z } from "zod/v4";
// Note: Zod v4 has slightly different API — using zod/v4 import

// ==================== COMMON ====================

export const uuidField = z.string().min(1, "ID is required");
export const positiveDecimal = z.number().positive("Must be positive");
export const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), {
  message: "Invalid date format",
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ==================== AUTH ====================

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// ==================== USER ====================

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .transform((v) => v.trim()),
  password: passwordSchema,
  role: z.string().min(1, "Role is required"),
  branchId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: passwordSchema.optional(),
  isActive: z.boolean().optional(),
});

// ==================== BRANCH ====================

export const createBranchSchema = z.object({
  name: z.string().min(1, "Branch name is required").max(100),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

// ==================== PROJECT ====================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200)
    .transform((v) => v.trim()),
  description: z.string().nullable().optional(),
  address: z
    .string()
    .min(1, "Address is required")
    .transform((v) => v.trim()),
  startDate: dateString,
  endDate: dateString.nullable().optional(),
  budget: z.number().min(0, "Budget must be >= 0"),
  status: z.string().optional(),
  branchId: z.string().min(1, "Branch is required"),
  projectManagerId: z.string().min(1, "Project manager is required"),
  siteManagerId: z.string().nullable().optional(),
  clientId: z.string().min(1, "Client is required"),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  actualCost: z.number().min(0).nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

// ==================== LEAD ====================

export const createLeadSchema = z.object({
  name: z
    .string()
    .min(1, "Lead name is required")
    .max(200)
    .transform((v) => v.trim()),
  company: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  source: z.string().nullable().optional(),
  status: z.string().optional(),
  type: z.string().nullable().optional(),
  budgetMin: z.number().min(0).nullable().optional(),
  budgetMax: z.number().min(0).nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
});

// ==================== INVOICE ====================

export const createInvoiceSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z.number().positive("Amount must be positive"),
  status: z.string().optional(),
  issuedAt: dateString,
  dueDate: dateString,
});

// ==================== PAYMENT ====================

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),
  amount: z.number().positive("Amount must be positive"),
  method: z.string().min(1, "Payment method is required"),
  proofUrl: z.string().nullable().optional(),
  paidAt: dateString.nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== MATERIAL ====================

export const createMaterialSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Material name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.number().min(0, "Unit price must be >= 0"),
  status: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  vendorId: z.string().nullable().optional(),
  orderedAt: dateString.nullable().optional(),
});

// ==================== TASK ====================

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(300),
  description: z.string().nullable().optional(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().nullable().optional(),
  startDate: dateString,
  dueDate: dateString,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "BLOCKED"]).optional(),
});

// ==================== FILE UPLOAD ====================

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: { size: number; type: string }): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return `File type not allowed: ${file.type}`;
  }
  return null;
}

// ==================== PROGRESS REPORT ====================

export const createProgressReportSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  reportDate: dateString,
  percentage: z.number().int().min(0).max(100),
  description: z.string().min(1, "Description is required"),
  weather: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});
