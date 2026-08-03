"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useMemo } from "react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// All available navigation items
const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["all"] },
  { href: "/dashboard/projects", label: "Projects", icon: "architecture", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN", "CLIENT", "HOME_OWNER"] },
  { href: "/dashboard/leads", label: "Leads", icon: "analytics", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR"] },
  { href: "/dashboard/clients", label: "Clients", icon: "groups", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR"] },
  { href: "/dashboard/rab", label: "RAB", icon: "request_quote", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "ADMIN_KANTOR", "SURVEYOR", "KONSULTAN", "ARSITEK"] },
  { href: "/dashboard/materials", label: "Materials", icon: "trolley", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "LOGISTIK", "MANDOR", "SURVEYOR", "VENDOR"] },
  { href: "/dashboard/transactions", label: "Transactions", icon: "swap_horiz", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "SITE_MANAGER", "ADMIN_KANTOR", "LOGISTIK", "MANDOR"] },
  { href: "/dashboard/documents", label: "Documents", icon: "description", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER", "KONSULTAN", "CLIENT"] },
  { href: "/dashboard/invoices", label: "Invoices", icon: "receipt_long", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE", "CLIENT"] },
  { href: "/dashboard/reports", label: "Reports", icon: "bar_chart", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR", "FINANCE"] },
  { href: "/dashboard/settings", label: "Settings", icon: "settings", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
];

// Admin-only section
const adminNavItems = [
  { href: "/dashboard/users", label: "Users", icon: "manage_accounts", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
  { href: "/dashboard/branches", label: "Branches", icon: "domain", roles: ["SUPER_ADMIN", "OWNER"] },
];

export function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const visibleNavItems = useMemo(() => {
    if (!userRole) return allNavItems.filter((item) => item.roles.includes("all"));
    return allNavItems.filter(
      (item) => item.roles.includes("all") || item.roles.includes(userRole)
    );
  }, [userRole]);

  const visibleAdminItems = useMemo(() => {
    if (!userRole) return [];
    return adminNavItems.filter((item) => item.roles.includes(userRole));
  }, [userRole]);

  const linkStyle = (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 16px",
    borderRadius: "0",
    textDecoration: "none",
    fontFamily: FONT_LABEL,
    fontSize: "14px",
    fontWeight: isActive ? 700 : 500,
    letterSpacing: "0.02em",
    color: isActive ? T.primary : "#5a6278",
    backgroundColor: isActive ? T.surfaceContainerLow : "transparent",
    borderRight: isActive ? `3px solid ${T.primary}` : "3px solid transparent",
    transition: "all 0.15s ease",
  });

  const hoverHandlers = (isActive) => ({
    onMouseEnter: (e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = T.surfaceContainerLow;
        e.currentTarget.style.color = T.primary;
      }
    },
    onMouseLeave: (e) => {
      if (!isActive) {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#5a6278";
      }
    },
  });

  return (
    <aside
      className="sk-sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        overflowY: "auto",
        backgroundColor: T.surfaceCard,
        borderRight: `1px solid ${T.outlineSoft}`,
        width: "256px",
        flexShrink: 0,
        zIndex: 40,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Brand */}
      <div style={{ padding: "32px 24px 24px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/smartkonstrunksi.jpeg"
            alt="Smart Konstruksi"
            className="sk-logo-spin"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              objectFit: "cover",
              flexShrink: 0,
              border: "1px solid #1a1c1e",
            }}
          />
          <div>
            <h1
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "18px",
                fontWeight: 700,
                color: T.primary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Smart Konstruksi
            </h1>
            <p
              style={{
                fontFamily: FONT_LABEL,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: T.outline,
                margin: 0,
                marginTop: "2px",
              }}
            >
              {userRole?.replace(/_/g, " ") || "Precision ERP"}
            </p>
          </div>
        </div>

        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="sk-sidebar-close"
            style={{
              position: "absolute",
              top: "20px",
              right: "16px",
              width: "32px",
              height: "32px",
              display: "none", /* shown via CSS media query */
              alignItems: "center",
              justifyContent: "center",
              background: T.surfaceContainerLow,
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "8px",
              cursor: "pointer",
              color: "#5a6278",
              transition: "all 0.15s",
            }}
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav style={{ flex: 1, padding: "0 16px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={linkStyle(isActive)}
              {...hoverHandlers(isActive)}
              onClick={onClose}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "22px", lineHeight: 1 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <>
            <p
              style={{
                fontFamily: FONT_LABEL,
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#9ca3af",
                padding: "16px 16px 6px",
                margin: 0,
              }}
            >
              Administration
            </p>
            {visibleAdminItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={linkStyle(isActive)}
                  {...hoverHandlers(isActive)}
                  onClick={onClose}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "22px", lineHeight: 1 }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px",
          borderTop: `1px solid ${T.outlineSoft}`,
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        <Link
          href="/dashboard/profile"
          style={linkStyle(pathname === "/dashboard/profile")}
          {...hoverHandlers(pathname === "/dashboard/profile")}
          onClick={onClose}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            account_circle
          </span>
          <span>Profile</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 16px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT_LABEL,
            fontSize: "14px",
            fontWeight: 500,
            color: "#5a6278",
            width: "100%",
            textAlign: "left",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = T.surfaceContainerLow;
            e.currentTarget.style.color = T.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#5a6278";
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            logout
          </span>
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sk-sidebar-close {
            display: flex !important;
          }
        }
      `}</style>
    </aside>
  );
}
