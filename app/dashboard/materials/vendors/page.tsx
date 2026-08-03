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

type Vendor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isVerified: boolean;
  _count: { materials: number };
  createdAt: string;
};

export default function VendorsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string;
  const canManage = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "LOGISTIK"].includes(role);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", address: "", isVerified: false });
  const [saving, setSaving] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "100");
      const res = await fetch(`/api/materials/vendors?${params}`);
      const json = await res.json();
      setVendors(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const openCreate = () => {
    setEditItem(null);
    setFormData({ name: "", phone: "", email: "", address: "", isVerified: false });
    setShowModal(true);
  };

  const openEdit = (v: Vendor) => {
    setEditItem(v);
    setFormData({ name: v.name, phone: v.phone || "", email: v.email || "", address: v.address || "", isVerified: v.isVerified });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      const url = editItem ? `/api/materials/vendors/${editItem.id}` : "/api/materials/vendors";
      const method = editItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed to save"); return; }
      setShowModal(false);
      fetchVendors();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    const res = await fetch(`/api/materials/vendors/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error || "Failed to delete"); return; }
    fetchVendors();
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Vendors</h1>
          <p style={{ ...cellMuted, margin: "4px 0 0", fontSize: "14px" }}>Manage suppliers &amp; material vendors</p>
        </div>
        {canManage && <button onClick={openCreate} style={btnPrimary}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
        >+ New Vendor</button>}
      </div>

      <div style={{ ...card, padding: "16px", marginBottom: "16px" }}>
        <input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} style={input} />
      </div>

      <div style={card}>
        {loading ? (
          <div style={{ padding: "4px 0" }}>
            {/* Skeleton header */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px", padding: "12px 16px", background: T.surfaceContainerLow, borderBottom: `2px solid ${T.outlineSoft}44` }}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-3 w-16 ml-auto" />
              <Skeleton className="h-3 w-14 ml-auto" />
            </div>
            {/* Skeleton rows */}
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "14px 16px", borderBottom: `1px solid ${T.outlineSoft}22` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "180px" }}>
                  <Skeleton className="h-5 w-[160px]" />
                  <Skeleton className="h-3 w-[120px]" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "200px" }}>
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
                <Skeleton className="h-6 w-[72px] rounded-full ml-auto" />
                <Skeleton className="h-6 w-9 rounded-full ml-auto" />
                <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                  <Skeleton className="h-8 w-14 rounded-lg" />
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : vendors.length === 0 ? <p style={cellMuted}>No vendors yet.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thCell}>Name</th>
                <th style={thCell}>Contact</th>
                <th style={{ ...thCell, textAlign: "center" }}>Verified</th>
                <th style={{ ...thCell, textAlign: "center" }}>Materials</th>
                <th style={{ ...thCell, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} {...rowHover}>
                  <td style={tdCell}>
                    <span style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: "14px", color: T.onSurface }}>{v.name}</span>
                    {v.address && <div style={{ ...tdCell, color: T.onSurfaceMuted, fontSize: "12px", padding: "2px 0 0" }}>{v.address}</div>}
                  </td>
                  <td style={tdCell}>
                    {v.phone && <div style={cellText}>{v.phone}</div>}
                    {v.email && <div style={cellMuted}>{v.email}</div>}
                    {!v.phone && !v.email && <span style={cellMuted}>—</span>}
                  </td>
                  <td style={{ ...tdCell, textAlign: "center" }}>
                    <span style={{ ...badge, background: v.isVerified ? T.successBg : T.surfaceContainerLow, color: v.isVerified ? T.success : T.onSurfaceMuted }}>
                      {v.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td style={{ ...tdCell, textAlign: "center" }}><span style={{ ...badge, background: T.surfaceContainerLow, color: T.onSurfaceVariant }}>{v._count.materials}</span></td>
                  <td style={{ ...tdCell, textAlign: "right" }}>
                    <button onClick={() => openEdit(v)} style={{
                      background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "8px",
                      padding: "6px 14px", fontFamily: "'Geist', monospace", fontSize: "12px", fontWeight: 500,
                      color: T.onSurfaceVariant, cursor: "pointer", marginRight: "6px",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >Edit</button>
                    {canManage && (
                      <button onClick={() => handleDelete(v.id)} style={{
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

      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowModal(false)}>
          <div style={{ ...card, width: "500px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 20px" }}>
              {editItem ? "Edit Vendor" : "New Vendor"}
            </h2>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Name *</label>
              <input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} style={input} autoFocus />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Phone</label>
                <input value={formData.phone} onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))} style={input} placeholder="+62..." />
              </div>
              <div>
                <label style={label}>Email</label>
                <input value={formData.email} onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))} style={input} type="email" />
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Address</label>
              <textarea value={formData.address} onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))} style={{ ...input, minHeight: "60px", resize: "vertical" }} />
            </div>
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="verified" checked={formData.isVerified}
                onChange={(e) => setFormData((f) => ({ ...f, isVerified: e.target.checked }))}
                style={{ width: "18px", height: "18px", accentColor: T.primary }} />
              <label htmlFor="verified" style={{ ...cellText, cursor: "pointer" }}>Verified vendor</label>
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
