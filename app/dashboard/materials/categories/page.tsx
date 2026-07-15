"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const T = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#eff4ff",
  error: "#ba1a1a",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
};

const btnPrimary: React.CSSProperties = {
  background: T.primary,
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  fontFamily: T.fontLabel,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.02em",
};

const btnOutline: React.CSSProperties = {
  ...btnPrimary,
  background: "transparent",
  color: T.onSurfaceVariant,
  border: `1px solid ${T.outlineSoft}`,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${T.outlineSoft}`,
  fontFamily: T.fontBody,
  fontSize: "14px",
  color: T.onSurface,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  fontFamily: T.fontLabel,
  fontSize: "12px",
  fontWeight: 600,
  color: T.onSurfaceVariant,
  display: "block",
  marginBottom: "6px",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const cellText: React.CSSProperties = {
  fontFamily: T.fontBody,
  fontSize: "13px",
  color: T.onSurface,
};

const cellMuted: React.CSSProperties = {
  ...cellText,
  color: T.onSurfaceMuted,
};

const badge: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontFamily: T.fontLabel,
  fontWeight: 600,
  display: "inline-block",
};

// ── Shared Table Styles ──
const thCell: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: "'Geist', monospace",
  fontSize: "11px",
  fontWeight: 600,
  color: T.onSurfaceMuted,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: T.surfaceContainerLow,
  textAlign: "left",
  borderBottom: `2px solid ${T.outlineSoft}44`,
  whiteSpace: "nowrap",
};

const tdCell: React.CSSProperties = {
  padding: "14px 16px",
  fontFamily: "'Inter', sans-serif",
  fontSize: "13px",
  color: T.onSurface,
  borderBottom: `1px solid ${T.outlineSoft}22`,
  verticalAlign: "middle",
};

const rowHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.backgroundColor = "#f8fafc";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLTableRowElement>) => {
    e.currentTarget.style.backgroundColor = "transparent";
  },
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  _count: { materials: number };
  createdAt: string;
};

export default function MaterialCategoriesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const canCreate = session?.user?.role && ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "ADMIN_KANTOR", "LOGISTIK"].includes(session.user.role as string);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "100");
      const res = await fetch(`/api/materials/categories?${params}`);
      const json = await res.json();
      setCategories(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditItem(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const url = editItem
        ? `/api/materials/categories/${editItem.id}`
        : "/api/materials/categories";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        return;
      }
      setShowModal(false);
      fetchCategories();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/materials/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete");
        return;
      }
      fetchCategories();
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: "32px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Material Categories</h1>
          <p style={{ ...cellMuted, margin: "4px 0 0", fontSize: "14px" }}>Manage material categories for catalog &amp; purchasing</p>
        </div>
        {canCreate && (
          <button onClick={openCreate} style={btnPrimary}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >+ New Category</button>
        )}
      </div>

      {/* Search */}
      <div style={{ ...card, padding: "16px", marginBottom: "16px" }}>
        <input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {/* Skeleton header */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 16px", background: T.surfaceContainerLow, borderBottom: `2px solid ${T.outlineSoft}44` }}>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
            </div>
            {/* Skeleton rows */}
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "14px 16px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
                <Skeleton className="h-5 w-[160px]" />
                <Skeleton className="h-4 w-[240px]" />
                <Skeleton className="h-6 w-9 rounded-full ml-auto" />
                <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                  <Skeleton className="h-8 w-14 rounded-lg" />
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p style={cellMuted}>No categories yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thCell}>Name</th>
                <th style={thCell}>Description</th>
                <th style={{ ...thCell, textAlign: "center" }}>Materials</th>
                <th style={{ ...thCell, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} {...rowHover}>
                  <td style={tdCell}><span style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: "14px", color: T.onSurface }}>{cat.name}</span></td>
                  <td style={tdCell}><span style={{ ...tdCell, color: T.onSurfaceMuted, fontWeight: 400 }}>{cat.description || "—"}</span></td>
                  <td style={{ ...tdCell, textAlign: "center" }}>
                    <span style={{ ...badge, background: T.surfaceContainerLow, color: T.onSurfaceVariant }}>{cat._count.materials}</span>
                  </td>
                  <td style={{ ...tdCell, textAlign: "right" }}>
                    <button onClick={() => openEdit(cat)} style={{
                      background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "8px",
                      padding: "6px 14px", fontFamily: "'Geist', monospace", fontSize: "12px", fontWeight: 500,
                      color: T.onSurfaceVariant, cursor: "pointer", marginRight: "6px",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >Edit</button>
                    {canCreate && (
                      <button onClick={() => handleDelete(cat.id)} style={{
                        background: "transparent", border: `1px solid ${T.error}44`, borderRadius: "8px",
                        padding: "6px 14px", fontFamily: "'Geist', monospace", fontSize: "12px", fontWeight: 500,
                        color: T.error, cursor: "pointer",
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 101,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)",
        }} onClick={() => setShowModal(false)}>
          <div style={{ ...card, width: "450px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 20px" }}>
              {editItem ? "Edit Category" : "New Category"}
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={label}>Name *</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                style={input}
                placeholder="e.g. Semen, Besi, Pasir"
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                style={{ ...input, minHeight: "80px", resize: "vertical" }}
                placeholder="Optional description"
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={btnOutline}>Cancel</button>
              <button onClick={handleSave} style={btnPrimary} disabled={saving || !formData.name.trim()}>
                {saving ? "Saving..." : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
