"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  primaryGlow: "rgba(0,79,53,0.12)",
  secondary: "#565e74",
  secondaryContainer: "#d7dff9",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainer: "#e5eeff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainerHigh: "#dce9ff",
  error: "#ba1a1a",
  errorContainer: "rgba(255,218,214,0.2)",
  errorLight: "rgba(186,26,26,0.08)",
  success: "#15803d",
  successBg: "rgba(220,252,231,0.6)",
  tertiary: "#424545",
  tertiaryFixed: "#e2e3e2",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const glassCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
  borderRadius: "12px",
  padding: "20px",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const ALL_ROLES = [
  "SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR",
  "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER",
  "INTERIOR_DESIGNER", "KONSULTAN", "FINANCE", "CLIENT", "VENDOR",
  "HOME_OWNER", "MANDOR", "LOGISTIK", "SURVEYOR",
];

const CAN_MANAGE_USERS = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

const ROLE_STYLES: Record<string, { color: string; bg: string }> = {
  SUPER_ADMIN:     { color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  OWNER:           { color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  BRANCH_MANAGER:  { color: T.primary, bg: T.primaryLight },
  PROJECT_MANAGER: { color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
  SITE_MANAGER:    { color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
};

function fmtRole(r: string) {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

// ── KpiCard ────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, label, value }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string | number;
}) {
  return (
    <div style={glassCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ padding: "8px", background: iconBg, borderRadius: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: iconColor, display: "block", fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>
      <p style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 4px" }}>{label}</p>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "28px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.2 }}>{value}</h3>
    </div>
  );
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, src }: { name?: string; src?: string }) {
  return src ? (
    <img src={src} alt={name} style={{ width: "36px", height: "36px", borderRadius: "9999px", border: `2px solid ${T.secondaryContainer}`, objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: "36px", height: "36px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700, color: T.onSurface }}>
      {getInitials(name)}
    </div>
  );
}

// ── RoleBadge ──────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const s = ROLE_STYLES[role] || { color: T.secondary, bg: "rgba(86,94,116,0.08)" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "9999px", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700, color: s.color, background: s.bg, whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {fmtRole(role)}
    </span>
  );
}

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "9999px", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700, color: active ? T.primary : T.error, background: active ? T.primaryLight : T.errorContainer, whiteSpace: "nowrap" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: active ? T.primary : T.error, flexShrink: 0 }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────
function FilterChip({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value)?.label || "All";
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`, borderRadius: "9999px", fontFamily: T.fontLabel, fontSize: "12px", cursor: "pointer", color: T.onSurface, whiteSpace: "nowrap" }}>
        <span style={{ color: T.onSurfaceMuted }}>{label}:</span>
        <span style={{ fontWeight: 700, color: T.primary }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: T.onSurfaceMuted }}>expand_more</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, minWidth: "160px", overflow: "hidden", maxHeight: "240px", overflowY: "auto" }}>
            {options.map(o => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: o.value === value ? T.primaryLight : "none", border: "none", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: o.value === value ? 700 : 400, color: o.value === value ? T.primary : T.onSurface, cursor: "pointer" }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── ActionDropdown ─────────────────────────────────────────────────────────
function ActionDropdown({ userId, userName, router, onDeleted }: {
  userId: string; userName: string; router: any; onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleDelete = async () => {
    setDeleting(true); setDelError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete user");
      }
      setShowDel(false); setOpen(false); onDeleted();
    } catch (err: any) { setDelError(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: T.onSurfaceMuted, borderRadius: "8px", display: "inline-flex", lineHeight: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
          <div style={{ position: "absolute", top: "100%", right: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: "160px", overflow: "hidden" }}>
            <button onClick={() => { setOpen(false); router.push(`/dashboard/users/${userId}`); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px", background: "none", border: "none", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 400, color: T.onSurface, cursor: "pointer", transition: "background 0.12s ease" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.primaryLight)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted }}>edit</span> Edit User
            </button>
            <button onClick={() => { setOpen(false); setShowDel(true); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px", background: "none", border: "none", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 400, color: T.error, cursor: "pointer", transition: "background 0.12s ease" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.errorContainer)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span> Delete User
            </button>
          </div>
        </>
      )}
      {showDel && (
        <>
          <div onClick={() => setShowDel(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", zIndex: 100 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: T.surfaceCard, borderRadius: "16px", padding: "28px", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", zIndex: 101, maxWidth: "400px", width: "90%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: T.errorContainer, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.error }}>delete_forever</span>
              </div>
              <div>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "17px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Delete User</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>This cannot be undone.</p>
              </div>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceVariant, margin: "0 0 6px", lineHeight: 1.5 }}>
              Remove <strong>{userName}</strong> and all associated data permanently?
            </p>
            {delError && <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.error, margin: "0 0 12px" }}>{delError}</p>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowDel(false)} disabled={deleting}
                style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: T.onSurface, cursor: deleting ? "not-allowed" : "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", background: T.error, border: "none", borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: "#fff", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const canManage = CAN_MANAGE_USERS.includes(userRole || "");

  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [kpiActive, setKpiActive] = useState<number | null>(null);
  const [kpiInactive, setKpiInactive] = useState<number | null>(null);
  const [kpiRoles, setKpiRoles] = useState<number | null>(null);
  const limit = 10;

  // ── Fetch branches ──
  useEffect(() => {
    if (!session) return;
    fetch("/api/branches?limit=100", { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.data) setBranches(d.data); })
      .catch(() => {});
  }, [session]);

  // ── Fetch users ──
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    if (branchFilter) params.set("branchId", branchFilter);
    if (activeFilter) params.set("isActive", activeFilter);
    try {
      const res = await fetch(`/api/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setUsers(d.data || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total ?? 0);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, branchFilter, activeFilter]);

  useEffect(() => { if (session) fetchUsers(); }, [session, fetchUsers]);

  // ── Fetch KPI ──
  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch("/api/users?isActive=true&limit=1", { credentials: "include" }).then(r => r.json()),
      fetch("/api/users?isActive=false&limit=1", { credentials: "include" }).then(r => r.json()),
      fetch("/api/users?limit=1000", { credentials: "include" }).then(r => r.json()),
    ]).then(([active, inactive, all]) => {
      setKpiActive(active.pagination?.total ?? 0);
      setKpiInactive(inactive.pagination?.total ?? 0);
      setKpiRoles(new Set((all.data || []).map((u: any) => u.role)).size);
    }).catch(() => {});
  }, [session]);

  // ── Debounce search ──
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setRoleFilter(""); setBranchFilter(""); setActiveFilter(""); setPage(1);
  };
  const hasActiveFilters = !!(roleFilter || branchFilter || activeFilter || search);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th { text-align: left; padding: 12px 20px; font-family: ${T.fontLabel}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.onSurfaceMuted}; background: ${T.surfaceContainerLow}; border-bottom: 1px solid ${T.outlineSoft}33; }
        .sk-table td { padding: 14px 20px; font-family: ${T.fontBody}; font-size: 14px; color: ${T.onSurface}; border-bottom: 1px solid ${T.outlineSoft}22; vertical-align: middle; }
        .sk-table tbody tr { transition: background 0.12s ease; }
        .sk-table tbody tr:hover { background: ${T.surfaceContainerLow}; }
        .sk-table tbody tr:last-child td { border-bottom: none; }
        .sk-page-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid ${T.outlineSoft}66; border-radius: 8px; background: ${T.surfaceCard}; color: ${T.onSurfaceVariant}; font-family: ${T.fontLabel}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; line-height: 1; }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: T.onSurface, margin: 0 }}>Users</h2>
          <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Manage user accounts and access permissions.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/users/new"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 6px rgba(0,79,53,0.25)", transition: "all 0.15s ease" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span> Add User
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
        <KpiCard icon="manage_accounts" iconBg={T.primaryLight} iconColor={T.primary} label="Total Users" value={total !== null ? String(total) : "—"} />
        <KpiCard icon="person_check" iconBg={T.successBg} iconColor={T.success} label="Active Users" value={kpiActive !== null ? String(kpiActive) : "—"} />
        <KpiCard icon="person_off" iconBg={T.errorContainer} iconColor={T.error} label="Inactive Users" value={kpiInactive !== null ? String(kpiInactive) : "—"} />
        <KpiCard icon="admin_panel_settings" iconBg="rgba(37,99,235,0.08)" iconColor="#2563eb" label="Roles" value={kpiRoles !== null ? String(kpiRoles) : "—"} />
      </div>

      {/* Table Card */}
      <div style={card}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.outlineSoft}22`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: T.onSurfaceMuted, pointerEvents: "none" }}>search</span>
              <input type="text" placeholder="Search users…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 40px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          {/* Filters */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <FilterChip label="Role" value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }}
              options={[{ label: "All", value: "" }, ...ALL_ROLES.map(r => ({ label: fmtRole(r), value: r }))]} />
            <FilterChip label="Branch" value={branchFilter} onChange={v => { setBranchFilter(v); setPage(1); }}
              options={[{ label: "All", value: "" }, ...branches.map(b => ({ label: b.name, value: b.id }))]} />
            <FilterChip label="Status" value={activeFilter} onChange={v => { setActiveFilter(v); setPage(1); }}
              options={[{ label: "All", value: "" }, { label: "Active", value: "true" }, { label: "Inactive", value: "false" }]} />
            {hasActiveFilters && (
              <button onClick={resetFilters}
                style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <div style={{ display: "inline-block", width: "28px", height: "28px", border: `3px solid ${T.outlineSoft}44`, borderTopColor: T.primary, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: "12px 0 0" }}>Loading users…</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>group_off</span>
            <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 6px" }}>No users found</h3>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: "0 0 20px" }}>Try adjusting your filters or add a new user.</p>
            {canManage && (
              <Link href="/dashboard/users/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", background: T.primary, color: "#fff", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span> Add User
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sk-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th style={{ width: "60px", textAlign: "right" }} />
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ cursor: "default" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Avatar name={u.name} src={u.avatar} />
                        <div>
                          <p style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600, color: T.onSurface, margin: 0, lineHeight: 1.3 }}>{u.name || "—"}</p>
                          <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted, margin: "1px 0 0" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceVariant }}>{u.branch?.name || "—"}</td>
                    <td><StatusBadge active={u.isActive} /></td>
                    <td style={{ fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurfaceMuted }}>{fmtDate(u.lastLogin)}</td>
                    <td style={{ fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurfaceMuted }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <ActionDropdown userId={u.id} userName={u.name || u.email} router={router} onDeleted={() => fetchUsers()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && users.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.outlineSoft}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
              Showing {Math.min((page - 1) * limit + 1, total || 0)}–{Math.min(page * limit, total || 0)} of {total || 0}
            </p>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ padding: "0 12px" }}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={n} className={`sk-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>;
              })}
              {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
              <button className="sk-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: "0 12px" }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
