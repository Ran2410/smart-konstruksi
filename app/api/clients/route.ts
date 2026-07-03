// ============================================================
// Smart Konstruksi — Clients API (List)
// Used for dropdowns in project create/edit forms
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/clients — List all active clients (project:read)
// Returns simplified list for dropdowns: { id, companyName, userName, userId }
export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search") || "";

      const where: Record<string, unknown> = {
        deletedAt: null,
        user: { isActive: true },
      };

      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ];
      }

      const clients = await prisma.client.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          address: true,
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return apiSuccess(clients);
    } catch (error) {
      return apiError(error);
    }
  }
);
