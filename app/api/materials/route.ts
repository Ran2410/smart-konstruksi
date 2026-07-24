// ============================================================
// Smart Konstruksi — Materials Inventory API (List + Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import {
  withPermission,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { createMaterialSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// GET /api/materials
export const GET = withPermission("material:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const vendorId = searchParams.get("vendorId");

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
        },
        orderBy: { name: "asc" },
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

// POST /api/materials
export const POST = withPermission("material:create", async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = validateOrRespond(createMaterialSchema, body);
    if (parsed instanceof Response) return parsed;

    const material = await prisma.material.create({
      data: {
        name: parsed.name.trim(),
        unit: parsed.unit,
        stock: parsed.stock,
        minStock: parsed.minStock,
        avgPrice: parsed.avgPrice,
        notes: parsed.notes || null,
        categoryId: parsed.categoryId || null,
        vendorId: parsed.vendorId || null,
        createdBy: user.id,
      },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await logAudit(user.id, "CREATE", "Material", material.id, null, pickAuditFields(material, ['name', 'category', 'unit', 'stock', 'minStock']));

    return apiCreated({ data: material });
  } catch (error) {
    return apiError(error);
  }
});
