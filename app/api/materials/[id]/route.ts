// ============================================================
// Smart Konstruksi — Material Detail API (Get + Update + Delete)
// GLOBAL MASTER DATA — no branchId/project scope by design
// Security: role-level withPermission("material:read/update/delete") only.
// Verified Vesper 26 Agt 2026: Material/MaterialCategory/Vendor are global
// catalogs (schema has no branchId), so object-level branch check is
// intentionally not required. If per-branch isolation is needed in future,
// add branchId to schema and add canAccessMaterial guard here.
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateMaterialSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

export const GET = withPermission("material:read", async (request) => {
  try {
    const id = extractIdFromPath(request.url);
    const material = await prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true, phone: true } },
      },
    });
    if (!material) return apiError(new Error("Material not found"));
    return apiSuccess(material);
  } catch (error) {
    return apiError(error);
  }
});

export const PUT = withPermission("material:update", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.material.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Material not found"));

    const body = await request.json();
    const parsed = validateOrRespond(updateMaterialSchema, body);
    if (parsed instanceof Response) return parsed;

    const updateData: Record<string, unknown> = { updatedBy: user.id };
    if (parsed.name !== undefined) updateData.name = parsed.name.trim();
    if (parsed.unit !== undefined) updateData.unit = parsed.unit;
    if (parsed.stock !== undefined) updateData.stock = parsed.stock;
    if (parsed.minStock !== undefined) updateData.minStock = parsed.minStock;
    if (parsed.avgPrice !== undefined) updateData.avgPrice = parsed.avgPrice;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes || null;
    if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId || null;
    if (parsed.vendorId !== undefined) updateData.vendorId = parsed.vendorId || null;

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await logAudit(user.id, "UPDATE", "Material", material.id, pickAuditFields(existing, ['name', 'categoryId', 'unit', 'stock', 'minStock']), pickAuditFields(material, ['name', 'categoryId', 'unit', 'stock', 'minStock']));

    return apiSuccess(material);
  } catch (error) {
    return apiError(error);
  }
});

export const DELETE = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.material.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Material not found"));

    await prisma.material.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    // Audit log
    await logAudit(user.id, "DELETE", "Material", existing.id, pickAuditFields(existing, ['name', 'categoryId', 'unit', 'stock', 'minStock']), null);

    return apiNoContent();
  } catch (error) {
    return apiError(error);
  }
});
