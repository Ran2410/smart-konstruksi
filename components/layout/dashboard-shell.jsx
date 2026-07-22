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
      {sidebarOpen && (
        <div
          className="sk-sidebar-backdrop"
          onClick={closeSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 55,
            display: "none", /* shown via CSS media query */
          }}
        />
      )}

      {/* Sidebar */}
      <div className={`sk-sidebar-wrapper ${sidebarOpen ? "open" : ""}`}>
        <Sidebar onClose={closeSidebar} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: "256px" }}>
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
        /* Tablet: sidebar still visible but narrower padding */
        @media (max-width: 1024px) {
          .sk-main {
            padding: 24px 24px !important;
          }
        }

        /* Mobile: sidebar becomes overlay drawer */
        @media (max-width: 768px) {
          .sk-sidebar-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            z-index: 60;
            transform: translateX(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sk-sidebar-wrapper.open {
            transform: translateX(0);
          }

          .sk-sidebar-backdrop {
            display: block !important;
          }

          .sk-main {
            padding: 16px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
