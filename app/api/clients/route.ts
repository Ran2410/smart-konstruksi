// ============================================================
// Smart Konstruksi — Clients API (List)
// Returns both Client records AND users with CLIENT role
// Creates missing Client records on-the-fly
// ============================================================

import { prisma } from "@/lib/prisma";
import { withPermission, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/clients — List all clients for dropdowns (project:read)
export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      // 1. Get existing client records
      const existingClients = await prisma.client.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          companyName: true,
          user: {
            select: { id: true, name: true, email: true, isActive: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      // 2. Get users with CLIENT role that don't have a client record yet
      const clientUserIds = existingClients.map((c) => c.user.id);
      const usersWithoutClient = await prisma.user.findMany({
        where: {
          role: "CLIENT",
          isActive: true,
          deletedAt: null,
          id: { notIn: clientUserIds },
        },
        select: { id: true, name: true, email: true },
        take: 100,
      });

      // 3. Auto-create Client records for users without one
      const newClients = await Promise.all(
        usersWithoutClient.map((u) =>
          prisma.client.create({
            data: {
              userId: u.id,
              companyName: u.name,
              createdBy: user.id,
            },
            select: {
              id: true,
              companyName: true,
              user: { select: { id: true, name: true, email: true } },
            },
          })
        )
      );

      // 4. Combine and return
      const allClients = [...existingClients, ...newClients];

      return apiSuccess(allClients);
    } catch (error) {
      return apiError(error);
    }
  }
);
