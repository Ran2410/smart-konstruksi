"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
};

function fmtCurrency(n: string | number | null | undefined) {
  if (n == null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n));
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    DRAFT: { bg: T.mutedBg, color: T.muted, label: "Draft" },
    PENDING_APPROVAL: { bg: T.warningBg, color: T.warning, label: "Pending Approval" },
    APPROVED: { bg: T.successBg, color: T.success, label: "Approved" },
    REJECTED: { bg: T.errorLight, color: T.error, label: "Rejected" },
  };
  const c = config[status] || config.DRAFT;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 14px", borderRadius: "20px",
      background: c.bg, color: c.color,
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color }} />
      {c.label}
    </span>
  );
}

// ── Section / Item Row ────────────────────────────────────────────────────
function ItemRow({ item, sections, onUpdate, onDelete }: {
  item: any; sections: string[]; onUpdate: (id: string, data: any) => void; onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ section: item.section, name: item.name, unit: item.unit, qty: String(item.qty), unitPrice: String(item.unitPrice) });

  const handleSave = () => {
    onUpdate(item.id, {
      section: form.section,
      name: form.name,
      unit: form.unit,
      qty: parseFloat(form.qty) || 0,
      unitPrice: parseFloat(form.unitPrice) || 0,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <tr>
        <td style={{ padding: "8px 12px" }}>
          <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}
            style={inputStyle}>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value="__new__">+ New section</option>
          </select>
        </td>
        <td style={{ padding: "8px 12px" }}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Item name" />
        </td>
        <td style={{ padding: "8px 12px" }}>
          <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} style={inputStyle}>
            {["m²","m³","m","unit","ls","titik","sak","batang","kg","zak","lusin","buah","set"].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </td>
        <td style={{ padding: "8px 12px" }}>
          <input type="number" step="0.01" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} style={{ ...inputStyle, width: "80px" }} />
        </td>
        <td style={{ padding: "8px 12px" }}>
          <input type="number" step="1000" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} style={{ ...inputStyle, width: "110px" }} />
        </td>
        <td style={{ padding: "8px 12px", fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600 }}>
          {fmtCurrency(parseFloat(form.qty || "0") * parseFloat(form.unitPrice || "0"))}
        </td>
        <td style={{ padding: "8px 12px" }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={handleSave} style={iconBtn(T.success)} title="Save">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check</span>
            </button>
            <button onClick={() => setEditing(false)} style={iconBtn(T.onSurfaceMuted)} title="Cancel">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={tdStyle}>{item.section}</td>
      <td style={{ ...tdStyle, fontWeight: 500 }}>{item.name}</td>
      <td style={{ ...tdStyle, fontFamily: T.fontLabel, fontSize: "12px" }}>{item.unit}</td>
      <td style={{ ...tdStyle, fontFamily: T.fontLabel, fontSize: "12px", textAlign: "right" }}>{Number(item.qty).toLocaleString()}</td>
      <td style={{ ...tdStyle, fontFamily: T.fontLabel, fontSize: "12px", textAlign: "right" }}>{fmtCurrency(item.unitPrice)}</td>
      <td style={{ ...tdStyle, fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, textAlign: "right" }}>{fmtCurrency(item.total)}</td>
      <td style={{ padding: "8px 12px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          <button onClick={() => setEditing(true)} style={iconBtn(T.primary)} title="Edit">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>
          </button>
          <button onClick={() => onDelete(item.id)} style={iconBtn(T.error)} title="Delete">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "6px 10px", borderRadius: "6px", border: `1px solid ${T.outlineSoft}55`,
  fontFamily: T.fontBody, fontSize: "12px", color: T.onSurface,
  background: T.surfaceCard, outline: "none", width: "100%", boxSizing: "border-box",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px", fontFamily: T.fontBody, fontSize: "13px",
  color: T.onSurface, borderBottom: `1px solid ${T.outlineSoft}22`,
  verticalAlign: "middle",
};

const iconBtn = (color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: "28px", height: "28px", borderRadius: "6px",
  border: "none", background: "transparent", color,
  cursor: "pointer", transition: "all 0.15s",
});

// ── Main Page ──────────────────────────────────────────────────────────────
export default function RABDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const role = session?.user?.role || "";
  const canEdit = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "ESTIMATOR", "ADMIN_KANTOR"].includes(role);

  const [rab, setRab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New item form
  const [newSection, setNewSection] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("unit");
  const [newQty, setNewQty] = useState("1");
  const [newPrice, setNewPrice] = useState("0");
  const [newCustomSection, setNewCustomSection] = useState("");

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    icon: string;
    confirmLabel: string;
    confirmColor?: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchRAB = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rab/${params.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Not found");
      const json = await res.json();
      setRab(json.data || json);
    } catch (e) {
      setError("RAB not found");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchRAB(); }, [fetchRAB]);

  // Group items by section
  const sections = rab?.items
    ? ([...new Set(rab.items.map((i: any) => i.section))] as string[]).sort()
    : [];

  const sectionTotals = sections.map((s) => ({
    section: s,
    items: rab.items.filter((i: any) => i.section === s),
    total: rab.items.filter((i: any) => i.section === s).reduce((sum: number, i: any) => sum + Number(i.total), 0),
  }));

  const grandTotal = sectionTotals.reduce((sum: number, s) => sum + s.total, 0);

  // ── Add Item ──
  const handleAddItem = async () => {
    const section = newSection === "__new__" ? newCustomSection : newSection;
    if (!section || !newName) return;

    try {
      const res = await fetch("/api/rab/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rabId: rab.id,
          section,
          name: newName,
          unit: newUnit,
          qty: parseFloat(newQty) || 1,
          unitPrice: parseFloat(newPrice) || 0,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to add item");

      // Reset form and refresh
      setNewName(""); setNewQty("1"); setNewPrice("0");
      fetchRAB();
    } catch (e) {
      setError("Failed to add item");
    }
  };

  // ── Update Item ──
  const handleUpdateItem = async (itemId: string, data: any) => {
    try {
      await fetch(`/api/rab/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      fetchRAB();
    } catch (e) {
      setError("Failed to update item");
    }
  };

  // ── Delete Item ──
  const handleDeleteItem = async (itemId: string) => {
    setConfirmDialog({
      title: "Delete Item",
      description: "Remove this item from the RAB?",
      icon: "delete",
      confirmLabel: "Delete",
      confirmColor: T.error,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await fetch(`/api/rab/items/${itemId}`, { method: "DELETE", credentials: "include" });
          fetchRAB();
        } catch (e) {
          setError("Failed to delete item");
        }
      },
    });
  };

  // ── Submit for Approval ──
  const handleSubmitApproval = async () => {
    setConfirmDialog({
      title: "Submit for Approval",
      description: "Send this RAB to your approver for review?",
      icon: "send",
      confirmLabel: "Submit",
      confirmColor: T.warning,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/rab/${rab.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "PENDING_APPROVAL" }),
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed to submit");
          fetchRAB();
        } catch (e: any) {
          setError(e.message);
        }
      },
    });
  };

  // ── Approve / Reject (for approvers) ──
  const handleApprovalAction = async (action: "APPROVED" | "REJECTED") => {
    const isApprove = action === "APPROVED";
    setConfirmDialog({
      title: isApprove ? "Approve RAB" : "Reject RAB",
      description: isApprove
        ? "Approve this RAB? It will be locked and used as the project budget reference."
        : "Reject this RAB? It will be sent back for revision.",
      icon: isApprove ? "check_circle" : "cancel",
      confirmLabel: isApprove ? "Approve" : "Reject",
      confirmColor: isApprove ? T.success : T.error,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const res = await fetch(`/api/rab/${rab.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: action }),
            credentials: "include",
          });
          if (!res.ok) throw new Error("Failed");
          fetchRAB();
        } catch (e: any) {
          setError(e.message);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ padding: "24px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ height: "40px", width: "300px", marginBottom: "16px", borderRadius: "8px", background: `linear-gradient(90deg, ${T.outlineSoft}22 25%, ${T.outlineSoft}44 50%, ${T.outlineSoft}22 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
        <div style={{ height: "200px", borderRadius: "12px", background: `linear-gradient(90deg, ${T.outlineSoft}22 25%, ${T.outlineSoft}44 50%, ${T.outlineSoft}22 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      </div>
    );
  }

  if (error || !rab) {
    return (
      <div style={{ padding: "24px 32px", textAlign: "center", color: T.onSurfaceMuted }}>
        <p>{error || "RAB not found"}</p>
        <Link href="/dashboard/rab" style={{ color: T.primary }}>Back to RAB list</Link>
      </div>
    );
  }

  const isDraft = rab.status === "DRAFT";
  const isPending = rab.status === "PENDING_APPROVAL";
  const canApprove = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"].includes(role);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "24px" }}>
        <Link href="/dashboard/rab" style={{ color: T.onSurfaceMuted, textDecoration: "none", display: "flex", marginTop: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>arrow_back</span>
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{rab.title}</h1>
            <StatusBadge status={rab.status} />
            <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted }}>v{rab.version}</span>
          </div>
          <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            {rab.code} &middot; Created {fmtDate(rab.createdAt)} &middot; Last updated {fmtDate(rab.updatedAt)}
          </p>
        </div>
      </div>

      {/* Lead Info */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <h3 style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 12px" }}>Lead Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "11px", color: T.onSurfaceMuted, fontFamily: T.fontLabel }}>Name</span>
            <p style={{ margin: "2px 0", fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600 }}>{rab.lead?.name || "—"}</p>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: T.onSurfaceMuted, fontFamily: T.fontLabel }}>Company</span>
            <p style={{ margin: "2px 0", fontFamily: T.fontBody, fontSize: "13px" }}>{rab.lead?.company || "—"}</p>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: T.onSurfaceMuted, fontFamily: T.fontLabel }}>Location</span>
            <p style={{ margin: "2px 0", fontFamily: T.fontBody, fontSize: "13px" }}>{rab.lead?.location || "—"}</p>
          </div>
          <div>
            <span style={{ fontSize: "11px", color: T.onSurfaceMuted, fontFamily: T.fontLabel }}>Notes</span>
            <p style={{ margin: "2px 0", fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceVariant }}>{rab.notes || "—"}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {isDraft && canEdit && (
          <button onClick={handleSubmitApproval} style={{
            padding: "8px 20px", borderRadius: "10px", background: T.warning, color: "#fff",
            border: "none", fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
            Submit for Approval
          </button>
        )}
        {isPending && canApprove && (
          <>
            <button onClick={() => handleApprovalAction("APPROVED")} style={{
              padding: "8px 20px", borderRadius: "10px", background: T.success, color: "#fff",
              border: "none", fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>check_circle</span>
              Approve
            </button>
            <button onClick={() => handleApprovalAction("REJECTED")} style={{
              padding: "8px 20px", borderRadius: "10px", background: T.error, color: "#fff",
              border: "none", fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>cancel</span>
              Reject
            </button>
          </>
        )}
        {/* Export Excel — all roles can download */}
        {rab.id && (
          <a
            href={`/api/rab/${rab.id}/export`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginLeft: "auto",
              padding: "8px 20px", borderRadius: "10px",
              background: "#fff", color: T.primary,
              border: `1px solid ${T.primary}`,
              fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px",
              textDecoration: "none",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
            Export Excel
          </a>
        )}
      </div>

      {/* RAB Items Table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: 0 }}>
            RAB Items
            <span style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "12px", fontWeight: 400, textTransform: "none", marginLeft: "8px" }}>
              ({rab.items?.length || 0} items)
            </span>
          </h3>
          <span style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.primary }}>
            {fmtCurrency(grandTotal)}
          </span>
        </div>

        {(!rab.items || rab.items.length === 0) ? (
          <div style={{ textAlign: "center", padding: "32px", color: T.onSurfaceMuted }}>
            <p style={{ fontFamily: T.fontBody, fontSize: "13px", margin: 0 }}>No items yet. Add work items below.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 120 }}>Section</th>
                  <th style={{ ...thStyle, minWidth: 180 }}>Item Name</th>
                  <th style={{ ...thStyle, minWidth: 60 }}>Unit</th>
                  <th style={{ ...thStyle, minWidth: 80, textAlign: "right" }}>Qty</th>
                  <th style={{ ...thStyle, minWidth: 110, textAlign: "right" }}>Unit Price</th>
                  <th style={{ ...thStyle, minWidth: 110, textAlign: "right" }}>Total</th>
                  {isDraft && canEdit && <th style={{ ...thStyle, width: 70 }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rab.items.map((item: any) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    sections={sections}
                    onUpdate={handleUpdateItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Section Total Summary */}
        {sectionTotals.length > 0 && (
          <div style={{ marginTop: "16px", borderTop: `1px solid ${T.outlineSoft}33`, paddingTop: "12px" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "32px", flexWrap: "wrap" }}>
              {sectionTotals.map((s) => (
                <div key={s.section} style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: T.fontLabel, fontSize: "10px", textTransform: "uppercase", color: T.onSurfaceMuted }}>{s.section}</span>
                  <p style={{ margin: "2px 0", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600 }}>{fmtCurrency(s.total)}</p>
                </div>
              ))}
              <div style={{ textAlign: "right", borderLeft: `1px solid ${T.outlineSoft}44`, paddingLeft: "16px" }}>
                <span style={{ fontFamily: T.fontLabel, fontSize: "10px", textTransform: "uppercase", color: T.onSurfaceMuted }}>Grand Total</span>
                <p style={{ margin: "2px 0", fontFamily: T.fontDisplay, fontSize: "16px", fontWeight: 700, color: T.primary }}>{fmtCurrency(grandTotal)}</p>
              </div>
            </div>
            {Number(rab.marginPercent) > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "32px", flexWrap: "wrap", marginTop: "12px", paddingTop: "12px", borderTop: `1px dashed ${T.outlineSoft}44` }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: T.fontLabel, fontSize: "10px", textTransform: "uppercase", color: T.onSurfaceMuted }}>Margin ({Number(rab.marginPercent)}%)</span>
                  <p style={{ margin: "2px 0", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: T.warning }}>{fmtCurrency(grandTotal * Number(rab.marginPercent) / 100)}</p>
                </div>
                <div style={{ textAlign: "right", borderLeft: `1px solid ${T.outlineSoft}44`, paddingLeft: "16px" }}>
                  <span style={{ fontFamily: T.fontLabel, fontSize: "10px", textTransform: "uppercase", color: T.onSurfaceMuted }}>Total + Margin</span>
                  <p style={{ margin: "2px 0", fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 800, color: T.primary }}>{fmtCurrency(grandTotal + (grandTotal * Number(rab.marginPercent) / 100))}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Item Form */}
      {isDraft && canEdit && (
        <div style={{ ...card, marginTop: "16px" }}>
          <h3 style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, margin: "0 0 16px" }}>
            Add Item
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", alignItems: "end" }}>
            <div>
              <label style={{ fontFamily: T.fontLabel, fontSize: "10px", display: "block", marginBottom: "4px", color: T.onSurfaceMuted }}>Section</label>
              <select value={newSection} onChange={(e) => setNewSection(e.target.value)} style={inputStyle}>
                <option value="">Select section...</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                <option value="__new__">+ New Section</option>
              </select>
              {newSection === "__new__" && (
                <input value={newCustomSection} onChange={(e) => setNewCustomSection(e.target.value)}
                  placeholder="New section name" style={{ ...inputStyle, marginTop: "4px" }} />
              )}
            </div>
            <div>
              <label style={{ fontFamily: T.fontLabel, fontSize: "10px", display: "block", marginBottom: "4px", color: T.onSurfaceMuted }}>Item Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Pasir beton" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: T.fontLabel, fontSize: "10px", display: "block", marginBottom: "4px", color: T.onSurfaceMuted }}>Unit</label>
              <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} style={inputStyle}>
                {["m²","m³","m","unit","ls","titik","sak","batang","kg","zak","lusin","buah","set"].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: T.fontLabel, fontSize: "10px", display: "block", marginBottom: "4px", color: T.onSurfaceMuted }}>Qty</label>
              <input type="number" step="0.01" value={newQty} onChange={(e) => setNewQty(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontFamily: T.fontLabel, fontSize: "10px", display: "block", marginBottom: "4px", color: T.onSurfaceMuted }}>Unit Price</label>
              <input type="number" step="1000" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <button onClick={handleAddItem} disabled={!newSection || !newName} style={{
                padding: "8px 20px", borderRadius: "10px", background: T.primary, color: "#fff",
                border: "none", fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
                cursor: "pointer", opacity: (!newSection || !newName) ? 0.5 : 1,
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add</span>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent className="">
          <AlertDialogHeader className="">
            <AlertDialogMedia className="">
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: confirmDialog?.confirmColor || T.error, display: "block", fontVariationSettings: "'FILL' 1" }}>
                {confirmDialog?.icon}
              </span>
            </AlertDialogMedia>
            <AlertDialogTitle className="">{confirmDialog?.title}</AlertDialogTitle>
            <AlertDialogDescription className="">{confirmDialog?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel className="" onClick={() => setConfirmDialog(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className=""
              onClick={confirmDialog?.onConfirm}
              style={confirmDialog?.confirmColor ? {
                background: confirmDialog.confirmColor,
                boxShadow: `0 2px 8px ${confirmDialog.confirmColor}40`,
              } : undefined}
            >
              {confirmDialog?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontFamily: T.fontLabel,
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: T.onSurfaceMuted,
  textAlign: "left",
  borderBottom: `1px solid ${T.outlineSoft}44`,
  whiteSpace: "nowrap",
};
