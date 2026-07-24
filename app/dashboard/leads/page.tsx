"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  primaryMedium: "rgba(0,79,53,0.15)",
  secondary: "#565e74",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  surfaceContainerHigh: "#eef2ef",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.4)",
  warning: "#b45309",
  warningLight: "rgba(253,230,138,0.3)",
  success: "#15803d",
  successLight: "rgba(220,252,231,0.8)",
  info: "#2563eb",
  infoMedium: "rgba(37,99,235,0.12)",
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

// ── Status Config ─────────────────────────────────────────────────────────
const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUOTED", "NEGOTIATION", "WON", "LOST"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  NEW:          { label: "New",         color: "#2563eb", bg: "rgba(37,99,235,0.08)",   dot: "#2563eb" },
  CONTACTED:    { label: "Contacted",   color: "#b45309", bg: "rgba(180,83,9,0.08)",    dot: "#b45309" },
  QUOTED:       { label: "Quoted",      color: "#7c3aed", bg: "rgba(124,58,237,0.08)",  dot: "#7c3aed" },
  NEGOTIATION:  { label: "Negotiation", color: "#ca8a04", bg: "rgba(202,138,4,0.1)",    dot: "#ca8a04" },
  WON:          { label: "Won",         color: "#15803d", bg: "rgba(21,128,61,0.08)",   dot: "#15803d" },
  LOST:         { label: "Lost",        color: "#dc2626", bg: "rgba(220,38,38,0.08)",   dot: "#dc2626" },
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
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 700,
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
                  border: "none", fontFamily: T.fontLabel, fontSize: "13px",
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
            <p style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</p>
            <p style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: "2px 0 0" }}>{m.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Lead Card (Kanban) ────────────────────────────────────────────────────
function LeadCard({ lead, onDragStart }: { lead: any; onDragStart: (e: React.DragEvent, lead: any) => void }) {
  const cfg = STATUS_CONFIG[lead.status] || { label: lead.status, color: T.outline, bg: T.surfaceContainerLow, dot: T.outline };
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onClick={() => window.location.href = `/dashboard/leads/${lead.id}`}
      style={{
        background: T.surfaceCard, borderRadius: "12px",
        border: `1px solid rgba(190,201,193,0.2)`,
        padding: "14px", cursor: "grab", userSelect: "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <p style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.3 }}>{lead.name}</p>
        {lead.source && (
          <span style={{
            fontFamily: T.fontLabel, fontSize: "9px", fontWeight: 600,
            color: T.onSurfaceMuted, background: T.surfaceContainerLow,
            padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {lead.source.replace(/_/g, " ")}
          </span>
        )}
      </div>
      {lead.company && (
        <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceVariant, margin: "0 0 6px" }}>{lead.company}</p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
        {lead.budgetMax != null ? (
          <span style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, color: T.primary }}>
            {formatCurrency(Number(lead.budgetMax))}
          </span>
        ) : (
          <span />
        )}
        <span style={{ fontFamily: T.fontLabel, fontSize: "10px", color: T.outline }}>
          {daysAgo(lead.createdAt)}
        </span>
      </div>
      {lead.assignedUser && (
        <p style={{ fontFamily: T.fontBody, fontSize: "11px", color: T.onSurfaceMuted, margin: "6px 0 0", borderTop: `1px solid rgba(190,201,193,0.15)`, paddingTop: "6px" }}>
          👤 {lead.assignedUser.name}
        </p>
      )}
    </div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────
function KanbanColumn({ stage, leads, onDrop, onDragStart, isDragOver }: {
  stage: string;
  leads: any[];
  onDrop: (stage: string) => void;
  onDragStart: (e: React.DragEvent, lead: any) => void;
  isDragOver: boolean;
}) {
  const cfg = STATUS_CONFIG[stage] || { label: stage, color: T.outline, bg: T.surfaceContainerLow, dot: T.outline };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={() => onDrop(stage)}
      style={{
        flex: "1 1 200px", minWidth: "200px", maxWidth: "320px",
        display: "flex", flexDirection: "column",
        background: isDragOver ? "rgba(0,79,53,0.04)" : T.surfaceContainerLow,
        borderRadius: "16px", border: isDragOver ? `2px dashed ${T.primary}` : `1px solid rgba(190,201,193,0.2)`,
        transition: "all 0.15s",
        padding: "12px", maxHeight: "calc(100vh - 320px)", overflow: "hidden",
      }}
    >
      {/* Column Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "12px", padding: "0 4px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
          <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 700, color: T.onSurface }}>{cfg.label}</span>
        </div>
        <span style={{
          fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
          color: T.onSurfaceMuted, background: T.surfaceCard,
          borderRadius: "9999px", padding: "2px 10px",
          border: `1px solid rgba(190,201,193,0.2)`,
        }}>
          {leads.length}
        </span>
      </div>

      {/* Column Body */}
      <div style={{
        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px",
        paddingRight: "2px", minHeight: "60px",
      }}>
        {leads.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px 8px", textAlign: "center",
            fontFamily: T.fontBody, fontSize: "12px", color: T.outline, fontStyle: "italic",
          }}>
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onDragStart={onDragStart} />
          ))
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function LeadsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Data states
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
  const [draggedLead, setDraggedLead] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // ── Fetch Leads ────────────────────────────────────────────────────────
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

  // ── Fetch ALL leads for pipeline view ──────────────────────────────────
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

  // Refresh data on mount and filter change
  useEffect(() => { if (session) { fetchLeads(); fetchAllLeads(); } }, [session, fetchLeads, fetchAllLeads]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Drag & Drop Handlers ───────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, lead: any) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", lead.id);
  };

  const handleDrop = async (newStatus: string) => {
    setDragOverColumn(null);
    if (!draggedLead || draggedLead.status === newStatus) {
      setDraggedLead(null);
      return;
    }

    const leadId = draggedLead.id;
    const oldStatus = draggedLead.status;

    // Optimistic update
    setAllLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    );
    setDraggedLead(null);

    try {
      setUpdatingId(leadId);
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on error
        setAllLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: oldStatus } : l))
        );
        throw new Error("Failed to update status");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Reset Filters ──────────────────────────────────────────────────────
  const resetFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter(""); setSourceFilter(""); setPage(1);
  };

  const hasActiveFilters = !!(statusFilter || sourceFilter || search);

  // Group leads by status for pipeline view
  const groupedLeads = allLeads.reduce((acc: Record<string, any[]>, lead: any) => {
    if (!acc[lead.status]) acc[lead.status] = [];
    acc[lead.status].push(lead);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th {
          text-align: left; padding: 14px 24px;
          font-family: ${T.fontLabel}; font-size: 11px; font-weight: 700;
          letter-spacing: 0.05em; text-transform: uppercase; color: ${T.outline};
          background: rgba(245,248,246,0.5);
          border-bottom: 1px solid rgba(190,201,193,0.2);
        }
        .sk-table td {
          padding: 16px 24px; font-family: ${T.fontBody}; font-size: 14px;
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
          font-family: ${T.fontLabel}; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; line-height: 1;
        }
        .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
        .sk-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
        .kanban-scroll::-webkit-scrollbar { height: 6px; }
        .kanban-scroll::-webkit-scrollbar-track { background: transparent; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(190,201,193,0.4); border-radius: 99px; }
        .kanban-columns::-webkit-scrollbar { height: 6px; }
        .kanban-columns::-webkit-scrollbar-track { background: transparent; }
        .kanban-columns::-webkit-scrollbar-thumb { background: rgba(190,201,193,0.4); border-radius: 99px; }
      `}</style>

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.01em", color: T.onSurface, margin: 0 }}>
            {view === "pipeline" ? "Pipeline" : "Leads"}
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: "16px", color: T.onSurfaceMuted, margin: "4px 0 0", maxWidth: "480px" }}>
            {view === "pipeline"
              ? "Drag & drop leads between stages to update their status."
              : "Track and manage potential customer leads."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* View Toggle */}
          <div style={{
            display: "flex", background: T.surfaceContainerLow,
            borderRadius: "10px", padding: "3px",
            border: `1px solid rgba(190,201,193,0.25)`,
          }}>
            <button
              onClick={() => setView("pipeline")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "7px 14px", borderRadius: "8px",
                border: "none", cursor: "pointer",
                fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700,
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
                fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700,
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
              fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700,
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

      {/* ── Pipeline View ───────────────────────────────────────────────── */}
      {view === "pipeline" ? (
        <div style={cardStyle}>
          {/* Filters */}
          <div style={{
            padding: "0 0 16px", borderBottom: `1px solid rgba(190,201,193,0.2)`,
            display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
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
                  borderRadius: "10px", fontFamily: T.fontBody, fontSize: "14px",
                  color: T.onSurface, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <FilterChip
              label="Source" value={sourceFilter}
              onChange={(v) => { setSourceFilter(v); }}
              options={SOURCE_OPTIONS}
            />
            {hasActiveFilters && (
              <button onClick={resetFilters} style={{
                fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700,
                color: T.primary, background: "none", border: "none", cursor: "pointer",
              }}>
                Reset Filters
              </button>
            )}
          </div>

          {/* Kanban Columns */}
          {pipelineLoading ? (
            <div style={{ padding: "48px", textAlign: "center" }}>
              <p style={{ fontFamily: T.fontBody, color: T.onSurfaceMuted }}>Loading pipeline...</p>
            </div>
          ) : (
            <div className="kanban-columns" style={{
              display: "flex", gap: "12px", overflowX: "auto",
              paddingTop: "16px", paddingBottom: "4px",
            }}>
              {PIPELINE_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  leads={groupedLeads[stage] || []}
                  onDrop={handleDrop}
                  onDragStart={handleDragStart}
                  isDragOver={dragOverColumn === stage}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── TABLE VIEW ──────────────────────────────────────────────── */
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
                  style={{ width: "100%", padding: "9px 12px 9px 40px", background: T.surfaceContainerLow, border: `1px solid rgba(190,201,193,0.3)`, borderRadius: "10px", fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <FilterChip label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={STATUS_OPTIONS} />
              <FilterChip label="Source" value={sourceFilter} onChange={(v) => { setSourceFilter(v); setPage(1); }} options={SOURCE_OPTIONS} />
              {hasActiveFilters && (
                <button onClick={resetFilters} style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", marginLeft: "4px" }}>
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Table */}
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
              <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error }}>{error}</p>
              <button onClick={fetchLeads} style={{ marginTop: "12px", padding: "8px 20px", background: T.primaryLight, color: T.primary, border: `1px solid ${T.primary}`, borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Retry</button>
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "64px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>person_search</span>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 8px" }}>No leads found</h3>
              <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.outline, margin: "0 0 20px" }}>Try adjusting your filters or create a new lead.</p>
              <Link href="/dashboard/leads/new" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", background: T.primary, color: "#fff", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
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
                        <p style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{lead.name}</p>
                        {lead.email && (
                          <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{lead.email}</p>
                        )}
                      </td>
                      <td style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceVariant }}>{lead.company || "—"}</td>
                      <td style={{ fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurfaceMuted }}>{lead.phone || "—"}</td>
                      <td>
                        {lead.source ? (
                          <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceVariant, background: T.surfaceContainerLow, padding: "2px 8px", borderRadius: "4px" }}>
                            {lead.source.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                        ) : "—"}
                      </td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td style={{ fontFamily: T.fontBody, fontSize: "14px" }}>{lead.assignedUser?.name || "—"}</td>
                      <td style={{ fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurfaceMuted }}>
                        {lead.budgetMin != null || lead.budgetMax != null
                          ? `${formatCurrency(Number(lead.budgetMin))} – ${formatCurrency(Number(lead.budgetMax))}`
                          : "—"}
                      </td>
                      <td style={{ fontFamily: T.fontLabel, fontSize: "13px", color: T.onSurfaceMuted, whiteSpace: "nowrap" }}>{formatDate(lead.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 0 && leads.length > 0 && (
            <div style={{ padding: "16px 0 0", borderTop: `1px solid rgba(190,201,193,0.2)`, marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
                Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} leads
              </p>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ minWidth: "auto", padding: "0 12px" }}>← Prev</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  return (
                    <button key={n} className={`sk-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                  );
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
