// ============================================================
// Smart Konstruksi — Materials API (List + Create)
// GET /api/materials — List materials with pagination & filters
// POST /api/materials — Create a new material
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

// ==================== GET /api/materials ====================
export const GET = withPermission("material:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);

    // Filters
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Build where clause
    // Materials don't have branchId directly — scope filter goes through project relation
    const scopeFilter = buildScopeFilter(user, { branchField: "branchId" });

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Apply scope filter through project relation
    if (Object.keys(scopeFilter).length > 0) {
      where.project = scopeFilter;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = { name: { contains: category, mode: "insensitive" } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          project: { select: { id: true, name: true, code: true } },
          category: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.material.count({ where }),
    ]);

    return apiPaginated(materials, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// ==================== POST /api/materials ====================
export const POST = withPermission("material:create", async (request, { user }) => {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["name", "quantity", "unit", "unitPrice", "projectId"];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return apiError(new Error(`Field '${field}' is required`));
      }
    }

    // Calculate totalPrice
    const totalPrice = body.quantity * body.unitPrice;

    const material = await prisma.material.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        quantity: body.quantity,
        unit: body.unit,
        unitPrice: body.unitPrice,
        totalPrice,
        status: body.status || "ORDERED",
        categoryId: body.categoryId || null,
        vendorId: body.vendorId || null,
        orderedAt: body.orderedAt ? new Date(body.orderedAt) : null,
        createdBy: user.id,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    return apiCreated({ data: material });
  } catch (error) {
    return apiError(error);
  }
});
