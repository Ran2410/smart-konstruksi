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
const CAN_MANAGE_CLIENTS = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

// ── Display name: company name or individual name ────────────────────────
function displayName(client: any): string {
  return client.companyName || client.user?.name || "Individual";
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

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "20px",
      background: active ? T.successBg : T.errorContainer,
      color: active ? T.success : T.error,
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: active ? T.success : T.error }} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Action Menu ───────────────────────────────────────────────────────────
function ActionMenu({
  clientId,
  onDelete,
}: {
  clientId: string;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        style={{
          width: "32px", height: "32px", display: "flex", alignItems: "center",
          justifyContent: "center", background: "none", border: "none",
          borderRadius: "8px", cursor: "pointer", color: T.onSurfaceMuted,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.color = T.onSurface; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.onSurfaceMuted; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_horiz</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "100%", marginTop: "4px", zIndex: 50,
          background: T.surfaceCard, borderRadius: "12px",
          border: `1px solid ${T.outlineSoft}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          minWidth: "160px", padding: "4px",
        }}>
          <Link href={`/dashboard/clients/${clientId}`} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", textDecoration: "none",
            fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurface,
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>visibility</span>
            View Details
          </Link>
          <button onClick={() => { setOpen(false); onDelete(clientId); }} style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "8px", textDecoration: "none",
            fontFamily: T.fontLabel, fontSize: "13px", color: T.error,
            background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left",
            transition: "background 0.15s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.errorContainer + "55")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPageChange }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  const btn: React.CSSProperties = {
    padding: "8px 14px", border: `1px solid ${T.outlineSoft}`,
    borderRadius: "10px", background: T.surfaceCard, cursor: "pointer",
    fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
    color: T.onSurfaceMuted, transition: "all 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginTop: "24px" }}>
      <button style={btn} disabled={page <= 1} onClick={() => onPageChange(page - 1)}
        onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = T.outline; }}}
        onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceCard; e.currentTarget.style.borderColor = T.outlineSoft; }}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", display: "block" }}>chevron_left</span>
      </button>
      {pages.map(p => (
        <button key={p} style={{ ...btn, background: p === page ? T.primary : T.surfaceCard, color: p === page ? "#fff" : T.onSurfaceMuted, borderColor: p === page ? T.primary : T.outlineSoft }} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button style={btn} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
        onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = T.outline; }}}
        onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceCard; e.currentTarget.style.borderColor = T.outlineSoft; }}>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", display: "block" }}>chevron_right</span>
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const canManage = role && CAN_MANAGE_CLIENTS.includes(role);

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/clients?${params}`);
      const data = await res.json();
      setClients(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch { setClients([]); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const handleSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(value); setPage(1); }, 400);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client? This will also deactivate their user account.")) return;
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) { fetchClients(); }
      else { const err = await res.json(); alert(err.message || "Failed to delete"); }
    } catch { alert("Failed to delete client"); }
  };

  // KPI stats
  const activeCount = clients.filter(c => c.user?.isActive).length;
  const inactiveCount = clients.filter(c => !c.user?.isActive).length;
  const totalProjects = clients.reduce((sum, c) => sum + (c._count?.projects || 0), 0);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "26px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.2 }}>Clients</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Manage client companies and their projects
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/clients/new" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", background: T.primary, color: "#fff",
            borderRadius: "10px", textDecoration: "none",
            fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
            letterSpacing: "0.02em", transition: "all 0.15s", border: "none", cursor: "pointer",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#003d29")}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Add Client
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <KpiCard icon="groups" iconBg={T.primaryLight} iconColor={T.primary} label="Total Clients" value={total} />
        <KpiCard icon="check_circle" iconBg={T.successBg} iconColor={T.success} label="Active" value={activeCount} />
        <KpiCard icon="cancel" iconBg={T.errorContainer + "55"} iconColor={T.error} label="Inactive" value={inactiveCount} />
        <KpiCard icon="architecture" iconBg="rgba(124,58,237,0.08)" iconColor="#7c3aed" label="Total Projects" value={totalProjects} />
      </div>

      {/* Table Card */}
      <div style={{ ...card, padding: "20px 24px" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
            <span className="material-symbols-outlined" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", color: T.outline, pointerEvents: "none" }}>search</span>
            <input
              placeholder="Search by name, email or company..."
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: "100%", boxSizing: "border-box", padding: "10px 14px 10px 42px",
                background: T.surfaceContainerLow, border: `1.5px solid ${T.outlineSoft}66`,
                borderRadius: "10px", fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface,
                outline: "none", transition: "all 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = `${T.outlineSoft}66`)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} style={{
            padding: "10px 16px", background: T.surfaceContainerLow,
            border: `1.5px solid ${T.outlineSoft}66`, borderRadius: "10px",
            fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface,
            outline: "none", cursor: "pointer", minWidth: "130px",
            transition: "border-color 0.2s",
          }} onFocus={(e) => (e.currentTarget.style.borderColor = T.primary)}
            onBlur={(e) => (e.currentTarget.style.borderColor = `${T.outlineSoft}66`)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table / Loading / Empty */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: T.onSurfaceMuted }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", display: "block", marginBottom: "12px", animation: "spin 1s linear infinite" }}>sync</span>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", margin: 0 }}>Loading clients...</p>
          </div>
        ) : clients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", display: "block", marginBottom: "12px", color: `${T.outlineSoft}88`, fontVariationSettings: "'FILL' 1" }}>groups</span>
            <p style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 600, color: T.onSurface, margin: "0 0 4px" }}>
              {search || statusFilter ? "No clients found" : "No clients yet"}
            </p>
            <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: 0 }}>
              {search || statusFilter ? "Try adjusting your search or filter" : "Add your first client to get started"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.fontBody }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.outlineSoft}44` }}>
                  <th style={thStyle}>Company</th>
                  <th style={thStyle}>PIC</th>
                  <th style={thStyle}>Contact</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Projects</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Since</th>
                  <th style={{ width: "48px" }}></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: `1px solid ${T.outlineSoft}22`, transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                  >
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "10px",
                          background: T.primaryLight, display: "flex", alignItems: "center",
                          justifyContent: "center", flexShrink: 0,
                        }}>
                          <span style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.primary }}>
                            {getInitials(displayName(client))}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: T.onSurface, fontSize: "14px" }}>
                            {displayName(client)}
                          </span>
                          {!client.companyName && client.companyName !== null && (
                            <span style={{ fontFamily: T.fontLabel, fontSize: "10px", color: T.onSurfaceMuted, marginLeft: "6px" }}>
                              (Individual)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: T.onSurfaceVariant, fontSize: "13px" }}>{client.user.name}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: T.onSurface, fontSize: "13px" }}>{client.user.email}</span>
                        {client.user.phone && (
                          <span style={{ color: T.onSurfaceMuted, fontSize: "12px", fontFamily: T.fontLabel }}>{client.user.phone}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: "28px", padding: "2px 10px", borderRadius: "20px",
                        background: T.primaryLight, color: T.primary,
                        fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600,
                      }}>
                        {client._count?.projects || 0}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <StatusBadge active={client.user.isActive} />
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ color: T.onSurfaceMuted, fontSize: "12px", fontFamily: T.fontLabel }}>
                        {fmtDate(client.createdAt)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                        <ActionMenu clientId={client.id} onDelete={handleDelete} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px", fontFamily: T.fontLabel, fontSize: "11px",
  fontWeight: 600, color: T.outline, letterSpacing: "0.06em",
  textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px", fontSize: "14px", verticalAlign: "middle",
};
