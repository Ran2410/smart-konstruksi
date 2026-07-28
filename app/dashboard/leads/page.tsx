"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: "1px solid rgba(190,201,193,0.25)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
};

// ── Status Config ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: string }> = {
  NEW:          { label: "New",         color: "#2563eb", bg: "rgba(37,99,235,0.08)",   dot: "#2563eb",   icon: "fiber_new" },
  CONTACTED:    { label: "Contacted",   color: "#b45309", bg: "rgba(180,83,9,0.08)",    dot: "#b45309",   icon: "call_made" },
  QUOTED:       { label: "Quoted",      color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  dot: "#7c3aed",   icon: "request_quote" },
  NEGOTIATION:  { label: "Negotiation", color: "#ca8a04", bg: "rgba(202,138,4,0.1)",    dot: "#ca8a04",   icon: "handshake" },
  WON:          { label: "Won",         color: "#15803d", bg: "rgba(21,128,61,0.08)",   dot: "#15803d",   icon: "emoji_events" },
  LOST:         { label: "Lost",        color: "#dc2626", bg: "rgba(220,38,38,0.08)",   dot: "#dc2626",   icon: "cancel" },
};

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  ...PIPELINE_STAGES.map((s) => ({ label: STATUS_CONFIG[s].label, value: s })),
];

const SOURCE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Website", value: "WEBSITE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "Social Media", value: "SOCIAL_MEDIA" },
  { label: "Walk-in", value: "WALK_IN" },
  { label: "Phone", value: "PHONE" },
  { label: "Email", value: "EMAIL" },
  { label: "Event", value: "EVENT" },
  { label: "Other", value: "OTHER" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}M`;
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ── Status Badge ──────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: T.outline, bg: T.surfaceContainerLow, dot: T.outline };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "9999px",
      fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
      color: cfg.color, background: cfg.bg, whiteSpace: "nowrap",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Filter Chip ───────────────────────────────────────────────────────────
function FilterChip({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label || "All";
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 12px", background: T.surfaceContainerLow,
          border: `1px solid rgba(190,201,193,0.3)`, borderRadius: "9999px",
          fontFamily: FONT_LABEL, fontSize: "12px", cursor: "pointer",
        }}
      >
        <span style={{ color: T.onSurfaceMuted }}>{label}:</span>
        <span style={{ fontWeight: 700, color: T.primary }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.onSurfaceMuted }}>expand_more</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0,
            background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`,
            borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 10, minWidth: "160px", overflow: "hidden",
            maxHeight: "240px", overflowY: "auto",
          }}>
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "10px 16px", background: o.value === value ? T.primaryLight : "none",
                  border: "none", fontFamily: FONT_LABEL, fontSize: "13px",
                  fontWeight: o.value === value ? 700 : 400,
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

// ── Pipeline Metrics ──────────────────────────────────────────────────────
function PipelineMetrics({ leads }: { leads: any[] }) {
  const total = leads.length;
  const active = leads.filter((l) => !["WON", "LOST"].includes(l.status)).length;
  const won = leads.filter((l) => l.status === "WON").length;
  const lost = leads.filter((l) => l.status === "LOST").length;
  const closed = won + lost;
  const winRate = closed > 0 ? Math.round((won / closed) * 100) : 0;
  const pipelineValue = leads
    .filter((l) => !["WON", "LOST"].includes(l.status))
    .reduce((sum, l) => sum + (Number(l.budgetMax) || 0), 0);
  const wonValue = leads
    .filter((l) => l.status === "WON")
    .reduce((sum, l) => sum + (Number(l.budgetMax) || 0), 0);

  const metrics = [
    { label: "Total Leads", value: String(total), icon: "group", color: T.info },
    { label: "Active Deals", value: String(active), icon: "trending_up", color: T.primary },
    { label: "Win Rate", value: `${winRate}%`, icon: "emoji_events", color: T.success },
    { label: "Pipeline Value", value: formatCurrency(pipelineValue), icon: "account_balance", color: T.warning },
    { label: "Won Revenue", value: formatCurrency(wonValue), icon: "payments", color: T.success },
  ];

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "12px", marginBottom: "16px",
    }}>
      {metrics.map((m) => (
        <div key={m.label} style={{
          background: T.surfaceCard, borderRadius: "14px",
          border: `1px solid rgba(190,201,193,0.2)`,
          padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "28px", color: m.color }}>{m.icon}</span>
          <div>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</p>
            <p style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: "2px 0 0" }}>{m.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lead Card (Kanban) ────────────────────────────────────────────────────
function LeadCard({ lead, canEdit, onDragStart }: {
  lead: any;
  canEdit: boolean;
  onDragStart: (leadId: string) => void;
}) {
  const cfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: T.outline, bg: T.surfaceContainerLow, dot: T.outline };
  const sourceLabel = lead.source?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  const handleDragStart = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.dataTransfer.setData("text/plain", lead.id);
    e.dataTransfer.effectAllowed = "move";
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
    onDragStart(lead.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
    el.style.borderColor = "rgba(190,201,193,0.25)";
    el.style.transform = "translateY(0)";
  };

  return (
    <div
      draggable={canEdit}
      onClick={() => window.location.href = `/dashboard/leads/${lead.id}`}
      style={{
        background: T.surfaceCard,
        borderRadius: "12px",
        border: `1px solid rgba(190,201,193,0.25)`,
        padding: "14px 14px 12px",
        cursor: canEdit ? "grab" : "pointer",
        transition: "all 0.15s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = T.primary;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = "rgba(190,201,193,0.25)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: "3px", background: cfg.color,
        borderRadius: "12px 12px 0 0",
      }} />

      {/* Status badge + Source */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "10px" }}>
        <span style={{
          fontFamily: FONT_LABEL, fontSize: "9px", fontWeight: 700,
          color: cfg.color, background: `${cfg.color}12`,
          padding: "2px 8px", borderRadius: "4px",
          textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: "16px",
        }}>
          {cfg.label}
        </span>
        {lead.source && (
          <span style={{
            fontFamily: FONT_LABEL, fontSize: "9px", fontWeight: 600,
            color: T.onSurfaceMuted, background: T.surfaceContainerLow,
            padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap",
          }}>
            {sourceLabel}
          </span>
        )}
      </div>

      {/* Name */}
      <div style={{
        fontFamily: FONT_DISPLAY, fontSize: "13px", fontWeight: 600,
        color: T.onSurface, marginBottom: "4px", lineHeight: 1.4,
      }}>
        {lead.name}
      </div>

      {/* Company */}
      {lead.company && (
        <div style={{
          fontFamily: FONT_BODY, fontSize: "11px", color: T.onSurfaceVariant,
          marginBottom: "10px",
        }}>
          {lead.company}
        </div>
      )}

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(190,201,193,0.2)", marginBottom: "8px" }} />

      {/* Bottom row: budget + days ago */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        {lead.budgetMax != null ? (
          <span style={{
            fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.primary,
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>payments</span>
            {formatCurrency(Number(lead.budgetMax))}
          </span>
        ) : (
          <span style={{ fontFamily: FONT_BODY, fontSize: "11px", color: T.outlineSoft, fontStyle: "italic" }}>
            No budget
          </span>
        )}
        <span style={{
          fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 600, color: T.outline,
          display: "flex", alignItems: "center", gap: "4px", flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>schedule</span>
          {daysAgo(lead.createdAt)}
        </span>
      </div>

      {/* Assignee row */}
      {lead.assignedUser && (
        <div style={{
          display: "flex", alignItems: "center", gap: "6px", marginTop: "8px",
          paddingTop: "8px", borderTop: `1px solid rgba(190,201,193,0.15)`,
        }}>
          <div style={{
            width: "20px", height: "20px", borderRadius: "9999px",
            background: T.primaryLight, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "12px", color: T.primary }}>person</span>
          </div>
          <span style={{
            fontFamily: FONT_BODY, fontSize: "11px", fontWeight: 500,
            color: T.onSurfaceVariant, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {lead.assignedUser.name}
          </span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function LeadsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role as string;
  const canEdit = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR"].includes(role);

  // Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // View toggle
  const [view, setView] = useState<"table" | "pipeline">("pipeline");

  // Drag state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // ── Fetch Leads (paginated for table) ───────────────────────────────
  const fetchLeads = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/leads?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setLeads(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, sourceFilter]);

  // ── Fetch ALL leads for pipeline view ──────────────────────────────
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  const fetchAllLeads = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "500" });
      if (search) params.set("search", search);
      if (sourceFilter) params.set("source", sourceFilter);
      const res = await fetch(`/api/leads?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      setAllLeads(data.data || []);
    } catch (_) {}
    finally { setPipelineLoading(false); }
  }, [search, sourceFilter]);

  useEffect(() => { if (session) { fetchLeads(); fetchAllLeads(); } }, [session, fetchLeads, fetchAllLeads]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Quick Status Change ────────────────────────────────────────────
  const quickStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchAllLeads();
      }
    } catch {}
  };

  // ── Reset Filters ──────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter(""); setSourceFilter(""); setPage(1);
  };

  const hasActiveFilters = !!(statusFilter || sourceFilter || search);

  // Group leads by status
  const grouped = PIPELINE_STAGES.map((stage) => ({
    value: stage,
    ...STATUS_CONFIG[stage],
    leads: allLeads.filter((l) => l.status === stage),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th {
          text-align: left; padding: 14px 24px;
          font-family: ${FONT_LABEL}; font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; color: ${T.outline};
          background: rgba(245,248,246,0.5);
          border-bottom: 1px solid rgba(190,201,193,0.2);
        }
        .sk-table td {
          padding: 16px 24px; font-family: ${FONT_BODY}; font-size: 14px;
          color: ${T.onSurface}; border-bottom: 1px solid rgba(190,201,193,0.15);
          vertical-align: middle;
        }
        .sk-table tbody tr { cursor: pointer; transition: background 0.12s; }
        .sk-table tbody tr:hover { background: rgba(245,248,246,0.5); }
        .sk-table tbody tr:last-child td { border-bottom: none; }
        .sk-page-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 34px; height: 34px; padding: 0 8px;
          border: 1px solid rgba(190,201,193,0.5); border-radius: 8px;
          background: ${T.surfaceCard}; color: ${T.onSurfaceVariant};
          font-family: ${FONT_LABEL}; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; line-height: 1;
        }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "12px",
            background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "26px", color: T.primary }}>
              {view === "pipeline" ? "account_tree" : "analytics"}
            </span>
          </div>
          <div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "28px", fontWeight: 600, letterSpacing: "-0.01em", color: T.onSurface, margin: 0 }}>
              {view === "pipeline" ? "Pipeline" : "Leads"}
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>
              {view === "pipeline" ? `${allLeads.length} leads · Drag & drop to update status` : "Track and manage potential customer leads."}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* View Toggle */}
          <div style={{
            display: "flex", background: T.surfaceContainerLow,
            borderRadius: "10px", padding: "3px", gap: "2px",
            border: `1px solid rgba(190,201,193,0.25)`,
          }}>
            <button
              onClick={() => setView("pipeline")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px",
                border: "none", cursor: "pointer",
                fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700,
                background: view === "pipeline" ? T.surfaceCard : "transparent",
                color: view === "pipeline" ? T.primary : T.onSurfaceMuted,
                boxShadow: view === "pipeline" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>account_tree</span>
              Pipeline
            </button>
            <button
              onClick={() => setView("table")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px",
                border: "none", cursor: "pointer",
                fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700,
                background: view === "table" ? T.surfaceCard : "transparent",
                color: view === "table" ? T.primary : T.onSurfaceMuted,
                boxShadow: view === "table" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.15s",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>table_rows</span>
              Table
            </button>
          </div>
          <Link
            href="/dashboard/leads/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 22px", background: T.primary, color: "#fff",
              border: "none", borderRadius: "10px",
              fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
              textDecoration: "none", boxShadow: "0 2px 6px rgba(0,79,53,0.25)",
              transition: "all 0.15s ease",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
            + Add Lead
          </Link>
        </div>
      </div>

      {/* ── Metrics (Pipeline View) ─────────────────────────────────────── */}
      {view === "pipeline" && !pipelineLoading && allLeads.length > 0 && (
        <PipelineMetrics leads={allLeads} />
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PIPELINE VIEW */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === "pipeline" ? (
        <div style={{ ...cardStyle, padding: "24px" }}>
          {/* Filters */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
            marginBottom: "20px", paddingBottom: "16px",
            borderBottom: `1px solid rgba(190,201,193,0.2)`,
          }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: T.outline, pointerEvents: "none" }}>search</span>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px 9px 40px",
                  background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.3)`,
                  borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px",
                  color: T.onSurface, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <FilterChip label="Source" value={sourceFilter} onChange={(v) => { setSourceFilter(v); }} options={SOURCE_OPTIONS} />
            {hasActiveFilters && (
              <button onClick={resetFilters} style={{
                fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700,
                color: T.primary, background: "none", border: "none", cursor: "pointer",
              }}>
                Reset Filters
              </button>
            )}
          </div>

          {/* Loading */}
          {pipelineLoading ? (
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "32px", justifyContent: "center", color: T.outline,
              fontFamily: FONT_LABEL, fontSize: "14px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>progress_activity</span>
              Loading pipeline…
            </div>
          ) : (
            <>
              {/* Board Columns — grid like tasks-board */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "12px",
                overflowX: "auto",
              }}>
                {grouped.map((col) => (
                  <div
                    key={col.value}
                    style={{
                      background: "#ffffff",
                      borderRadius: "14px",
                      border: `1px solid ${dropTarget === col.value ? "rgba(0,79,53,0.4)" : "rgba(190,201,193,0.15)"}`,
                      boxShadow: dropTarget === col.value ? "0 0 0 2px rgba(0,79,53,0.08)" : "0 1px 4px rgba(0,0,0,0.03)",
                      padding: "16px 12px 12px",
                      minHeight: "200px",
                      display: "flex", flexDirection: "column",
                      transition: "all 0.15s ease",
                      position: "relative",
                    }}
                    onDragOver={(e) => {
                      if (!canEdit || !draggedLeadId) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDropTarget(col.value);
                    }}
                    onDragLeave={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX;
                      const y = e.clientY;
                      if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                        setDropTarget((prev) => prev === col.value ? null : prev);
                      }
                    }}
                    onDrop={(e) => {
                      if (!canEdit) return;
                      e.preventDefault();
                      const leadId = e.dataTransfer.getData("text/plain");
                      setDropTarget(null);
                      setDraggedLeadId(null);
                      if (leadId) {
                        const currentLead = allLeads.find((l) => l.id === leadId);
                        if (currentLead && currentLead.status !== col.value) {
                          quickStatusChange(leadId, col.value);
                        }
                      }
                    }}
                  >
                    {/* Column Header */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginBottom: "14px", paddingBottom: "10px",
                      borderBottom: `2px solid ${col.color}15`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: col.color }}>
                          {col.icon}
                        </span>
                        <span style={{
                          fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700,
                          color: T.onSurface, textTransform: "uppercase", letterSpacing: "0.04em",
                        }}>
                          {col.label}
                        </span>
                      </div>
                      <span style={{
                        fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600,
                        color: T.outline, background: "rgba(111,122,114,0.08)",
                        padding: "2px 9px", borderRadius: "6px",
                        minWidth: "20px", textAlign: "center",
                      }}>
                        {col.leads.length}
                      </span>
                    </div>

                    {/* Lead Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                      {col.leads.length === 0 ? (
                        <div style={{
                          textAlign: "center", padding: "24px 8px",
                          color: dropTarget === col.value ? T.primary : T.outlineSoft,
                          fontFamily: FONT_BODY, fontSize: "12px",
                          borderRadius: "8px",
                          background: dropTarget === col.value ? "rgba(0,79,53,0.04)" : "transparent",
                          border: dropTarget === col.value ? `2px dashed ${T.primary}40` : "2px dashed transparent",
                          transition: "all 0.15s ease",
                          flex: 1, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "28px", display: "block", marginBottom: "4px" }}>
                            {dropTarget === col.value ? "add_location" : col.value === "WON" ? "celebration" : col.value === "LOST" ? "sentiment_dissatisfied" : "drag_indicator"}
                          </span>
                          {dropTarget === col.value && draggedLeadId
                            ? "Drop here"
                            : col.value === "NEW"
                              ? "No new leads"
                              : col.value === "WON"
                                ? "No won deals"
                                : col.value === "LOST"
                                  ? "No lost deals"
                                  : "Move leads here"}
                        </div>
                      ) : (
                        col.leads.map((lead) => (
                          <LeadCard
                            key={lead.id}
                            lead={lead}
                            canEdit={canEdit}
                            onDragStart={setDraggedLeadId}
                          />
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drag & Drop Hint */}
              {canEdit && (
                <div style={{
                  marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap",
                  padding: "14px 16px", background: "rgba(0,79,53,0.04)",
                  border: "1px dashed rgba(0,79,53,0.2)", borderRadius: "10px",
                  alignItems: "center",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", color: T.primary }}>touch_app</span>
                  <span style={{ fontFamily: FONT_BODY, fontSize: "12px", fontWeight: 500, color: T.onSurface }}>
                    <strong>Drag & drop</strong> lead cards between columns to update status
                  </span>
                  <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                    {PIPELINE_STAGES.map((s) => (
                      <span key={s} style={{
                        fontFamily: FONT_LABEL, fontSize: "10px",
                        color: STATUS_CONFIG[s]?.color || T.outline,
                        background: `${(STATUS_CONFIG[s]?.color || T.outline)}10`,
                        padding: "2px 6px", borderRadius: "4px",
                      }}>
                        {STATUS_CONFIG[s]?.label || s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════════════ */
        /* TABLE VIEW */
        /* ════════════════════════════════════════════════════════════════════ */
        <div style={cardStyle}>
          {/* Toolbar */}
          <div style={{
            padding: "0 0 16px", borderBottom: `1px solid rgba(190,201,193,0.2)`,
            display: "flex", flexDirection: "column", gap: "12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: T.outline, pointerEvents: "none" }}>search</span>
                <input
                  type="text"
                  placeholder="Search by name or company..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px 9px 40px", background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.3)`, borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <FilterChip label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTIONS} />
              <FilterChip label="Source" value={sourceFilter} onChange={(v) => { setSourceFilter(v); setPage(1); }} options={SOURCE_OPTIONS} />
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Table content — same as before with pagination */}
          {loading ? (
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", gap: "24px", marginBottom: "16px", borderBottom: `1px solid ${T.outlineSoft}44`, paddingBottom: "12px" }}>
                <Skeleton className="h-3 w-[130px]" />
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-3 w-[80px]" />
                <Skeleton className="h-3 w-[90px]" />
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-3 w-[100px]" />
                <Skeleton className="h-3 w-[90px]" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-5 w-[110px]" />
                    <Skeleton className="h-5 w-[80px]" />
                    <Skeleton className="h-5 w-[90px]" />
                    <Skeleton className="h-5 w-[110px]" />
                    <Skeleton className="h-5 w-[110px]" />
                    <Skeleton className="h-5 w-[90px]" />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.error, display: "block", marginBottom: "8px" }}>error</span>
              <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.error }}>{error}</p>
              <button onClick={fetchLeads} style={{ marginTop: "12px", padding: "8px 20px", background: T.primaryLight, color: T.primary, border: `1px solid ${T.primary}`, borderRadius: "8px", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Retry</button>
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "64px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>person_search</span>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 8px" }}>No leads found</h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: "0 0 20px" }}>Try adjusting your filters or create a new lead.</p>
              <Link href="/dashboard/leads/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", background: T.primary, color: "#fff", borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>Add Lead
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="sk-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Phone</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Budget Range</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                      <td>
                        <p style={{ fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{lead.name}</p>
                        {lead.email && <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{lead.email}</p>}
                      </td>
                      <td style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant }}>{lead.company || "—"}</td>
                      <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted }}>{lead.phone || "—"}</td>
                      <td>{lead.source ? (
                        <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceVariant, background: T.surfaceContainerLow, padding: "2px 8px", borderRadius: "4px" }}>
                          {lead.source.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </span>
                      ) : "—"}</td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td style={{ fontFamily: FONT_BODY, fontSize: "14px" }}>{lead.assignedUser?.name || "—"}</td>
                      <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted }}>
                        {lead.budgetMin != null || lead.budgetMax != null
                          ? `${formatCurrency(Number(lead.budgetMin))} – ${formatCurrency(Number(lead.budgetMax))}`
                          : "—"}
                      </td>
                      <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted, whiteSpace: "nowrap" }}>{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && leads.length > 0 && (
            <div style={{ padding: "16px 0 0", borderTop: `1px solid rgba(190,201,193,0.2)`, marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
                Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} leads
              </p>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ minWidth: "auto", padding: "0 12px" }}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return <button key={n} className={`sk-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>;
                })}
                {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
                <button className="sk-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ minWidth: "auto", padding: "0 12px" }}>Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
