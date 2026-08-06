"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
import { NotificationBell } from "@/components/layout/notification-bell";
// Roles that can create projects
const CAN_CREATE_PROJECT = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER"];

export function Topbar({ onToggleSidebar, sidebarOpen }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const canCreate = userRole && CAN_CREATE_PROJECT.includes(userRole);

  const tabs = [
    { label: "Project Overview", href: "/dashboard" },
    { label: "Resource Allocation", href: "/dashboard/resources" },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(248, 249, 255, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(190, 201, 193, 0.4)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 40px",
        width: "100%",
        boxSizing: "border-box",
        gap: "24px",
      }}
      className="sk-topbar"
    >
      {/* Left: hamburger + search + nav tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "32px", flex: 1, minWidth: 0 }}>
        {/* Hamburger — mobile only */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="sk-hamburger"
            style={{
              display: "none", /* shown via CSS media query */
              padding: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: T.onSurfaceVariant,
              borderRadius: "8px",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
              {sidebarOpen ? "close" : "menu"}
            </span>
          </button>
        )}

        {/* Search */}
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }} className="sk-search-wrapper">
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: T.outline,
              fontSize: "20px",
              pointerEvents: "none",
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search projects, materials, or files..."
            className="sk-search-input"
            style={{
              width: "100%",
              boxSizing: "border-box",
              paddingLeft: "40px",
              paddingRight: "16px",
              paddingTop: "8px",
              paddingBottom: "8px",
              background: T.surfaceContainerLow,
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "8px",
              fontFamily: FONT_BODY,
              fontSize: "14px",
              color: T.onSurface,
              outline: "none",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = T.primary;
              e.target.style.boxShadow = "0 0 0 3px rgba(0,79,53,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = T.outlineSoft;
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Tab nav */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexShrink: 0,
          }}
          className="sk-tabs"
        >
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  fontFamily: FONT_LABEL,
                  fontSize: "14px",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.primary : T.onSurfaceVariant,
                  textDecoration: "none",
                  borderBottom: isActive ? `2px solid ${T.primary}` : "2px solid transparent",
                  paddingBottom: "4px",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: icon buttons + divider + Create Project (role-gated) */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <NotificationBell />
        <button
          className="sk-apps-btn"
          style={{
            padding: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: T.onSurfaceVariant,
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          aria-label="Apps"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
            apps
          </span>
        </button>

        {/* User name */}
        {session?.user?.name && (
          <span
            style={{
              fontFamily: FONT_LABEL,
              fontSize: "13px",
              fontWeight: 500,
              color: T.onSurfaceVariant,
              padding: "4px 10px",
              background: T.surfaceContainerLow,
              borderRadius: "6px",
              whiteSpace: "nowrap",
            }}
            className="sk-user-name"
          >
            {session.user.name}
          </span>
        )}
      </div>

      <style>{`
        /* Tablet */
        @media (max-width: 1024px) {
          .sk-topbar {
            padding: 12px 24px !important;
          }
          .sk-tabs {
            display: none !important;
          }
          .sk-user-name {
            display: none !important;
          }
          .sk-apps-btn {
            display: none !important;
          }
        }

        /* Mobile */
        @media (max-width: 768px) {
          .sk-topbar {
            padding: 10px 16px !important;
            gap: 12px !important;
          }
          .sk-hamburger {
            display: flex !important;
          }
          .sk-search-wrapper {
            max-width: none !important;
          }
          .sk-search-input {
            font-size: 16px !important; /* prevent iOS zoom */
          }
          .sk-divider {
            display: none !important;
          }
          .sk-create-btn {
            padding: 8px 12px !important;
          }
          .sk-create-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
