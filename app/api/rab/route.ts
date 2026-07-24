// ============================================================
// Smart Konstruksi — RAB API (List + Create)
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
import { Prisma } from "@prisma/client";
import { createRABSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";
import { logAudit, pickAuditFields } from "@/lib/audit-log";

// GET /api/rab — List RABs (rab:read)
export const GET = withPermission(
  "rab:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = parsePagination(searchParams);
      const search = searchParams.get("search") || "";
      const status = searchParams.get("status") || "";
      const leadId = searchParams.get("leadId") || "";

      const where: Prisma.RABWhereInput = {
        deletedAt: null,
      };

      // Scope by role
      if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
        // Global: no filter
      } else if (["ESTIMATOR", "ADMIN_KANTOR", "BRANCH_MANAGER", "PROJECT_MANAGER"].includes(user.role)) {
        // These roles can see RABs linked to leads in their branch
        if (user.branchId) {
          where.lead = { branchId: user.branchId };
        }
      } else {
        // Read-only roles: only see RABs from leads in their branch
        if (user.branchId) {
          where.lead = { branchId: user.branchId };
        }
      }

      // Search filter
      if (search) {
        where.OR = [
          { code: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
          { lead: { name: { contains: search, mode: "insensitive" } } },
        ];
      }

      // Status filter
      if (status) {
        const statuses = status.split(",").map((s) => s.trim());
        if (statuses.length === 1) {
          where.status = statuses[0] as any;
        } else {
          where.status = { in: statuses as any };
        }
      }

      // Lead filter
      if (leadId) {
        where.leadId = leadId;
      }

      const [rabs, total] = await Promise.all([
        prisma.rAB.findMany({
          where,
          include: {
            lead: {
              select: { id: true, name: true, company: true, branchId: true },
            },
            _count: {
              select: { items: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.rAB.count({ where }),
      ]);

      return apiPaginated(rabs, total, page, limit);
    } catch (error) {
      return apiError(error);
    }
  }
);

// POST /api/rab — Create RAB (rab:create)
export const POST = withPermission(
  "rab:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = validateOrRespond(createRABSchema, body);
      if (parsed instanceof Response) return parsed;

      const { leadId, title, notes, marginPercent } = parsed;

      // Verify lead exists
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return Response.json(
          { error: "Lead not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Auto-generate RAB code: RAB000001 (global sequential)
      const lastRAB = await prisma.rAB.findFirst({
        orderBy: { code: "desc" },
        select: { code: true },
      });

      let nextNumber = 1;
      if (lastRAB) {
        const match = lastRAB.code.match(/RAB(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      const code = `RAB${String(nextNumber).padStart(6, "0")}`;

      const rab = await prisma.rAB.create({
        data: {
          code,
          leadId,
          title: title || lead.name,
          notes: notes || null,
          marginPercent: marginPercent || 0,
          createdBy: user.id,
        },
        include: {
          lead: {
            select: { id: true, name: true, company: true },
          },
        },
      });

      await logAudit(user.id, "CREATE", "RAB", rab.id, null, pickAuditFields(rab, ['code', 'title', 'status', 'total', 'marginPercent']));

      return apiCreated(rab);
    } catch (error) {
      return apiError(error);
    }
  }
);
