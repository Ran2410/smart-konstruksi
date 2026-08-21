import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { validateOrRespond } from "@/lib/validation";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  phone: z.string().trim().max(30).nullable().optional(),
});

// GET /api/profile — Fetch current user's profile
export const GET = withAuth(async (_request, { user: sessionUser }) => {
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      updatedAt: true,
      branchId: true,
      branch: {
        select: { id: true, name: true },
      },
    },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json(user);
});

// PATCH /api/profile — Update name / phone
export const PATCH = withAuth(async (request, { user: sessionUser }) => {
  try {
    const parsed = validateOrRespond(updateProfileSchema, await request.json());
    if (parsed instanceof Response) return parsed;
    const { name, phone } = parsed;

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        branchId: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return Response.json(updatedUser);
  } catch (error) {
    return apiError(error);
  }
});
