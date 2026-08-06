"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const META: Record<string, { icon: string; color: string }> = {
  TASK: { icon: "task_alt", color: "#7c3aed" },
  PROGRESS: { icon: "trending_up", color: "#15803d" },
  INVOICE: { icon: "receipt_long", color: "#2563eb" },
  PAYMENT: { icon: "payments", color: "#0d9488" },
  APPROVAL: { icon: "fact_check", color: "#b45309" },
  DOCUMENT: { icon: "description", color: "#4f46e5" },
  SYSTEM: { icon: "notifications", color: "#6f7a72" },
};

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=6", { credentials: "include" });
      if (!res.ok) return;
      const d = await res.json();
      setItems(d.data || []);
      setUnread(d.unreadCount || 0);
    } catch {
      // silent — bell stays empty
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchNotifs(), 0);
    const interval = setInterval(fetchNotifs, 30000); // poll every 30s
    const onFocus = () => fetchNotifs();
    window.addEventListener("focus", onFocus);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotifs]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST", credentials: "include" });
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async (n: any) => {
    if (!n.isRead) {
      await fetch(`/api/notifications/${n.id}`, { method: "PUT", credentials: "include" }).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: T.onSurfaceVariant,
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        aria-label="Notifications"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
          {unread > 0 ? "notifications" : "notifications_none"}
        </span>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              minWidth: "17px",
              height: "17px",
              borderRadius: "9999px",
              background: "#dc2626",
              color: "#fff",
              fontFamily: FONT_LABEL,
              fontSize: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxSizing: "border-box",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: "0",
              width: "360px",
              maxWidth: "92vw",
              background: T.surfaceCard,
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "12px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
              zIndex: 50,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 16px",
                borderBottom: `1px solid ${T.outlineSoft}33`,
              }}
            >
              <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "15px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                Notifications
                {unread > 0 && (
                  <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "9999px", background: T.errorLight, color: T.error, fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700 }}>
                    {unread} new
                  </span>
                )}
              </h3>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: FONT_LABEL,
                    fontSize: "12px",
                    fontWeight: 700,
                    color: T.primary,
                    padding: "4px 6px",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: "380px", overflowY: "auto" }}>
              {items.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft, display: "block", marginBottom: "8px" }}>
                    notifications_off
                  </span>
                  <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted, margin: 0 }}>No notifications yet</p>
                </div>
              ) : (
                items.map((n) => {
                  const meta = META[n.type] || META.SYSTEM;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpen(n)}
                      style={{
                        display: "flex",
                        gap: "12px",
                        width: "100%",
                        textAlign: "left",
                        padding: "12px 16px",
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
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "10px",
                          background: `${meta.color}12`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "17px", color: meta.color }}>
                          {meta.icon}
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.3 }}>
                          {n.title}
                        </p>
                        <p style={{ fontFamily: FONT_BODY, fontSize: "12.5px", color: T.onSurfaceVariant, margin: "2px 0 0", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {n.message}
                        </p>
                        <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                      {!n.isRead && (
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.primary, flexShrink: 0, marginTop: "4px" }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px 16px",
                borderTop: `1px solid ${T.outlineSoft}33`,
                fontFamily: FONT_LABEL,
                fontSize: "13px",
                fontWeight: 700,
                color: T.primary,
                textDecoration: "none",
                background: T.surfaceCard,
              }}
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
