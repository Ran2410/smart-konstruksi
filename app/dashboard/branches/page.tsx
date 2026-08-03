"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
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
const CAN_CREATE = ["SUPER_ADMIN", "OWNER"];

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
      <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 4px" }}>{label}</p>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "28px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.2 }}>{value}</h3>
    </div>
  );
}

// ── ActionDropdown ─────────────────────────────────────────────────────────
function ActionDropdown({ branchId, branchName, router, onDeleted }: {
  branchId: string; branchName: string; router: any; onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
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
      const res = await fetch(`/api/branches/${branchId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete branch");
      }
      setShowDel(false); setOpen(false); onDeleted();
    } catch (err: any) { setDelError(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={(e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
        setOpen(!open);
      }}
        style={{ padding: "6px", background: "none", border: "none", cursor: "pointer", color: T.onSurfaceMuted, borderRadius: "8px", display: "inline-flex", lineHeight: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
          <div style={{ position: "fixed", top: menuPos.top + "px", right: menuPos.right + "px", background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, minWidth: "160px", overflow: "hidden" }}>
            <button onClick={() => { setOpen(false); router.push(`/dashboard/branches/${branchId}`); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px", background: "none", border: "none", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 400, color: T.onSurface, cursor: "pointer", transition: "background 0.12s ease" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.primaryLight)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted }}>edit</span> Edit Branch
            </button>
            <button onClick={() => { setOpen(false); setShowDel(true); }}
              style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px", background: "none", border: "none", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 400, color: T.error, cursor: "pointer", transition: "background 0.12s ease" }}
              onMouseEnter={e => (e.currentTarget.style.background = T.errorContainer)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span> Delete Branch
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
                <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Delete Branch</h3>
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>This cannot be undone.</p>
              </div>
            </div>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant, margin: "0 0 6px", lineHeight: 1.5 }}>
              Remove <strong>{branchName}</strong> and all of its data permanently?
            </p>
            {delError && <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.error, margin: "0 0 12px" }}>{delError}</p>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button onClick={() => setShowDel(false)} disabled={deleting}
                style={{ padding: "9px 18px", background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "8px", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: T.onSurface, cursor: deleting ? "not-allowed" : "pointer" }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: "9px 18px", background: T.error, border: "none", borderRadius: "8px", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: "#fff", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}>
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
export default function BranchesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const canCreate = CAN_CREATE.includes(userRole || "");

  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const limit = 10;

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/branches?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setBranches(d.data || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total ?? 0);
    } catch { setBranches([]); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { if (session) fetchBranches(); }, [session, fetchBranches]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetFilters = () => { setSearchInput(""); setSearch(""); setPage(1); };
  const hasActiveFilters = !!search;

  // Aggregate stats from current page
  const totalUsers = branches.reduce((s, b) => s + (b._count?.users || 0), 0);
  const totalProjects = branches.reduce((s, b) => s + (b._count?.projects || 0), 0);
  const activeBranches = branches.filter(b => b.isActive !== false).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th { text-align: left; padding: 12px 20px; font-family: ${FONT_LABEL}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.onSurfaceMuted}; background: ${T.surfaceContainerLow}; border-bottom: 1px solid ${T.outlineSoft}33; }
        .sk-table td { padding: 14px 20px; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.onSurface}; border-bottom: 1px solid ${T.outlineSoft}22; vertical-align: middle; }
        .sk-table tbody tr { transition: background 0.12s ease; }
        .sk-table tbody tr:hover { background: ${T.surfaceContainerLow}; }
        .sk-table tbody tr:last-child td { border-bottom: none; }
        .sk-page-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid ${T.outlineSoft}66; border-radius: 8px; background: ${T.surfaceCard}; color: ${T.onSurfaceVariant}; font-family: ${FONT_LABEL}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; line-height: 1; }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: T.onSurface, margin: 0 }}>Branches</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Manage company branches and locations.
          </p>
        </div>
        {canCreate && (
          <Link href="/dashboard/branches/new"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 22px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, textDecoration: "none", boxShadow: "0 2px 6px rgba(0,79,53,0.25)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span> Add Branch
          </Link>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "20px" }}>
        <KpiCard icon="domain" iconBg={T.primaryLight} iconColor={T.primary} label="Total Branches" value={total !== null ? String(total) : "—"} />
        <KpiCard icon="group" iconBg={T.secondaryContainer} iconColor="#5a6278" label="Total Users" value={String(totalUsers)} />
        <KpiCard icon="architecture" iconBg="rgba(66,69,69,0.08)" iconColor={T.tertiary} label="Total Projects" value={String(totalProjects)} />
        <KpiCard icon="check_circle" iconBg={T.successBg} iconColor={T.success} label="Active Branches" value={String(activeBranches)} />
      </div>

      {/* Table Card */}
      <div style={card}>
        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.outlineSoft}22`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: T.onSurfaceMuted, pointerEvents: "none" }}>search</span>
              <input type="text" placeholder="Search branches…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 40px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, outline: "none", boxSizing: "border-box" }} />
            </div>
            {hasActiveFilters && (
              <button onClick={resetFilters}
                style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.primary, background: T.primaryLight, border: "none", cursor: "pointer", padding: "8px 16px", borderRadius: "8px" }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {/* Skeleton header */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 20px", background: T.surfaceContainerLow, borderBottom: `1px solid ${T.outlineSoft}33` }}>
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-3 w-[140px]" />
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-3 w-12 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-3 w-20 ml-auto" />
              <Skeleton className="h-3 w-6 ml-auto" />
            </div>
            {/* Skeleton rows */}
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "14px 20px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "180px" }}>
                  <Skeleton className="h-9 w-9 rounded-[10px]" />
                  <Skeleton className="h-4 w-[120px]" />
                </div>
                <Skeleton className="h-4 w-[140px]" />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "160px" }}>
                  <Skeleton className="h-3 w-[120px]" />
                  <Skeleton className="h-3 w-[140px]" />
                </div>
                <Skeleton className="h-7 w-7 rounded-full ml-auto" />
                <Skeleton className="h-7 w-7 rounded-full ml-auto" />
                <Skeleton className="h-6 w-[68px] rounded-full ml-auto" />
                <Skeleton className="h-4 w-[90px] ml-auto" />
                <Skeleton className="h-5 w-5 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>domain_off</span>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 6px" }}>No branches found</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: "0 0 20px" }}>Get started by adding your first branch.</p>
            {canCreate && (
              <Link href="/dashboard/branches/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", background: T.primary, color: "#fff", borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span> Add Branch
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sk-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th style={{ textAlign: "center" }}>Users</th>
                  <th style={{ textAlign: "center" }}>Projects</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: "60px", textAlign: "right" }} />
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} style={{ cursor: "default" }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.primary, fontVariationSettings: "'FILL' 1" }}>domain</span>
                        </div>
                        <span style={{ fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 600, color: T.onSurface }}>{b.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant, maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {b.address || "—"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {b.phone ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.onSurfaceMuted }}>call</span> {b.phone}
                          </span>
                        ) : null}
                        {b.email ? (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.onSurfaceMuted }}>mail</span> {b.email}
                          </span>
                        ) : null}
                        {!b.phone && !b.email && <span style={{ color: T.outline, fontFamily: FONT_BODY, fontSize: "13px" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "28px", height: "28px", padding: "0 8px", borderRadius: "9999px", background: T.primaryLight, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 700, color: T.primary }}>
                        {b._count?.users || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "28px", height: "28px", padding: "0 8px", borderRadius: "9999px", background: T.surfaceContainerHigh, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 700, color: T.onSurfaceVariant }}>
                        {b._count?.projects || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "9999px", fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700, color: b.isActive !== false ? T.primary : T.error, background: b.isActive !== false ? T.primaryLight : T.errorContainer, whiteSpace: "nowrap" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: b.isActive !== false ? T.primary : T.error, flexShrink: 0 }} />
                        {b.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted }}>{fmtDate(b.createdAt)}</td>
                    <td style={{ textAlign: "right" }}>
                      <ActionDropdown branchId={b.id} branchName={b.name} router={router} onDeleted={() => fetchBranches()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && branches.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.outlineSoft}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
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
    </div>
  );
}
