// ============================================================
// Smart Konstruksi — Projects API (List + Create)
// ============================================================

import { prisma } from "@/lib/prisma";
import { logAudit, pickAuditFields } from "@/lib/audit-log";
import {
  withPermission,
  parsePagination,
  buildScopeFilter,
  apiSuccess,
  apiCreated,
  apiPaginated,
} from "@/lib/api/with-auth";
import { apiError, ForbiddenError } from "@/lib/rbac/guard";
import { createProjectSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";

// GET /api/projects — List projects (project:read)
export const GET = withPermission(
  "project:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = parsePagination(searchParams);
      const search = searchParams.get("search") || "";
      const branchId = searchParams.get("branchId") || "";
      const status = searchParams.get("status") || "";
      const projectManagerId = searchParams.get("projectManagerId") || "";

      const where: Record<string, unknown> = {
        deletedAt: null,
      };

      // Scope filtering
      if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
        // Global: no filter
      } else if (["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(user.role)) {
        if (user.branchId) where.branchId = user.branchId;
      } else if (["CLIENT", "HOME_OWNER"].includes(user.role)) {
        // Client: find their Client record, then filter by clientId
        const clientProfile = await prisma.client.findUnique({
          where: { userId: user.id },
          select: { id: true },
        });
        if (clientProfile) {
          where.clientId = clientProfile.id;
        } else {
          where.clientId = "__no_client__"; // no results
        }
      } else if (["PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN", "MANDOR", "SURVEYOR", "LOGISTIK"].includes(user.role)) {
        where.members = { some: { userId: user.id } };
      }

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
        ];
      }

      // Branch filter (only for global roles)
      if (
        branchId &&
        (user.role === "SUPER_ADMIN" || user.role === "OWNER")
      ) {
        where.branchId = branchId;
      }

      // Status filter (supports comma-separated: PLANNING,IN_PROGRESS)
      if (status) {
        const statuses = status.split(",").map((s) => s.trim());
        if (statuses.length === 1) {
          where.status = statuses[0];
        } else {
          where.status = { in: statuses };
        }
      }

      // Project Manager filter
      if (projectManagerId) {
        where.projectManagerId = projectManagerId;
      }

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            branch: { select: { id: true, name: true } },
            projectManager: {
              select: { id: true, name: true, email: true },
            },
            siteManager: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { members: true, tasks: true, transactions: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.project.count({ where }),
      ]);

      return apiPaginated(projects, total, page, limit);
    } catch (error) {
      return apiError(error);
    }
  }
);

// POST /api/projects — Create project (project:create)
export const POST = withPermission(
  "project:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = validateOrRespond(createProjectSchema, body);
      if (parsed instanceof Response) return parsed;

      const {
        name,
        description,
        address,
        startDate,
        endDate,
        budget,
        status,
        branchId,
        projectManagerId,
        siteManagerId,
        clientId,
      } = parsed;

      if (
        !["SUPER_ADMIN", "OWNER"].includes(user.role) &&
        branchId !== user.branchId
      ) {
        return apiError(new ForbiddenError("You cannot create a project outside your branch"));
      }

      // Generate project code (PJ000001 format)
      const lastProject = await prisma.project.findFirst({
        orderBy: { createdAt: "desc" },
        select: { code: true },
      });

      let nextCode = 1;
      if (lastProject?.code) {
        const lastNum = parseInt(lastProject.code.replace("PJ", ""), 10);
        if (!isNaN(lastNum)) {
          nextCode = lastNum + 1;
        }
      }
      const code = `PJ${String(nextCode).padStart(6, "0")}`;

      const project = await prisma.project.create({
        data: {
          code,
          name: name.trim(),
          description: description || null,
          address: address.trim(),
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          budget: Number(budget),
          status: (status || "PLANNING") as any,
          branchId,
          projectManagerId,
          siteManagerId: siteManagerId || null,
          clientId,
          createdBy: user.id,
        },
        include: {
          branch: { select: { id: true, name: true } },
          projectManager: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Audit log
      await logAudit(user.id, "CREATE", "Project", project.id, null, pickAuditFields(project, ['name', 'code', 'status', 'budget', 'startDate', 'endDate']));

      return apiCreated(project);
    } catch (error) {
      return apiError(error);
    }
  }
);
