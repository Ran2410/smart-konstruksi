// ============================================================
// Smart Konstruksi — Settings API (Company Profile)
// GET  /api/settings        — read company profile (auto-create default)
// PUT  /api/settings        — update company profile (audit logged)
// ============================================================

import { prisma } from "@/lib/prisma";
import {
  withPermission,
  apiSuccess,
} from "@/lib/api/with-auth";
import { apiError } from "@/lib/rbac/guard";
import { updateCompanyProfileSchema } from "@/lib/validation/schemas";
import { validateOrRespond } from "@/lib/validation/index";
import { logAudit, pickAuditFields } from "@/lib/audit-log";

const PROFILE_ID = "company";

const PROFILE_SELECT = {
  id: true,
  companyName: true,
  tagline: true,
  address: true,
  phone: true,
  email: true,
  taxId: true,
  website: true,
  logoUrl: true,
  currency: true,
  invoicePrefix: true,
  taxRate: true,
  updatedBy: true,
  updatedAt: true,
} as const;

/**
 * Get the singleton company profile, creating it with defaults
 * if it does not exist yet (idempotent).
 */
async function getOrCreateProfile() {
  const existing = await prisma.companyProfile.findUnique({
    where: { id: PROFILE_ID },
  });
  if (existing) return existing;
  return prisma.companyProfile.create({
    data: { id: PROFILE_ID },
  });
}

/**
 * Attach the updater's display name for the UI footer
 * ("Last updated by <name>").
 */
async function withUpdaterName(profile: { updatedBy: string | null }) {
  if (!profile.updatedBy) return { ...profile, updatedByName: null };
  const updater = await prisma.user.findUnique({
    where: { id: profile.updatedBy },
    select: { name: true },
  });
  return { ...profile, updatedByName: updater?.name || null };
}

// GET /api/settings — settings:read
// SUPER_ADMIN / OWNER / BRANCH_MANAGER
export const GET = withPermission("settings:read", async () => {
  try {
    const profile = await getOrCreateProfile();
    return apiSuccess({ data: await withUpdaterName(profile) });
  } catch (error) {
    return apiError(error);
  }
});

// PUT /api/settings — settings:manage
// Updates partial fields; every change is written to the audit log.
export const PUT = withPermission("settings:manage", async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = validateOrRespond(updateCompanyProfileSchema, body);
    if (parsed instanceof Response) return parsed;

    // Capture previous state for the audit trail
    const previous = await getOrCreateProfile();

    const updated = await prisma.companyProfile.update({
      where: { id: PROFILE_ID },
      data: {
        ...parsed,
        updatedBy: user.id,
      },
      select: PROFILE_SELECT,
    });

    await logAudit(
      user.id,
      "UPDATE",
      "CompanyProfile",
      PROFILE_ID,
      pickAuditFields(previous, [
        "companyName", "tagline", "address", "phone", "email",
        "taxId", "website", "logoUrl", "currency", "invoicePrefix", "taxRate",
      ]),
      pickAuditFields(updated, [
        "companyName", "tagline", "address", "phone", "email",
        "taxId", "website", "logoUrl", "currency", "invoicePrefix", "taxRate",
      ])
    );

    return apiSuccess({ data: await withUpdaterName(updated) });
  } catch (error) {
    return apiError(error);
  }
});
