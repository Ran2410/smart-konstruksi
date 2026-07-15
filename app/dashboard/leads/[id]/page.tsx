"use client";

import { useState, useEffect } from "react";
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
  secondary: "#565e74",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  surfaceContainerHigh: "#eef2ef",
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

// ── Styles ────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: "1px solid rgba(190,201,193,0.25)",
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
};

const editFieldStyle: React.CSSProperties = {
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

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: T.fontLabel,
  fontSize: "11px",
  fontWeight: 600,
  color: T.outline,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "Website" },
  { value: "REFERRAL", label: "Referral" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "PHONE", label: "Phone" },
  { value: "EMAIL", label: "Email" },
  { value: "EVENT", label: "Event" },
  { value: "OTHER", label: "Other" },
];

const TYPE_OPTIONS = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "RENOVATION", label: "Renovation" },
  { value: "INTERIOR", label: "Interior Design" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUOTED", label: "Quoted" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

// ── Components ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: T.error }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{
          fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted,
          margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
          {hint}
        </p>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
      {/* Header skeleton */}
      <div style={{ ...cardStyle, marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
      {/* Form skeleton */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid rgba(190,201,193,0.25)" }}>
          <Skeleton className="h-12 w-12 rounded-[14px]" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-10 w-full rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function EditLeadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    source: "",
    type: "",
    budgetMin: "",
    budgetMax: "",
    location: "",
    notes: "",
    assignedTo: "",
    branchId: "",
    status: "NEW",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // ── Fetch lead data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !leadId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/leads/${leadId}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/users?limit=100", { credentials: "include" }).then(r => r.json()),
      fetch("/api/branches?limit=100", { credentials: "include" }).then(r => r.json()),
    ])
      .then(([leadData, usersData, branchesData]) => {
        if (leadData.error) throw new Error(leadData.error);
        setLead(leadData);
        setUsers(usersData.data || []);
        setBranches(branchesData.data || []);
        // Pre-fill form
        setForm({
          name: leadData.name || "",
          company: leadData.company || "",
          phone: leadData.phone || "",
          email: leadData.email || "",
          source: leadData.source || "",
          type: leadData.type || "",
          budgetMin: leadData.budgetMin != null ? String(Number(leadData.budgetMin)) : "",
          budgetMax: leadData.budgetMax != null ? String(Number(leadData.budgetMax)) : "",
          location: leadData.location || "",
          notes: leadData.notes || "",
          assignedTo: leadData.assignedTo || "",
          branchId: leadData.branchId || "",
          status: leadData.status || "NEW",
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => { setLoading(false); setLoadingDropdowns(false); });
  }, [session, leadId]);

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = T.primary;
    e.target.style.boxShadow = "0 0 0 4px rgba(0,79,53,0.08)";
    e.target.style.background = "#fff";
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = T.outlineSoft;
    e.target.style.boxShadow = "none";
    e.target.style.background = T.surfaceContainerLow;
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTouched((t) => ({ ...t, [key]: true }));
    if (errors[key]) {
      setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
    }
  };

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ name: true });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        status: form.status || "NEW",
      };
      if (form.company.trim()) body.company = form.company.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.email.trim()) body.email = form.email.trim();
      if (form.source) body.source = form.source;
      if (form.type) body.type = form.type;
      if (form.budgetMin) body.budgetMin = Number(form.budgetMin);
      if (form.budgetMax) body.budgetMax = Number(form.budgetMax);
      if (form.location.trim()) body.location = form.location.trim();
      if (form.notes.trim()) body.notes = form.notes.trim();
      if (form.assignedTo) body.assignedTo = form.assignedTo;
      if (form.branchId) body.branchId = form.branchId;

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update lead");
      }
      router.push("/dashboard/leads");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputFieldStyle = (field: string): React.CSSProperties => ({
    ...editFieldStyle,
    borderColor: errors[field] && touched[field] ? T.error : T.outlineSoft,
    background: errors[field] && touched[field] ? "rgba(255,218,214,0.15)" : T.surfaceContainerLow,
  });

  const selectStyle = (field: string): React.CSSProperties => ({
    ...inputFieldStyle(field),
    cursor: "pointer",
    appearance: "none" as any,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236f7a72' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "40px",
  });

  const textareaStyle = (field: string): React.CSSProperties => ({
    ...inputFieldStyle(field),
    minHeight: "100px",
    resize: "vertical" as any,
    lineHeight: "1.6",
  });

  if (loading || !session) return <DetailSkeleton />;

  if (error) {
    return (
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px", textAlign: "center", paddingTop: "80px" }}>
        <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.error, display: "block", marginBottom: "12px" }}>error</span>
        <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.onSurface, margin: "0 0 8px" }}>Lead not found</h3>
        <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.outline, margin: "0 0 24px" }}>{error}</p>
        <Link href="/dashboard/leads" style={{ padding: "10px 24px", background: T.primary, color: "#fff", borderRadius: "10px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
      <style>{`
        .sk-error-msg {
          font-family: ${T.fontBody};
          font-size: 12px;
          color: ${T.error};
          margin: 6px 0 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .sk-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .sk-form-grid .full {
          grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
          .sk-form-grid {
            grid-template-columns: 1fr;
          }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "32px", marginTop: "20px" }}>
        <Link
          href="/dashboard/leads"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "44px", height: "44px", borderRadius: "14px",
            background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`,
            color: T.onSurfaceVariant, textDecoration: "none", flexShrink: 0,
            transition: "all 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: "32px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Edit Lead
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: 0, lineHeight: "1.5" }}>
            Update lead information for <strong>{lead?.name}</strong>.
          </p>
        </div>
      </div>

      {/* Global Error */}
      {submitError && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", marginBottom: "24px",
          background: T.errorLight,
          border: "1px solid rgba(186,26,26,0.2)",
          borderRadius: "12px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error }}>error</span>
          <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error, flex: 1 }}>{submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.error }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div style={cardStyle}>
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid rgba(190,201,193,0.25)` }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,79,53,0.1)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>edit</span>
            </div>
            <div>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: 700, color: T.onSurface, margin: 0, letterSpacing: "-0.01em" }}>Lead Information</h3>
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0", lineHeight: "1.4" }}>Update lead information as needed.</p>
            </div>
          </div>

          <div className="sk-form-grid">
            {/* Name */}
            <Field label="Full Name" required>
              <input
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={set("name")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("name")}
              />
              {errors.name && touched.name && <p className="sk-error-msg">{errors.name}</p>}
            </Field>

            {/* Company */}
            <Field label="Company">
              <input
                type="text"
                placeholder="Company name"
                value={form.company}
                onChange={set("company")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("company")}
              />
            </Field>

            {/* Phone */}
            <Field label="Phone">
              <input
                type="tel"
                placeholder="+62 812 3456 7890"
                value={form.phone}
                onChange={set("phone")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("phone")}
              />
            </Field>

            {/* Email */}
            <Field label="Email">
              <input
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={set("email")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("email")}
              />
            </Field>

            {/* Source */}
            <Field label="Source">
              <select
                value={form.source}
                onChange={set("source")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("source")}
              >
                <option value="">Select source...</option>
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* Type */}
            <Field label="Project Type">
              <select
                value={form.type}
                onChange={set("type")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("type")}
              >
                <option value="">Select type...</option>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* Budget Min */}
            <Field label="Min Budget">
              <input
                type="number"
                placeholder="0"
                min="0"
                value={form.budgetMin}
                onChange={set("budgetMin")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("budgetMin")}
              />
            </Field>

            {/* Budget Max */}
            <Field label="Max Budget">
              <input
                type="number"
                placeholder="0"
                min="0"
                value={form.budgetMax}
                onChange={set("budgetMax")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("budgetMax")}
              />
            </Field>

            {/* Status */}
            <Field label="Status">
              <select
                value={form.status}
                onChange={set("status")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("status")}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            {/* Location */}
            <Field label="Location">
              <input
                type="text"
                placeholder="City / area"
                value={form.location}
                onChange={set("location")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("location")}
              />
            </Field>

            {/* Assigned To */}
            <Field label="Assigned To">
              <select
                value={form.assignedTo}
                onChange={set("assignedTo")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("assignedTo")}
                disabled={loadingDropdowns}
              >
                <option value="">Select user...</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name || u.email}</option>
                ))}
              </select>
            </Field>

            {/* Branch */}
            <Field label="Branch">
              <select
                value={form.branchId}
                onChange={set("branchId")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("branchId")}
                disabled={loadingDropdowns}
              >
                <option value="">Select branch...</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>

            {/* Notes - Full width */}
            <div className="full">
              <Field label="About / Notes">
                <textarea
                  placeholder="Additional information about the lead..."
                  value={form.notes}
                  onChange={set("notes")}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={textareaStyle("notes")}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingBottom: "32px" }}>
          <Link
            href="/dashboard/leads"
            style={{
              padding: "12px 24px", background: T.surfaceCard, color: T.onSurfaceVariant,
              border: `1px solid ${T.outlineSoft}`, borderRadius: "12px",
              fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600,
              textDecoration: "none", cursor: "pointer", transition: "all 0.15s",
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "12px 32px", background: submitting ? T.outline : T.primary,
              color: "#fff", border: "none", borderRadius: "12px",
              fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: submitting ? "none" : "0 2px 8px rgba(0,79,53,0.2)",
              transition: "all 0.15s",
            }}
          >
            {submitting ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                Menyimpan...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                Save Changes
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
