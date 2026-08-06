"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const META: Record<string, { icon: string; color: string; label: string }> = {
  TASK: { icon: "task_alt", color: "#7c3aed", label: "Task" },
  PROGRESS: { icon: "trending_up", color: "#15803d", label: "Progress" },
  INVOICE: { icon: "receipt_long", color: "#2563eb", label: "Invoice" },
  PAYMENT: { icon: "payments", color: "#0d9488", label: "Payment" },
  APPROVAL: { icon: "fact_check", color: "#b45309", label: "Approval" },
  DOCUMENT: { icon: "description", color: "#4f46e5", label: "Document" },
  SYSTEM: { icon: "notifications", color: "#6f7a72", label: "System" },
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FilterChip({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label || "All";
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`, borderRadius: "9999px", fontFamily: FONT_LABEL, fontSize: "12px", cursor: "pointer", color: T.onSurface, whiteSpace: "nowrap" }}>
        <span style={{ color: T.onSurfaceMuted }}>{label}:</span>
        <span style={{ fontWeight: 700, color: T.primary }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: T.onSurfaceMuted }}>expand_more</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9 }} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, minWidth: "150px", overflow: "hidden", maxHeight: "240px", overflowY: "auto" }}>
            {options.map((o) => (
              <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: o.value === value ? T.primaryLight : "none", border: "none", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: o.value === value ? 700 : 400, color: o.value === value ? T.primary : T.onSurface, cursor: "pointer" }}>
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const limit = 15;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (unreadOnly) params.set("unreadOnly", "true");
    if (typeFilter) params.set("type", typeFilter);
    try {
      const res = await fetch(`/api/notifications?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setItems(d.data || []);
      setUnread(d.unreadCount || 0);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total ?? 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, unreadOnly, typeFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchItems(), 0);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const handleOpen = async (n: any) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PUT", credentials: "include" }).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
    }
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
      setUnread(0);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  };

  const hasFilters = unreadOnly || typeFilter;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: T.onSurface, margin: 0 }}>Notifications</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Stay updated on tasks, progress reports, invoices, and payments.
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll} disabled={markingAll}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, cursor: markingAll ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(0,79,53,0.25)", opacity: markingAll ? 0.6 : 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>done_all</span>
            {markingAll ? "Marking…" : "Mark All as Read"}
          </button>
        )}
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "20px" }}>
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.primary, fontVariationSettings: "'FILL' 1" }}>notifications</span>
          </div>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 4px" }}>Total</p>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "26px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{total}</h3>
        </div>
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: T.errorLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error, fontVariationSettings: "'FILL' 1" }}>mark_email_unread</span>
          </div>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 4px" }}>Unread</p>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "26px", fontWeight: 700, color: T.error, margin: 0 }}>{unread}</h3>
        </div>
      </div>

      {/* List card */}
      <div style={card}>
        {/* Toolbar */}
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.outlineSoft}22`, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <FilterChip label="Status" value={unreadOnly ? "unread" : ""} onChange={(v) => { setUnreadOnly(v === "unread"); setPage(1); }}
            options={[{ label: "All", value: "" }, { label: "Unread", value: "unread" }]} />
          <FilterChip label="Type" value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }}
            options={[{ label: "All", value: "" }, { label: "Task", value: "TASK" }, { label: "Progress", value: "PROGRESS" }, { label: "Invoice", value: "INVOICE" }, { label: "Payment", value: "PAYMENT" }, { label: "Approval", value: "APPROVAL" }]} />
          {hasFilters && (
            <button onClick={() => { setUnreadOnly(false); setTypeFilter(""); setPage(1); }}
              style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
              Reset
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: "8px 20px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", gap: "14px", padding: "16px 0", borderBottom: `1px solid ${T.outlineSoft}22`, alignItems: "flex-start" }}>
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div style={{ flex: 1 }}>
                  <Skeleton className="h-4 w-44 mb-2" />
                  <Skeleton className="h-3 w-full max-w-md mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>notifications_off</span>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 6px" }}>No notifications found</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div>
            {items.map((n) => {
              const meta = META[n.type] || META.SYSTEM;
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  style={{
                    display: "flex",
                    gap: "14px",
                    width: "100%",
                    textAlign: "left",
                    padding: "16px 20px",
                    background: n.isRead ? T.surfaceCard : T.primaryLight,
                    border: "none",
                    borderBottom: `1px solid ${T.outlineSoft}22`,
                    cursor: "pointer",
                    transition: "background 0.12s ease",
                    alignItems: "flex-start",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.isRead ? T.surfaceCard : T.primaryLight)}
                >
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${meta.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "21px", color: meta.color }}>{meta.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <p style={{ fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                        {n.title}
                        {!n.isRead && (
                          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: T.primary, marginLeft: "8px", verticalAlign: "middle" }} />
                        )}
                      </p>
                      <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {fmtDateTime(n.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontFamily: FONT_BODY, fontSize: "13.5px", color: T.onSurfaceVariant, margin: "4px 0 0", lineHeight: 1.5 }}>{n.message}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "8px", padding: "2px 8px", borderRadius: "9999px", background: `${meta.color}12`, fontFamily: FONT_LABEL, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  {n.link && (
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted, marginTop: "4px", flexShrink: 0 }}>chevron_right</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && items.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.outlineSoft}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "34px", height: "34px", border: `1px solid ${T.outlineSoft}66`, borderRadius: "8px", background: T.surfaceCard, color: T.onSurfaceVariant, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ minWidth: "34px", height: "34px", border: `1px solid ${T.outlineSoft}66`, borderRadius: "8px", background: page === n ? T.primary : T.surfaceCard, color: page === n ? "#fff" : T.onSurfaceVariant, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                    {n}
                  </button>
                );
              })}
              <button className="sk-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "0 12px", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "34px", height: "34px", border: `1px solid ${T.outlineSoft}66`, borderRadius: "8px", background: T.surfaceCard, color: T.onSurfaceVariant, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
