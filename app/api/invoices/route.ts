// ============================================================
// Smart Konstruksi — Invoices API (List + Create)
// GET /api/invoices — List invoices with pagination & filters
// POST /api/invoices — Create a new invoice
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  parsePagination,
  buildScopeFilter,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

/**
 * Auto-generate invoice number: INV + YYYYMMDD + 6-digit daily sequence
 * Format: INV20260629000001
 */
async function generateInvoiceNo(): Promise<string> {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  // Find the last invoice created today
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });

  let sequence = 1;
  if (lastInvoice) {
    // Extract the last 6 digits as sequence number
    const lastSeq = parseInt(lastInvoice.invoiceNo.slice(-6), 10);
    sequence = lastSeq + 1;
  }

  return `INV${dateStr}${String(sequence).padStart(6, "0")}`;
}

// ==================== GET /api/invoices ====================
export const GET = withPermission("invoice:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    // Filters
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause — scope filter via project relation
    const scopeFilter = buildScopeFilter(user, { branchField: "branchId" });

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Apply scope filter through project relation if needed
    if (Object.keys(scopeFilter).length > 0) {
      where.project = scopeFilter;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
              branchId: true,
              branch: { select: { id: true, name: true } },
            },
          },
          payments: {
            select: { id: true, amount: true, method: true, paidAt: true },
            orderBy: { paidAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return apiPaginated(invoices, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// ==================== POST /api/invoices ====================
export const POST = withPermission("invoice:create", async (request, { user }) => {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["projectId", "amount", "issuedAt", "dueDate"];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return apiError(new Error(`Field '${field}' is required`));
      }
    }

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: { id: body.projectId, deletedAt: null },
    });

    if (!project) {
      return apiError(new Error("Project not found"));
    }

    // Auto-generate invoice number
    const invoiceNo = await generateInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        projectId: body.projectId,
        invoiceNo,
        amount: body.amount,
        status: body.status || "DRAFT",
        issuedAt: new Date(body.issuedAt),
        dueDate: new Date(body.dueDate),
        createdBy: user.id,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return apiCreated({ data: invoice });
  } catch (error) {
    return apiError(error);
  }
});
