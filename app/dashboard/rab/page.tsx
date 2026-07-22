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
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainer: "#e5eeff",
  surfaceContainerLow: "#eff4ff",
  error: "#ba1a1a",
  errorLight: "rgba(186,26,26,0.08)",
  success: "#15803d",
  successBg: "rgba(220,252,231,0.6)",
  warning: "#b76e00",
  warningBg: "rgba(255,237,213,0.6)",
  muted: "#6f7a72",
  mutedBg: "rgba(111,122,114,0.1)",
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

const thCell: React.CSSProperties = {
  padding: "14px 16px",
  fontFamily: T.fontLabel,
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: T.onSurfaceMuted,
  textAlign: "left" as const,
  borderBottom: `1px solid ${T.outlineSoft}44`,
  whiteSpace: "nowrap",
};

const tdCell: React.CSSProperties = {
  padding: "14px 16px",
  fontFamily: T.fontBody,
  fontSize: "13px",
  color: T.onSurface,
  borderBottom: `1px solid ${T.outlineSoft}22`,
  verticalAlign: "middle",
};

const rowHover: React.CSSProperties = {
  cursor: "pointer",
  transition: "background 0.15s",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const CAN_MANAGE_RAB = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "ADMIN_KANTOR"];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(n: string | number | null | undefined) {
  if (n == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n));
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: T.mutedBg, color: T.muted, label: "Draft" },
    PENDING_APPROVAL: { bg: T.warningBg, color: T.warning, label: "Pending" },
    APPROVED: { bg: T.successBg, color: T.success, label: "Approved" },
    REJECTED: { bg: T.errorLight, color: T.error, label: "Rejected" },
  };
  const c = config[status] || config.DRAFT;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "20px",
      background: c.bg, color: c.color,
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color }} />
      {c.label}
    </span>
  );
}

// ── KpiCard ────────────────────────────────────────────────────────────────
function KpiCard({ icon, iconBg, iconColor, label, value }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string | number;
}) {
  return (
    <div style={{
      background: `rgba(255,255,255,0.7)`, backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
      borderRadius: "12px", padding: "20px",
    }}>
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

// ── Pagination ────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const btn: React.CSSProperties = {
    padding: "6px 14px", borderRadius: "8px", border: `1px solid ${T.outlineSoft}55`,
    background: T.surfaceCard, fontFamily: T.fontLabel, fontSize: "12px",
    cursor: "pointer", color: T.onSurface, transition: "all 0.15s",
  };
  const activeBtn: React.CSSProperties = { ...btn, background: T.primary, color: "#fff", borderColor: T.primary };
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "24px" }}>
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} style={btn}>‹ Prev</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onPage(p)} style={p === page ? activeBtn : btn}>{p}</button>
      ))}
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} style={btn}>Next ›</button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RABPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role || "";
  const canManage = CAN_MANAGE_RAB.includes(role);

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/rab?${params}`, { credentials: "include" });
      const json = await res.json();
      setData(json.data || []);
      setTotalPages(json.totalPages || 1);
      setTotal(json.total || 0);
    } catch (e) {
      console.error("Fetch RAB error:", e);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  // ── Stats ──
  const draftCount = data.filter((r) => r.status === "DRAFT").length;
  const pendingCount = data.filter((r) => r.status === "PENDING_APPROVAL").length;
  const approvedCount = data.filter((r) => r.status === "APPROVED").length;
  const totalValue = data.reduce((s, r) => s + Number(r.total), 0);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>RAB</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Rencana Anggaran Biaya — {total} total
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/rab/new" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 20px", borderRadius: "12px",
            background: T.primary, color: "#fff",
            fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
            textDecoration: "none", transition: "all 0.15s",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New RAB
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <KpiCard icon="description" iconBg={T.mutedBg} iconColor={T.onSurfaceMuted} label="Draft" value={draftCount} />
        <KpiCard icon="hourglass_top" iconBg={T.warningBg} iconColor={T.warning} label="Pending Approval" value={pendingCount} />
        <KpiCard icon="check_circle" iconBg={T.successBg} iconColor={T.success} label="Approved" value={approvedCount} />
        <KpiCard icon="payments" iconBg={T.primaryLight} iconColor={T.primary} label="Total Value" value={fmtCurrency(totalValue)} />
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: "1 1 240px", position: "relative" }}>
          <span className="material-symbols-outlined" style={{
            position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
            fontSize: "18px", color: T.onSurfaceMuted, pointerEvents: "none",
          }}>search</span>
          <input
            placeholder="Search RAB..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 12px 10px 38px", borderRadius: "10px",
              border: `1px solid ${T.outlineSoft}55`, fontFamily: T.fontBody, fontSize: "13px",
              color: T.onSurface, background: T.surfaceCard, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: "10px 14px", borderRadius: "10px", border: `1px solid ${T.outlineSoft}55`,
            fontFamily: T.fontBody, fontSize: "13px", color: T.onSurface,
            background: T.surfaceCard, cursor: "pointer", outline: "none",
          }}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_APPROVAL">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: "24px" }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ height: "48px", marginBottom: "8px", borderRadius: "8px", background: `linear-gradient(90deg, ${T.outlineSoft}22 25%, ${T.outlineSoft}44 50%, ${T.outlineSoft}22 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", color: T.onSurfaceMuted }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", opacity: 0.3, marginBottom: "12px" }}>description</span>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", margin: 0 }}>No RAB found. Create your first RAB from a lead.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thCell}>Code</th>
                  <th style={thCell}>Title</th>
                  <th style={thCell}>Lead</th>
                  <th style={thCell}>Items</th>
                  <th style={thCell}>Total</th>
                  <th style={thCell}>Version</th>
                  <th style={thCell}>Status</th>
                  <th style={thCell}>Created</th>
                </tr>
              </thead>
              <tbody>
                {data.map((rab) => (
                  <tr key={rab.id} style={rowHover}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => router.push(`/dashboard/rab/${rab.id}`)}
                  >
                    <td style={{ ...tdCell, fontFamily: T.fontLabel, fontSize: "12px", color: T.primary, fontWeight: 600 }}>{rab.code}</td>
                    <td style={{ ...tdCell, fontWeight: 500 }}>{rab.title}</td>
                    <td style={{ ...tdCell, color: T.onSurfaceVariant }}>{rab.lead?.name || "—"}</td>
                    <td style={tdCell}>
                      <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted }}>
                        {rab._count?.items || 0} items
                      </span>
                    </td>
                    <td style={{ ...tdCell, fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600 }}>{fmtCurrency(rab.total)}</td>
                    <td style={{ ...tdCell, fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted }}>v{rab.version}</td>
                    <td style={tdCell}><StatusBadge status={rab.status} /></td>
                    <td style={{ ...tdCell, color: T.onSurfaceMuted, fontSize: "12px" }}>{fmtDate(rab.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
