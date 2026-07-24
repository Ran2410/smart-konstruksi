"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

const T = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  success: "#15803d",
  successBg: "#f0fdf4",
  warning: "#b76e00",
  warningBg: "#fff7ed",
  error: "#ba1a1a",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${T.outlineSoft}`,
  fontFamily: T.fontBody,
  fontSize: "14px",
  color: T.onSurface,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const thCell: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: "'Geist', monospace",
  fontSize: "11px",
  fontWeight: 600,
  color: T.onSurfaceMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: T.surfaceContainerLow,
  textAlign: "left",
  borderBottom: `2px solid ${T.outlineSoft}44`,
  whiteSpace: "nowrap",
};

const tdCell: React.CSSProperties = {
  padding: "14px 16px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "13px",
  color: T.onSurface,
  verticalAlign: "middle",
};

const rowHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.backgroundColor = "#f8fafc"; },
  onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => { e.currentTarget.style.backgroundColor = "transparent"; },
};

type Tx = {
  id: string;
  type: string;
  qty: number;
  price: number;
  totalCost: number;
  date: string;
  notes: string | null;
  purpose: string;
  material: { id: string; name: string; unit: string };
  project: { id: string; name: string; code: string } | null;
};

export default function TransactionsPage() {
  const { data: session } = useSession();
  const canDelete = ["SUPER_ADMIN", "OWNER"].includes(session?.user?.role as string);

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [materialIdFilter, setMaterialIdFilter] = useState("");
  const [materialOptions, setMaterialOptions] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTxs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (materialIdFilter) params.set("materialId", materialIdFilter);
      params.set("page", String(page));
      params.set("limit", "50");

      const [txRes, matRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch("/api/materials?limit=500"),
      ]);
      const txJson = await txRes.json();
      const matJson = await matRes.json();
      setTransactions(txJson.data || []);
      setTotalPages(txJson.pagination?.totalPages || 0);
      setTotal(txJson.pagination?.total || 0);
      if (matJson.data) setMaterialOptions(matJson.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [typeFilter, materialIdFilter, page]);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);
  useEffect(() => { setPage(1); }, [typeFilter, materialIdFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction? Stock will be reversed.")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error || "Failed"); return; }
    fetchTxs();
  };

  const formatCurrency = (val: number) => val.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
  const formatDate = (d: string) => new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Transaction History</h1>
        <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "14px", margin: "4px 0 0" }}>All material stock movements — purchases &amp; usage</p>
      </div>

      {/* Filters */}
      <div style={{ ...card, padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ ...input, maxWidth: "140px" }}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>
        <select value={materialIdFilter} onChange={(e) => setMaterialIdFilter(e.target.value)} style={{ ...input, maxWidth: "280px" }}>
          <option value="">All Materials</option>
          {materialOptions.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <span style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "13px" }}>{transactions.length} entries</span>
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {/* Header skeleton pills */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${T.outlineSoft}44` }}>
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            {/* Table rows skeleton */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <Skeleton className="h-5 w-[110px]" />
                  <Skeleton className="h-5 w-[50px]" />
                  <Skeleton className="h-5 w-[120px]" />
                  <Skeleton className="h-5 w-[50px]" />
                  <Skeleton className="h-5 w-[90px]" />
                  <Skeleton className="h-5 w-[90px]" />
                  <Skeleton className="h-5 w-[80px]" />
                </div>
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody }}>No transactions yet.</p>
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thCell}>Date</th>
                  <th style={{ ...thCell, textAlign: "center" }}>Type</th>
                  <th style={thCell}>Material</th>
                  <th style={{ ...thCell, textAlign: "right" }}>Qty</th>
                  <th style={{ ...thCell, textAlign: "right" }}>Price</th>
                  <th style={{ ...thCell, textAlign: "right" }}>Total</th>
                  <th style={thCell}>Project</th>
                  <th style={thCell}>Purpose</th>
                  <th style={thCell}>Notes</th>
                  {canDelete && <th style={{ ...thCell, textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} {...rowHover}>
                    <td style={tdCell}><span style={{ fontFamily: "'Geist', monospace", fontSize: "12px", color: T.onSurface }}>{formatDate(tx.date)}</span></td>
                    <td style={{ ...tdCell, textAlign: "center" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontFamily: T.fontLabel, fontWeight: 600, display: "inline-block",
                        background: tx.type === "IN" ? T.successBg : T.warningBg,
                        color: tx.type === "IN" ? T.success : T.warning,
                      }}>{tx.type === "IN" ? "IN" : "OUT"}</span>
                    </td>
                    <td style={tdCell}><span style={{ fontWeight: 600, fontSize: "13px" }}>{tx.material.name}</span></td>
                    <td style={{ ...tdCell, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontWeight: 600, color: tx.type === "IN" ? T.success : T.warning }}>
                        {tx.type === "IN" ? "+" : "-"}{tx.qty}
                      </span>
                      <span style={{ color: T.onSurfaceMuted, fontSize: "12px" }}> {tx.material.unit}</span>
                    </td>
                    <td style={{ ...tdCell, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "12px", color: T.onSurfaceMuted }}>
                        {tx.price ? formatCurrency(Number(tx.price)) : "—"}
                      </span>
                    </td>
                    <td style={{ ...tdCell, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "13px", fontWeight: 700, color: T.onSurface }}>
                        {formatCurrency(Number(tx.totalCost))}
                      </span>
                    </td>
                    <td style={tdCell}>
                      {tx.project
                        ? <span style={{ fontFamily: "'Geist', monospace", fontSize: "12px", color: T.primary }}>{tx.project.code}</span>
                        : <span style={{ color: T.onSurfaceMuted, fontSize: "12px" }}>—</span>
                      }
                    </td>
                    <td style={tdCell}>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontFamily: T.fontLabel, fontWeight: 600, display: "inline-block",
                        background: tx.purpose === "PURCHASE" ? T.primaryLight : tx.purpose === "OPERATIONAL" ? "#f0f0ff" : tx.purpose === "PROJECT_USAGE" ? T.warningBg : T.surfaceContainerLow,
                        color: tx.purpose === "PURCHASE" ? T.primary : tx.purpose === "OPERATIONAL" ? "#5555cc" : tx.purpose === "PROJECT_USAGE" ? T.warning : T.onSurfaceVariant,
                      }}>{tx.purpose?.replace(/_/g, ' ') || "—"}</span>
                    </td>
                    <td style={tdCell}>
                      <span style={{ color: tx.notes ? T.onSurface : T.onSurfaceMuted, fontSize: "12px" }}>{tx.notes || "—"}</span>
                    </td>
                    {canDelete && (
                      <td style={{ ...tdCell, textAlign: "right" }}>
                        <button onClick={() => handleDelete(tx.id)} style={{
                          background: "transparent", border: `1px solid ${T.error}44`, borderRadius: "8px",
                          padding: "4px 10px", fontFamily: "'Geist', monospace", fontSize: "11px", fontWeight: 500,
                          color: T.error, cursor: "pointer",
                        }} onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                        >Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 0 && total > 0 && (
              <div style={{ padding: "16px 0 0", borderTop: `1px solid rgba(190,201,193,0.2)`, marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
                  Showing {Math.min((page - 1) * 50 + 1, total)} to {Math.min(page * 50, total)} of {total} transactions
                </p>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: "auto", height: "34px", padding: "0 12px",
                    border: `1px solid rgba(190,201,193,0.5)`, borderRadius: "8px",
                    background: "#fff", color: T.onSurfaceVariant,
                    fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
                    cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1,
                    transition: "all 0.15s",
                  }} onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                    onMouseLeave={(e) => { if (page > 1) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                  >← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button key={n} onClick={() => setPage(n)} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: "34px", height: "34px", padding: "0 8px",
                        border: `1px solid ${page === n ? T.primary : "rgba(190,201,193,0.5)"}`, borderRadius: "8px",
                        background: page === n ? T.primary : "#fff",
                        color: page === n ? "#fff" : T.onSurfaceVariant,
                        fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s", lineHeight: 1,
                      }} onMouseEnter={(e) => { if (page !== n) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                        onMouseLeave={(e) => { if (page !== n) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                      >{n}</button>
                    );
                  })}
                  {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: "auto", height: "34px", padding: "0 12px",
                    border: `1px solid rgba(190,201,193,0.5)`, borderRadius: "8px",
                    background: "#fff", color: T.onSurfaceVariant,
                    fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
                    cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1,
                    transition: "all 0.15s",
                  }} onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                    onMouseLeave={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
