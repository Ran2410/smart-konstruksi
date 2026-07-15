// ============================================================
// Smart Konstruksi — Transactions API (List + Create)
// POST /api/transactions — Create stock IN/OUT
// GET /api/transactions — List transactions
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
import { createTransactionSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// Recalculate project actualCost from all OUT transactions
async function recalcProjectActualCost(projectId: string) {
  const agg = await prisma.transaction.aggregate({
    where: { projectId, type: "OUT" },
    _sum: { totalCost: true },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { actualCost: agg._sum.totalCost ?? 0 },
  });
}

// GET /api/transactions
export const GET = withPermission("material:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const materialId = searchParams.get("materialId");
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    if (materialId) where.materialId = materialId;
    if (projectId) where.projectId = projectId;
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          material: { select: { id: true, name: true, unit: true } },
          project: { select: { id: true, name: true, code: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return apiPaginated(transactions, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/transactions — Create IN/OUT transaction
export const POST = withPermission("material:create", async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = validateOrRespond(createTransactionSchema, body);
    if (parsed instanceof Response) return parsed;

    const material = await prisma.material.findFirst({
      where: { id: parsed.materialId, deletedAt: null },
    });
    if (!material) return apiError(new Error("Material not found"));

    let totalCost: number;
    let newAvgPrice: number | null = null;
    let newStock: number;

    if (parsed.type === "IN") {
      // Stock IN: receive purchase
      const price = parsed.price ?? 0;
      totalCost = parsed.qty * price;

      // Calculate new average price
      const currentStockValue = Number(material.stock) * Number(material.avgPrice);
      const incomingValue = parsed.qty * price;
      newStock = Number(material.stock) + parsed.qty;
      newAvgPrice = newStock > 0 ? (currentStockValue + incomingValue) / newStock : price;
    } else {
      // Stock OUT: usage
      if (Number(material.stock) < parsed.qty) {
        return apiError(new Error(`Insufficient stock. Available: ${material.stock} ${material.unit}`));
      }
      const price = parsed.price ?? Number(material.avgPrice);
      totalCost = parsed.qty * Number(price);
      newStock = Number(material.stock) - parsed.qty;
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        type: parsed.type,
        materialId: parsed.materialId,
        qty: parsed.qty,
        price: parsed.type === "IN" ? (parsed.price ?? 0) : Number(material.avgPrice),
        totalCost,
        projectId: parsed.projectId || null,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        notes: parsed.notes || null,
        createdBy: user.id,
      },
      include: {
        material: { select: { id: true, name: true, unit: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // Update material stock & avgPrice
    const matUpdate: Record<string, unknown> = {
      stock: newStock,
      updatedBy: user.id,
    };
    if (newAvgPrice !== null) {
      matUpdate.avgPrice = newAvgPrice;
    }
    await prisma.material.update({
      where: { id: parsed.materialId },
      data: matUpdate,
    });

    // Auto-update project actualCost if OUT with project
    if (parsed.type === "OUT" && parsed.projectId) {
      await recalcProjectActualCost(parsed.projectId);
    }

    return apiCreated({ data: transaction });
  } catch (error) {
    return apiError(error);
  }
});
