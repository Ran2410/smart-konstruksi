"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL, RADIUS, SPACING, SHADOWS } from "@/lib/design-tokens";

// ── Shared Styles ──
const card = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
} as const;

const btnPrimary = {
  background: T.primary,
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  fontFamily: FONT_LABEL,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.02em",
} as const;

const btnOutline = {
  ...btnPrimary,
  background: "transparent",
  color: T.onSurfaceVariant,
  border: `1px solid ${T.outlineSoft}`,
} as const;

const input = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${T.outlineSoft}`,
  fontFamily: FONT_BODY,
  fontSize: "14px",
  color: T.onSurface,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
} as const;

const label = {
  fontFamily: FONT_LABEL,
  fontSize: "12px",
  fontWeight: 600,
  color: T.onSurfaceVariant,
  display: "block",
  marginBottom: "6px",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
} as const;

const thCell = {
  padding: "12px 16px",
  fontFamily: FONT_LABEL,
  fontSize: "11px",
  fontWeight: 600,
  color: T.onSurfaceMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: T.surfaceContainerLow,
  textAlign: "left" as const,
  borderBottom: `2px solid ${T.outlineSoft}44`,
  whiteSpace: "nowrap" as const,
};

const tdCell = {
  padding: "14px 16px",
  fontFamily: FONT_BODY,
  fontSize: "13px",
  color: T.onSurface,
  borderBottom: `1px solid ${T.outlineSoft}22`,
  verticalAlign: "middle" as const,
};

// ── Types ──
type Category = {
  id: string;
  name: string;
  description: string | null;
  documentCount?: number;
  createdAt: string;
};

// ── Page ──
export default function DocumentCategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role as string;
  const canManage = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ADMIN_KANTOR"].includes(role);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ── Data Fetching ──
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents/categories?limit=100");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setCategories(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ── Handlers ──
  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: "", description: "" });
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setError("");
    setSaving(true);
    try {
      const url = editItem
        ? `/api/documents/categories/${editItem.id}`
        : "/api/documents/categories";
      const method = editItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save");
        return;
      }

      setShowModal(false);
      fetchCategories();
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.documentCount && cat.documentCount > 0) {
      alert(
        `Cannot delete "${cat.name}" because it has ${cat.documentCount} document(s). Reassign those documents first.`
      );
      return;
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      const res = await fetch(`/api/documents/categories/${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete");
        return;
      }
      fetchCategories();
    } catch (e) {
      console.error(e);
    }
  };

  // ── Helpers ──
  const cellMuted = (text: string) => (
    <span style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted }}>
      {text}
    </span>
  );

  const rowHover = {
    onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.currentTarget.style.backgroundColor = T.surfaceContainerLow;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
      e.currentTarget.style.backgroundColor = "transparent";
    },
  };

  // ── Render ──
  return (
    <div style={{ padding: SPACING.xl, maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "24px",
              fontWeight: 700,
              color: T.onSurface,
              margin: 0,
            }}
          >
            Document Categories
          </h1>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "14px",
              color: T.onSurfaceMuted,
              margin: "4px 0 0",
            }}
          >
            Manage document categories
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            style={btnPrimary}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            + New Category
          </button>
        )}
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {/* Skeleton header */}
            <div
              style={{
                display: "flex",
                gap: "24px",
                padding: "12px 16px",
                background: T.surfaceContainerLow,
                borderBottom: `2px solid ${T.outlineSoft}44`,
              }}
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
            </div>
            {/* Skeleton rows */}
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "24px",
                  padding: "14px 16px",
                  borderBottom: `1px solid ${T.outlineSoft}22`,
                }}
              >
                <Skeleton className="h-5 w-[160px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-6 w-9 ml-auto" />
                <div style={{ display: "flex", gap: "6px" }}>
                  <Skeleton className="h-8 w-12 rounded" />
                  <Skeleton className="h-8 w-14 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>
              No categories yet.
            </p>
            {canManage && (
              <button
                onClick={openCreate}
                style={{ ...btnPrimary, marginTop: "12px" }}
              >
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Scrollable table wrapper */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thCell}>Name</th>
                    <th style={thCell}>Description</th>
                    <th style={{ ...thCell, textAlign: "center", width: "100px" }}>Documents</th>
                    <th style={{ ...thCell, textAlign: "right", width: "160px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const hasDocs = cat.documentCount && cat.documentCount > 0;
                    return (
                      <tr key={cat.id} {...rowHover}>
                        <td style={tdCell}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontFamily: FONT_BODY,
                              fontSize: "14px",
                              color: T.onSurface,
                            }}
                          >
                            {cat.name}
                          </span>
                        </td>
                        <td style={tdCell}>
                          <span
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: "13px",
                              color: T.onSurfaceMuted,
                            }}
                          >
                            {cat.description || "—"}
                          </span>
                        </td>
                        <td style={{ ...tdCell, textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              fontSize: "11px",
                              fontFamily: FONT_LABEL,
                              fontWeight: 600,
                              background: T.surfaceContainerLow,
                              color: T.onSurfaceVariant,
                            }}
                          >
                            {cat.documentCount ?? 0}
                          </span>
                        </td>
                        <td style={{ ...tdCell, textAlign: "right" }}>
                          {canManage && (
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", position: "relative" }}>
                              {/* Kebab menu */}
                              <div style={{ position: "relative" }}>
                                <button
                                  onClick={() => setOpenMenu(openMenu === cat.id ? null : cat.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    padding: "6px",
                                    borderRadius: "8px",
                                    color: T.onSurfaceMuted,
                                    display: "inline-flex",
                                    lineHeight: 1,
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = T.surfaceContainerLow;
                                  }}
                                  onMouseLeave={(e) => {
                                    if (openMenu !== cat.id)
                                      e.currentTarget.style.background = "none";
                                  }}
                                >
                                  <span
                                    className="material-symbols-outlined"
                                    style={{ fontSize: "20px" }}
                                  >
                                    more_vert
                                  </span>
                                </button>
                                {openMenu === cat.id && (
                                  <>
                                    <div
                                      style={{ position: "fixed", inset: 0, zIndex: 50 }}
                                      onClick={() => setOpenMenu(null)}
                                    />
                                    <div
                                      style={{
                                        position: "absolute",
                                        right: 0,
                                        top: "100%",
                                        marginTop: "4px",
                                        zIndex: 51,
                                        background: "#fff",
                                        borderRadius: "12px",
                                        border: `1px solid ${T.outlineSoft}`,
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        minWidth: "160px",
                                        overflow: "hidden",
                                      }}
                                    >
                                      <button
                                        onClick={() => {
                                          openEdit(cat);
                                          setOpenMenu(null);
                                        }}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          width: "100%",
                                          padding: "10px 16px",
                                          border: "none",
                                          background: "transparent",
                                          fontFamily: "'Inter', sans-serif",
                                          fontSize: "13px",
                                          color: T.onSurface,
                                          cursor: "pointer",
                                          textAlign: "left",
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.background = "#f8fafc";
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.background = "transparent";
                                        }}
                                      >
                                        <span
                                          className="material-symbols-outlined"
                                          style={{ fontSize: "18px", color: T.onSurfaceMuted }}
                                        >
                                          edit
                                        </span>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDelete(cat);
                                          setOpenMenu(null);
                                        }}
                                        disabled={
                                          hasDocs ? true : false
                                        }
                                        title={
                                          hasDocs
                                            ? `Has ${cat.documentCount} document(s)`
                                            : `Delete ${cat.name}`
                                        }
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          width: "100%",
                                          padding: "10px 16px",
                                          border: "none",
                                          background: "transparent",
                                          fontFamily: "'Inter', sans-serif",
                                          fontSize: "13px",
                                          color: hasDocs ? T.onSurfaceMuted : T.error,
                                          cursor: hasDocs ? "not-allowed" : "pointer",
                                          textAlign: "left",
                                          opacity: hasDocs ? 0.5 : 1,
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!hasDocs)
                                            e.currentTarget.style.background = "#fef2f2";
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!hasDocs)
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                      >
                                        <span
                                          className="material-symbols-outlined"
                                          style={{ fontSize: "18px" }}
                                        >
                                          delete
                                        </span>
                                        Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 101,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ ...card, width: "450px", maxWidth: "90vw" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: "18px",
                fontWeight: 700,
                color: T.onSurface,
                margin: "0 0 20px",
              }}
            >
              {editItem ? "Edit Category" : "New Category"}
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={label}>Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                style={input}
                placeholder="e.g. Contract Documents"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                style={{ ...input, minHeight: "80px", resize: "vertical" }}
                placeholder="Optional description"
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: `1px solid ${T.error}44`,
                  borderRadius: "10px",
                  marginBottom: "16px",
                  fontFamily: FONT_BODY,
                  fontSize: "13px",
                  color: T.error,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={btnOutline}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={btnPrimary}
                disabled={saving || !formData.name.trim()}
              >
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
