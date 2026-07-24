"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  primaryMedium: "rgba(0,79,53,0.15)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.4)",
  warning: "#b45309",
  warningLight: "rgba(253,230,138,0.3)",
  success: "#15803d",
  successLight: "rgba(220,252,231,0.8)",
  info: "#2563eb",
  infoMedium: "rgba(37,99,235,0.12)",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: "1px solid rgba(190,201,193,0.25)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 16px",
  background: T.surfaceContainerLow,
  border: `1.5px solid ${T.outlineSoft}`,
  borderRadius: "12px",
  fontFamily: T.fontBody,
  fontSize: "14px",
  lineHeight: "1.5",
  color: T.onSurface,
  outline: "none",
  transition: "all 0.2s ease",
};

const label: React.CSSProperties = {
  display: "block",
  fontFamily: T.fontLabel,
  fontSize: "11px",
  fontWeight: 600,
  color: T.outline,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  DRAFT: { label: "Draft", color: "#6f7a72", bg: "rgba(111,122,114,0.12)", dot: "#6f7a72" },
  SENT: { label: "Sent", color: "#2563eb", bg: "rgba(37,99,235,0.10)", dot: "#2563eb" },
  PAID: { label: "Paid", color: "#15803d", bg: "rgba(21,128,61,0.10)", dot: "#15803d" },
  OVERDUE: { label: "Overdue", color: "#ba1a1a", bg: "rgba(186,26,26,0.10)", dot: "#ba1a1a" },
};

function formatCurrency(amount: number | string | null | undefined) {
  if (amount == null || amount === "") return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrencyInput(val: string): string {
  const numeric = val.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(/,/g, ".")) || 0;
}

const CAN_UPDATE_STATUS = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"];
const CAN_PAY = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR", "FINANCE"];

function Field({ label: lbl, required, hint, children, error }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label style={label}>
        {lbl}
        {required && <span style={{ color: T.error, marginLeft: "4px" }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: "6px 0 0", fontFamily: T.fontBody, fontSize: "12px", color: T.error, display: "flex", alignItems: "center", gap: "4px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
          {error}
        </p>
      )}
      {!error && hint && (
        <p style={{ margin: "6px 0 0", fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: T.outline,
    bg: T.surfaceContainerLow,
    dot: T.outline,
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 12px",
        borderRadius: "9999px",
        fontFamily: T.fontLabel,
        fontSize: "11px",
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.outlineSoft}22` }}>
      <span style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function InvoiceDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const role = session?.user?.role as string | undefined;
  const canUpdate = !!(role && CAN_UPDATE_STATUS.includes(role));
  const canPay = !!(role && CAN_PAY.includes(role));

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountDisplay: "",
    method: "",
    paidAt: "",
    proofUrl: "",
    notes: "",
  });
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ amountDisplay: "", issuedAt: "", dueDate: "" });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load invoice");
      const data = await res.json();
      setInvoice(data.data || data);
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const t = requestAnimationFrame(() => fetchInvoice());
    return () => cancelAnimationFrame(t);
  }, [id, fetchInvoice]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setActionBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update status");
      setInvoice(data.data || data);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handlePaymentChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setPaymentForm((prev) => ({ ...prev, [field]: e.target.value }));
    setPaymentErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const display = formatCurrencyInput(e.target.value);
    setPaymentForm((prev) => ({ ...prev, amountDisplay: display }));
    setPaymentErrors((prev) => {
      const n = { ...prev };
      delete n.amount;
      return n;
    });
  };

  const validatePayment = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const amount = parseCurrency(paymentForm.amountDisplay);
    if (amount <= 0) errs.amount = "Enter a positive amount";
    if (!paymentForm.method.trim()) errs.method = "Payment method is required";
    if (!paymentForm.paidAt) errs.paidAt = "Paid date is required";
    const remaining = Math.max(0, Number(invoice?.amount || 0) - Number(invoice?.totalPaid || 0));
    if (amount > remaining) errs.amount = `Amount exceeds remaining balance (${formatCurrency(remaining)})`;
    return errs;
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const errs = validatePayment();
    if (Object.keys(errs).length > 0) {
      setPaymentErrors(errs);
      return;
    }
    setPaymentSubmitting(true);
    setPaymentError(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          invoiceId: id,
          amount: parseCurrency(paymentForm.amountDisplay),
          method: paymentForm.method,
          paidAt: paymentForm.paidAt,
          proofUrl: paymentForm.proofUrl || null,
          notes: paymentForm.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to record payment");
      setPaymentOpen(false);
      setPaymentForm({ amountDisplay: "", method: "", paidAt: "", proofUrl: "", notes: "" });
      fetchInvoice();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // ── Edit Handlers ────────────────────────────────────────────────────
  const openEdit = () => {
    if (!invoice) return;
    setEditForm({
      amountDisplay: formatCurrencyInput(String(Math.round(Number(invoice.amount) / 1000) * 1000)),
      issuedAt: invoice.issuedAt?.split("T")[0] || "",
      dueDate: invoice.dueDate?.split("T")[0] || "",
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const handleEditChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === "amountDisplay" ? formatCurrencyInput(e.target.value) : e.target.value;
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setEditErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validateEdit = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!editForm.amountDisplay || parseCurrency(editForm.amountDisplay) <= 0) errs.amount = "Enter a positive amount";
    if (!editForm.issuedAt) errs.issuedAt = "Issued date is required";
    if (!editForm.dueDate) errs.dueDate = "Due date is required";
    return errs;
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: parseCurrency(editForm.amountDisplay),
          issuedAt: editForm.issuedAt,
          dueDate: editForm.dueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update invoice");
      setInvoice(data.data || data);
      setEditOpen(false);
    } catch (err: any) {
      setEditErrors({ _general: err.message });
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete Handler ──────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!id) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || err.message || "Delete failed"); }
      router.push("/dashboard/invoices");
    } catch (err: any) {
      setActionError(err.message);
      setDeleteConfirm(false);
    } finally {
      setDeleteBusy(false);
    }
  };

  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = T.primary;
    e.currentTarget.style.boxShadow = "0 0 0 4px rgba(0,79,53,0.08)";
    e.currentTarget.style.background = "#fff";
  };
  const blur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = T.outlineSoft;
    e.currentTarget.style.boxShadow = "none";
    e.currentTarget.style.background = T.surfaceContainerLow;
  };

  const selectStyle: React.CSSProperties = {
    ...input,
    cursor: "pointer",
    appearance: "none" as any,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236f7a72' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px",
  };

  const remaining = invoice ? Math.max(0, Number(invoice.amount || 0) - Number(invoice.totalPaid || 0)) : 0;

  if (loading) {
    return (
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
        <div style={card}>
          <Skeleton className="h-8 w-[280px]" style={{ marginBottom: "16px" }} />
          <Skeleton className="h-4 w-[160px]" style={{ marginBottom: "32px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
        <div style={{ ...card, textAlign: "center", padding: "64px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: T.error, display: "block", marginBottom: "12px" }}>
            error
          </span>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.onSurface, margin: "0 0 8px" }}>
            {error || "Invoice not found"}
          </h3>
          <Link
            href="/dashboard/invoices"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 20px",
              background: T.primary,
              color: "#fff",
              borderRadius: "10px",
              fontFamily: T.fontLabel,
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              marginTop: "16px",
            }}
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          fontFamily: T.fontLabel,
          fontSize: "12px",
          color: T.onSurfaceMuted,
        }}
      >
        <Link
          href="/dashboard/invoices"
          style={{ color: T.onSurfaceMuted, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceMuted)}
        >
          Invoices
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
        <span style={{ color: T.onSurface }}>{invoice.invoiceNo}</span>
      </div>

      {/* Header */}
      <div style={{ ...card, marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontFamily: T.fontDisplay, fontSize: "26px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
                {invoice.invoiceNo}
              </h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>
              Project: {" "}
              <Link
                href={`/dashboard/projects/${invoice.project?.id}`}
                style={{ color: T.primary, textDecoration: "none", fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {invoice.project?.name || "—"}
              </Link>
              {invoice.project?.code && <span style={{ color: T.onSurfaceMuted }}> ({invoice.project.code})</span>}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {canUpdate && invoice.status === "DRAFT" && (
              <button
                onClick={() => updateStatus("SENT")}
                disabled={actionBusy}
                style={{
                  padding: "10px 18px",
                  background: T.info,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: actionBusy ? "not-allowed" : "pointer",
                  opacity: actionBusy ? 0.7 : 1,
                }}
              >
                Mark as Sent
              </button>
            )}
            {canUpdate && invoice.status === "SENT" && (
              <button
                onClick={() => updateStatus("OVERDUE")}
                disabled={actionBusy}
                style={{
                  padding: "10px 18px",
                  background: T.warning,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: actionBusy ? "not-allowed" : "pointer",
                  opacity: actionBusy ? 0.7 : 1,
                }}
              >
                Mark as Overdue
              </button>
            )}
            {canUpdate && invoice.status === "OVERDUE" && (
              <button
                onClick={() => updateStatus("SENT")}
                disabled={actionBusy}
                style={{
                  padding: "10px 18px",
                  background: T.info,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: actionBusy ? "not-allowed" : "pointer",
                  opacity: actionBusy ? 0.7 : 1,
                }}
              >
                Reopen as Sent
              </button>
            )}
            {canPay && invoice.status !== "PAID" && remaining > 0 && (
              <button
                onClick={() => setPaymentOpen(true)}
                style={{
                  padding: "10px 18px",
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Record Payment
              </button>
            )}
            {/* Download PDF — always visible */}
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                background: "rgba(255,255,255,0.8)",
                color: T.onSurface,
                border: `1px solid ${T.outlineSoft}`,
                borderRadius: "10px",
                fontFamily: T.fontLabel,
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.primary;
                e.currentTarget.style.color = T.primary;
                e.currentTarget.style.background = T.primaryLight;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.outlineSoft;
                e.currentTarget.style.color = T.onSurface;
                e.currentTarget.style.background = "rgba(255,255,255,0.8)";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                download
              </span>
              PDF
            </a>
            {canUpdate && (
              <button
                onClick={openEdit}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  background: "rgba(255,255,255,0.8)",
                  color: T.onSurface,
                  border: `1px solid ${T.outlineSoft}`,
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.primary;
                  e.currentTarget.style.color = T.primary;
                  e.currentTarget.style.background = T.primaryLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.outlineSoft;
                  e.currentTarget.style.color = T.onSurface;
                  e.currentTarget.style.background = "rgba(255,255,255,0.8)";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                Edit
              </button>
            )}
            {canUpdate && (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  background: "transparent",
                  color: T.error,
                  border: `1px solid ${T.error}44`,
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.errorLight;
                  e.currentTarget.style.borderColor = T.error;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = `${T.error}44`;
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                Delete
              </button>
            )}
          </div>
        </div>

        {actionError && (
          <div style={{ padding: "12px 16px", background: T.errorLight, borderRadius: "10px", color: T.error, fontFamily: T.fontBody, fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
            {actionError}
          </div>
        )}

        {/* Summary grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <div style={{ background: T.primaryLight, borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Invoice Amount</p>
            <p style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{formatCurrency(invoice.amount)}</p>
          </div>
          <div style={{ background: T.successLight, borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Paid</p>
            <p style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 700, color: T.success, margin: 0 }}>{formatCurrency(invoice.totalPaid)}</p>
          </div>
          <div style={{ background: remaining > 0 ? "rgba(180,83,9,0.08)" : T.successLight, borderRadius: "12px", padding: "16px" }}>
            <p style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Remaining</p>
            <p style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 700, color: remaining > 0 ? T.warning : T.success, margin: 0 }}>{formatCurrency(remaining)}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Details */}
        <div style={card}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 20px" }}>Invoice Details</h3>
          <DetailRow label="Invoice Number" value={invoice.invoiceNo} />
          <DetailRow label="Project" value={invoice.project?.name || "—"} />
          <DetailRow label="Issued Date" value={formatDate(invoice.issuedAt)} />
          <DetailRow label="Due Date" value={formatDate(invoice.dueDate)} />
          <DetailRow label="Paid Date" value={formatDate(invoice.paidAt)} />
          <DetailRow label="Created" value={formatDate(invoice.createdAt)} />
        </div>

        {/* Payment history */}
        <div style={card}>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: "0 0 20px" }}>Payment History</h3>
          {(!invoice.payments || invoice.payments.length === 0) ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft, display: "block", marginBottom: "8px" }}>
                payments
              </span>
              <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>No payments recorded yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {invoice.payments.map((p: any) => (
                <div key={p.id} style={{ padding: "14px", background: T.surfaceContainerLow, borderRadius: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 700, color: T.onSurface }}>{formatCurrency(p.amount)}</span>
                    <span style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.onSurfaceMuted, background: T.surfaceCard, padding: "2px 8px", borderRadius: "4px" }}>{p.method}</span>
                  </div>
                  <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted, margin: 0 }}>Paid on {formatDate(p.paidAt)}</p>
                  {p.confirmedBy && (
                    <p style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.success, margin: "4px 0 0" }}>
                      Verified by {p.confirmedBy.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment modal */}
      {paymentOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={() => setPaymentOpen(false)}
        >
          <div
            style={{
              background: T.surfaceCard,
              borderRadius: "20px",
              border: "1px solid rgba(190,201,193,0.25)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflow: "auto",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Record Payment</h3>
              <button
                onClick={() => setPaymentOpen(false)}
                style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", borderRadius: "8px", color: T.onSurfaceMuted }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            <div style={{ padding: "12px 16px", background: T.surfaceContainerLow, borderRadius: "10px", marginBottom: "20px" }}>
              <p style={{ fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted, margin: "0 0 4px" }}>Remaining Balance</p>
              <p style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{formatCurrency(remaining)}</p>
            </div>

            {paymentError && (
              <div style={{ padding: "12px 16px", background: T.errorLight, borderRadius: "10px", color: T.error, fontFamily: T.fontBody, fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                {paymentError}
              </div>
            )}

            <form onSubmit={submitPayment}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                <Field label="Amount" required error={paymentErrors.amount}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 1.500.000.000"
                    value={paymentForm.amountDisplay}
                    onChange={handlePaymentAmountChange}
                    onFocus={focus}
                    onBlur={blur}
                    style={{
                      ...input,
                      borderColor: paymentErrors.amount ? T.error : T.outlineSoft,
                      fontFamily: T.fontLabel,
                    }}
                  />
                </Field>

                <Field label="Payment Method" required error={paymentErrors.method}>
                  <select
                    style={{
                      ...selectStyle,
                      borderColor: paymentErrors.method ? T.error : T.outlineSoft,
                    }}
                    value={paymentForm.method}
                    onChange={handlePaymentChange("method")}
                    onFocus={focus}
                    onBlur={blur}
                  >
                    <option value="">Select method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>

                <Field label="Paid Date" required error={paymentErrors.paidAt}>
                  <input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={handlePaymentChange("paidAt")}
                    onFocus={focus}
                    onBlur={blur}
                    style={{
                      ...input,
                      borderColor: paymentErrors.paidAt ? T.error : T.outlineSoft,
                    }}
                  />
                </Field>

                <Field label="Proof URL" hint="Optional link to payment receipt">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={paymentForm.proofUrl}
                    onChange={handlePaymentChange("proofUrl")}
                    onFocus={focus}
                    onBlur={blur}
                    style={input}
                  />
                </Field>

                <Field label="Notes" hint="Optional internal note">
                  <textarea
                    value={paymentForm.notes}
                    onChange={handlePaymentChange("notes")}
                    onFocus={focus}
                    onBlur={blur}
                    style={{ ...input, minHeight: "80px", resize: "vertical" as any }}
                    placeholder="Notes..."
                  />
                </Field>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: `1px solid rgba(190,201,193,0.2)`, paddingTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                  style={{ padding: "10px 20px", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px", background: "#fff", color: T.onSurface, fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  style={{ padding: "10px 22px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, cursor: paymentSubmitting ? "not-allowed" : "pointer", opacity: paymentSubmitting ? 0.7 : 1 }}
                >
                  {paymentSubmitting ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setDeleteConfirm(false)}
        >
          <div
            style={{ background: T.surfaceCard, borderRadius: "20px", border: "1px solid rgba(190,201,193,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: "400px", padding: "32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: T.error, display: "block", marginBottom: "12px" }}>delete_forever</span>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: "0 0 8px" }}>Delete Invoice?</h3>
              <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>
                This will soft-delete invoice <strong>{invoice.invoiceNo}</strong>. Payments will remain but the invoice will no longer appear in listings.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ padding: "10px 20px", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px", background: "#fff", color: T.onSurface, fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteBusy}
                style={{ padding: "10px 20px", background: T.error, color: "#fff", border: "none", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, cursor: deleteBusy ? "not-allowed" : "pointer", opacity: deleteBusy ? 0.7 : 1 }}
              >
                {deleteBusy ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={() => setEditOpen(false)}
        >
          <div
            style={{ background: T.surfaceCard, borderRadius: "20px", border: "1px solid rgba(190,201,193,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflow: "auto", padding: "32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "20px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Edit Invoice</h3>
              <button onClick={() => setEditOpen(false)} style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", borderRadius: "8px", color: T.onSurfaceMuted }}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
              </button>
            </div>

            {editErrors._general && (
              <div style={{ padding: "12px 16px", background: T.errorLight, borderRadius: "10px", color: T.error, fontFamily: T.fontBody, fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
                {editErrors._general}
              </div>
            )}

            <form onSubmit={submitEdit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "24px" }}>
                <Field label="Amount" required error={editErrors.amount}>
                  <input
                    type="text" inputMode="numeric" placeholder="e.g. 1.500.000.000"
                    value={editForm.amountDisplay}
                    onChange={handleEditChange("amountDisplay")}
                    onFocus={focus} onBlur={blur}
                    style={{ ...input, borderColor: editErrors.amount ? T.error : T.outlineSoft, fontFamily: T.fontLabel }}
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <Field label="Issued Date" required error={editErrors.issuedAt}>
                    <input type="date" value={editForm.issuedAt} onChange={handleEditChange("issuedAt")} onFocus={focus} onBlur={blur}
                      style={{ ...input, borderColor: editErrors.issuedAt ? T.error : T.outlineSoft }} />
                  </Field>
                  <Field label="Due Date" required error={editErrors.dueDate}>
                    <input type="date" value={editForm.dueDate} onChange={handleEditChange("dueDate")} onFocus={focus} onBlur={blur}
                      style={{ ...input, borderColor: editErrors.dueDate ? T.error : T.outlineSoft }} />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: `1px solid rgba(190,201,193,0.2)`, paddingTop: "20px" }}>
                <button type="button" onClick={() => setEditOpen(false)} style={{ padding: "10px 20px", border: `1px solid ${T.outlineSoft}`, borderRadius: "10px", background: "#fff", color: T.onSurface, fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={editSubmitting} style={{ padding: "10px 22px", background: T.primary, color: "#fff", border: "none", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, cursor: editSubmitting ? "not-allowed" : "pointer", opacity: editSubmitting ? 0.7 : 1 }}>
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
