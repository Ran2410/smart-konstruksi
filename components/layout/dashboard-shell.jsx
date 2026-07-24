"use client";

import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { usePathname } from "next/navigation";

export function DashboardShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="sk-shell" style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Backdrop — mobile only */}
      <div
        className="sk-backdrop"
        onClick={closeSidebar}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 55,
          opacity: sidebarOpen ? 1 : 0,
          pointerEvents: sidebarOpen ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Sidebar — open class toggled via React state directly */}
      <div
        className={"sk-sidebar-wrapper" + (sidebarOpen ? " sk-open" : "")}
        style={{ width: "256px", flexShrink: 0, zIndex: 60 }}
      >
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />
        <main
          className="sk-main"
          style={{
            flex: 1,
            padding: "32px 40px",
            maxWidth: "1440px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        /* Tablet: narrower padding */
        @media (max-width: 1024px) {
          .sk-main {
            padding: 24px 24px !important;
          }
        }

        /* Mobile: sidebar becomes overlay drawer */
        @media (max-width: 768px) {
          .sk-sidebar-wrapper {
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sk-sidebar-wrapper.sk-open {
            transform: translateX(0) !important;
          }

          .sk-main {
            padding: 16px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
