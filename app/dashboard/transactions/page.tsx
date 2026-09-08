"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useAppDialog } from "@/components/app-dialog-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

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

type Tx = {
  id: string;
  type: string;
  qty: number;
  price: number;
  totalCost: number;
  date: string;
  notes: string | null;
  purpose: string;
  reversedAt: string | null;
  reversalOfId: string | null;
  reversalReason: string | null;
  material: { id: string; name: string; unit: string };
  project: { id: string; name: string; code: string } | null;
};

type Summary = {
  totalTransactions: number;
  totalCost: number;
  totalIn: number;
  totalInCount: number;
  totalOut: number;
  totalOutCount: number;
  net: number;
};

type MonthlyData = {
  month: string;
  IN: number;
  OUT: number;
};

function formatCurrency(val: number) {
  return val.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
}

function getMonthLabel(month: string) {
  const d = new Date(month + "-01");
  return d.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

// ── Summary Card ──────────────────────────────────────────────────────────
function SummaryCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: string; color: string;
}) {
  return (
    <div style={{
      background: T.surfaceCard, borderRadius: "14px",
      border: `1px solid rgba(190,201,193,0.2)`,
      padding: "20px", display: "flex", alignItems: "flex-start", gap: "14px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "12px",
        background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 700, color: T.onSurface, margin: "4px 0 0" }}>{value}</p>
        {sub && <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { data: session } = useSession();
  const { requestText } = useAppDialog();
  const canReverse = ["SUPER_ADMIN", "OWNER"].includes(session?.user?.role as string);

  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [materialIdFilter, setMaterialIdFilter] = useState("");
  const [materialOptions, setMaterialOptions] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Report state
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [topMaterials, setTopMaterials] = useState<any[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

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

  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/transactions/summary?from=${dateFrom}&to=${dateTo}`);
      const json = await res.json();
      if (json.data) {
        setSummary(json.data.summary);
        setMonthly(json.data.monthly || []);
        setTopMaterials(json.data.topMaterials || []);
      }
    } catch (e) { console.error(e); }
    finally { setReportLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void fetchTxs());
    return () => cancelAnimationFrame(frame);
  }, [fetchTxs]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => void fetchReport());
    return () => cancelAnimationFrame(frame);
  }, [fetchReport]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setPage(1));
    return () => cancelAnimationFrame(frame);
  }, [typeFilter, materialIdFilter]);

  const handleReverse = async (id: string) => {
    const reason = await requestText({
      title: "Reverse transaction?",
      description: "A linked opposite transaction will be created to preserve the audit trail.",
      label: "Reversal reason",
      placeholder: "Explain why this transaction needs to be reversed",
      actionLabel: "Reverse transaction",
      minLength: 3,
      validationMessage: "Enter a reason of at least 3 characters.",
    });
    if (reason === null) return;
    const res = await fetch(`/api/transactions/${id}/reverse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to reverse transaction.");
      return;
    }
    fetchTxs();
    fetchReport();
    toast.success("Transaction reversed.");
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: "28px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
          Transaction Reports
        </h1>
        <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "14px", margin: "4px 0 0" }}>
          Overview and history of all material stock movements
        </p>
      </div>

      {/* ── Date Range ─────────────────────────────────────────────────── */}
      <div style={{ ...card, padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <label style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, display: "flex", alignItems: "center", gap: "8px" }}>
          From
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            style={{ ...input, maxWidth: "160px", padding: "8px 12px" }} />
        </label>
        <label style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, display: "flex", alignItems: "center", gap: "8px" }}>
          To
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            style={{ ...input, maxWidth: "160px", padding: "8px 12px" }} />
        </label>
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      {reportLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ ...card, padding: "20px" }}><Skeleton className="h-16 w-full" /></div>
          ))}
        </div>
      ) : summary ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <SummaryCard label="Total Transactions" value={String(summary.totalTransactions)} icon="receipt_long" color={T.primary} />
          <SummaryCard label="Total Stock In" value={formatCurrency(summary.totalIn)} sub={`${summary.totalInCount} transactions`} icon="inventory" color="#2563eb" />
          <SummaryCard label="Total Stock Out" value={formatCurrency(summary.totalOut)} sub={`${summary.totalOutCount} transactions`} icon="output" color={T.warning} />
          <SummaryCard label="Net Movement" value={formatCurrency(summary.net)} icon="account_balance" color={summary.net >= 0 ? T.success : T.error} />
          <SummaryCard label="Total Cost" value={formatCurrency(summary.totalCost)} icon="payments" color="#7c3aed" />
        </div>
      ) : null}

      {/* ── Monthly Chart ─────────────────────────────────────────────── */}
      {reportLoading ? (
        <div style={{ ...card, marginBottom: "16px", padding: "24px" }}>
          <Skeleton className="h-[240px] w-full" />
        </div>
      ) : monthly.length > 0 ? (
        <div style={{ ...card, marginBottom: "16px" }}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 600, color: T.onSurface, margin: "0 0 16px" }}>
            Monthly IN / OUT Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthly} barGap={0} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={T.outlineSoft} />
              <XAxis
                dataKey="month"
                tickFormatter={getMonthLabel}
                tick={{ fontSize: 11, fontFamily: T.fontLabel, fill: T.onSurfaceMuted }}
                axisLine={{ stroke: T.outlineSoft }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                tick={{ fontSize: 11, fontFamily: T.fontLabel, fill: T.onSurfaceMuted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => getMonthLabel(label)}
                contentStyle={{
                  borderRadius: "10px", border: `1px solid ${T.outlineSoft}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", fontFamily: T.fontBody }}
              />
              <Bar dataKey="IN" name="Stock In" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="OUT" name="Stock Out" fill={T.warning} radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "16px" }}>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 600, color: T.onSurface, margin: "0 0 12px" }}>Transaction History</h3>
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
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${T.outlineSoft}44` }}>
              <Skeleton className="h-3 w-[100px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
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
                    {canReverse && <th style={{ ...thCell, textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ opacity: tx.reversedAt || tx.reversalOfId ? 0.62 : 1 }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={tdCell}><span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurface }}>{new Date(tx.date).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
                      <td style={{ ...tdCell, textAlign: "center" }}>
                        <span style={{
                          padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontFamily: T.fontLabel, fontWeight: 600, display: "inline-block",
                          background: tx.type === "IN" ? T.successBg : T.warningBg,
                          color: tx.type === "IN" ? T.success : T.warning,
                        }}>{tx.type === "IN" ? "IN" : "OUT"}</span>
                        {(tx.reversedAt || tx.reversalOfId) && (
                          <span style={{ display: "block", marginTop: "4px", fontSize: "9px", color: T.onSurfaceMuted }}>
                            {tx.reversalOfId ? "REVERSAL" : "REVERSED"}
                          </span>
                        )}
                      </td>
                      <td style={tdCell}><span style={{ fontWeight: 600, fontSize: "13px" }}>{tx.material.name}</span></td>
                      <td style={{ ...tdCell, textAlign: "right" }}>
                        <span style={{ fontFamily: T.fontLabel, fontWeight: 600, color: tx.type === "IN" ? T.success : T.warning }}>
                          {tx.type === "IN" ? "+" : "-"}{tx.qty}
                        </span>
                        <span style={{ color: T.onSurfaceMuted, fontSize: "12px" }}> {tx.material.unit}</span>
                      </td>
                      <td style={{ ...tdCell, textAlign: "right" }}>
                        <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted }}>
                          {tx.price ? formatCurrency(Number(tx.price)) : "—"}
                        </span>
                      </td>
                      <td style={{ ...tdCell, textAlign: "right" }}>
                        <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 700, color: T.onSurface }}>
                          {formatCurrency(Number(tx.totalCost))}
                        </span>
                      </td>
                      <td style={tdCell}>
                        {tx.project
                          ? <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.primary }}>{tx.project.code}</span>
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
                      {canReverse && (
                        <td style={{ ...tdCell, textAlign: "right" }}>
                          {!tx.reversedAt && !tx.reversalOfId ? <button onClick={() => handleReverse(tx.id)} style={{
                            background: "transparent", border: `1px solid ${T.error}44`, borderRadius: "8px",
                            padding: "4px 10px", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 500,
                            color: T.error, cursor: "pointer",
                          }} onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          >Reverse</button> : <span style={{ fontSize: "11px", color: T.onSurfaceMuted }}>Locked</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  }}>← Prev</button>
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
                        cursor: "pointer",
                      }}>{n}</button>
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
                  }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
