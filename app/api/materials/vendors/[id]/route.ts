// ============================================================
// Smart Konstruksi — Vendor Detail API
// GLOBAL MASTER DATA — no branchId/project scope by design
// See note in app/api/materials/[id]/route.ts (Vesper 26 Agt 2026)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
  apiNoContent,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateVendorSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

function extractIdFromPath(url: string): string {
  const pathParts = new URL(url).pathname.split("/");
  return pathParts[pathParts.length - 1] || "";
}

export const GET = withPermission("material:read", async (request) => {
  try {
    const id = extractIdFromPath(request.url);
    const vendor = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { materials: true } } },
    });
    if (!vendor) return apiError(new Error("Vendor not found"));
    return apiSuccess(vendor);
  } catch (error) {
    return apiError(error);
  }
});

export const PUT = withPermission("material:update", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Vendor not found"));

    const body = await request.json();
    const parsed = validateOrRespond(updateVendorSchema, body);
    if (parsed instanceof Response) return parsed;

    const updateData: Record<string, unknown> = { updatedBy: user.id };
    if (parsed.name !== undefined) updateData.name = parsed.name.trim();
    if (parsed.phone !== undefined) updateData.phone = parsed.phone || null;
    if (parsed.email !== undefined) updateData.email = parsed.email || null;
    if (parsed.address !== undefined) updateData.address = parsed.address || null;
    if (parsed.isVerified !== undefined) updateData.isVerified = parsed.isVerified;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess(vendor);
  } catch (error) {
    return apiError(error);
  }
});

export const DELETE = withPermission("material:delete", async (request, { user }) => {
  try {
    const id = extractIdFromPath(request.url);
    const existing = await prisma.vendor.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return apiError(new Error("Vendor not found"));

    // Check if vendor has materials
    const materialCount = await prisma.material.count({
      where: { vendorId: id, deletedAt: null },
    });
    if (materialCount > 0) {
      return apiError(new Error("Cannot delete vendor with existing materials. Remove them first."));
    }

    await prisma.vendor.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: user.id },
    });

    return apiNoContent();
  } catch (error) {
    return apiError(error);
  }
});
