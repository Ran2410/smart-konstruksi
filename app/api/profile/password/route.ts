import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { validateOrRespond } from "@/lib/validation";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .regex(/[A-Z]/, "New password must contain an uppercase letter")
    .regex(/[0-9]/, "New password must contain a number"),
});

// PATCH /api/profile/password — Change password
export const PATCH = withAuth(async (request, { user: sessionUser }) => {
  try {
    const parsed = validateOrRespond(changePasswordSchema, await request.json());
    if (parsed instanceof Response) return parsed;
    const { currentPassword, newPassword } = parsed;

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { password: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { password: hashedPassword },
    });

    return Response.json({ message: "Password changed successfully" });
  } catch (error) {
    return apiError(error);
  }
});
