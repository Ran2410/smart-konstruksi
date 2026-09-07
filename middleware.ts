import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  checkRateLimit,
  getClientIP,
  rateLimitResponse,
  addSecurityHeaders,
  LOGIN_CONFIG,
  API_READ_CONFIG,
  API_WRITE_CONFIG,
} from "@/lib/rate-limiter";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

const SKIP_PATTERNS = ["/_next", "/api", "/favicon.ico", "/public"];

const ROLE_ACCESS: Record<string, string[]> = {
  "/login": ["*"],
  "/register": ["*"],
  "/forgot-password": ["*"],
  "/dashboard": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ESTIMATOR",
    "SITE_MANAGER",
    "ADMIN_KANTOR",
    "ARSITEK",
    "QC_INSPECTOR",
    "K3_OFFICER",
    "INTERIOR_DESIGNER",
    "KONSULTAN",
    "FINANCE",
    "CLIENT",
    "VENDOR",
    "HOME_OWNER",
    "LOGISTIK",
    "MANDOR",
    "SURVEYOR",
  ],
  "/dashboard/users": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"],
  "/dashboard/branches": ["SUPER_ADMIN", "OWNER"],
  "/dashboard/projects": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ESTIMATOR",
    "SITE_MANAGER",
    "ADMIN_KANTOR",
    "ARSITEK",
    "QC_INSPECTOR",
    "K3_OFFICER",
    "INTERIOR_DESIGNER",
    "KONSULTAN",
    "CLIENT",
    "HOME_OWNER",
  ],
  "/dashboard/leads": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ADMIN_KANTOR",
  ],
  "/dashboard/clients": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ADMIN_KANTOR",
  ],
  "/dashboard/invoices": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "ADMIN_KANTOR",
    "FINANCE",
    "CLIENT",
  ],
  "/dashboard/payments": ["SUPER_ADMIN", "OWNER", "FINANCE"],
  "/dashboard/rab": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ESTIMATOR",
    "ADMIN_KANTOR",
    "SURVEYOR",
    "KONSULTAN",
    "ARSITEK",
  ],
  "/dashboard/materials": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ESTIMATOR",
    "SITE_MANAGER",
    "ADMIN_KANTOR",
    "LOGISTIK",
    "MANDOR",
    "SURVEYOR",
    "VENDOR",
  ],
  "/dashboard/transactions": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ESTIMATOR",
    "SITE_MANAGER",
    "ADMIN_KANTOR",
    "LOGISTIK",
    "MANDOR",
  ],
  "/dashboard/approvals": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "FINANCE",
  ],
  "/dashboard/reports": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "ADMIN_KANTOR",
    "FINANCE",
  ],
  "/dashboard/tasks": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "SITE_MANAGER",
  ],
  "/dashboard/attendance": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "SITE_MANAGER",
    "MANDOR",
  ],
  "/dashboard/qc": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "QC_INSPECTOR",
  ],
  "/dashboard/safety": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "K3_OFFICER",
  ],
  "/dashboard/vendors": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "ADMIN_KANTOR",
  ],
  "/dashboard/documents": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "PROJECT_MANAGER",
    "SITE_MANAGER",
    "ADMIN_KANTOR",
    "ARSITEK",
    "QC_INSPECTOR",
    "K3_OFFICER",
    "INTERIOR_DESIGNER",
    "KONSULTAN",
    "CLIENT",
  ],
  "/dashboard/settings": ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"],
  "/dashboard/client-portal": ["CLIENT"],
  "/dashboard/vendor-portal": ["VENDOR"],
  "/dashboard/warranty": [
    "SUPER_ADMIN",
    "OWNER",
    "BRANCH_MANAGER",
    "ADMIN_KANTOR",
    "FINANCE",
    "SITE_MANAGER",
    "CLIENT",
    "HOME_OWNER",
  ],
  "/dashboard/notifications": ["*"],
};

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const clientIP = getClientIP(request);

  if (pathname === "/api/auth/callback/credentials") {
    const result = checkRateLimit(`login:${clientIP}`, LOGIN_CONFIG);
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter!);
    }
  }

  // Auth endpoints have their own protections in Auth.js. Do not charge session,
  // CSRF, and credentials requests to the dashboard API bucket as well.
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const isRead = request.method === "GET" || request.method === "HEAD";
    const bucket = isRead ? "read" : "write";
    const config = isRead ? API_READ_CONFIG : API_WRITE_CONFIG;
    const result = checkRateLimit(`api:${bucket}:${clientIP}`, config);
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter!);
    }
  }

  for (const pattern of SKIP_PATTERNS) {
    if (pathname.startsWith(pattern)) return NextResponse.next();
  }
  if (pathname.includes(".")) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    // Over HTTPS (production, tunnels) Auth.js names the cookie
    // `__Secure-authjs.session-token`; on plain HTTP it is
    // `authjs.session-token`. getToken defaults to secureCookie:false,
    // which breaks sessions behind HTTPS tunnels (login -> back to /login).
    secureCookie: request.nextUrl.protocol === "https:",
  });

  const isAuthenticated = !!token;
  const role = token?.role as string | undefined;

  if (!isAuthenticated) {
    if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!role) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("__Secure-authjs.session-token");
    return response;
  }

  if (!canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
