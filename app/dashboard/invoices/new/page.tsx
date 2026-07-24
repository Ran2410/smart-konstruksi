"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.4)",
  success: "#15803d",
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

const CAN_CREATE = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR"];

function formatCurrencyInput(val: string): string {
  const numeric = val.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

function parseCurrency(val: string): number {
  return Number(val.replace(/\./g, "").replace(/,/g, ".")) || 0;
}

export default function NewInvoicePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role as string | undefined;
  const canCreate = !!(role && CAN_CREATE.includes(role));

  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [form, setForm] = useState({
    projectId: "",
    amountDisplay: "",
    issuedAt: "",
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const t = requestAnimationFrame(() => setLoadingProjects(true));
    fetch("/api/projects?limit=200&status=PLANNING,IN_PROGRESS", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setProjects(data.data || []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));
    return () => cancelAnimationFrame(t);
  }, [session]);

  useEffect(() => {
    if (!canCreate) {
      router.push("/dashboard/invoices");
    }
  }, [canCreate, router]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const display = formatCurrencyInput(e.target.value);
    setForm((prev) => ({ ...prev, amountDisplay: display }));
    setErrors((prev) => {
      const n = { ...prev };
      delete n.amount;
      return n;
    });
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!form.projectId) errs.projectId = "Project is required";
    if (!form.amountDisplay || parseCurrency(form.amountDisplay) <= 0) errs.amount = "Enter a positive amount";
    if (!form.issuedAt) errs.issuedAt = "Issued date is required";
    if (!form.dueDate) errs.dueDate = "Due date is required";
    if (form.issuedAt && form.dueDate && new Date(form.dueDate) < new Date(form.issuedAt)) {
      errs.dueDate = "Due date must be on or after issued date";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          projectId: form.projectId,
          amount: parseCurrency(form.amountDisplay),
          issuedAt: form.issuedAt,
          dueDate: form.dueDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create invoice");
      }
      router.push(`/dashboard/invoices/${data.data?.id || data.id}`);
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
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

  if (!canCreate) return null;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
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
        <span style={{ color: T.onSurface }}>New Invoice</span>
      </div>

      <div style={card}>
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontSize: "22px",
            fontWeight: 700,
            color: T.onSurface,
            margin: "0 0 4px",
          }}
        >
          Create New Invoice
        </h2>
        <p
          style={{
            fontFamily: T.fontBody,
            fontSize: "14px",
            color: T.onSurfaceMuted,
            margin: "0 0 32px",
          }}
        >
          Generate an invoice for a project. The invoice number will be assigned automatically.
        </p>

        {submitError && (
          <div
            style={{
              padding: "12px 16px",
              background: T.errorLight,
              borderRadius: "10px",
              color: T.error,
              fontFamily: T.fontBody,
              fontSize: "13px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginBottom: "28px" }}>
            <Field label="Project" required error={errors.projectId}>
              <select
                style={{
                  ...selectStyle,
                  borderColor: errors.projectId ? T.error : T.outlineSoft,
                }}
                value={form.projectId}
                onChange={handleChange("projectId")}
                onFocus={focus}
                onBlur={blur}
                disabled={loadingProjects}
              >
                <option value="">{loadingProjects ? "Loading projects..." : "Select a project"}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.code ? `(${p.code})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Amount" required hint="Invoice total amount" error={errors.amount}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 1.500.000.000"
                value={form.amountDisplay}
                onChange={handleAmountChange}
                onFocus={focus}
                onBlur={blur}
                style={{
                  ...input,
                  borderColor: errors.amount ? T.error : T.outlineSoft,
                  fontFamily: T.fontLabel,
                }}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <Field label="Issued Date" required error={errors.issuedAt}>
                <input
                  type="date"
                  value={form.issuedAt}
                  onChange={handleChange("issuedAt")}
                  onFocus={focus}
                  onBlur={blur}
                  style={{
                    ...input,
                    borderColor: errors.issuedAt ? T.error : T.outlineSoft,
                  }}
                />
              </Field>
              <Field label="Due Date" required error={errors.dueDate}>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange("dueDate")}
                  onFocus={focus}
                  onBlur={blur}
                  style={{
                    ...input,
                    borderColor: errors.dueDate ? T.error : T.outlineSoft,
                  }}
                />
              </Field>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: `1px solid rgba(190,201,193,0.2)`,
              paddingTop: "24px",
            }}
          >
            <Link
              href="/dashboard/invoices"
              style={{
                padding: "10px 20px",
                border: `1px solid ${T.outlineSoft}`,
                borderRadius: "10px",
                background: "#fff",
                color: T.onSurface,
                fontFamily: T.fontLabel,
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "10px 22px",
                background: T.primary,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontFamily: T.fontLabel,
                fontSize: "14px",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
