"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { T, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

/**
 * ReportComments — comment thread scoped to a single progress report.
 * Used inside the report detail modal (reportId + projectId).
 */
export function ReportComments({ projectId, reportId }: { projectId: string; reportId: string }) {
  const { data: session } = useSession();
  const meId = (session?.user as any)?.id;
  const meRole = (session?.user as any)?.role;
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments?reportId=${reportId}`, { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setComments(d.data || []);
      setCount(d.data?.length || 0);
    } catch {
      // silent
    }
  }, [projectId, reportId]);

  useEffect(() => {
    const t = setTimeout(() => fetchComments(), 0);
    return () => clearTimeout(t);
  }, [fetchComments]);

  const handlePost = async () => {
    const content = draft.trim();
    if (!content || posting) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, reportId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || "Failed to post comment");
      setComments((prev) => [...prev, d.data]);
      setCount((c) => c + 1);
      setDraft("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) return;
      setComments((prev) => prev.filter((c) => c.id !== id));
      setCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  return (
    <div style={{ borderTop: `1px solid ${T.outlineSoft}33` }}>
      {/* Toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "14px 28px",
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "100%",
          fontFamily: FONT_LABEL,
          fontSize: "13px",
          fontWeight: 600,
          color: T.primary,
          textAlign: "left",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
          {open ? "expand_less" : "chat_bubble"}
        </span>
        Comments ({count})
      </button>

      {open && (
        <div style={{ padding: "0 28px 16px" }}>
          {/* List */}
          {comments.length === 0 ? (
            <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: "0 0 12px" }}>
              No comments on this report yet.
            </p>
          ) : (
            <div style={{ marginBottom: "12px" }}>
              {comments.map((c) => {
                const canDelete = c.author?.id === meId || ADMIN_ROLES.includes(meRole);
                return (
                  <div key={c.id} style={{ display: "flex", gap: "10px", padding: "10px 0", borderBottom: `1px solid ${T.outlineSoft}22`, alignItems: "flex-start" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 700, color: T.onSurface }}>
                      {getInitials(c.author?.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: FONT_LABEL, fontSize: "12.5px", fontWeight: 700, color: T.onSurface }}>{c.author?.name || "Unknown"}</span>
                        <span style={{ fontFamily: FONT_LABEL, fontSize: "10.5px", color: T.onSurfaceMuted }}>{fmtTime(c.createdAt)}</span>
                      </div>
                      <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant, margin: "3px 0 0", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.content}</p>
                    </div>
                    {canDelete && (
                      <button onClick={() => handleDelete(c.id)} title="Delete comment"
                        style={{ background: "none", border: "none", cursor: "pointer", color: T.onSurfaceMuted, padding: "2px", flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Input */}
          {error && <p style={{ fontFamily: FONT_BODY, fontSize: "12.5px", color: T.error, margin: "0 0 6px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePost();
                }
              }}
              placeholder="Reply to this report…"
              style={{
                flex: 1,
                padding: "10px 12px",
                border: `1px solid ${T.outlineSoft}`,
                borderRadius: "10px",
                fontFamily: FONT_BODY,
                fontSize: "13.5px",
                color: T.onSurface,
                background: T.surfaceCard,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handlePost}
              disabled={posting || !draft.trim()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "10px 16px", background: T.primary, color: "#fff",
                border: "none", borderRadius: "10px", fontFamily: FONT_LABEL,
                fontSize: "13px", fontWeight: 700, cursor: posting || !draft.trim() ? "not-allowed" : "pointer",
                opacity: posting || !draft.trim() ? 0.5 : 1, whiteSpace: "nowrap",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{posting ? "hourglass_top" : "send"}</span>
              {posting ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
