"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { RevenueTrendChart, WeeklyProfitChart } from "@/components/charts/dashboard-charts";
import Link from "next/link";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const card = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}`,
  boxShadow: "0 1px 3px rgba(31,38,135,0.04), 0 4px 16px rgba(31,38,135,0.05)",
  padding: "24px",
};

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, change, up, color }) {
  const accentColor = color || T.primary;
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        ...card,
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 32px rgba(31,38,135,0.12)" : "0 8px 32px rgba(31,38,135,0.07)",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          background: `${accentColor}12`,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          transition: "all 0.2s ease",
          transform: hovered ? "scale(1.08)" : "scale(1)",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "22px", color: accentColor }}>
          {icon}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "26px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.2, letterSpacing: "-0.01em" }}>
            {value}
          </h3>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 500, color: T.onSurfaceVariant, margin: "6px 0 0" }}>
            {label}
          </p>
        </div>
        {change && (
          <div style={{ display: "flex", alignItems: "center", gap: "2px", color: up !== false ? T.success : T.error, fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, marginBottom: "2px" }}>
            {change}
            <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
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
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: "0 0 24px" }}>
        Recent Activity
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.length === 0 && (
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: 0 }}>Belum ada aktivitas.</p>
        )}
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              padding: "8px 10px",
              borderRadius: "10px",
              margin: "0 -10px",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${item.color || T.primary}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: item.color || T.primary }}>
                {item.icon}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, margin: 0, lineHeight: 1.5 }}>
                {item.text}
              </p>
              <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.outline, margin: "2px 0 0" }}>
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
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
          {title}
        </h3>
        {badge && (
          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.primary, background: T.primaryLight, padding: "4px 10px", borderRadius: "9999px" }}>
            {badge}
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: T.surfaceContainerLow,
              borderRadius: "10px",
              transition: "all 0.15s ease",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.surfaceContainer;
              e.currentTarget.style.borderColor = T.outlineSoft;
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.surfaceContainerLow;
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: item.color || T.primary }}>
                {item.icon}
              </span>
              <span style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface }}>
                {item.label}
              </span>
            </div>
            <span style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: item.statusColor || T.outline }}>
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
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ ...card, padding: "32px" }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: "0 0 24px" }}>
        {title}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "36px", color: T.outlineSoft, display: "block", marginBottom: "8px" }}>trending_up</span>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: 0 }}>Belum ada data progress.</p>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.outline, margin: "4px 0 0" }}>Progress laporan akan muncul di sini.</p>
          </div>
        )}
        {items.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface }}>{item.label}</span>
              <span style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: T.primary }}>{item.value}%</span>
            </div>
            <div style={{ height: "8px", background: T.surfaceContainerLow, borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: animated ? `${item.value}%` : "0%",
                  background: item.color || T.primary,
                  borderRadius: "9999px",
                  transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDelay: `${i * 80}ms`,
                }}
              />
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
      <style>{`
        @keyframes sk-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sk-animate { animation: sk-fade-up 0.4s ease both; }
      `}</style>
      {/* Header skeleton */}
      <div>
        <div style={{ width: "200px", height: "28px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "8px" }} />
        <div style={{ width: "300px", height: "16px", background: "#e5e7eb", borderRadius: "8px" }} />
      </div>
      {/* Stats skeleton */}
      <section className="sk-dash-grid-stats">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...card }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#e5e7eb", marginBottom: "16px" }} />
            <div style={{ width: "60px", height: "26px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "8px" }} />
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
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: T.error, marginBottom: "16px", display: "block" }}>error</span>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", color: T.onSurface, margin: "0 0 8px" }}>Gagal memuat dashboard</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: 0 }}>{error}</p>
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
          .sk-dash-grid-stats { grid-template-columns: 1fr !important; gap: 12px !important; }
          .sk-dash-grid-mid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sk-dash-grid-bottom { grid-template-columns: 1fr !important; gap: 16px !important; }
          .sk-dash-grid-charts { grid-template-columns: 1fr !important; gap: 16px !important; }
        }
        @media (max-width: 640px) {
          .sk-dash-grid-stats > *, .sk-dash-grid-mid > *, .sk-dash-grid-bottom > *, .sk-dash-grid-charts > * { min-width: 0; }
        }
      `}</style>
      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="sk-dash-title" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: T.onSurface, margin: 0 }}>
            {config.greeting}
          </h2>
          <p className="sk-dash-subtitle" style={{ fontFamily: FONT_BODY, color: T.onSurfaceVariant, margin: "4px 0 0" }}>
            Welcome back, {session?.user?.name || "User"} — {config.subtitle || "here's what's happening today."}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.primary }}>calendar_today</span>
          <span style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 500, color: T.onSurface }}>
            {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
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

      {/* ── Stock Alert ───────────────────────────────────────────────── */}
      <StockAlertSection />

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
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 600, color: T.onSurface, margin: "0 0 24px" }}>
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
// ── Stock Alert Section ──────────────────────────────────────────────────────
function StockAlertSection() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const res = await fetch("/api/materials?limit=500");
        const json = await res.json();
        const items = json.data || [];
        const lowStock = items.filter((m) => Number(m.stock) > 0 && Number(m.stock) <= Number(m.minStock));
        const outOfStock = items.filter((m) => Number(m.stock) <= 0);
        setAlerts([...outOfStock.map((m) => ({ ...m, alertType: "out" })), ...lowStock.map((m) => ({ ...m, alertType: "low" }))]);
      } catch (_) {}
      finally { setLoading(false); }
    }
    fetchAlerts();
  }, []);

  if (loading || alerts.length === 0) return null;

  const outCount = alerts.filter((a) => a.alertType === "out").length;
  const lowCount = alerts.filter((a) => a.alertType === "low").length;

  return (
    <Link href="/dashboard/materials" style={{ textDecoration: "none", display: "block" }}>
      <div style={{
        background: outCount > 0 ? "#fef2f2" : T.warningBg,
        borderRadius: "14px", border: `1px solid ${outCount > 0 ? "#fecaca" : "#fed7aa"}`,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px",
        cursor: "pointer", transition: "all 0.15s",
      }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: outCount > 0 ? "#fecaca" : "#fed7aa",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: outCount > 0 ? T.error : T.warning }}>inventory</span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: "15px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
            Stock Alert{outCount + lowCount > 1 ? "s" : ""}
          </p>
          <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant, margin: "2px 0 0" }}>
            {outCount > 0 && <span style={{ fontWeight: 600, color: T.error }}>{outCount} out of stock</span>}
            {outCount > 0 && lowCount > 0 && <span> • </span>}
            {lowCount > 0 && <span style={{ fontWeight: 600, color: T.warning }}>{lowCount} low stock</span>}
            <span> — click to view inventory</span>
          </p>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.outline }}>chevron_right</span>
      </div>
    </Link>
  );
}

function ActionBtn({ icon, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        background: hovered ? T.primary : T.surfaceContainerLow,
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontFamily: FONT_BODY,
        fontSize: "14px",
        fontWeight: 500,
        color: hovered ? "#fff" : T.onSurface,
        width: "100%",
        textAlign: "left",
        transition: "all 0.2s ease",
        transform: hovered ? "translateX(3px)" : "translateX(0)",
        boxShadow: hovered ? "0 4px 12px rgba(0,79,53,0.2)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{icon}</span>
      {label}
    </button>
  );
}
