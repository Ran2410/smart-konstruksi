// ============================================================
// Smart Konstruksi — Clients API (List + Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  withPermission,
  parsePagination,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// GET /api/clients — List clients
export const GET = withPermission("project:read", async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    // Search filter — search both company name and user name/email
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Active status filter
    if (status === "active") {
      where.user = { isActive: true };
    } else if (status === "inactive") {
      where.user = { isActive: false };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          companyName: true,
          address: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              isActive: true,
              lastLogin: true,
            },
          },
          _count: {
            select: {
              projects: { where: { deletedAt: null } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return apiPaginated(clients, total, page, limit);
  } catch (error) {
    return apiError(error);
  }
});

// POST /api/clients — Create client (user:create)
export const POST = withPermission(
  "user:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const { name, email, password, phone, companyName, address } = body;

      if (!name || !email || !password) {
        return apiError(new Error("Name, email, and password are required"));
      }

      // Check email uniqueness
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          deletedAt: null,
        },
      });

      if (existingUser) {
        return apiError(new Error("Email already registered"));
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user + client in transaction
      const client = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: email.trim().toLowerCase(),
            name: name.trim(),
            password: hashedPassword,
            role: "CLIENT",
            phone: phone || null,
            isActive: true,
            createdBy: user.id,
          },
        });

        return tx.client.create({
          data: {
            userId: newUser.id,
            companyName: companyName?.trim() || null,
            address: address?.trim() || null,
            createdBy: user.id,
          },
          select: {
            id: true,
            companyName: true,
            address: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            _count: {
              select: {
                projects: { where: { deletedAt: null } },
              },
            },
          },
        });
      });

      return apiCreated(client);
    } catch (error) {
      return apiError(error);
    }
  }
);
