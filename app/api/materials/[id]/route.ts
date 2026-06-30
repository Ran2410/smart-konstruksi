// ============================================================
// Smart Konstruksi — Material Detail API (Get + Update + Delete)
// GET /api/materials/[id] — Get material by ID
// PUT /api/materials/[id] — Update material
// DELETE /api/materials/[id] — Soft delete material
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// Helper: extract [id] from URL path
function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

// ==================== GET /api/materials/[id] ====================
export const GET = withPermission("material:read", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);

    if (!id) {
      return apiError(new Error("Material ID is required"));
    }

    const material = await prisma.material.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true, branchId: true },
        },
        category: { select: { id: true, name: true, description: true } },
        vendor: { select: { id: true, name: true, phone: true, email: true, address: true } },
      },
    });

    if (!material) {
      return apiError(new Error("Material not found"));
    }

    return apiSuccess(material);
  } catch (error) {
    return apiError(error);
  }
});

// ==================== PUT /api/materials/[id] ====================
export const PUT = withPermission("material:update", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);

    if (!id) {
      return apiError(new Error("Material ID is required"));
    }

    // Check material exists
    const existing = await prisma.material.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return apiError(new Error("Material not found"));
    }

    const body = await request.json();

    // Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {
      updatedBy: user.id,
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.unitPrice !== undefined) updateData.unitPrice = body.unitPrice;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.vendorId !== undefined) updateData.vendorId = body.vendorId;
    if (body.orderedAt !== undefined) updateData.orderedAt = body.orderedAt ? new Date(body.orderedAt) : null;
    if (body.deliveredAt !== undefined) updateData.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : null;
    if (body.installedAt !== undefined) updateData.installedAt = body.installedAt ? new Date(body.installedAt) : null;

    // Recalculate totalPrice if quantity or unitPrice changed
    if (body.quantity !== undefined || body.unitPrice !== undefined) {
      const qty = body.quantity !== undefined ? body.quantity : existing.quantity;
      const price = body.unitPrice !== undefined ? body.unitPrice : Number(existing.unitPrice);
      updateData.totalPrice = qty * price;
    }

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
    });

    return apiSuccess(material);
  } catch (error) {
    return apiError(error);
  }
});

// ==================== DELETE /api/materials/[id] ====================
export const DELETE = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);

    if (!id) {
      return apiError(new Error("Material ID is required"));
    }

    // Check material exists
    const existing = await prisma.material.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return apiError(new Error("Material not found"));
    }

    // Soft delete
    await prisma.material.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });

    return apiNoContent();
  } catch (error) {
    return apiError(error);
  }
});
