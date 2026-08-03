"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
  borderRadius: "12px",
  padding: "20px",
};

const solidCard: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid rgba(190,201,193,0.3)`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

// ── Status Config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  PLANNING:    { label: "Planning",    color: "#2563eb", bg: "rgba(37,99,235,0.08)",   dot: "#2563eb" },
  IN_PROGRESS: { label: "In Progress", color: T.primary, bg: T.primaryLight,           dot: T.primary },
  ON_HOLD:     { label: "On Hold",     color: T.tertiary, bg: "rgba(226,227,226,0.4)", dot: T.tertiary },
  COMPLETED:   { label: "Completed",   color: "#15803d", bg: "rgba(220,252,231,0.8)",  dot: "#15803d" },
  CANCELLED:   { label: "Cancelled",   color: T.error,   bg: T.errorContainer,         dot: T.error },
};

const CAN_CREATE = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER"];

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ── Types ──────────────────────────────────────────────────────────────────
interface KpiStats {
  total: number;
  active: number;
  completed: number;
  planning: number;
  onHold: number;
  cancelled: number;
  totalBudget: number;
  avgProgress: number;
  delayed: number;
}

interface Branch { id: string; name: string; }
interface Manager { id: string; name: string; }

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, badge, badgeColor, badgeIcon, label, value }: {
  icon: string; iconBg: string; iconColor: string; badge: string;
  badgeColor: string; badgeIcon: string; label: string; value: string;
}) {
  return (
    <div style={glassCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ padding: "8px", background: iconBg, borderRadius: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: iconColor, display: "block" }}>{icon}</span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: badgeColor }}>
          {badge}
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{badgeIcon}</span>
        </span>
      </div>
      <p style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 4px" }}>{label}</p>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "24px", fontWeight: 600, color: T.onSurface, margin: 0 }}>{value}</h3>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: T.outline, bg: T.surfaceContainerLow, dot: T.outline };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "9999px",
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ minWidth: "128px" }}>
      <div style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>{value}%</div>
      <div style={{ height: "6px", background: T.surfaceContainerHigh, borderRadius: "9999px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: T.primary, borderRadius: "9999px", transition: "width 1s ease-in-out" }} />
      </div>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, src }: { name: string; src?: string }) {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";
  return src ? (
    <img src={src} alt={name} style={{ width: "32px", height: "32px", borderRadius: "9999px", border: `1px solid ${T.outlineSoft}`, objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: "32px", height: "32px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontLabel, fontSize: "10px", fontWeight: 700, color: T.onSurface, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// ── Action Dropdown ────────────────────────────────────────────────────────
function ActionDropdown({ projectId, router, canEdit }: { projectId: string; router: any; canEdit?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions: Array<{ icon: string; label: string; color?: string; onClick: () => any }> = [
    { icon: "visibility", label: "View Details", onClick: () => router.push(`/dashboard/projects/${projectId}`) },
  ];
  if (canEdit) {
    actions.push(
      { icon: "edit", label: "Edit Project", onClick: () => router.push(`/dashboard/projects/${projectId}`) },
      { icon: "delete", label: "Delete Project", color: T.error, onClick: async () => {
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
          const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
          if (res.ok) { setOpen(false); window.location.reload(); }
        } catch { /* ignore */ }
      }},
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: T.onSurfaceMuted, borderRadius: "8px", display: "inline-flex" }}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 19 }} />
          <div style={{ position: "absolute", top: "100%", right: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20, minWidth: "180px", overflow: "hidden" }}>
            {actions.map((a) => (
              <button key={a.label} onClick={(e) => { e.stopPropagation(); a.onClick(); }} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500, color: a.color || T.onSurface, cursor: "pointer", transition: "background 0.12s" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Drawer (Project Detail Sidebar) ────────────────────────────────────────
function ProjectDrawer({ project, onClose, router }: { project: any; onClose: () => void; router: any }) {
  if (!project) return null;
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!project?.id) return;
    fetch(`/api/tasks?projectId=${project.id}&limit=10`)
      .then(r => r.json())
      .then(d => setTasks(d.data || []))
      .catch(() => {});
  }, [project?.id]);

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", zIndex: 49, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, height: "100%", width: "min(450px, 90vw)",
        background: T.surfaceCard, boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        zIndex: 50, borderLeft: `1px solid rgba(190,201,193,0.3)`,
        display: "flex", flexDirection: "column",
        animation: "slideIn 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderBottom: `1px solid rgba(190,201,193,0.3)` }}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Project Details</h3>
          <button onClick={onClose} style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: T.onSurfaceVariant, borderRadius: "9999px", display: "flex" }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Identity */}
          <div style={{ padding: "20px", borderRadius: "16px", background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.3)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "12px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", color: T.primary }}>architecture</span>
              </div>
              <div>
                <p style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.primary, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 4px" }}>{project.code}</p>
                <h4 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{project.name}</h4>
              </div>
            </div>
            <div style={{ borderTop: `1px solid rgba(190,201,193,0.3)`, paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { label: "Client", value: project.client?.companyName || project.client?.name || "—" },
                { label: "Manager", value: project.projectManager?.name || "—" },
                { label: "Branch", value: project.branch?.name || "—" },
                { label: "Start Date", value: formatDate(project.startDate) },
                { label: "End Date", value: formatDate(project.endDate) },
                { label: "Budget", value: formatCurrency(Number(project.budget)) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted }}>{label}</span>
                  <span style={{ fontFamily: T.fontBody, fontSize: "14px", fontWeight: 700, color: T.onSurface }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status + Progress */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <StatusBadge status={project.status} />
            <div style={{ flex: 1 }}><ProgressBar value={project.progress || 0} /></div>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h5 style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.onSurface, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Description</h5>
              <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceVariant, margin: 0, lineHeight: 1.6 }}>{project.description}</p>
            </div>
          )}

          {/* Recent Tasks */}
          <div>
            <h5 style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.onSurface, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>Recent Tasks</h5>
            {tasks.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {tasks.map((t: any) => (
                  <div key={t.id} style={{ padding: "10px 14px", borderRadius: "10px", background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.2)` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: T.onSurface }}>{t.title}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.outline, margin: 0 }}>No tasks yet</p>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid rgba(190,201,193,0.3)`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button style={{ padding: "12px", background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.onSurface, cursor: "pointer" }}>
            View Files
          </button>
          <button
            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
            style={{ padding: "12px", background: T.primary, border: "none", borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,79,53,0.2)" }}
          >
            Open Project
          </button>
        </div>
      </div>
    </>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────
function FilterChip({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  const current = options.find((o) => o.value === value)?.label || "All";
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", background: T.surfaceContainerLow,
          border: `1px solid rgba(190,201,193,0.3)`, borderRadius: "9999px",
          fontFamily: T.fontLabel, fontSize: "12px", cursor: "pointer",
        }}
      >
        <span style={{ color: T.onSurfaceMuted }}>{label}:</span>
        <span style={{ fontWeight: 700, color: T.primary }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.onSurfaceMuted }}>expand_more</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, minWidth: "160px", overflow: "hidden", maxHeight: "240px", overflowY: "auto" }}>
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 16px", background: o.value === value ? T.primaryLight : "none",
                  border: "none", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: o.value === value ? 700 : 400,
                  color: o.value === value ? T.primary : T.onSurface, cursor: "pointer",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function ProjectsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const canCreate = CAN_CREATE.includes(userRole || "");
  const canEdit = CAN_CREATE.includes(userRole || "");

  // Data states
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState<KpiStats | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [managerFilter, setManagerFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeView, setActiveView] = useState<"table" | "board">("table");
  const [drawerProject, setDrawerProject] = useState<any>(null);
  const limit = 10;

  // ── Fetch KPI Stats ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/projects/stats")
      .then((r) => r.json())
      .then((d) => { setKpi(d); })
      .catch(() => {});
  }, [session]);

  // ── Fetch Branches for filter ────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/branches?limit=100")
      .then((r) => r.json())
      .then((d) => { if (d.data) setBranches(d.data); })
      .catch(() => {});
  }, [session]);

  // ── Fetch Managers for filter ────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/users?role=PROJECT_MANAGER&limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setManagers(d.data.map((u: any) => ({ id: u.id, name: u.name })));
      })
      .catch(() => {});
  }, [session]);

  // ── Fetch Projects ──────────────────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (branchFilter) params.set("branchId", branchFilter);
      if (managerFilter) params.set("projectManagerId", managerFilter);
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, branchFilter, managerFilter]);

  useEffect(() => { if (session) fetchProjects(); }, [session, fetchProjects]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Reset Filters ────────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("");
    setBranchFilter(""); setManagerFilter(""); setPage(1);
  };

  const hasActiveFilters = statusFilter || branchFilter || managerFilter || search;

  const viewTabs = ["Table", "Board"] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th {
          text-align: left; padding: 14px 24px;
          font-family: ${T.fontLabel}; font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; color: ${T.outline};
          background: rgba(239,244,255,0.5);
        }
        .sk-table td {
          padding: 16px 24px; font-family: ${T.fontBody}; font-size: 14px;
          color: ${T.onSurface}; border-bottom: 1px solid rgba(190,201,193,0.2);
          vertical-align: middle;
        }
        .sk-table tbody tr { cursor: pointer; transition: background 0.12s; }
        .sk-table tbody tr:hover { background: rgba(239,244,255,0.5); }
        .sk-table tbody tr:last-child td { border-bottom: none; }
        .sk-view-btn { padding: 6px 16px; background: none; border: none; cursor: pointer; font-family: ${T.fontLabel}; font-size: 14px; font-weight: 500; color: ${T.onSurfaceMuted}; border-radius: 6px; transition: all 0.15s; }
        .sk-view-btn.active { background: ${T.surfaceCard}; color: ${T.primary}; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .sk-page-btn { display: flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid rgba(190,201,193,0.5); border-radius: 8px; background: ${T.surfaceCard}; color: ${T.onSurfaceVariant}; font-family: ${T.fontLabel}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
        .sk-icon-btn { padding: 8px; border: 1px solid rgba(190,201,193,0.5); border-radius: 8px; background: none; cursor: pointer; color: ${T.onSurfaceMuted}; transition: background 0.15s; display: flex; }
        .sk-icon-btn:hover { background: ${T.surfaceContainerLow}; }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h2 style={{ fontFamily: T.fontDisplay, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.01em", color: T.onSurface, margin: 0 }}>Projects</h2>
            <p style={{ fontFamily: T.fontBody, fontSize: "16px", color: T.onSurfaceMuted, margin: "4px 0 0", maxWidth: "480px" }}>
              Manage construction projects across all branches. {kpi?.total ?? total} projects currently active.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {canCreate && (
              <Link href="/dashboard/projects/new" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px", background: T.primary, color: "#fff", border: "none", borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 1px 3px rgba(0,79,53,0.2)", whiteSpace: "nowrap" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span> New Project
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Grid (Dynamic from DB) ──────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
        <KpiCard
          icon="engineering"
          iconBg={T.primaryLight}
          iconColor={T.primary}
          badge={`+${kpi?.active ?? 0}`}
          badgeColor={T.primary}
          badgeIcon="trending_up"
          label="Active Projects"
          value={String(kpi?.active ?? "—")}
        />
        <KpiCard
          icon="payments"
          iconBg={T.secondaryContainer}
          iconColor="#5a6278"
          badge="Total"
          badgeColor={T.onSurfaceMuted}
          badgeIcon="account_balance"
          label="Total Budget"
          value={kpi?.totalBudget ? formatCurrency(kpi.totalBudget) : "—"}
        />
        <KpiCard
          icon="speed"
          iconBg="rgba(66,69,69,0.08)"
          iconColor={T.tertiary}
          badge="Avg"
          badgeColor={T.onSurfaceMuted}
          badgeIcon="remove"
          label="Avg. Progress"
          value={kpi?.avgProgress != null ? `${kpi.avgProgress}%` : "—"}
        />
        <KpiCard
          icon="event_busy"
          iconBg="rgba(255,218,214,0.25)"
          iconColor={T.error}
          badge={kpi?.delayed ? `-${kpi.delayed}` : "0"}
          badgeColor={T.error}
          badgeIcon="arrow_downward"
          label="Delayed Projects"
          value={String(kpi?.delayed ?? 0)}
        />
      </div>

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div style={solidCard}>
        {/* Toolbar */}
        <div style={{ padding: "16px", borderBottom: `1px solid rgba(190,201,193,0.2)`, display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* View tabs + search */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", background: T.surfaceContainerLow, padding: "4px", borderRadius: "8px" }}>
              {viewTabs.map((v) => (
                <button key={v} className={`sk-view-btn ${activeView === v.toLowerCase() ? "active" : ""}`} onClick={() => setActiveView(v.toLowerCase() as any)}>
                  {v}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", fontSize: "20px", color: T.outline }}>search</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ padding: "8px 12px 8px 38px", background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.3)`, borderRadius: "8px", fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface, width: "240px", outline: "none" }}
              />
            </div>
          </div>
          {/* Filter chips */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <FilterChip
              label="Status" value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
              options={[
                { label: "All", value: "" },
                { label: "Planning", value: "PLANNING" },
                { label: "In Progress", value: "IN_PROGRESS" },
                { label: "On Hold", value: "ON_HOLD" },
                { label: "Completed", value: "COMPLETED" },
                { label: "Cancelled", value: "CANCELLED" },
              ]}
            />
            <FilterChip
              label="Branch" value={branchFilter}
              onChange={(v) => { setBranchFilter(v); setPage(1); }}
              options={[
                { label: "All", value: "" },
                ...branches.map((b) => ({ label: b.name, value: b.id })),
              ]}
            />
            <FilterChip
              label="Manager" value={managerFilter}
              onChange={(v) => { setManagerFilter(v); setPage(1); }}
              options={[
                { label: "All", value: "" },
                ...managers.map((m) => ({ label: m.name, value: m.id })),
              ]}
            />
            {hasActiveFilters && (
              <button onClick={resetFilters} style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        {activeView === "table" && (
          <>
            {loading ? (
              <div style={{ padding: "24px" }}>
                {/* Header skeleton pills */}
                <div style={{ display: "flex", gap: "24px", marginBottom: "16px", borderBottom: `1px solid ${T.outlineSoft}44`, paddingBottom: "12px" }}>
                  <Skeleton className="h-3 w-[80px]" />
                  <Skeleton className="h-3 w-[160px]" />
                  <Skeleton className="h-3 w-[110px]" />
                  <Skeleton className="h-3 w-[100px]" />
                  <Skeleton className="h-3 w-[100px]" />
                  <Skeleton className="h-3 w-[90px]" />
                </div>
                {/* Table rows skeleton */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                      <Skeleton className="h-5 w-[80px]" />
                      <Skeleton className="h-5 w-[200px]" />
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-5 w-[100px]" />
                      <Skeleton className="h-5 w-[80px]" />
                      <Skeleton className="h-5 w-[90px]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.error, display: "block", marginBottom: "8px" }}>error</span>
                <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error }}>{error}</p>
                <button onClick={fetchProjects} style={{ marginTop: "12px", padding: "8px 20px", background: T.primaryLight, color: T.primary, border: `1px solid ${T.primary}`, borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Retry</button>
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: "64px", textAlign: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>architecture</span>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.onSurface, margin: "0 0 8px" }}>No projects found</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.outline, margin: 0 }}>Try adjusting your filters or create a new project.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="sk-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Project Name</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Budget</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => (
                      <tr key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)}>
                        <td>
                          <span style={{ padding: "4px 8px", background: T.surfaceContainer, color: T.primary, fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, borderRadius: "4px" }}>
                            {p.code}
                          </span>
                        </td>
                        <td>
                          <p style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px" }}>{p.name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {p.address && (
                              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontFamily: T.fontBody, fontSize: "11px", color: T.onSurfaceMuted }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>location_on</span>
                                {p.address?.split(",")[0] || p.address}
                              </span>
                            )}
                            {p.endDate && (
                              <span style={{ display: "flex", alignItems: "center", gap: "3px", fontFamily: T.fontBody, fontSize: "11px", color: T.onSurfaceMuted }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_today</span>
                                {formatDate(p.endDate)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Avatar name={p.projectManager?.name || "?"} />
                            <span style={{ fontFamily: T.fontBody, fontSize: "14px" }}>{p.projectManager?.name || "—"}</span>
                          </div>
                        </td>
                        <td><StatusBadge status={p.status} /></td>
                        <td><ProgressBar value={p.progress || 0} /></td>
                        <td style={{ fontFamily: T.fontBody, fontSize: "14px", fontWeight: 500 }}>{formatCurrency(Number(p.budget))}</td>
                        <td style={{ textAlign: "right" }}>
                          <ActionDropdown projectId={p.id} router={router} canEdit={canEdit} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Board View */}
        {activeView === "board" && (
          <div style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", background: `rgba(239,244,255,0.4)` }}>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
              const colProjects = projects.filter((p) => p.status === key);
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h4 style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: cfg.color, margin: 0 }}>{cfg.label}</h4>
                    <span style={{ padding: "2px 8px", background: cfg.bg, color: cfg.color, borderRadius: "4px", fontFamily: T.fontLabel, fontSize: "10px", fontWeight: 700 }}>{colProjects.length}</span>
                  </div>
                  <div style={{ height: "3px", background: cfg.bg, borderRadius: "9999px", marginBottom: "8px", borderLeft: `3px solid ${cfg.color}` }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {colProjects.map((p) => (
                      <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} style={{ background: T.surfaceCard, padding: "14px", borderRadius: "12px", border: `1px solid rgba(190,201,193,0.2)`, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "box-shadow 0.15s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontFamily: T.fontLabel, fontSize: "10px", fontWeight: 700, color: T.primary, background: T.primaryLight, padding: "2px 6px", borderRadius: "4px" }}>{p.code}</span>
                        </div>
                        <h5 style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px" }}>{p.name}</h5>
                        <div style={{ marginTop: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontFamily: T.fontLabel, fontSize: "10px", fontWeight: 700, color: T.outline }}>{p.progress || 0}%</span>
                          </div>
                          <div style={{ height: "4px", background: T.surfaceContainerHigh, borderRadius: "9999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${p.progress || 0}%`, background: T.primary }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {colProjects.length === 0 && (
                      <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.outline, textAlign: "center", padding: "16px", margin: 0 }}>No projects</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {activeView === "table" && totalPages > 0 && (
          <div style={{ padding: "16px 24px", background: `rgba(239,244,255,0.3)`, borderTop: `1px solid rgba(190,201,193,0.2)`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} projects
            </p>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ minWidth: "auto", padding: "0 12px", fontFamily: T.fontLabel, fontSize: "13px" }}>Previous</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={n} className={`sk-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                );
              })}
              {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
              <button className="sk-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ minWidth: "auto", padding: "0 12px", fontFamily: T.fontLabel, fontSize: "13px" }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {drawerProject && <ProjectDrawer project={drawerProject} onClose={() => setDrawerProject(null)} router={router} />}
    </div>
  );
}
