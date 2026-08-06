"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const ADMIN_ROLES = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"];

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
};

function fmtTime(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

function fmtRole(r: string) {
  return r.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * DiscussionTab — project-level comment thread.
 * Fetches and posts comments via /api/projects/[id]/comments.
 */
export function DiscussionTab({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const meId = (session?.user as any)?.id;
  const meRole = (session?.user as any)?.role;
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setComments(d.data || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

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
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || d.error || "Failed to post comment");
      setComments((prev) => [...prev, d.data]);
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
    } catch {
      // silent
    }
  };

  return (
    <div style={card} className="animate-fade-in">
      {/* Header */}
      <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
        <SectionHeaderSmall icon="chat_bubble" title="Discussion" subtitle={`${comments.length} comment${comments.length !== 1 ? "s" : ""} — project-wide conversation`} />
      </div>

      {/* Comment list */}
      <div style={{ padding: "8px 28px" }}>
        {loading ? (
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, padding: "20px 0" }}>Loading comments…</p>
        ) : comments.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft, display: "block", marginBottom: "8px" }}>chat_bubble_outline</span>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>No comments yet. Start the conversation.</p>
          </div>
        ) : (
          comments.map((c) => {
            const isMine = c.author?.id === meId;
            const canDelete = isMine || ADMIN_ROLES.includes(meRole);
            return (
              <div key={c.id} style={{ display: "flex", gap: "12px", padding: "16px 0", borderBottom: `1px solid ${T.outlineSoft}22`, alignItems: "flex-start" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "9999px", background: T.secondaryContainer, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: T.onSurface }}>
                  {c.author?.avatar ? (
                    <img src={c.author.avatar} alt={c.author.name} style={{ width: "38px", height: "38px", borderRadius: "9999px", objectFit: "cover" }} />
                  ) : getInitials(c.author?.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 700, color: T.onSurface }}>{c.author?.name || "Unknown"}</span>
                    <span style={{ padding: "1px 8px", borderRadius: "9999px", background: T.primaryLight, fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: T.primary }}>
                      {fmtRole(c.author?.role)}
                    </span>
                    <span style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted }}>{fmtTime(c.createdAt)}</span>
                  </div>
                  {c.reportId && (
                    <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: "#7c3aed", margin: "4px 0 0" }}>
                      <span className="material-symbols-outlined" style={{ fontSize: "12px", verticalAlign: "middle" }}>monitoring</span> On a progress report
                    </p>
                  )}
                  <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant, margin: "6px 0 0", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.content}</p>
                </div>
                {canDelete && (
                  <button onClick={() => handleDelete(c.id)} title="Delete comment"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.onSurfaceMuted, padding: "4px", borderRadius: "8px", flexShrink: 0 }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = T.error)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceMuted)}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 28px 24px" }}>
        {error && <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.error, margin: "0 0 8px" }}>{error}</p>}
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder="Write a comment… (Enter to send, Shift+Enter for new line)"
            rows={2}
            style={{
              flex: 1,
              padding: "12px 14px",
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "12px",
              fontFamily: FONT_BODY,
              fontSize: "14px",
              color: T.onSurface,
              background: T.surfaceCard,
              outline: "none",
              resize: "vertical",
              minHeight: "56px",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handlePost}
            disabled={posting || !draft.trim()}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "12px 22px", background: T.primary, color: "#fff",
              border: "none", borderRadius: "12px", fontFamily: FONT_LABEL,
              fontSize: "14px", fontWeight: 700, cursor: posting || !draft.trim() ? "not-allowed" : "pointer",
              opacity: posting || !draft.trim() ? 0.5 : 1, whiteSpace: "nowrap",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{posting ? "hourglass_top" : "send"}</span>
            {posting ? "Posting…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeaderSmall({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.primary }}>{icon}</span>
      </div>
      <div>
        <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "16px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{title}</h3>
        <p style={{ fontFamily: FONT_BODY, fontSize: "12.5px", color: T.onSurfaceMuted, margin: "1px 0 0" }}>{subtitle}</p>
      </div>
    </div>
  );
}
