"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  error: "#ba1a1a",
  warning: "#b45309",
  success: "#15803d",
  info: "#2563eb",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: "1px solid rgba(190,201,193,0.25)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
};

const thCell: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: T.fontLabel,
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
  fontFamily: T.fontBody,
  fontSize: "13px",
  color: T.onSurface,
  borderBottom: `1px solid ${T.outlineSoft}22`,
  verticalAlign: "middle",
};

const rowHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.backgroundColor = "#f8fafc";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
  },
};

const CAN_CREATE = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "#6f7a72", bg: "rgba(111,122,114,0.12)", dot: "#6f7a72" },
  SENT: { label: "Sent", color: "#2563eb", bg: "rgba(37,99,235,0.10)", dot: "#2563eb" },
  PAID: { label: "Paid", color: "#15803d", bg: "rgba(21,128,61,0.10)", dot: "#15803d" },
  OVERDUE: { label: "Overdue", color: "#ba1a1a", bg: "rgba(186,26,26,0.10)", dot: "#ba1a1a" },
};

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Sent", value: "SENT" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

function formatCurrency(amount: number | string | null | undefined) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function paidSum(payments: { amount: number | string }[] | undefined) {
  if (!payments?.length) return 0;
  return payments.reduce((s, p) => s + Number(p.amount || 0), 0);
}

function isPastDue(dueDate: string | null | undefined, status: string) {
  if (!dueDate || status === "PAID" || status === "DRAFT") return false;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: T.outline,
    bg: T.surfaceContainerLow,
    dot: T.outline,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontFamily: T.fontLabel,
        fontSize: "11px",
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────
function FilterChip({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label || "All";
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          background: T.surfaceContainerLow,
          border: `1px solid rgba(190,201,193,0.3)`,
          borderRadius: "9999px",
          fontFamily: T.fontLabel,
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        <span style={{ color: T.onSurfaceMuted }}>{label}:</span>
        <span style={{ fontWeight: 700, color: T.primary }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.onSurfaceMuted }}>
          expand_more
        </span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              background: T.surfaceCard,
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              zIndex: 10,
              minWidth: "160px",
              overflow: "hidden",
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  background: o.value === value ? T.primaryLight : "none",
                  border: "none",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: o.value === value ? 700 : 400,
                  color: o.value === value ? T.primary : T.onSurface,
                  cursor: "pointer",
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

// ── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "16px",
        }}
      >
        <div style={{ padding: "8px", background: iconBg, borderRadius: "8px" }}>
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "22px",
              color: iconColor,
              display: "block",
              fontVariationSettings: "'FILL' 1",
            }}
          >
            {icon}
          </span>
        </div>
      </div>
      <p
        style={{
          fontFamily: T.fontLabel,
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: T.onSurfaceMuted,
          margin: "0 0 4px",
        }}
      >
        {label}
      </p>
      <h3
        style={{
          fontFamily: T.fontDisplay,
          fontSize: "28px",
          fontWeight: 700,
          color: T.onSurface,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {value}
      </h3>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function InvoicesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role as string | undefined;
  const canCreate = !!(role && CAN_CREATE.includes(role));

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const limit = 10;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/invoices?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch invoices");
      const data = await res.json();
      setInvoices(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (!session) return;
    const t = requestAnimationFrame(() => {
      fetchInvoices();
    });
    return () => cancelAnimationFrame(t);
  }, [session, fetchInvoices]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const hasActiveFilters = !!(statusFilter || search);

  const draftCount = invoices.filter((i) => i.status === "DRAFT").length;
  const sentCount = invoices.filter((i) => i.status === "SENT").length;
  const paidCount = invoices.filter((i) => i.status === "PAID").length;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
  const outstanding = invoices
    .filter((i) => i.status !== "PAID")
    .reduce((sum, i) => sum + Math.max(0, Number(i.amount || 0) - paidSum(i.payments)), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-page-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 34px; height: 34px; padding: 0 8px;
          border: 1px solid rgba(190,201,193,0.5); border-radius: 8px;
          background: ${T.surfaceCard}; color: ${T.onSurfaceVariant};
          font-family: ${T.fontLabel}; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; line-height: 1;
        }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: T.onSurface,
              margin: 0,
            }}
          >
            Invoices
          </h2>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: "16px",
              color: T.onSurfaceMuted,
              margin: "4px 0 0",
              maxWidth: "480px",
            }}
          >
            Track project invoices and payment status
          </p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/invoices/new"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 22px",
              background: T.primary,
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontFamily: T.fontLabel,
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(0,79,53,0.25)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.primary)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              add
            </span>
            New Invoice
          </Link>
        )}
      </div>

      {/* KPI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        <KpiCard
          icon="receipt_long"
          iconColor={T.primary}
          iconBg={T.primaryLight}
          label="Total"
          value={total}
        />
        <KpiCard
          icon="schedule"
          iconColor={T.info}
          iconBg="rgba(37,99,235,0.10)"
          label="Sent / Draft"
          value={`${sentCount} / ${draftCount}`}
        />
        <KpiCard
          icon="check_circle"
          iconColor={T.success}
          iconBg="rgba(21,128,61,0.10)"
          label="Paid (page)"
          value={paidCount}
        />
        <KpiCard
          icon="warning"
          iconColor={overdueCount ? T.error : T.warning}
          iconBg={overdueCount ? "rgba(186,26,26,0.10)" : "rgba(180,83,9,0.10)"}
          label="Overdue / Outstanding"
          value={overdueCount}
        />
      </div>

      {outstanding > 0 && (
        <p
          style={{
            fontFamily: T.fontLabel,
            fontSize: "12px",
            color: T.onSurfaceMuted,
            margin: 0,
          }}
        >
          Outstanding on this page:{" "}
          <strong style={{ color: T.onSurface }}>{formatCurrency(outstanding)}</strong>
        </p>
      )}

      {/* Table card */}
      <div style={cardStyle}>
        <div
          style={{
            padding: "0 0 16px",
            borderBottom: `1px solid rgba(190,201,193,0.2)`,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "20px",
                  color: T.outline,
                  pointerEvents: "none",
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search invoice number..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 40px",
                  background: T.surfaceContainerLow,
                  border: `1px solid rgba(190,201,193,0.3)`,
                  borderRadius: "10px",
                  fontFamily: T.fontBody,
                  fontSize: "14px",
                  color: T.onSurface,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <FilterChip
              label="Status"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={STATUS_OPTIONS}
            />
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: T.primary,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  marginLeft: "4px",
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "24px 0" }}>
            <div
              style={{
                display: "flex",
                gap: "24px",
                marginBottom: "16px",
                borderBottom: `1px solid ${T.outlineSoft}44`,
                paddingBottom: "12px",
              }}
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-[100px]" />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-[100px]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "40px", color: T.error, display: "block", marginBottom: "8px" }}
            >
              error
            </span>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error }}>{error}</p>
            <button
              onClick={fetchInvoices}
              style={{
                marginTop: "12px",
                padding: "8px 20px",
                background: T.primaryLight,
                color: T.primary,
                border: `1px solid ${T.primary}`,
                borderRadius: "8px",
                fontFamily: T.fontLabel,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "56px",
                color: T.outlineSoft,
                display: "block",
                marginBottom: "12px",
              }}
            >
              receipt_long
            </span>
            <h3
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "18px",
                fontWeight: 600,
                color: T.onSurface,
                margin: "0 0 8px",
              }}
            >
              No invoices found
            </h3>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: "14px",
                color: T.outline,
                margin: "0 0 20px",
              }}
            >
              Try adjusting your filters or create a new invoice.
            </p>
            {canCreate && (
              <Link
                href="/dashboard/invoices/new"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 24px",
                  background: T.primary,
                  color: "#fff",
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                  add
                </span>
                New Invoice
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thCell}>Invoice No</th>
                  <th style={thCell}>Project</th>
                  <th style={{ ...thCell, textAlign: "right" }}>Amount</th>
                  <th style={{ ...thCell, textAlign: "right" }}>Paid</th>
                  <th style={thCell}>Status</th>
                  <th style={thCell}>Issued</th>
                  <th style={thCell}>Due</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const paid = paidSum(inv.payments);
                  const pastDue = isPastDue(inv.dueDate, inv.status);
                  return (
                    <tr
                      key={inv.id}
                      {...rowHover}
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                    >
                      <td style={tdCell}>
                        <span
                          style={{
                            fontFamily: T.fontLabel,
                            fontSize: "13px",
                            fontWeight: 700,
                            color: T.onSurface,
                          }}
                        >
                          {inv.invoiceNo}
                        </span>
                      </td>
                      <td style={tdCell}>
                        <div
                          style={{
                            fontFamily: T.fontBody,
                            fontSize: "13px",
                            fontWeight: 600,
                            color: T.onSurface,
                          }}
                        >
                          {inv.project?.name || "—"}
                        </div>
                        {inv.project?.code && (
                          <div
                            style={{
                              fontFamily: T.fontLabel,
                              fontSize: "11px",
                              color: T.onSurfaceMuted,
                              marginTop: "2px",
                            }}
                          >
                            {inv.project.code}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          ...tdCell,
                          textAlign: "right",
                          fontFamily: T.fontLabel,
                          fontWeight: 600,
                        }}
                      >
                        {formatCurrency(inv.amount)}
                      </td>
                      <td
                        style={{
                          ...tdCell,
                          textAlign: "right",
                          fontFamily: T.fontLabel,
                          color: paid > 0 ? T.success : T.onSurfaceMuted,
                        }}
                      >
                        {formatCurrency(paid)}
                      </td>
                      <td style={tdCell}>
                        <StatusBadge status={inv.status} />
                      </td>
                      <td
                        style={{
                          ...tdCell,
                          fontFamily: T.fontLabel,
                          fontSize: "12px",
                          color: T.onSurfaceMuted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(inv.issuedAt)}
                      </td>
                      <td
                        style={{
                          ...tdCell,
                          fontFamily: T.fontLabel,
                          fontSize: "12px",
                          color: pastDue ? T.error : T.onSurfaceMuted,
                          fontWeight: pastDue ? 700 : 400,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(inv.dueDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 0 && invoices.length > 0 && (
          <div
            style={{
              padding: "16px 0 0",
              borderTop: `1px solid rgba(190,201,193,0.2)`,
              marginTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
              Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of{" "}
              {total} invoices
            </p>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button
                className="sk-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ minWidth: "auto", padding: "0 12px" }}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n =
                  totalPages <= 5
                    ? i + 1
                    : page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                return (
                  <button
                    key={n}
                    className={`sk-page-btn ${page === n ? "active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                );
              })}
              {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
              <button
                className="sk-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ minWidth: "auto", padding: "0 12px" }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
