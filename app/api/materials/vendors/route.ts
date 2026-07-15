// ============================================================
// Smart Konstruksi — Vendors API (List + Create)
// GET /api/materials/vendors — List vendors
// POST /api/materials/vendors — Create vendor
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { createVendorSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

export const GET = withPermission("material:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { _count: { select: { materials: true } } },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);

    return apiPaginated(vendors, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

export const POST = withPermission("material:create", async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = validateOrRespond(createVendorSchema, body);
    if (parsed instanceof Response) return parsed;

    const vendor = await prisma.vendor.create({
      data: {
        name: parsed.name.trim(),
        phone: parsed.phone || null,
        email: parsed.email || null,
        address: parsed.address || null,
        isVerified: parsed.isVerified ?? false,
        createdBy: user.id,
      },
    });

    return apiCreated(vendor);
  } catch (error) {
    return apiError(error);
  }
});
