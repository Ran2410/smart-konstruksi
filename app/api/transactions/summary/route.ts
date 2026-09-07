// ============================================================
// Smart Konstruksi — Transactions Summary API
// GET /api/transactions/summary?from=2024-01-01&to=2024-12-31
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

export const GET = withPermission("material:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter: Record<string, Date> = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z");

    const where: Record<string, unknown> = {
      reversedAt: null,
      reversalOfId: null,
    };
    if (from || to) where.date = dateFilter;

    // Monthly aggregation
    const monthlyRaw = await prisma.$queryRawUnsafe<
      { month: string; type: string; total: number; count: bigint }[]
    >(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        type,
        COALESCE(SUM("totalCost"), 0) AS total,
        COUNT(*) AS count
      FROM "transactions"
      WHERE "reversedAt" IS NULL AND "reversalOfId" IS NULL ${from ? `AND date >= '${from}'` : ""} ${to ? `AND date <= '${to}T23:59:59.999Z'` : ""}
      GROUP BY month, type
      ORDER BY month ASC
    `);

    // Total summary
    const totalAgg = await prisma.transaction.aggregate({
      where,
      _sum: { totalCost: true },
      _count: true,
    });

    const totalIn = await prisma.transaction.aggregate({
      where: { ...where, type: "IN" },
      _sum: { totalCost: true },
      _count: true,
    });

    const totalOut = await prisma.transaction.aggregate({
      where: { ...where, type: "OUT" },
      _sum: { totalCost: true },
      _count: true,
    });

    // Build monthly series
    const monthMap: Record<string, { month: string; IN: number; OUT: number }> = {};
    for (const row of monthlyRaw) {
      if (!monthMap[row.month]) monthMap[row.month] = { month: row.month, IN: 0, OUT: 0 };
      if (row.type === "IN") monthMap[row.month].IN = Number(row.total);
      else monthMap[row.month].OUT = Number(row.total);
    }

    const monthly = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Top materials by usage (OUT)
    const topMaterials = await prisma.transaction.groupBy({
      by: ["materialId"],
      where: { ...where, type: "OUT" },
      _sum: { totalCost: true, qty: true },
      orderBy: { _sum: { totalCost: "desc" } },
      take: 10,
    });

    const materialIds = topMaterials.map((m) => m.materialId);
    const materials = materialIds.length > 0
      ? await prisma.material.findMany({
          where: { id: { in: materialIds } },
          select: { id: true, name: true, unit: true },
        })
      : [];
    const materialMap = Object.fromEntries(materials.map((m) => [m.id, m]));

    const topMaterialsList = topMaterials.map((m) => ({
      materialId: m.materialId,
      materialName: materialMap[m.materialId]?.name || "Unknown",
      unit: materialMap[m.materialId]?.unit || "",
      totalCost: Number(m._sum.totalCost || 0),
      totalQty: Number(m._sum.qty || 0),
    }));

    return apiSuccess({
      summary: {
        totalTransactions: totalAgg._count,
        totalCost: Number(totalAgg._sum.totalCost || 0),
        totalIn: Number(totalIn._sum.totalCost || 0),
        totalInCount: totalIn._count,
        totalOut: Number(totalOut._sum.totalCost || 0),
        totalOutCount: totalOut._count,
        net: Number(totalIn._sum.totalCost || 0) - Number(totalOut._sum.totalCost || 0),
      },
      monthly,
      topMaterials: topMaterialsList,
    });
  } catch (error) {
    return apiError(error);
  }
});
