"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Shared styles ──────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: `1px solid ${T.outlineSoft}`,
  borderRadius: "10px",
  fontFamily: FONT_BODY,
  fontSize: "14px",
  color: T.onSurface,
  background: T.surfaceCard,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_LABEL,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: T.onSurfaceMuted,
  margin: "0 0 6px",
};

const fieldRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR", "AUD"];

const ACTION_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  CREATE: { color: "#15803d", bg: "rgba(220,252,231,0.6)", label: "Create" },
  UPDATE: { color: "#2563eb", bg: "rgba(219,234,254,0.6)", label: "Update" },
  DELETE: { color: "#ba1a1a", bg: "rgba(255,218,214,0.4)", label: "Delete" },
};

function fmtDate(d: string | null | undefined, withTime = true) {
  if (!d) return "—";
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return new Date(d).toLocaleDateString("id-ID", opts);
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 999,
        background: type === "success" ? "#15803d" : "#ba1a1a",
        color: "#fff",
        padding: "14px 24px",
        borderRadius: "12px",
        fontFamily: FONT_BODY,
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────
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
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, minWidth: "160px", overflow: "hidden", maxHeight: "240px", overflowY: "auto" }}>
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
// TAB 1 — Company Profile
// ════════════════════════════════════════════════════════════════════════════
function CompanyProfileTab() {
  const { data: session } = useSession();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<{ name: string; at: string } | null>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    let active = true;
    fetch("/api/settings", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d.data) return;
        const p = d.data;
        setForm({
          companyName: p.companyName || "",
          tagline: p.tagline || "",
          address: p.address || "",
          phone: p.phone || "",
          email: p.email || "",
          taxId: p.taxId || "",
          website: p.website || "",
          logoUrl: p.logoUrl || "",
          currency: p.currency || "IDR",
          invoicePrefix: p.invoicePrefix || "INV",
          taxRate: p.taxRate != null ? String(Number(p.taxRate)) : "11",
        });
        if (p.updatedAt) {
          setLastUpdated({ name: p.updatedByName || "System", at: p.updatedAt });
        }
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { ...form, taxRate: Number(form.taxRate || 0) };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || "Failed to save settings");
      setLastUpdated({ name: (session?.user as any)?.name || "You", at: d.data.updatedAt });
      setToast({ message: "Company profile updated", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton className="h-6 w-52" />
        <div style={{ ...card, padding: "24px" }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full mb-4" />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* General */}
      <div style={{ ...card, padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>business</span>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 700, color: T.onSurface, margin: 0 }}>General Information</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>Company identity shown across the system.</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Company Name *</label>
            <input style={input} value={form.companyName || ""} onChange={set("companyName")} placeholder="PT. Kita Satu Intersolusi" />
          </div>
          <div>
            <label style={labelStyle}>Tagline</label>
            <input style={input} value={form.tagline || ""} onChange={set("tagline")} placeholder="Build Smarter. Manage Better." />
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <textarea style={{ ...input, minHeight: "72px", resize: "vertical", fontFamily: FONT_BODY }} value={form.address || ""} onChange={set("address")} placeholder="Street, city, province" />
          </div>
          <div style={fieldRow}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={input} value={form.phone || ""} onChange={set("phone")} placeholder="+62 21 0000 0000" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input style={input} type="email" value={form.email || ""} onChange={set("email")} placeholder="hello@company.com" />
            </div>
          </div>
          <div style={fieldRow}>
            <div>
              <label style={labelStyle}>Tax ID (NPWP)</label>
              <input style={input} value={form.taxId || ""} onChange={set("taxId")} placeholder="00.000.000.0-000.000" />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input style={input} value={form.website || ""} onChange={set("website")} placeholder="https://company.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial defaults */}
      <div style={{ ...card, padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(37,99,235,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: "#2563eb" }}>payments</span>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Financial Defaults</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>Defaults applied when creating new invoices.</p>
          </div>
        </div>
        <div style={fieldRow}>
          <div>
            <label style={labelStyle}>Currency</label>
            <select style={{ ...input, cursor: "pointer" }} value={form.currency || "IDR"} onChange={set("currency")}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Invoice Prefix</label>
            <input style={input} value={form.invoicePrefix || ""} onChange={set("invoicePrefix")} placeholder="INV" maxLength={10} />
          </div>
          <div>
            <label style={labelStyle}>Tax Rate (%)</label>
            <input style={input} type="number" min={0} max={100} step={0.1} value={form.taxRate || ""} onChange={set("taxRate")} placeholder="11" />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div style={{ ...card, padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: 0 }}>
          {lastUpdated ? <>Last updated by <strong style={{ color: T.onSurface }}>{lastUpdated.name}</strong> on {fmtDate(lastUpdated.at)}</> : "No updates yet."}
        </p>
        <button onClick={handleSave} disabled={saving}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 26px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(0,79,53,0.25)", opacity: saving ? 0.6 : 1 }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{saving ? "hourglass_top" : "save"}</span>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — Audit Log
// ════════════════════════════════════════════════════════════════════════════
function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 15;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("entity", entityFilter);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/settings/audit-logs?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setLogs(d.data || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, search]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(), 0);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const hasActiveFilters = !!(actionFilter || entityFilter || search);

  const renderDiff = (log: any) => {
    const oldD = log.oldData as Record<string, unknown> | null;
    const newD = log.newData as Record<string, unknown> | null;
    if (log.action === "CREATE") return newD;
    if (log.action === "DELETE") return oldD;
    return newD || oldD;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Intro */}
      <div style={{ ...card, padding: "20px 28px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>history</span>
        </div>
        <div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Audit Trail</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>
            Every data change is recorded with actor, timestamp, and before/after values.
          </p>
        </div>
      </div>

      {/* Table card */}
      <div style={card}>
        <style>{`
          .sk-table { width: 100%; border-collapse: collapse; }
          .sk-table th { text-align: left; padding: 12px 20px; font-family: ${FONT_LABEL}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.onSurfaceMuted}; background: ${T.surfaceContainerLow}; border-bottom: 1px solid ${T.outlineSoft}33; }
          .sk-table td { padding: 14px 20px; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.onSurface}; border-bottom: 1px solid ${T.outlineSoft}22; vertical-align: middle; }
          .sk-table tbody tr.audit-row { cursor: pointer; transition: background 0.12s ease; }
          .sk-table tbody tr.audit-row:hover { background: ${T.surfaceContainerLow}; }
          .sk-table tbody tr:last-child td { border-bottom: none; }
          .sk-page-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 8px; border: 1px solid ${T.outlineSoft}66; border-radius: 8px; background: ${T.surfaceCard}; color: ${T.onSurfaceVariant}; font-family: ${FONT_LABEL}; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s ease; line-height: 1; }
          .sk-page-btn:hover:not(:disabled) { border-color: ${T.primary}; color: ${T.primary}; background: ${T.primaryLight}; }
          .sk-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
          .sk-page-btn.active { background: ${T.primary}; color: #fff; border-color: ${T.primary}; }
        `}</style>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.outlineSoft}22`, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "20px", color: T.onSurfaceMuted, pointerEvents: "none" }}>search</span>
              <input type="text" placeholder="Search by user…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                style={{ width: "100%", padding: "9px 12px 9px 40px", background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <FilterChip label="Action" value={actionFilter} onChange={(v) => { setActionFilter(v); setPage(1); }}
              options={[{ label: "All", value: "" }, { label: "Create", value: "CREATE" }, { label: "Update", value: "UPDATE" }, { label: "Delete", value: "DELETE" }]} />
            <FilterChip label="Entity" value={entityFilter} onChange={(v) => { setEntityFilter(v); setPage(1); }}
              options={[{ label: "All", value: "" }, { label: "Company Profile", value: "CompanyProfile" }, { label: "Project", value: "Project" }, { label: "Invoice", value: "Invoice" }, { label: "Payment", value: "Payment" }, { label: "RAB", value: "RAB" }, { label: "Material", value: "Material" }, { label: "Lead", value: "Lead" }, { label: "User", value: "User" }, { label: "Document", value: "Document" }, { label: "Transaction", value: "Transaction" }]} />
            {hasActiveFilters && (
              <button onClick={() => { setActionFilter(""); setEntityFilter(""); setSearchInput(""); setSearch(""); setPage(1); }}
                style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.primary, background: "none", border: "none", cursor: "pointer", padding: "6px 8px" }}>
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 20px", background: T.surfaceContainerLow, borderBottom: `1px solid ${T.outlineSoft}33` }}>
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-3 w-[90px]" />
              <Skeleton className="h-3 w-[120px]" />
              <Skeleton className="h-3 w-[100px] ml-auto" />
              <Skeleton className="h-3 w-[140px] ml-auto" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "14px 20px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
                <Skeleton className="h-4 w-[130px]" />
                <Skeleton className="h-6 w-[80px] rounded-full" />
                <Skeleton className="h-4 w-[110px]" />
                <Skeleton className="h-4 w-[80px] ml-auto" />
                <Skeleton className="h-4 w-[150px] ml-auto" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>manage_search</span>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 6px" }}>No audit entries found</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="sk-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Entity</th>
                  <th>Entity ID</th>
                  <th style={{ width: "40px", textAlign: "right" }} />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionStyle = ACTION_STYLES[log.action] || { color: T.secondary, bg: "rgba(86,94,116,0.08)", label: log.action };
                  const expanded = expandedId === log.id;
                  const detail = renderDiff(log);
                  return (
                    <FragmentRow key={log.id} log={log} expanded={expanded} onToggle={() => setExpandedId(expanded ? null : log.id)} actionStyle={actionStyle} detail={detail} />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && logs.length > 0 && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.outlineSoft}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
              Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
            </p>
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <button className="sk-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: "0 12px" }}>← Prev</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return <button key={n} className={`sk-page-btn ${page === n ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>;
              })}
              {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
              <button className="sk-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: "0 12px" }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FragmentRow({ log, expanded, onToggle, actionStyle, detail }: {
  log: any; expanded: boolean; onToggle: () => void; actionStyle: { color: string; bg: string; label: string }; detail: Record<string, unknown> | null;
}) {
  return (
    <>
      <tr className="audit-row" onClick={onToggle}>
        <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted, whiteSpace: "nowrap" }}>{fmtDate(log.createdAt)}</td>
        <td>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "9999px", fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700, color: actionStyle.color, background: actionStyle.bg, whiteSpace: "nowrap" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: actionStyle.color }} />
            {actionStyle.label}
          </span>
        </td>
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 700, color: T.onSurface }}>
              {getInitials(log.user?.name)}
            </div>
            <div>
              <p style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: T.onSurface, margin: 0, lineHeight: 1.3 }}>{log.user?.name || "System"}</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "11px", color: T.onSurfaceMuted, margin: "1px 0 0" }}>{log.user?.email || ""}</p>
            </div>
          </div>
        </td>
        <td style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant }}>{log.entity}</td>
        <td style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted }}>{log.entityId?.slice(0, 12)}…</td>
        <td style={{ textAlign: "right" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>expand_more</span>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: T.surfaceContainerLow }}>
          <td colSpan={6} style={{ padding: "0" }}>
            <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>ID: {log.entityId}</span>
                {log.ipAddress && <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>IP: {log.ipAddress}</span>}
                <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>At: {fmtDate(log.createdAt)}</span>
              </div>
              {log.action === "UPDATE" && (log.oldData || log.newData) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <DetailBox title="Before" data={log.oldData} accent="#b45309" />
                  <DetailBox title="After" data={log.newData} accent="#15803d" />
                </div>
              )}
              {log.action !== "UPDATE" && detail && (
                <DetailBox title={log.action === "CREATE" ? "Created" : "Deleted"} data={detail} accent={log.action === "CREATE" ? "#15803d" : "#ba1a1a"} />
              )}
              {!detail && <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: 0 }}>No structured data recorded for this entry.</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBox({ title, data, accent }: { title: string; data: unknown; accent: string }) {
  return (
    <div style={{ background: T.surfaceCard, border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", overflow: "hidden" }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.outlineSoft}33`, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: accent }} />
        <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceVariant }}>{title}</span>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", lineHeight: 1.55, color: T.onSurfaceVariant, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "audit">("profile");

  const tabs = [
    { key: "profile" as const, label: "Company Profile", icon: "business" },
    { key: "audit" as const, label: "Audit Log", icon: "history" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: T.onSurface, margin: 0 }}>Settings</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
          Company profile, financial defaults, and system audit trail.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${T.outlineSoft}44` }}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px",
                background: "none", border: "none", borderBottom: active ? `2px solid ${T.primary}` : "2px solid transparent",
                fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: active ? 700 : 500,
                color: active ? T.primary : T.onSurfaceVariant, cursor: "pointer", marginBottom: "-1px",
                transition: "color 0.15s ease",
              }}>
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{t.icon}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "profile" ? <CompanyProfileTab /> : <AuditLogTab />}
    </div>
  );
}
