"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RevenueTrendChart, WeeklyProfitChart } from "@/components/charts/dashboard-charts";

// ── Shared style tokens ──────────────────────────────────────────────────────
const TOKEN = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  secondary: "#565e74",
  secondaryLight: "#dce9ff",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  error: "#ba1a1a",
  warning: "#b45309",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card = {
  background: TOKEN.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${TOKEN.outlineSoft}`,
  boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
  padding: "24px",
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, change, up, color }) {
  const accentColor = color || TOKEN.primary;
  return (
    <div style={card}>
      <div
        style={{
          width: "40px",
          height: "40px",
          background: `${accentColor}10`,
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: accentColor }}>
          {icon}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "24px", fontWeight: 600, color: TOKEN.onSurface, margin: 0, lineHeight: 1.2 }}>
            {value}
          </h3>
          <p style={{ fontFamily: TOKEN.fontLabel, fontSize: "14px", fontWeight: 500, color: TOKEN.onSurfaceVariant, margin: "4px 0 0" }}>
            {label}
          </p>
        </div>
        {change && (
          <div style={{ display: "flex", alignItems: "center", gap: "2px", color: up !== false ? TOKEN.primary : TOKEN.error, fontFamily: TOKEN.fontLabel, fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>
            {change}
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              {up !== false ? "arrow_upward" : "arrow_downward"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity List ────────────────────────────────────────────────────────────
function ActivityList({ items }) {
  return (
    <div style={{ ...card, padding: "32px" }}>
      <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "20px", fontWeight: 600, color: TOKEN.onSurface, margin: "0 0 24px" }}>
        Recent Activity
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {items.length === 0 && (
          <p style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.outline, margin: 0 }}>Belum ada aktivitas.</p>
        )}
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "9999px", background: `${item.color || TOKEN.primary}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: item.color || TOKEN.primary }}>
                {item.icon}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.onSurface, margin: 0, lineHeight: 1.5 }}>
                {item.text}
              </p>
              <p style={{ fontFamily: TOKEN.fontLabel, fontSize: "12px", color: TOKEN.outline, margin: "2px 0 0" }}>
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Quick List ───────────────────────────────────────────────────────────────
function QuickList({ title, items, badge }) {
  return (
    <div style={{ ...card, padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "20px", fontWeight: 600, color: TOKEN.onSurface, margin: 0 }}>
          {title}
        </h3>
        {badge && (
          <span style={{ fontFamily: TOKEN.fontLabel, fontSize: "12px", fontWeight: 600, color: TOKEN.primary, background: TOKEN.primaryLight, padding: "4px 10px", borderRadius: "9999px" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: TOKEN.surfaceContainerLow, borderRadius: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: item.color || TOKEN.primary }}>
                {item.icon}
              </span>
              <span style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.onSurface }}>
                {item.label}
              </span>
            </div>
            <span style={{ fontFamily: TOKEN.fontLabel, fontSize: "13px", fontWeight: 600, color: item.statusColor || TOKEN.outline }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressCard({ title, items }) {
  return (
    <div style={{ ...card, padding: "32px" }}>
      <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "20px", fontWeight: 600, color: TOKEN.onSurface, margin: "0 0 24px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {items.length === 0 && (
          <p style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.outline, margin: 0 }}>Belum ada data progress.</p>
        )}
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.onSurface }}>{item.label}</span>
              <span style={{ fontFamily: TOKEN.fontLabel, fontSize: "13px", fontWeight: 600, color: TOKEN.primary }}>{item.value}%</span>
            </div>
            <div style={{ height: "8px", background: TOKEN.surfaceContainerLow, borderRadius: "9999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${item.value}%`, background: item.color || TOKEN.primary, borderRadius: "9999px", transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "8px 0" }}>
      {/* Header skeleton */}
      <div>
        <div style={{ width: "200px", height: "28px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "8px" }} />
        <div style={{ width: "300px", height: "16px", background: "#e5e7eb", borderRadius: "8px" }} />
      </div>
      {/* Stats skeleton */}
      <section className="sk-dash-grid-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...card }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "9999px", background: "#e5e7eb", marginBottom: "16px" }} />
            <div style={{ width: "60px", height: "24px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "8px" }} />
            <div style={{ width: "100px", height: "14px", background: "#e5e7eb", borderRadius: "8px" }} />
          </div>
        ))}
      </section>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// QUICK ACTIONS (role-based, static — no DB needed)
// ══════════════════════════════════════════════════════════════════════════════
const QUICK_ACTIONS = {
  SUPER_ADMIN: [
    { icon: "add", label: "Create New Project" },
  ],
  OWNER: [
    { icon: "add", label: "Create New Project" },
  ],
  BRANCH_MANAGER: [
    { icon: "add", label: "Create New Project" },
  ],
  PROJECT_MANAGER: [
    { icon: "add", label: "Create New Project" },
  ],
  SITE_MANAGER: [
    { icon: "description", label: "Submit Daily Report" },
  ],
  CLIENT: [
    { icon: "chat", label: "Send Feedback" },
  ],
  FINANCE: [
    { icon: "receipt_long", label: "Generate Invoice" },
  ],
  ADMIN_KANTOR: [
    { icon: "receipt_long", label: "Generate Invoice" },
  ],
  ARSITEK: [
    { icon: "upload", label: "Upload Design" },
  ],
  QC_INSPECTOR: [
    { icon: "fact_check", label: "Start Inspection" },
  ],
  K3_OFFICER: [
    { icon: "health_and_safety", label: "Safety Audit" },
  ],
  VENDOR: [
    { icon: "check_circle", label: "Confirm Delivery" },
  ],
  ESTIMATOR: [
    { icon: "calculate", label: "Create RAB" },
  ],
  INTERIOR_DESIGNER: [
    { icon: "upload", label: "Upload Design" },
  ],
  KONSULTAN: [
    { icon: "rate_review", label: "Submit Review" },
  ],
  HOME_OWNER: [
    { icon: "chat", label: "Send Feedback" },
  ],
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) return;

    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard");
        const data = await res.json();
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [session]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div style={{ ...card, padding: "48px", textAlign: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: TOKEN.error, marginBottom: "16px", display: "block" }}>error</span>
        <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "20px", color: TOKEN.onSurface, margin: "0 0 8px" }}>Gagal memuat dashboard</h3>
        <p style={{ fontFamily: TOKEN.fontBody, fontSize: "14px", color: TOKEN.outline, margin: 0 }}>{error}</p>
      </div>
    );
  }

  const config = dashboardData || { greeting: "Dashboard", subtitle: "", stats: [], quickStats: [], activity: [], progress: [], chartData: null };
  const actions = QUICK_ACTIONS[userRole] || [];
  const showCharts = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "FINANCE", "ADMIN_KANTOR"].includes(userRole);
  const showBothCharts = ["SUPER_ADMIN", "OWNER", "FINANCE"].includes(userRole);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-dash-title { font-size: 28px; }
        .sk-dash-subtitle { font-size: 15px; }
        .sk-dash-grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
        .sk-dash-grid-mid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .sk-dash-grid-bottom { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .sk-dash-grid-charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
        @media (max-width: 640px) {
          .sk-dash-title { font-size: 22px !important; }
          .sk-dash-subtitle { font-size: 13px !important; }
          .sk-dash-grid-stats { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
          .sk-dash-grid-mid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sk-dash-grid-bottom { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sk-dash-grid-charts { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 380px) {
          .sk-dash-grid-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* Greeting */}
      <div>
        <h2 className="sk-dash-title" style={{ fontFamily: TOKEN.fontDisplay, fontWeight: 700, color: TOKEN.onSurface, margin: 0 }}>
          {config.greeting}
        </h2>
        <p className="sk-dash-subtitle" style={{ fontFamily: TOKEN.fontBody, color: TOKEN.onSurfaceVariant, margin: "4px 0 0" }}>
          Welcome back, {session?.user?.name || "User"} — {config.subtitle || "here's what's happening today."}
        </p>
      </div>

      {/* Charts — role-based */}
      {showCharts && config.chartData && (
        <section className="sk-dash-grid-charts">
          <RevenueTrendChart data={config.chartData.revenueTrend} />
          {showBothCharts && <WeeklyProfitChart data={config.chartData.weeklyProfit} />}
        </section>
      )}

      {/* Stat cards */}
      {config.stats && config.stats.length > 0 && (
        <section className="sk-dash-grid-stats">
          {config.stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </section>
      )}

      {/* Quick Stats + Activity */}
      <section className="sk-dash-grid-mid">
        {config.quickStats && config.quickStats.length > 0 && (
          <QuickList title="Quick Overview" items={config.quickStats} badge={`${config.quickStats.length} items`} />
        )}
        <ActivityList items={config.activity || []} />
      </section>

      {/* Progress + Quick Actions */}
      <section className="sk-dash-grid-bottom">
        <ProgressCard title="Project Progress" items={config.progress || []} />
        <div style={{ ...card, padding: "32px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontFamily: TOKEN.fontDisplay, fontSize: "20px", fontWeight: 600, color: TOKEN.onSurface, margin: "0 0 24px" }}>
            Quick Actions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
            {actions.map((action) => (
              <ActionBtn key={action.label} icon={action.icon} label={action.label} />
            ))}
            <ActionBtn icon="notifications" label="View Notifications" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ icon, label }) {
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        background: TOKEN.surfaceContainerLow,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontFamily: TOKEN.fontBody,
        fontSize: "14px",
        fontWeight: 500,
        color: TOKEN.onSurface,
        width: "100%",
        textAlign: "left",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = TOKEN.primaryLight; e.currentTarget.style.color = TOKEN.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = TOKEN.surfaceContainerLow; e.currentTarget.style.color = TOKEN.onSurface; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>
      {label}
    </button>
  );
}
