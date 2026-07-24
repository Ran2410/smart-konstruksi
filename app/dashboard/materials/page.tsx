"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  surfaceContainer: "#e5eeff",
  success: "#15803d",
  successBg: "#f0fdf4",
  warning: "#b76e00",
  warningBg: "#fff7ed",
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

const thStyle: React.CSSProperties = {
  padding: "12px 16px", fontFamily: T.fontLabel, fontSize: "11px",
  fontWeight: 600, color: T.outline, letterSpacing: "0.06em",
  textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px", fontSize: "14px", verticalAlign: "middle",
};

type Material = {
  id: string;
  name: string;
  unit: string;
  stock: number;
  avgPrice: number;
  minStock: number;
  notes: string | null;
  category: { id: string; name: string } | null;
  vendor: { id: string; name: string } | null;
  createdAt: string;
};

type Project = { id: string; name: string; code: string; budget?: number; actualCost?: number };
type Category = { id: string; name: string };
type Vendor = { id: string; name: string };

export default function InventoryPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string;
  const canManage = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ESTIMATOR", "ADMIN_KANTOR", "LOGISTIK"].includes(role);

  const [items, setItems] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<Material | null>(null);
  const [showStockIn, setShowStockIn] = useState<Material | null>(null);
  const [showStockOut, setShowStockOut] = useState<Material | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", unit: "", stock: 0, minStock: 0, avgPrice: 0, notes: "", categoryId: "", vendorId: "" });
  const [txForm, setTxForm] = useState({ qty: 1, price: 0, projectId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      params.set("page", String(page));
      params.set("limit", "50");

      const [matRes, catRes, vendRes, projRes] = await Promise.all([
        fetch(`/api/materials?${params}`),
        fetch("/api/materials/categories?limit=100"),
        fetch("/api/materials/vendors?limit=200"),
        fetch("/api/projects?limit=200&status=PLANNING,IN_PROGRESS"),
      ]);

      const matJson = await matRes.json();
      const catJson = await catRes.json();
      const vendJson = await vendRes.json();
      const projJson = await projRes.json();

      setItems(matJson.data || []);
      setTotalPages(matJson.pagination?.totalPages || 0);
      setTotal(matJson.pagination?.total || 0);
      setCategories(catJson.data || []);
      setVendors(vendJson.data || []);
      setProjects(projJson.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, categoryFilter, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  const openCreate = () => {
    setFormData({ name: "", unit: "", stock: 0, minStock: 0, avgPrice: 0, notes: "", categoryId: "", vendorId: "" });
    setShowCreate(true);
  };

  const openEdit = (item: Material) => {
    setFormData({ name: item.name, unit: item.unit, stock: item.stock, minStock: item.minStock, avgPrice: Number(item.avgPrice), notes: item.notes || "", categoryId: item.category?.id || "", vendorId: item.vendor?.id || "" });
    setShowEdit(item);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.unit.trim()) return;
    setSaving(true);
    try {
      const isEdit = !!showEdit;
      const url = isEdit ? `/api/materials/${showEdit!.id}` : "/api/materials";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed to save"); return; }
      setShowCreate(false); setShowEdit(null);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleStockIn = async () => {
    if (txForm.qty <= 0 || txForm.price < 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "IN", materialId: showStockIn!.id, qty: txForm.qty, price: txForm.price, notes: txForm.notes }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed"); return; }
      setShowStockIn(null);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleStockOut = async () => {
    if (txForm.qty <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "OUT", materialId: showStockOut!.id, qty: txForm.qty, projectId: txForm.projectId || null, notes: txForm.notes }),
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Failed"); return; }
      setShowStockOut(null);
      fetchItems();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (!res.ok) { const err = await res.json(); alert(err.error || "Failed"); return; }
    fetchItems();
  };

  const formatCurrency = (val: number) => val.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

  const totalValue = items.reduce((sum, m) => sum + (m.stock * Number(m.avgPrice)), 0);

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Inventory</h1>
          <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "14px", margin: "4px 0 0" }}>Material stock &amp; warehouse management</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/dashboard/materials/categories"><button style={{
            background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
            padding: "10px 16px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
            color: T.onSurfaceVariant, cursor: "pointer",
          }} onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceContainerLow}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Categories</button></Link>
          <Link href="/dashboard/materials/vendors"><button style={{
            background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
            padding: "10px 16px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
            color: T.onSurfaceVariant, cursor: "pointer",
          }} onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceContainerLow}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>Vendors</button></Link>
          <Link href="/dashboard/transactions"><button style={{
            background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
            padding: "10px 16px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
            color: T.onSurfaceVariant, cursor: "pointer",
          }} onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceContainerLow}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>History</button></Link>
          {canManage && <button onClick={openCreate} style={btnPrimary}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >+ New Material</button>}
        </div>
      </div>

      {/* Summary + Filters */}
      <div style={{ ...card, padding: "16px", marginBottom: "16px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ padding: "8px 16px", background: T.primaryLight, borderRadius: "10px" }}>
          <span style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, display: "block" }}>TOTAL STOCK VALUE</span>
          <span style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "20px", fontWeight: 700, color: T.primary }}>{formatCurrency(totalValue)}</span>
        </div>
        <input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...input, maxWidth: "280px" }} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ ...input, maxWidth: "200px" }}>
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <span style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "13px" }}>{items.length} items</span>
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div>
            {/* Header skeleton pills */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "12px", borderBottom: `1px solid ${T.outlineSoft}44` }}>
              <Skeleton className="h-3 w-[140px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[90px]" />
              <Skeleton className="h-3 w-[90px]" />
            </div>
            {/* Table rows skeleton */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-5 w-[50px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody }}>No materials in inventory.</p>
            {canManage && <button onClick={openCreate} style={{ ...btnPrimary, marginTop: "12px" }}>Add New Material</button>}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.fontBody }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.outlineSoft}44` }}>
                  <th style={thStyle}>Material</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Unit</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Stock</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Avg Price</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Total Value</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} style={{ transition: "background 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: "14px", color: T.onSurface }}>{m.name}</span>
                      {(m.category || m.vendor) && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                          {m.category && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontFamily: T.fontLabel, fontWeight: 600, background: T.surfaceContainerLow, color: T.onSurfaceVariant }}>{m.category.name}</span>}
                          {m.vendor && <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "10px", fontFamily: T.fontLabel, fontWeight: 600, background: T.primaryLight, color: T.primary }}>{m.vendor.name}</span>}
                        </div>
                      )}
                      {m.notes && <div style={{ color: T.onSurfaceMuted, fontSize: "12px", marginTop: "2px" }}>{m.notes}</div>}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontFamily: T.fontLabel, fontWeight: 600, background: T.primaryLight, color: T.primary }}>{m.unit}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "15px", fontWeight: 700, color: m.stock > m.minStock ? T.success : m.stock > 0 ? T.warning : T.error }}>
                        {m.stock}
                      </span>
                      {m.stock > 0 && m.stock <= m.minStock && (
                        <span style={{ marginLeft: "6px", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontFamily: "'Geist', monospace", fontWeight: 700, background: T.warningBg, color: T.warning, verticalAlign: "middle" }}>LOW</span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "13px", color: T.onSurfaceMuted }}>{formatCurrency(Number(m.avgPrice))}/<span style={{ fontSize: "11px" }}>{m.unit}</span></span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "14px", fontWeight: 700, color: T.onSurface }}>{formatCurrency(m.stock * Number(m.avgPrice))}</span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      {canManage && (
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", position: "relative" }}>
                          <button onClick={() => { setShowStockIn(m); setTxForm({ qty: 1, price: 0, projectId: "", notes: "" }); }} style={{
                            background: T.successBg, border: `1px solid ${T.success}44`, borderRadius: "8px",
                            padding: "6px 10px", fontFamily: "'Geist', monospace", fontSize: "11px", fontWeight: 600,
                            color: T.success, cursor: "pointer", lineHeight: 1,
                          }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>+IN</button>
                          <button onClick={() => { setShowStockOut(m); setTxForm({ qty: 1, price: Number(m.avgPrice), projectId: "", notes: "" }); }} style={{
                            background: T.warningBg, border: `1px solid ${T.warning}44`, borderRadius: "8px",
                            padding: "6px 10px", fontFamily: "'Geist', monospace", fontSize: "11px", fontWeight: 600,
                            color: T.warning, cursor: "pointer", lineHeight: 1,
                          }} onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>-OUT</button>
                          {/* Kebab menu */}
                          <div style={{ position: "relative" }}>
                            <button onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)} style={{
                              background: "none", border: "none", cursor: "pointer",
                              padding: "6px", borderRadius: "8px", color: T.onSurfaceMuted,
                              display: "inline-flex", lineHeight: 1,
                            }} onMouseEnter={(e) => e.currentTarget.style.background = T.surfaceContainerLow}
                              onMouseLeave={(e) => { if (openMenu !== m.id) e.currentTarget.style.background = "none"; }}
                            ><span className="material-symbols-outlined" style={{ fontSize: "20px" }}>more_vert</span></button>
                            {openMenu === m.id && (
                              <>
                                <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setOpenMenu(null)} />
                                <div style={{
                                  position: "absolute", right: 0, top: "100%", marginTop: "4px", zIndex: 51,
                                  background: "#fff", borderRadius: "12px", border: `1px solid ${T.outlineSoft}`,
                                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: "160px", overflow: "hidden",
                                }}>
                                  <button onClick={() => { openEdit(m); setOpenMenu(null); }} style={{
                                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px",
                                    border: "none", background: "transparent", fontFamily: "'Inter', sans-serif", fontSize: "13px",
                                    color: T.onSurface, cursor: "pointer", textAlign: "left",
                                  }} onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                  ><span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted }}>edit</span> Edit</button>
                                  <button onClick={() => { handleDelete(m.id); setOpenMenu(null); }} style={{
                                    display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "10px 16px",
                                    border: "none", background: "transparent", fontFamily: "'Inter', sans-serif", fontSize: "13px",
                                    color: T.error, cursor: "pointer", textAlign: "left",
                                  }} onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                  ><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span> Delete</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {totalPages > 0 && total > 0 && (
              <div style={{ padding: "16px 0 0", borderTop: `1px solid rgba(190,201,193,0.2)`, marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <p style={{ fontFamily: "'Geist', monospace", fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>
                  Showing {Math.min((page - 1) * 50 + 1, total)} to {Math.min(page * 50, total)} of {total} items
                </p>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: "auto", height: "34px", padding: "0 12px",
                    border: `1px solid rgba(190,201,193,0.5)`, borderRadius: "8px",
                    background: "#fff", color: T.onSurfaceVariant,
                    fontFamily: "'Geist', monospace", fontSize: "13px", fontWeight: 600,
                    cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.4 : 1,
                    transition: "all 0.15s",
                  }} onMouseEnter={(e) => { if (page > 1) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                    onMouseLeave={(e) => { if (page > 1) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                  >← Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let n = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                    return (
                      <button key={n} onClick={() => setPage(n)} style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: "34px", height: "34px", padding: "0 8px",
                        border: `1px solid ${page === n ? T.primary : "rgba(190,201,193,0.5)"}`, borderRadius: "8px",
                        background: page === n ? T.primary : "#fff",
                        color: page === n ? "#fff" : T.onSurfaceVariant,
                        fontFamily: "'Geist', monospace", fontSize: "13px", fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s", lineHeight: 1,
                      }} onMouseEnter={(e) => { if (page !== n) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                        onMouseLeave={(e) => { if (page !== n) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                      >{n}</button>
                    );
                  })}
                  {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: "auto", height: "34px", padding: "0 12px",
                    border: `1px solid rgba(190,201,193,0.5)`, borderRadius: "8px",
                    background: "#fff", color: T.onSurfaceVariant,
                    fontFamily: "'Geist', monospace", fontSize: "13px", fontWeight: 600,
                    cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.4 : 1,
                    transition: "all 0.15s",
                  }} onMouseEnter={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = T.primary; e.currentTarget.style.color = T.primary; e.currentTarget.style.background = T.primaryLight; }}}
                    onMouseLeave={(e) => { if (page < totalPages) { e.currentTarget.style.borderColor = "rgba(190,201,193,0.5)"; e.currentTarget.style.color = T.onSurfaceVariant; e.currentTarget.style.background = "#fff"; }}}
                  >Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
          onClick={() => { setShowCreate(false); setShowEdit(null); }}>
          <div style={{ ...card, width: "520px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 20px" }}>
              {showEdit ? "Edit Material" : "New Material"}
            </h2>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Material Name *</label>
              <input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} style={input} autoFocus />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Unit *</label>
                <select value={formData.unit} onChange={(e) => setFormData((f) => ({ ...f, unit: e.target.value }))} style={input}>
                  <option value="">Select...</option>
                  <option value="sak">Sak</option>
                  <option value="kg">Kg</option>
                  <option value="ton">Ton</option>
                  <option value="m³">M³</option>
                  <option value="m²">M²</option>
                  <option value="liter">Liter</option>
                  <option value="unit">Unit</option>
                  <option value="lembar">Lembar</option>
                  <option value="batang">Batang</option>
                  <option value="rol">Rol</option>
                  <option value="buah">Buah</option>
                </select>
              </div>
              <div>
                <label style={label}>Initial Stock</label>
                <input type="number" value={formData.stock} onChange={(e) => setFormData((f) => ({ ...f, stock: Number(e.target.value) }))} style={input} min={0} />
              </div>
              <div>
                <label style={label}>Min Stock</label>
                <input type="number" value={formData.minStock} onChange={(e) => setFormData((f) => ({ ...f, minStock: Number(e.target.value) }))} style={input} min={0} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))} style={input}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Vendor</label>
                <select value={formData.vendorId} onChange={(e) => setFormData((f) => ({ ...f, vendorId: e.target.value }))} style={input}>
                  <option value="">No vendor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Average Price (IDR)</label>
              <input type="number" value={formData.avgPrice} onChange={(e) => setFormData((f) => ({ ...f, avgPrice: Number(e.target.value) }))} style={input} min={0} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={label}>Notes</label>
              <input value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} style={input} />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowCreate(false); setShowEdit(null); }} style={{
                background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
                padding: "10px 20px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
                color: T.onSurfaceVariant, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleSave} style={btnPrimary} disabled={saving || !formData.name.trim() || !formData.unit}>
                {saving ? "Saving..." : showEdit ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {showStockIn && (
        <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowStockIn(null)}>
          <div style={{ ...card, width: "420px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px" }}>Stock In</h2>
            <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "14px", margin: "0 0 20px" }}>Add stock to <strong>{showStockIn.name}</strong> (current: {showStockIn.stock} {showStockIn.unit})</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Quantity *</label>
                <input type="number" value={txForm.qty} onChange={(e) => setTxForm((f) => ({ ...f, qty: Number(e.target.value) }))} style={input} min={0.01} step={0.01} autoFocus />
              </div>
              <div>
                <label style={label}>Purchase Price</label>
                <input type="number" value={txForm.price} onChange={(e) => setTxForm((f) => ({ ...f, price: Number(e.target.value) }))} style={input} min={0} />
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={label}>Notes</label>
              <input value={txForm.notes} onChange={(e) => setTxForm((f) => ({ ...f, notes: e.target.value }))} style={input} placeholder="Invoice ref, supplier notes..." />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowStockIn(null)} style={{
                background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
                padding: "10px 20px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
                color: T.onSurfaceVariant, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleStockIn} style={btnPrimary} disabled={saving || txForm.qty <= 0}>
                {saving ? "Processing..." : `Add ${txForm.qty} ${showStockIn.unit}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {showStockOut && (
        <div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowStockOut(null)}>
          <div style={{ ...card, width: "440px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px" }}>Stock Out</h2>
            <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "14px", margin: "0 0 20px" }}>
              Use <strong>{showStockOut.name}</strong> — available: <strong style={{ color: showStockOut.stock > 0 ? T.success : T.error }}>{showStockOut.stock} {showStockOut.unit}</strong>
            </p>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Quantity *</label>
              <input type="number" value={txForm.qty} onChange={(e) => setTxForm((f) => ({ ...f, qty: Number(e.target.value) }))} style={input} min={0.01} step={0.01} max={showStockOut.stock} autoFocus />
              {txForm.qty > showStockOut.stock && <p style={{ color: T.error, fontSize: "12px", margin: "4px 0 0" }}>Exceeds available stock!</p>}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Project (optional)</label>
              <select value={txForm.projectId} onChange={(e) => setTxForm((f) => ({ ...f, projectId: e.target.value }))} style={input}>
                <option value="">— No project (general use) —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </div>
            {(() => {
              const selProject = txForm.projectId ? projects.find((p) => p.id === txForm.projectId) : null;
              if (selProject) {
                const budget = Number(selProject.budget || 0);
                const actual = Number(selProject.actualCost || 0);
                const estCost = txForm.qty * Number(showStockOut.avgPrice || 0);
                const afterTotal = actual + estCost;
                const remaining = budget - afterTotal;
                const pct = budget > 0 ? ((afterTotal / budget) * 100) : 0;
                const isOver = afterTotal > budget;
                const nearLimit = !isOver && pct >= 80;

                const valStyle = (color: string): React.CSSProperties => ({
                  fontFamily: "'Geist', monospace", fontSize: "13px", fontWeight: 600, color,
                });

                return (
                  <div style={{ marginBottom: "16px", padding: "12px 16px", background: T.surfaceContainerLow, borderRadius: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "11px", color: T.onSurfaceMuted }}>BUDGET</span>
                      <span style={valStyle(T.onSurface)}>{budget.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "11px", color: T.onSurfaceMuted }}>ACTUAL COST</span>
                      <span style={valStyle(T.onSurface)}>{actual.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "'Geist', monospace", fontSize: "11px", color: T.onSurfaceMuted }}>EST. COST (this tx)</span>
                      <span style={valStyle(isOver ? T.error : T.onSurface)}>{estCost.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}</span>
                    </div>
                    <div style={{ borderTop: `1px solid ${T.outlineSoft}44`, paddingTop: "6px", marginTop: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Geist', monospace", fontSize: "11px", fontWeight: 600, color: isOver ? T.error : nearLimit ? T.warning : T.success }}>AFTER THIS</span>
                        <span style={{ ...valStyle(isOver ? T.error : nearLimit ? T.warning : T.success), fontSize: "14px" }}>
                          {afterTotal.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <span style={{ fontFamily: "'Geist', monospace", fontSize: "11px", color: isOver ? T.error : T.onSurfaceMuted }}>REMAINING</span>
                        <span style={{ ...valStyle(isOver ? T.error : nearLimit ? T.warning : T.success), fontSize: "14px" }}>
                          {remaining >= 0
                            ? remaining.toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })
                            : `-${Math.abs(remaining).toLocaleString("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 })}`}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: "8px", height: "6px", background: T.outlineSoft + "44", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: isOver ? T.error : nearLimit ? T.warning : T.success, borderRadius: "3px", transition: "width 0.3s ease" }} />
                    </div>
                    {isOver && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(186,26,26,0.08)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.error }}>warning</span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: T.error, fontWeight: 500 }}>
                          This transaction will exceed project budget!
                        </span>
                      </div>
                    )}
                    {nearLimit && !isOver && (
                      <div style={{ marginTop: "8px", padding: "8px 12px", background: T.warningBg, borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.warning }}>info</span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: T.warning, fontWeight: 500 }}>
                          Budget usage at {pct.toFixed(0)}% — getting close to limit.
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return <p style={{ color: T.onSurfaceMuted, fontSize: "11px", margin: "0 0 14px" }}>Select a project to see budget impact.</p>;
            })()}
            <div style={{ marginBottom: "16px" }}>
              <label style={label}>Notes</label>
              <input value={txForm.notes} onChange={(e) => setTxForm((f) => ({ ...f, notes: e.target.value }))} style={input} placeholder="Usage notes..." />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowStockOut(null)} style={{
                background: "transparent", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
                padding: "10px 20px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 500,
                color: T.onSurfaceVariant, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleStockOut} style={{ ...btnPrimary, background: T.warning }} disabled={saving || txForm.qty <= 0 || txForm.qty > showStockOut.stock}>
                {saving ? "Processing..." : `Use ${txForm.qty} ${showStockOut.unit}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        tbody tr:last-child { border-bottom: none; }
      `}</style>
    </div>
  );
}
