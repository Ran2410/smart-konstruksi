"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
};

const input: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${T.outlineSoft}`,
  fontFamily: FONT_BODY,
  fontSize: "14px",
  color: T.onSurface,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const thCell: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: FONT_LABEL,
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
  fontFamily: FONT_BODY,
  fontSize: "13px",
  color: T.onSurface,
  verticalAlign: "middle",
};

type InvoiceRow = {
  id: string;
  invoiceNo: string;
  amount: number;
  paid: number;
  outstanding: number;
  status: string;
  isOverdue: boolean;
  issuedAt: string;
  dueDate: string;
  projectName: string;
  projectCode: string;
  clientName: string;
};

type FinancialReport = {
  receivables: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueCount: number;
    overdueAmount: number;
    invoiceCount: number;
    invoices: InvoiceRow[];
  };
  cashflow: {
    months: { month: string; IN: number; OUT: number }[];
    totalIn: number;
    totalOut: number;
    net: number;
  };
  filters: { from: string | null; to: string | null; branchId: string | null };
};

function formatCurrency(val: number) {
  return val.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
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
        <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: "22px", fontWeight: 700, color: T.onSurface, margin: "4px 0 0" }}>{value}</p>
        {sub && <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT: { bg: "rgba(111,122,114,0.12)", color: "#565e74" },
  SENT: { bg: "rgba(37,99,235,0.12)", color: T.info },
  PAID: { bg: "rgba(21,128,61,0.12)", color: T.success },
  OVERDUE: { bg: "rgba(186,26,26,0.1)", color: T.error },
};

function StatusBadge({ status, overdue }: { status: string; overdue?: boolean }) {
  const key = overdue ? "OVERDUE" : status;
  const s = STATUS_STYLE[key] || STATUS_STYLE.DRAFT;
  return (
    <span style={{
      display: "inline-block", padding: "4px 10px", borderRadius: "999px",
      background: s.bg, color: s.color, fontFamily: FONT_LABEL, fontSize: "11px",
      fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em",
    }}>
      {overdue ? "Overdue" : status.replace(/_/g, " ")}
    </span>
  );
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as string;

  const [activeTab, setActiveTab] = useState<"financial" | "material" | "project">("financial");
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Material report state
  const [matReport, setMatReport] = useState<any | null>(null);
  const [matLoading, setMatLoading] = useState(false);

  // Project report state
  const [projReport, setProjReport] = useState<any | null>(null);
  const [projLoading, setProjLoading] = useState(false);
  const [projChartProject, setProjChartProject] = useState<string>("");

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 6);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [branchFilter, setBranchFilter] = useState("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);

  // ── Fetch branches for filter ────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/branches?limit=100")
      .then((r) => r.json())
      .then((d) => { if (d.data) setBranches(d.data); })
      .catch(() => {});
  }, [session]);

  // ── Fetch financial report ───────────────────────────────
  const fetchReport = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (branchFilter) params.set("branchId", branchFilter);
      const res = await fetch(`/api/reports/financial?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch report");
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, branchFilter]);

  useEffect(() => { if (session) fetchReport(); }, [session, fetchReport]);

  // ── Fetch material report ────────────────────────────────
  const fetchMaterialReport = useCallback(async () => {
    setMatLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/reports/material?${params}`);
      if (!res.ok) throw new Error("Failed to fetch material report");
      const data = await res.json();
      setMatReport(data);
    } catch (err: any) {
      console.error("Material report error:", err.message);
    } finally {
      setMatLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { if (session) fetchMaterialReport(); }, [session, fetchMaterialReport]);

  // ── Fetch project report ─────────────────────────────────
  const fetchProjectReport = useCallback(async () => {
    setProjLoading(true);
    try {
      const params = new URLSearchParams();
      if (branchFilter) params.set("branchId", branchFilter);
      const res = await fetch(`/api/reports/project?${params}`);
      if (!res.ok) throw new Error("Failed to fetch project report");
      const data = await res.json();
      setProjReport(data);
      if (data.progressSeries?.length > 0) {
        setProjChartProject(data.progressSeries[0].projectId);
      }
    } catch (err: any) {
      console.error("Project report error:", err.message);
    } finally {
      setProjLoading(false);
    }
  }, [branchFilter]);

  useEffect(() => { if (session) fetchProjectReport(); }, [session, fetchProjectReport]);

  // ── Export CSV ───────────────────────────────────────────
  const exportCSV = () => {
    if (!report) return;
    const rows = report.receivables.invoices;
    const header = ["Invoice No", "Project", "Client", "Issue Date", "Due Date", "Amount", "Paid", "Outstanding", "Status"];
    const csvLines = [
      header.join(","),
      ...rows.map((r) => [
        `"${r.invoiceNo}"`,
        `"${r.projectName.replace(/"/g, '""')}"`,
        `"${r.clientName.replace(/"/g, '""')}"`,
        formatDate(r.issuedAt),
        formatDate(r.dueDate),
        r.amount,
        r.paid,
        r.outstanding,
        r.isOverdue ? "OVERDUE" : r.status,
      ].join(",")),
    ];
    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receivables-report-${dateFrom}_to_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: "financial" as const, label: "Financial", icon: "payments" },
    { key: "material" as const, label: "Material & Stock", icon: "inventory_2" },
    { key: "project" as const, label: "Project & RAB", icon: "engineering" },
  ];

  const canSeeBranchFilter = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"].includes(userRole);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "26px", fontWeight: 800, color: T.onSurface, margin: 0 }}>
          Reports
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: "6px 0 0" }}>
          Financial, material, and project analytics in one place.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${T.outlineSoft}55`, paddingBottom: "0" }}>
        {tabs.map((t) => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 16px", background: "none", border: "none",
                cursor: "pointer", fontFamily: FONT_LABEL, fontSize: "13px",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? T.primary : T.onSurfaceMuted,
                borderBottom: isActive ? `2px solid ${T.primary}` : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      {activeTab === "financial" && (
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ ...input, width: "150px" }} />
          </div>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ ...input, width: "150px" }} />
          </div>
          {canSeeBranchFilter && (
            <div>
              <label style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Branch</label>
              <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ ...input, width: "180px" }}>
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <button
            onClick={fetchReport}
            style={{
              padding: "10px 18px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: T.primary, color: "#fff", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>refresh</span>
            Apply
          </button>
          <button
            onClick={exportCSV}
            disabled={!report || report.receivables.invoices.length === 0}
            style={{
              padding: "10px 18px", borderRadius: "10px", cursor: "pointer",
              background: "#fff", color: T.primary, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600,
              border: `1px solid ${T.primary}44`, display: "flex", alignItems: "center", gap: "6px",
              opacity: !report || report.receivables.invoices.length === 0 ? 0.5 : 1,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>file_download</span>
            Export CSV
          </button>
        </div>
      )}

      {/* ── CONTENT: Financial ─────────────────────────────── */}
      {activeTab === "financial" && (
        loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ ...card, padding: "20px" }}><Skeleton className="h-24 w-full" /></div>
            ))}
          </div>
        ) : error ? (
          <div style={card}>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.error, margin: 0 }}>
              ⚠️ {error}
            </p>
          </div>
        ) : report ? (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <SummaryCard
                label="Total Receivables"
                value={formatCurrency(report.receivables.totalInvoiced)}
                sub={`${report.receivables.invoiceCount} invoices`}
                icon="receipt_long"
                color={T.info}
              />
              <SummaryCard
                label="Paid"
                value={formatCurrency(report.receivables.totalPaid)}
                sub={`${report.receivables.invoiceCount > 0 ? Math.round((report.receivables.totalPaid / report.receivables.totalInvoiced) * 100) : 0}% of total`}
                icon="check_circle"
                color={T.success}
              />
              <SummaryCard
                label="Outstanding"
                value={formatCurrency(report.receivables.totalOutstanding)}
                sub="Unpaid balance"
                icon="hourglass_empty"
                color={T.warning}
              />
              <SummaryCard
                label="Overdue"
                value={formatCurrency(report.receivables.overdueAmount)}
                sub={`${report.receivables.overdueCount} invoices past due`}
                icon="error"
                color={T.error}
              />
            </div>

            {/* Receivables table */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    Receivables List
                  </h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                    Invoices vs received payments
                  </p>
                </div>
                <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted }}>
                  {report.receivables.invoices.length} invoices
                </span>
              </div>

              {report.receivables.invoices.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, textAlign: "center", padding: "32px 0", margin: 0 }}>
                  No invoices in this period.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={thCell}>Invoice</th>
                        <th style={thCell}>Project</th>
                        <th style={thCell}>Client</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Amount</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Paid</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Outstanding</th>
                        <th style={thCell}>Due Date</th>
                        <th style={thCell}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.receivables.invoices.map((inv) => (
                        <tr key={inv.id} style={{ borderBottom: `1px solid ${T.outlineSoft}33` }}>
                          <td style={{ ...tdCell, fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600 }}>{inv.invoiceNo}</td>
                          <td style={tdCell}>
                            <div style={{ fontWeight: 600 }}>{inv.projectName}</div>
                            <div style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>{inv.projectCode}</div>
                          </td>
                          <td style={tdCell}>{inv.clientName}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{formatCurrency(inv.amount)}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: T.success }}>{formatCurrency(inv.paid)}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: inv.outstanding > 0 ? T.warning : T.onSurface }}>{formatCurrency(inv.outstanding)}</td>
                          <td style={{ ...tdCell, whiteSpace: "nowrap" }}>
                            <div>{formatDate(inv.dueDate)}</div>
                            {inv.isOverdue && (
                              <div style={{ fontFamily: FONT_LABEL, fontSize: "10px", color: T.error, fontWeight: 600 }}>
                                {Math.max(0, Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000))} days overdue
                              </div>
                            )}
                          </td>
                          <td style={tdCell}><StatusBadge status={inv.status} overdue={inv.isOverdue} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null
      )}

      {/* ── CONTENT: Material & Stok ───────────────────────── */}
      {activeTab === "material" && (
        matLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ ...card, padding: "20px" }}><Skeleton className="h-24 w-full" /></div>
            ))}
          </div>
        ) : matReport ? (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <SummaryCard
                label="Total Stock Value"
                value={formatCurrency(matReport.summary.totalValue)}
                sub={`${matReport.summary.totalMaterials} material types`}
                icon="inventory_2"
                color={T.info}
              />
              <SummaryCard
                label="Needs Reorder"
                value={String(matReport.summary.belowMinCount)}
                sub="Materials below minimum stock"
                icon="warning"
                color={T.error}
              />
              <SummaryCard
                label="Top Category"
                value={matReport.byCategory[0]?.category || "-"}
                sub={matReport.byCategory[0] ? formatCurrency(matReport.byCategory[0].value) : "No data yet"}
                icon="category"
                color={T.primary}
              />
            </div>

            {/* Valuation per category */}
            <div style={card}>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                Stock Value by Category
              </h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 16px" }}>
                Stock valuation based on average price (avgPrice)
              </p>
              {matReport.byCategory.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, textAlign: "center", padding: "32px 0", margin: 0 }}>
                  No materials yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {matReport.byCategory.map((c: any) => {
                    const pct = matReport.summary.totalValue > 0 ? (c.value / matReport.summary.totalValue) * 100 : 0;
                    return (
                      <div key={c.category}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <span style={{ fontFamily: FONT_BODY, fontSize: "13px", fontWeight: 600, color: T.onSurface }}>
                            {c.category} <span style={{ color: T.onSurfaceMuted, fontWeight: 400 }}>({c.count} item)</span>
                          </span>
                          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurface }}>
                            {formatCurrency(c.value)}
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: T.surfaceContainerLow, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 999, background: T.primary, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reorder list */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    Reorder List
                  </h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                    Materials below minimum stock — restock needed
                  </p>
                </div>
                <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted }}>
                  {matReport.reorderList.length} items
                </span>
              </div>

              {matReport.reorderList.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.success, textAlign: "center", padding: "24px 0", margin: 0 }}>
                  ✓ All materials above minimum stock
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={thCell}>Material</th>
                        <th style={thCell}>Category</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Stock</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Min</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Deficit</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matReport.reorderList.map((r: any) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${T.outlineSoft}33`, background: r.stock === 0 ? T.errorLight : "transparent" }}>
                          <td style={{ ...tdCell, fontWeight: 600 }}>{r.name}</td>
                          <td style={tdCell}>{r.category}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: r.stock === 0 ? T.error : T.warning, fontWeight: 700 }}>
                            {r.stock} {r.unit}
                          </td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{r.minStock} {r.unit}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: T.error }}>-{r.deficit}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{formatCurrency(r.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Movement per material */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    Movement per Material
                  </h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                    Total IN/OUT for period {dateFrom} to {dateTo}
                  </p>
                </div>
              </div>

              {matReport.rows.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, textAlign: "center", padding: "32px 0", margin: 0 }}>
                  No materials yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={thCell}>Material</th>
                        <th style={thCell}>Category</th>
                        <th style={thCell}>Vendor</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Stock</th>
                        <th style={{ ...thCell, textAlign: "right" }}>IN</th>
                        <th style={{ ...thCell, textAlign: "right" }}>OUT</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Avg Price</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Stock Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matReport.rows.map((r: any) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${T.outlineSoft}33` }}>
                          <td style={{ ...tdCell, fontWeight: 600 }}>
                            {r.name}
                            {r.isBelowMin && (
                              <span style={{
                                display: "inline-block", marginLeft: "8px", padding: "2px 8px", borderRadius: "999px",
                                background: T.errorLight, color: T.error, fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 600,
                              }}>LOW</span>
                            )}
                          </td>
                          <td style={tdCell}>{r.category}</td>
                          <td style={tdCell}>{r.vendor}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600 }}>
                            {r.stock} {r.unit}
                          </td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: T.success }}>
                            +{r.movement.IN}
                          </td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: T.error }}>
                            -{r.movement.OUT}
                          </td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{formatCurrency(r.avgPrice)}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600 }}>{formatCurrency(r.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null
      )}

      {/* ── CONTENT: Project & RAB ─────────────────────────── */}
      {activeTab === "project" && (
        projLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ ...card, padding: "20px" }}><Skeleton className="h-24 w-full" /></div>
            ))}
          </div>
        ) : projReport ? (
          <>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <SummaryCard
                label="Total Budget"
                value={formatCurrency(projReport.summary.totalBudget)}
                sub={`${projReport.summary.totalProjects} projects`}
                icon="account_balance_wallet"
                color={T.info}
              />
              <SummaryCard
                label="Actual Cost"
                value={formatCurrency(projReport.summary.totalActual)}
                sub="Realized spending (actualCost)"
                icon="receipt_long"
                color={T.warning}
              />
              <SummaryCard
                label="RAB Pipeline"
                value={formatCurrency(projReport.summary.totalRAB)}
                sub="Total estimate (all status)"
                icon="request_quote"
                color={T.primary}
              />
              <SummaryCard
                label="Avg Progress"
                value={`${projReport.summary.avgProgress}%`}
                sub="Across all projects"
                icon="trending_up"
                color={T.success}
              />
            </div>

            {/* Budget vs Actual per project */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    Budget vs Actual Cost
                  </h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                    Budget vs actual cost per project
                  </p>
                </div>
              </div>

              {projReport.rows.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, textAlign: "center", padding: "32px 0", margin: 0 }}>
                  No projects found.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                    <thead>
                      <tr>
                        <th style={thCell}>Project</th>
                        <th style={thCell}>Branch</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Budget</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Actual</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Variance</th>
                        <th style={thCell}>Status</th>
                        <th style={thCell}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projReport.rows.map((p: any) => {
                        const isOver = p.variance < 0;
                        const statusStyle: Record<string, { bg: string; color: string }> = {
                          PLANNING: { bg: "rgba(111,122,114,0.12)", color: "#565e74" },
                          IN_PROGRESS: { bg: "rgba(37,99,235,0.12)", color: T.info },
                          ON_HOLD: { bg: "rgba(180,83,9,0.12)", color: T.warning },
                          COMPLETED: { bg: "rgba(21,128,61,0.12)", color: T.success },
                          CANCELLED: { bg: "rgba(186,26,26,0.1)", color: T.error },
                        };
                        const ss = statusStyle[p.status] || statusStyle.PLANNING;
                        return (
                          <tr key={p.id} style={{ borderBottom: `1px solid ${T.outlineSoft}33` }}>
                            <td style={{ ...tdCell, fontWeight: 600 }}>
                              <div>{p.name}</div>
                              <div style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>{p.code}</div>
                            </td>
                            <td style={tdCell}>{p.branch}</td>
                            <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{formatCurrency(p.budget)}</td>
                            <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: isOver ? T.error : T.onSurface }}>
                              {formatCurrency(p.actualCost)}
                            </td>
                            <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px", color: isOver ? T.error : T.success, fontWeight: 600 }}>
                              {isOver ? "−" : "+"}{formatCurrency(Math.abs(p.variance))}
                            </td>
                            <td style={tdCell}>
                              <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "999px", background: ss.bg, color: ss.color, fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                {p.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td style={tdCell}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ width: 80, height: 6, borderRadius: 999, background: T.surfaceContainerLow, overflow: "hidden" }}>
                                  <div style={{ height: "100%", borderRadius: 999, background: p.progress >= 100 ? T.success : p.progress >= 50 ? T.primary : T.warning, width: `${Math.min(100, p.progress)}%` }} />
                                </div>
                                <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>{p.progress}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Progress timeline chart */}
            {projReport.progressSeries.length > 0 && (
              <div style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                      Progress Timeline
                    </h3>
                    <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                      Progress percentage from periodic reports
                    </p>
                  </div>
                  <select
                    value={projChartProject}
                    onChange={(e) => setProjChartProject(e.target.value)}
                    style={{ ...input, width: "220px" }}
                  >
                    {projReport.progressSeries.map((s: any) => (
                      <option key={s.projectId} value={s.projectId}>{s.projectName}</option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const series = projReport.progressSeries.find((s: any) => s.projectId === projChartProject) || projReport.progressSeries[0];
                  const data = series.points.map((pt: any) => ({
                    date: pt.date.slice(5), // MM-DD
                    percentage: pt.percentage,
                  }));
                  return (
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer>
                        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontFamily: FONT_LABEL, fontSize: 11, fill: T.onSurfaceMuted }}
                            axisLine={{ stroke: "#e5e7eb" }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v: number) => `${v}%`}
                            tick={{ fontFamily: FONT_LABEL, fontSize: 11, fill: T.onSurfaceMuted }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                          />
                          <Tooltip
                            formatter={(value: any, name: any) => [`${value}%`, "Progress"]}
                            labelFormatter={(label) => `Date: ${label}`}
                            contentStyle={{ borderRadius: 12, border: `1px solid ${T.outlineSoft}`, fontFamily: FONT_BODY, fontSize: 12 }}
                          />
                          <Legend formatter={() => <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: T.onSurface }}>Progress %</span>} />
                          <Line type="monotone" dataKey="percentage" stroke={T.primary} strokeWidth={2.5} dot={{ r: 4, fill: T.primary }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* RAB pipeline */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                    RAB Pipeline
                  </h3>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                    Cost estimates from RAB by status
                  </p>
                </div>
              </div>

              {/* Status summary chips */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                {Object.entries(projReport.rabByStatus).map(([status, v]: [string, any]) => (
                  <div key={status} style={{ flex: "1 1 140px", padding: "14px 16px", borderRadius: "12px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}33` }}>
                    <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      {status.replace(/_/g, " ")}
                    </p>
                    <p style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "6px 0 0" }}>
                      {formatCurrency(v.total)}
                    </p>
                    <p style={{ fontFamily: FONT_BODY, fontSize: "11px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{v.count} RAB</p>
                  </div>
                ))}
              </div>

              {projReport.rabs.length === 0 ? (
                <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, textAlign: "center", padding: "24px 0", margin: 0 }}>
                  No RAB found.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                    <thead>
                      <tr>
                        <th style={thCell}>Code</th>
                        <th style={thCell}>Title</th>
                        <th style={thCell}>Lead</th>
                        <th style={{ ...thCell, textAlign: "right" }}>Total</th>
                        <th style={thCell}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projReport.rabs.map((r: any) => (
                        <tr key={r.id} style={{ borderBottom: `1px solid ${T.outlineSoft}33` }}>
                          <td style={{ ...tdCell, fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600 }}>{r.code}</td>
                          <td style={{ ...tdCell, fontWeight: 600 }}>{r.title}</td>
                          <td style={tdCell}>{r.lead?.name || "-"}</td>
                          <td style={{ ...tdCell, textAlign: "right", fontFamily: FONT_LABEL, fontSize: "12px" }}>{formatCurrency(r.total)}</td>
                          <td style={tdCell}>
                            <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "999px", background: "rgba(111,122,114,0.12)", color: "#565e74", fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                              {r.status.replace(/_/g, " ")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null
      )}
    </div>
  );
}
