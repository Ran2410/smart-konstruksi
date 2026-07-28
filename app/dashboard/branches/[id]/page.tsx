"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Styles ────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: `1px solid rgba(190,201,193,0.25)`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
  transition: "box-shadow 0.2s ease",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid rgba(190,201,193,0.25)",
};

const editFieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  background: T.surfaceContainerLow,
  border: `1.5px solid ${T.outlineSoft}`,
  borderRadius: "12px",
  fontFamily: FONT_BODY,
  fontSize: "14px",
  lineHeight: "1.5",
  color: T.onSurface,
  outline: "none",
  transition: "all 0.2s ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_LABEL,
  fontSize: "11px",
  fontWeight: 600,
  color: T.outline,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

// ── Role-based permissions ────────────────────────────────────────────────
const CAN_EDIT = ["SUPER_ADMIN", "OWNER"];

// ── Helpers ───────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ── Sub-components ────────────────────────────────────────────────────────
function InfoRow({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "6px",
      padding: "16px", background: T.surfaceContainerLow,
      borderRadius: "12px", border: `1px solid ${T.outlineSoft}30`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && (
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.outline }}>
            {icon}
          </span>
        )}
        <span style={{
          fontFamily: FONT_LABEL, fontSize: "10px", fontWeight: 600,
          color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          {label}
        </span>
      </div>
      <span style={{
        fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface,
        lineHeight: "1.5", fontWeight: 500,
      }}>
        {children || "—"}
      </span>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, badge }: {
  icon: string; title: string; subtitle?: string; badge?: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: `0 4px 12px rgba(0,79,53,0.1)`,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>
          {icon}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{
            fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700,
            color: T.onSurface, margin: 0, letterSpacing: "-0.01em",
          }}>
            {title}
          </h3>
          {badge && (
            <span style={{
              padding: "4px 12px", borderRadius: "9999px",
              fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600,
              background: T.primaryLight, color: T.primary,
            }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted,
            margin: "4px 0 0", lineHeight: "1.4",
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: string; label: string; value: number; color: string;
}) {
  return (
    <div style={{
      ...cardStyle, padding: "20px", display: "flex",
      alignItems: "center", gap: "16px",
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: `${color}12`, display: "flex",
        alignItems: "center", justifyContent: "center",
        flexShrink: 0, border: `1.5px solid ${color}20`,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color }}>
          {icon}
        </span>
      </div>
      <div>
        <div style={{
          fontFamily: FONT_DISPLAY, fontSize: "28px", fontWeight: 700,
          color: T.onSurface, lineHeight: 1.1,
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600,
          color: T.outline, marginTop: "4px", letterSpacing: "0.04em",
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
      <div style={{ ...cardStyle, height: "80px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ ...cardStyle, height: "100px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <Skeleton className="h-12 w-12 rounded-[14px]" />
              <div style={{ flex: 1 }}>
                <Skeleton className="h-7 w-10 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function BranchDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const branchId = params.id as string;
  const userRole = (session?.user as any)?.role;
  const canEdit = CAN_EDIT.includes(userRole || "");

  // ── State ──
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "", email: "" });
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Fetch Branch ──
  const fetchBranch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/branches/${branchId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Branch not found");
      const data = await res.json();
      setBranch(data);
      setEditForm({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
      });
      setEditActive(data.isActive !== false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => { if (session) fetchBranch(); }, [session, fetchBranch]);

  // ── Focus/Blur handlers ──
  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = T.primary;
    e.target.style.boxShadow = "0 0 0 4px rgba(0,79,53,0.08)";
    e.target.style.background = "#fff";
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = T.outlineSoft;
    e.target.style.boxShadow = "none";
    e.target.style.background = T.surfaceContainerLow;
  };

  // ── Edit Mode ──
  function startEdit() {
    setEditForm({
      name: branch.name || "",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
    });
    setEditActive(branch.isActive !== false);
    setSaveError(null);
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setSaveError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm.name.trim()) {
      setSaveError("Branch name is required");
      return;
    }
    setSaving(true); setSaveError(null);
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editForm.name.trim(),
          address: editForm.address.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
          isActive: editActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update branch");
      }
      const updated = await res.json();
      setBranch(updated);
      setEditMode(false);
      router.push("/dashboard/branches");
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ──
  async function handleDelete() {
    setDeleting(true); setDeleteError(null);
    try {
      const res = await fetch(`/api/branches/${branchId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete branch");
      }
      router.push("/dashboard/branches");
    } catch (err: any) {
      setDeleteError(err.message);
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  }

  // ── Loading State ──
  if (loading) return <DetailSkeleton />;

  // ── Error State ──
  if (error || !branch) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ ...cardStyle, textAlign: "center", padding: "64px 32px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.error, display: "block", marginBottom: "12px" }}>error</span>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "20px", color: T.onSurface, margin: "0 0 8px" }}>Branch Not Found</h3>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: "0 0 24px" }}>{error || "The branch you are looking for does not exist or has been deleted."}</p>
          <Link href="/dashboard/branches" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 24px", background: T.primary, color: "#fff",
            border: "none", borderRadius: "10px", fontFamily: FONT_LABEL,
            fontSize: "14px", fontWeight: 700, textDecoration: "none",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Branches
          </Link>
        </div>
      </div>
    );
  }

  const users = branch.users || [];
  const totalUsers = branch._count?.users || users.length;
  const totalProjects = branch._count?.projects || 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`
        textarea {
          resize: vertical;
          min-height: 100px;
          line-height: 1.6;
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "20px",
        marginTop: "20px",
      }}>
        <Link
          href="/dashboard/branches"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "44px", height: "44px", borderRadius: "14px",
            background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`,
            color: T.onSurfaceVariant, textDecoration: "none", flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = T.surfaceContainerLow;
            e.currentTarget.style.borderColor = T.outline;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = T.surfaceCard;
            e.currentTarget.style.borderColor = T.outlineSoft;
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>arrow_back</span>
        </Link>
        <div style={{ flex: 1 }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY, fontSize: "32px", fontWeight: 700,
            color: T.onSurface, margin: "0 0 4px", letterSpacing: "-0.02em",
            display: "flex", alignItems: "center", gap: "12px"
          }}>
            {branch.name}
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "9999px", fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 700, color: branch.isActive !== false ? T.primary : T.error, background: branch.isActive !== false ? T.primaryLight : T.errorContainer, whiteSpace: "nowrap" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: branch.isActive !== false ? T.primary : T.error, flexShrink: 0 }} />
              {branch.isActive !== false ? "Active" : "Inactive"}
            </span>
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted,
            margin: 0, lineHeight: "1.5"
          }}>
            Branch details and team management. {totalUsers} members, {totalProjects} projects.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {!editMode && canEdit && (
            <button
              onClick={startEdit}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", background: T.primary, color: "#fff",
                border: "none", borderRadius: "10px", fontFamily: FONT_LABEL,
                fontSize: "14px", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,79,53,0.2)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
              Edit
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", background: T.errorLight, color: T.error,
                border: `1px solid rgba(186,26,26,0.2)`, borderRadius: "10px",
                fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard icon="group" label="Team Members" value={totalUsers} color={T.primary} />
        <StatCard icon="architecture" label="Projects" value={totalProjects} color={T.secondary} />
        <StatCard icon="email" label="Has Email" value={branch.email ? 1 : 0} color={branch.email ? T.success : T.outline} />
        <StatCard icon="phone" label="Has Phone" value={branch.phone ? 1 : 0} color={branch.phone ? T.success : T.outline} />
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <>
          <div onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }} style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            zIndex: 49, backdropFilter: "blur(4px)",
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", zIndex: 50,
            background: T.surfaceCard, borderRadius: "20px",
            padding: "32px", width: "min(440px, 90vw)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            border: `1px solid rgba(190,201,193,0.25)`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "14px",
                background: T.errorLight, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.error }}>warning</span>
              </div>
              <div>
                <h3 style={{
                  fontFamily: FONT_DISPLAY, fontSize: "20px", fontWeight: 700,
                  color: T.onSurface, margin: 0,
                }}>Delete Branch</h3>
                <p style={{
                  fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted,
                  margin: "2px 0 0",
                }}>This action cannot be undone.</p>
              </div>
            </div>
            <p style={{
              fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant,
              margin: "0 0 8px", lineHeight: "1.5",
            }}>
              Are you sure you want to delete <strong style={{ color: T.onSurface }}>{branch.name}</strong>?
            </p>
            <p style={{
              fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted,
              margin: 0, lineHeight: "1.5",
            }}>
              {totalUsers > 0 ? (
                <span style={{ color: T.error }}>
                  This branch has {totalUsers} active member(s) and cannot be deleted. Please reassign or remove them first.
                </span>
              ) : (
                "All associated data will be permanently removed."
              )}
            </p>
            {deleteError && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 16px", marginTop: "12px",
                background: T.errorContainer, border: `1px solid rgba(186,26,26,0.2)`,
                borderRadius: "10px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.error }}>error</span>
                <span style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.error }}>{deleteError}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                disabled={deleting}
                style={{
                  padding: "10px 20px", background: T.surfaceCard,
                  border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
                  fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                  color: T.onSurface, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "10px 20px", background: deleting ? T.outlineSoft : T.error,
                  border: "none", borderRadius: "10px",
                  fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                  color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    Delete Branch
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Branch Information Card */}
      <div style={cardStyle}>
        <SectionHeader
          icon="domain"
          title="Branch Information"
          subtitle={editMode ? "Edit the branch details below." : "Current branch configuration."}
        />

        {editMode ? (
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {saveError && (
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 18px", background: T.errorContainer,
                border: `1px solid rgba(186,26,26,0.2)`, borderRadius: "12px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error }}>error</span>
                <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.error, margin: 0, flex: 1 }}>{saveError}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>Branch Name <span style={{ color: T.error }}>*</span></label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                onFocus={focusInput}
                onBlur={blurInput}
                style={editFieldStyle}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle}>Address</label>
              <textarea
                value={editForm.address}
                onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
                onFocus={focusInput}
                onBlur={blurInput}
                style={editFieldStyle}
              />
            </div>

            {/* Contact Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={editFieldStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={editFieldStyle}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <button type="button" onClick={() => setEditActive(v => !v)}
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 16px", background: editActive ? T.primaryLight : T.errorContainer, border: `1px solid ${editActive ? T.primary : T.error}44`, borderRadius: "10px", cursor: "pointer", fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600, color: editActive ? T.primary : T.error }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "9999px", background: editActive ? T.primary : T.error, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "12px", color: "#fff", fontVariationSettings: "'FILL' 1" }}>{editActive ? "check" : "close"}</span>
                </div>
                {editActive ? "Active" : "Inactive"}
              </button>
              <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                Inactive branches will be hidden from user selection and project assignments.
              </p>
            </div>

            {/* Actions */}
            <div style={{
              display: "flex", justifyContent: "flex-end", gap: "12px",
              paddingTop: "16px", borderTop: `1px solid rgba(190,201,193,0.25)`,
            }}>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                style={{
                  padding: "12px 24px", background: T.surfaceCard,
                  border: `1px solid ${T.outlineSoft}`, borderRadius: "12px",
                  fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                  color: T.onSurface, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 28px", background: saving ? T.outlineSoft : T.primary,
                  border: "none", borderRadius: "12px",
                  fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                  color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: saving ? "none" : "0 2px 8px rgba(0,79,53,0.2)",
                }}
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <InfoRow label="Branch Name" icon="domain">{branch.name}</InfoRow>
            <InfoRow label="Created" icon="calendar_today">{formatDate(branch.createdAt)}</InfoRow>
            <InfoRow label="Address" icon="location_on">{branch.address}</InfoRow>
            <InfoRow label="Phone" icon="phone">{branch.phone}</InfoRow>
            <InfoRow label="Email" icon="email">{branch.email}</InfoRow>
            <InfoRow label="Last Updated" icon="update">{formatDate(branch.updatedAt)}</InfoRow>
          </div>
        )}
      </div>

      {/* Members Card */}
      <div style={cardStyle}>
        <SectionHeader
          icon="group"
          title="Branch Members"
          subtitle={`${totalUsers} member(s) assigned to this branch.`}
          badge={String(totalUsers)}
        />

        {users.length === 0 ? (
          <div style={{
            padding: "40px", textAlign: "center",
            background: T.surfaceContainerLow, borderRadius: "12px",
            border: `1px solid ${T.outlineSoft}30`,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft, display: "block", marginBottom: "8px" }}>group</span>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.outline, margin: 0 }}>No members in this branch yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: "left", padding: "12px 16px",
                    fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: T.outline, background: "rgba(239,244,255,0.5)",
                    borderBottom: `1px solid rgba(190,201,193,0.3)`,
                  }}>Name</th>
                  <th style={{
                    textAlign: "left", padding: "12px 16px",
                    fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: T.outline, background: "rgba(239,244,255,0.5)",
                    borderBottom: `1px solid rgba(190,201,193,0.3)`,
                  }}>Email</th>
                  <th style={{
                    textAlign: "left", padding: "12px 16px",
                    fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: T.outline, background: "rgba(239,244,255,0.5)",
                    borderBottom: `1px solid rgba(190,201,193,0.3)`,
                  }}>Role</th>
                  <th style={{
                    textAlign: "left", padding: "12px 16px",
                    fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: T.outline, background: "rgba(239,244,255,0.5)",
                    borderBottom: `1px solid rgba(190,201,193,0.3)`,
                  }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: `1px solid rgba(190,201,193,0.2)` }}>
                    <td style={{ padding: "14px 16px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, verticalAlign: "middle" }}>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant, verticalAlign: "middle" }}>
                      {u.email}
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <span style={{
                        display: "inline-block", padding: "4px 10px",
                        borderRadius: "9999px", fontFamily: FONT_LABEL,
                        fontSize: "11px", fontWeight: 600,
                        background: T.primaryLight, color: T.primary,
                      }}>
                        {u.role?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "4px 10px", borderRadius: "9999px",
                        fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 700,
                        color: u.isActive ? T.success : T.error,
                        background: u.isActive ? T.successLight : T.errorLight,
                      }}>
                        <span style={{
                          width: "6px", height: "6px", borderRadius: "50%",
                          background: u.isActive ? T.success : T.error,
                        }} />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
