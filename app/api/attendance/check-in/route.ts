// ============================================================
// Smart Konstruksi — Attendance Check-In
// POST /api/attendance/check-in
// ============================================================

import { prisma } from "@/lib/prisma";
import { withAuth, apiCreated } from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { startOfDay } from "@/lib/attendance-time";

// POST /api/attendance/check-in — attendance:create (self check-in)
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const projectId = typeof body?.projectId === "string" ? body.projectId : "";
    const latitude = typeof body?.latitude === "number" ? body.latitude : null;
    const longitude = typeof body?.longitude === "number" ? body.longitude : null;
    const notes = typeof body?.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 300) : null;

    if (!projectId) return apiError(new Error("Project is required for check-in"));

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, deletedAt: true, branchId: true },
    });
    if (!project || project.deletedAt) return apiError(new Error("Project not found"));

    // Authorization: global/branch roles, or project member
    const isGlobal = ["SUPER_ADMIN", "OWNER"].includes(user.role);
    const isBranchRole = ["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role);
    let authorized = isGlobal || (isBranchRole && (!user.branchId || project.branchId === user.branchId));

    if (!authorized) {
      const member = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
        select: { id: true },
      });
      authorized = !!member;
    }
    if (!authorized) return apiError(new Error("Not a member of this project"));

    // Prevent double check-in: no open record today
    const existingOpen = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        checkOut: null,
        checkIn: { gte: startOfDay() },
      },
      select: { id: true },
    });
    if (existingOpen) {
      return apiError(new Error("Already checked in — please check out first"));
    }

    const record = await prisma.attendance.create({
      data: {
        userId: user.id,
        projectId,
        checkIn: new Date(),
        latitude,
        longitude,
        notes,
        createdBy: user.id,
      },
      include: {
        project: { select: { id: true, name: true, code: true } },
      },
    });

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        projectId,
        type: "ATTENDANCE_CHECK_IN",
        title: "Checked In",
        message: `${user.name} checked in at ${project.name}`,
        metadata: { attendanceId: record.id },
      },
    }).catch(() => {});

    return apiCreated({ data: record });
  } catch (error) {
    return apiError(error);
  }
});
