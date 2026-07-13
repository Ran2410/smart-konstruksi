// ============================================================
// Smart Konstruksi — Next.js Middleware (RBAC + Rate Limit)
// Layer 1: Route-level protection + Rate limiting + Security headers
// ============================================================

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  addSecurityHeaders,
  LOGIN_CONFIG,
  API_CONFIG,
} from "@/lib/rate-limiter";

// ==================== ROUTE ACCESS CONFIG ====================

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

const SKIP_PATTERNS = ["/_next", "/api", "/favicon.ico", "/public"];

const ROLE_ACCESS: Record<string, string[]> = {
  "/login": ["*"],
  "/register": ["*"],
  "/forgot-password": ["*"],
  "/dashboard": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN",
    "FINANCE", "CLIENT", "VENDOR", "HOME_OWNER",
  ],
  "/dashboard/users": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"],
  "/dashboard/branches": ["SUPER_ADMIN", "OWNER"],
  "/dashboard/projects": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "FINANCE", "CLIENT",
  ],
  "/dashboard/leads": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR"],
  "/dashboard/invoices": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"],
  "/dashboard/payments": ["SUPER_ADMIN", "OWNER", "FINANCE"],
  "/dashboard/rab": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "KONSULTAN"],
  "/dashboard/approvals": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "FINANCE"],
  "/dashboard/reports": [
    "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER",
    "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK",
    "QC_INSPECTOR", "K3_OFFICER", "FINANCE", "CLIENT",
  ],
  "/dashboard/tasks": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER"],
  "/dashboard/attendance": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER"],
  "/dashboard/qc": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "QC_INSPECTOR"],
  "/dashboard/safety": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "K3_OFFICER"],
  "/dashboard/vendors": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR"],
  "/dashboard/documents": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR", "ARSITEK", "CLIENT"],
  "/dashboard/settings": ["SUPER_ADMIN", "OWNER"],
  "/dashboard/client-portal": ["CLIENT"],
  "/dashboard/vendor-portal": ["VENDOR"],
  "/dashboard/warranty": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE", "SITE_MANAGER", "CLIENT", "HOME_OWNER"],
  "/dashboard/notifications": ["*"],
};

// ==================== HELPERS ====================

function canAccessRoute(role: string, pathname: string): boolean {
  if (ROLE_ACCESS[pathname]) {
    const allowed = ROLE_ACCESS[pathname];
    return allowed.includes("*") || allowed.includes(role);
  }
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length; i > 0; i--) {
    const prefix = "/" + segments.slice(0, i).join("/");
    if (ROLE_ACCESS[prefix]) {
      const allowed = ROLE_ACCESS[prefix];
      return allowed.includes("*") || allowed.includes(role);
    }
  }
  if (pathname.startsWith("/dashboard")) {
    const dashboardAccess = ROLE_ACCESS["/dashboard"];
    if (!dashboardAccess) return false;
    return dashboardAccess.includes("*") || dashboardAccess.includes(role);
  }
  return false;
}

// ==================== MIDDLEWARE ====================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // === RATE LIMITING ===
  const clientIP = getClientIP(request);

  // Stricter rate limit for login (credentials callback only)
  if (pathname === "/api/auth/callback/credentials") {
    const result = checkRateLimit(`login:${clientIP}`, LOGIN_CONFIG);
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter!);
    }
  }

  // General API rate limiting
  if (pathname.startsWith("/api/")) {
    const result = checkRateLimit(`api:${clientIP}`, API_CONFIG);
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter!);
    }
  }

  // === SKIP PATTERNS ===
  for (const pattern of SKIP_PATTERNS) {
    if (pathname.startsWith(pattern)) return NextResponse.next();
  }
  if (pathname.includes(".")) return NextResponse.next();

  // === AUTH CHECK ===
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const role = token?.role as string | undefined;

  // NOT LOGGED IN
  if (!isAuthenticated) {
    if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // LOGGED IN — Auth pages → redirect to dashboard
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Validate role exists
  if (!role) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  // Role-based route check
  if (!canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Add security headers to all responses
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
