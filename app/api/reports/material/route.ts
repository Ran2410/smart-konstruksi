// ============================================================
// Smart Konstruksi — Material & Stock Report API
// GET /api/reports/material?from=2026-01-01&to=2026-12-31
//   - Stock valuation: nilai stok per material + per kategori
//   - Reorder list: material di bawah minStock
//   - Movement per material: total IN/OUT dalam rentang
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

export const GET = withPermission("material:read", async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const txWhere: Record<string, unknown> = {
      reversedAt: null,
      reversalOfId: null,
    };
    if (from || to) txWhere.date = dateFilter;

    // Branch-scope movement data so scoped roles only see their own branch
    if (user.role !== "SUPER_ADMIN" && user.role !== "OWNER") {
      if (user.branchId) txWhere.project = { branchId: user.branchId };
    }

    // ── All materials with category + vendor ───────────────
    const materials = await prisma.material.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    // ── Movement aggregate per material ────────────────────
    const movements = await prisma.transaction.groupBy({
      by: ["materialId", "type"],
      where: txWhere,
      _sum: { qty: true },
    });

    const moveMap: Record<string, { IN: number; OUT: number }> = {};
    for (const m of movements) {
      if (!moveMap[m.materialId]) moveMap[m.materialId] = { IN: 0, OUT: 0 };
      moveMap[m.materialId][m.type as "IN" | "OUT"] += Number(m._sum.qty || 0);
    }

    // ── Build rows + valuation ─────────────────────────────
    let totalValue = 0;
    let belowMinCount = 0;

    const rows = materials.map((mat) => {
      const value = Number(mat.avgPrice) * mat.stock;
      totalValue += value;
      const isBelowMin = mat.minStock > 0 && mat.stock < mat.minStock;
      if (isBelowMin) belowMinCount += 1;
      const move = moveMap[mat.id] || { IN: 0, OUT: 0 };

      return {
        id: mat.id,
        name: mat.name,
        unit: mat.unit,
        stock: mat.stock,
        minStock: mat.minStock,
        avgPrice: Number(mat.avgPrice),
        value,
        isBelowMin,
        category: mat.category?.name || "-",
        vendor: mat.vendor?.name || "-",
        movement: { IN: move.IN, OUT: move.OUT },
      };
    });

    // ── Valuation per category ─────────────────────────────
    const catMap: Record<string, { category: string; value: number; count: number }> = {};
    for (const r of rows) {
      if (!catMap[r.category]) catMap[r.category] = { category: r.category, value: 0, count: 0 };
      catMap[r.category].value += r.value;
      catMap[r.category].count += 1;
    }
    const byCategory = Object.values(catMap).sort((a, b) => b.value - a.value);

    // ── Reorder list (di bawah minStock) ───────────────────
    const reorderList = rows
      .filter((r) => r.isBelowMin)
      .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock))
      .map((r) => ({
        ...r,
        deficit: Math.max(0, r.minStock - r.stock),
      }));

    return apiSuccess({
      summary: {
        totalMaterials: rows.length,
        totalValue,
        belowMinCount,
      },
      byCategory,
      reorderList,
      rows,
    });
  } catch (error) {
    return apiError(error);
  }
});
