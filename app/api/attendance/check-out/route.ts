// ============================================================
// Smart Konstruksi — Attendance Check-Out
// POST /api/attendance/check-out
// Closes the user's latest open record (or one by attendanceId).
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiSuccess } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";

// POST /api/attendance/check-out
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const attendanceId = typeof body?.attendanceId === "string" ? body.attendanceId : null;

    // Find the open record (either by id with ownership, or the latest open one)
    const existing = attendanceId
      ? await prisma.attendance.findFirst({
          where: { id: attendanceId, userId: user.id, checkOut: null },
          select: { id: true, projectId: true },
        })
      : await prisma.attendance.findFirst({
          where: { userId: user.id, checkOut: null },
          orderBy: { checkIn: "desc" },
          select: { id: true, projectId: true },
        });

    if (!existing) {
      return apiError(new Error("No active check-in found for today"));
    }

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        projectId: existing.projectId,
        type: "ATTENDANCE_CHECK_OUT",
        title: "Checked Out",
        message: `${user.name} checked out at ${record.project.name}`,
        metadata: { attendanceId: record.id },
      },
    }).catch(() => {});

    return apiSuccess({ data: record });
  } catch (error) {
    return apiError(error);
  }
});
