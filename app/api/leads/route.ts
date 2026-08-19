// ============================================================
// Smart Konstruksi — Leads API (List + Create)
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
import { createLeadSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";
import { logAudit, pickAuditFields } from "@/lib/audit-log";

// GET /api/leads — List leads (lead:read)
export const GET = withPermission(
  "lead:read",
  async (request, { user }) => {
    try {
      const { searchParams } = new URL(request.url);
      const { page, limit, skip } = parsePagination(searchParams);
      const search = searchParams.get("search") || "";
      const source = searchParams.get("source") || "";
      const status = searchParams.get("status") || "";
      const type = searchParams.get("type") || "";
      const branchId = searchParams.get("branchId") || "";
      const assignedTo = searchParams.get("assignedTo") || "";

      const andFilters: Prisma.LeadWhereInput[] = [];
      const where: Prisma.LeadWhereInput = {
        deletedAt: null,
        AND: andFilters,
      };

      // Scope filtering based on user role
      if (user.role === "SUPER_ADMIN" || user.role === "OWNER") {
        // Global: no filter
      } else if (
        ["BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE", "ESTIMATOR"].includes(user.role)
      ) {
        // Branch scope: own branch + unassigned leads (branchId null)
        if (user.branchId) {
          andFilters.push({
            OR: [{ branchId: user.branchId }, { branchId: null }],
          });
        }
      } else {
        // Other roles: only see their assigned leads
        andFilters.push({ assignedTo: user.id });
      }

      // Search filter
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ];
      }

      // Source filter
      if (source) {
        where.source = source;
      }

      // Status filter (supports comma-separated: NEW,CONTACTED)
      if (status) {
        const statuses = status.split(",").map((s) => s.trim());
        if (statuses.length === 1) {
          where.status = statuses[0] as any;
        } else {
          where.status = { in: statuses as any };
        }
      }

      // Type filter
      if (type) {
        where.type = type;
      }

      // Branch filter (only for global roles)
      if (
        branchId &&
        (user.role === "SUPER_ADMIN" || user.role === "OWNER")
      ) {
        where.branchId = branchId;
      }

      // Assigned to filter
      if (assignedTo) {
        where.assignedTo = assignedTo;
      }

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            branch: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.lead.count({ where }),
      ]);

      return apiPaginated(leads, total, page, limit);
    } catch (error) {
      return apiError(error);
    }
  }
);

// POST /api/leads — Create lead (lead:create)
export const POST = withPermission(
  "lead:create",
  async (request, { user }) => {
    try {
      const body = await request.json();
      const parsed = validateOrRespond(createLeadSchema, body);
      if (parsed instanceof Response) return parsed;

      const {
        name,
        company,
        phone,
        email,
        source,
        status,
        type,
        budgetMin,
        budgetMax,
        location,
        notes,
        assignedTo,
        branchId,
      } = parsed;

      const lead = await prisma.lead.create({
        data: {
          name,
          company: company || null,
          phone: phone || null,
          email: email || null,
          source: source || null,
          status: (status || "NEW") as any,
          type: type || null,
          budgetMin: budgetMin !== undefined ? new Prisma.Decimal(budgetMin) : undefined,
          budgetMax: budgetMax !== undefined ? new Prisma.Decimal(budgetMax) : undefined,
          location: location || null,
          notes: notes || null,
          assignedTo: user.role === "PROJECT_MANAGER" ? user.id : (assignedTo || null),
          branchId: user.role === "PROJECT_MANAGER" ? user.branchId : (branchId || null),
          createdBy: user.id,
        },
        include: {
          assignedUser: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      // Audit log
      await logAudit(user.id, "CREATE", "Lead", lead.id, null, pickAuditFields(lead, ['name', 'company', 'status', 'type', 'phone', 'email']));

      return apiCreated(lead);
    } catch (error) {
      return apiError(error);
    }
  }
);
