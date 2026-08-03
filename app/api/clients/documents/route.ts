// ============================================================
// Smart Konstruksi — Clients Documents API
// GET /api/clients/documents - List client-visible documents
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiPaginated } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import type { AuthenticatedUser } from "@/lib/api/with-auth";

export const GET = withAuth(async (request, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Only CLIENT role can use this endpoint
    if (user.role !== "CLIENT") {
      return apiError(new Error("Only clients can access this endpoint"));
    }

    // Find client profile and their projects
    const client = await prisma.client.findUnique({
      where: { userId: user.id },
      select: {
        projects: { select: { id: true } },
      },
    });

    if (!client) {
      return apiError(new Error("Client profile not found"));
    }

    const projectIds = client.projects.map((p) => p.id);

    // Build filter: only ACTIVE, client-visible documents in client's projects
    const where: Record<string, unknown> = {
      projectId: { in: projectIds },
      isClientVisible: true,
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;

    const skip = (page - 1) * limit;
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, code: true } },
          uploader: { select: { id: true, name: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return apiPaginated(documents, total, page, limit);
  } catch (error) {
    console.error("Error fetching client documents:", error);
    return apiError(error);
  }
});
