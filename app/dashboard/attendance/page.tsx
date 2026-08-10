"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

const CAN_CHECK_IN = ["SUPER_ADMIN", "SITE_MANAGER", "MANDOR"];
const CAN_MANAGE = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER"];

function fmtTime(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDuration(checkIn: string, checkOut: string | null) {
  if (!checkOut) return "—";
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return "—";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 999, background: type === "success" ? "#15803d" : "#ba1a1a", color: "#fff", padding: "14px 24px", borderRadius: "12px", fontFamily: FONT_BODY, fontSize: "14px", fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "12px" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{type === "success" ? "check_circle" : "error"}</span>
      {message}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// WORKER CARD — Check-in / Check-out
// ════════════════════════════════════════════════════════════════════════════
function WorkerCard({ onChanged }: { onChanged: () => void }) {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [projectId, setProjectId] = useState("");
  const [openRecord, setOpenRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const meId = (session?.user as any)?.id;

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects?limit=100", { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setProjects(d.data || []);
    } catch {
      setProjects([]);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance?date=${todayStr()}&limit=50`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      // Find an open record belonging to me (mandor scope returns own records)
      const open = (d.data || []).find((r: any) => !r.checkOut && r.user?.id === meId) || null;
      setOpenRecord(open);
    } catch {
      setOpenRecord(null);
    } finally {
      setLoading(false);
    }
  }, [meId]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProjects();
      fetchStatus();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchProjects, fetchStatus]);

  const handleCheckIn = async () => {
    if (!projectId) {
      setToast({ message: "Select a project first", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId,
          notes: notes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || "Check-in failed");
      setToast({ message: "Checked in successfully", type: "success" });
      setNotes("");
      onChanged();
      fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || "Check-out failed");
      setToast({ message: "Checked out successfully", type: "success" });
      onChanged();
      fetchStatus();
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={card}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>schedule</span>
          </div>
          <div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Field Attendance</h3>
            <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>
              {openRecord ? `Checked in at ${fmtTime(openRecord.checkIn)} — don't forget to check out.` : "Check in when you arrive at the site."}
            </p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : openRecord ? (
          /* Checked in — show check-out */
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(220,252,231,0.6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "34px", color: T.success }}>check_circle</span>
            </div>
            <p style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Checked in at {fmtTime(openRecord.checkIn)}</p>
            <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 16px" }}>{openRecord.project?.name}</p>
            <button onClick={handleCheckOut} disabled={busy}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 34px", background: T.error, color: "#fff", border: "none", borderRadius: "12px", fontFamily: FONT_LABEL, fontSize: "15px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{busy ? "hourglass_top" : "logout"}</span>
              {busy ? "Processing…" : "Check Out"}
            </button>
          </div>
        ) : (
          /* Not checked in — show form */
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 6px" }}>Project *</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, background: T.surfaceCard, outline: "none", boxSizing: "border-box", cursor: "pointer" }}>
                <option value="">Select project…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 6px" }}>Notes (optional)</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. kerja pondasi, cuaca cerah"
                style={{ width: "100%", padding: "11px 14px", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, background: T.surfaceCard, outline: "none", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button onClick={handleCheckIn} disabled={busy}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 34px", background: T.primary, color: "#fff", border: "none", borderRadius: "12px", fontFamily: FONT_LABEL, fontSize: "15px", fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", boxShadow: "0 2px 6px rgba(0,79,53,0.25)", opacity: busy ? 0.6 : 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>{busy ? "hourglass_top" : "login"}</span>
                {busy ? "Processing…" : "Check In"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RECORDS TABLE
// ════════════════════════════════════════════════════════════════════════════
function RecordsTable() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const isManager = CAN_MANAGE.includes(role || "");

  const [records, setRecords] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (projectFilter) params.set("projectId", projectFilter);
    if (dateFilter) params.set("date", dateFilter);
    try {
      const res = await fetch(`/api/attendance?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setRecords(d.data || []);
      setTotalPages(d.pagination?.totalPages || 1);
      setTotal(d.pagination?.total ?? 0);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, projectFilter, dateFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchRecords(), 0);
    return () => clearTimeout(t);
  }, [fetchRecords]);

  useEffect(() => {
    fetch("/api/projects?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.data) setProjects(d.data); })
      .catch(() => {});
  }, []);

  return (
    <div style={card}>
      <style>{`
        .sk-table { width: 100%; border-collapse: collapse; }
        .sk-table th { text-align: left; padding: 12px 20px; font-family: ${FONT_LABEL}; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: ${T.onSurfaceMuted}; background: ${T.surfaceContainerLow}; border-bottom: 1px solid ${T.outlineSoft}33; }
        .sk-table td { padding: 14px 20px; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.onSurface}; border-bottom: 1px solid ${T.outlineSoft}22; vertical-align: middle; }
        .sk-table tbody tr { transition: background 0.12s ease; }
        .sk-table tbody tr:hover { background: ${T.surfaceContainerLow}; }
        .sk-table tbody tr:last-child td { border-bottom: none; }
      `}</style>

      {/* Toolbar */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.outlineSoft}22`, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.onSurface }}>Attendance Records</span>
        {isManager && (
          <>
            <select value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "12.5px", color: T.onSurface, background: T.surfaceContainerLow, cursor: "pointer" }}>
              <option value="">All projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="date" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              style={{ padding: "8px 12px", border: `1px solid ${T.outlineSoft}44`, borderRadius: "10px", fontFamily: FONT_LABEL, fontSize: "12.5px", color: T.onSurface, background: T.surfaceContainerLow, cursor: "pointer" }} />
          </>
        )}
        {!isManager && (
          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted }}>{fmtDate(dateFilter)}</span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "4px 0" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", gap: "24px", padding: "14px 20px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div style={{ padding: "56px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "52px", color: T.outlineSoft, display: "block", marginBottom: "10px" }}>schedule</span>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "17px", fontWeight: 600, color: T.onSurface, margin: "0 0 6px" }}>No attendance records</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>No check-ins for the selected filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="sk-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Project</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 700, color: T.onSurface, flexShrink: 0 }}>
                        {r.user?.name?.split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div>
                        <p style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: T.onSurface, margin: 0, lineHeight: 1.3 }}>{r.user?.name || "—"}</p>
                        <p style={{ fontFamily: FONT_BODY, fontSize: "11px", color: T.onSurfaceMuted, margin: "1px 0 0" }}>{r.user?.role?.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant }}>{r.project?.name || "—"}</td>
                  <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurface }}>
                    {fmtDate(r.checkIn)} · {fmtTime(r.checkIn)}
                  </td>
                  <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: r.checkOut ? T.onSurface : T.warning }}>
                    {r.checkOut ? `${fmtDate(r.checkOut)} · ${fmtTime(r.checkOut)}` : "In progress"}
                  </td>
                  <td style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: r.checkOut ? T.primary : T.onSurfaceMuted }}>
                    {fmtDuration(r.checkIn, r.checkOut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && records.length > 0 && (
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.outlineSoft}22`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
            Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total}
          </p>
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}
              style={{ padding: "8px 14px", border: `1px solid ${T.outlineSoft}66`, borderRadius: "8px", background: T.surfaceCard, color: T.onSurfaceVariant, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontFamily: FONT_LABEL, fontSize: "13px", color: T.onSurfaceMuted }}>{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
              style={{ padding: "8px 14px", border: `1px solid ${T.outlineSoft}66`, borderRadius: "8px", background: T.surfaceCard, color: T.onSurfaceVariant, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function AttendancePage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canCheckIn = CAN_CHECK_IN.includes(role || "");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: T.onSurface, margin: 0 }}>Attendance</h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
          {canCheckIn ? "Check in and out at your project site." : "Monitor field attendance across projects."}
        </p>
      </div>

      {canCheckIn && <WorkerCard onChanged={() => setRefreshKey((k) => k + 1)} />}

      <RecordsTable key={refreshKey} />
    </div>
  );
}
