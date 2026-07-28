"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Styles ────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: `1px solid rgba(190,201,193,0.25)`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "36px",
  transition: "box-shadow 0.2s",
};

const inputStyle: React.CSSProperties = {
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

// ── Components ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: T.error }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{
          fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted,
          margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
          {hint}
        </p>
      )}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "16px",
      marginBottom: "28px", paddingBottom: "20px",
      borderBottom: `1px solid rgba(190,201,193,0.25)`
    }}>
      <div style={{
        width: "48px", height: "48px", borderRadius: "14px",
        background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, boxShadow: `0 4px 12px rgba(0,79,53,0.1)`
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>
          {icon}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{
          fontFamily: FONT_DISPLAY, fontSize: "19px", fontWeight: 700,
          color: T.onSurface, margin: 0, letterSpacing: "-0.01em"
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceMuted,
            margin: "4px 0 0", lineHeight: "1.4"
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Form Skeleton ──────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "32px", marginTop: "20px" }}>
        <Skeleton className="h-11 w-11 rounded-[14px]" />
        <div style={{ flex: 1 }}>
          <Skeleton className="h-8 w-[220px] mb-1" />
          <Skeleton className="h-4 w-[220px]" />
        </div>
      </div>
      {/* Form Card */}
      <div style={card}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid rgba(190,201,193,0.25)` }}>
          <Skeleton className="h-12 w-12 rounded-[14px]" />
          <div>
            <Skeleton className="h-5 w-[160px] mb-1" />
            <Skeleton className="h-4 w-[240px]" />
          </div>
        </div>
        {/* Name field */}
        <div style={{ marginBottom: "24px" }}>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-[44px] w-full rounded-[12px]" />
        </div>
        {/* Address field */}
        <div style={{ marginBottom: "24px" }}>
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-[100px] w-full rounded-[12px]" />
        </div>
        {/* Contact Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
          <div>
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-[44px] w-full rounded-[12px]" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-[44px] w-full rounded-[12px]" />
          </div>
        </div>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
        <Skeleton className="h-[44px] w-[100px] rounded-[12px]" />
        <Skeleton className="h-[44px] w-[140px] rounded-[12px]" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function NewBranchPage() {
  const { status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTouched((t) => ({ ...t, [key]: true }));
    if (errors[key]) {
      setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
    }
  };

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Branch name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const newTouched: Record<string, boolean> = {};
      Object.keys(errs).forEach(k => newTouched[k] = true);
      setTouched(t => ({ ...t, ...newTouched }));
      return;
    }
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create branch");
      }
      router.push("/dashboard/branches");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: errors[field] && touched[field] ? T.error : T.outlineSoft,
    background: errors[field] && touched[field] ? "rgba(255,218,214,0.15)" : T.surfaceContainerLow,
  });

  if (status === "loading") return <FormSkeleton />;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 16px" }}>
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
        marginBottom: "32px", marginTop: "20px"
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
            color: T.onSurface, margin: "0 0 4px", letterSpacing: "-0.02em"
          }}>
            Create New Branch
          </h2>
          <p style={{
            fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceMuted,
            margin: 0, lineHeight: "1.5"
          }}>
            Add a new company branch to organize your projects and teams.
          </p>
        </div>
      </div>

      {/* Global Error */}
      {submitError && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", marginBottom: "24px",
          background: T.errorContainer,
          border: `1px solid rgba(186,26,26,0.2)`,
          borderRadius: "12px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error }}>error</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.error, margin: 0, flex: 1 }}>{submitError}</p>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.error, padding: "4px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      {/* Form Card */}
      <div style={card}>
        <SectionHeader
          icon="domain"
          title="Branch Information"
          subtitle="Enter the branch details below. Only the branch name is required."
        />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Branch Name */}
          <Field label="Branch Name" required>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              onFocus={focusInput}
              onBlur={blurInput}
              placeholder="e.g. Jakarta Main Office"
              style={inputClass("name")}
            />
            {errors.name && touched.name && (
              <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.error, margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                {errors.name}
              </p>
            )}
          </Field>

          {/* Address */}
          <Field label="Address" hint="Full address of the branch location">
            <textarea
              value={form.address}
              onChange={set("address")}
              onFocus={focusInput}
              onBlur={blurInput}
              placeholder="e.g. Jl. Sudirman No. 123, Jakarta Selatan"
              style={inputClass("address")}
            />
          </Field>

          {/* Contact Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                onFocus={focusInput}
                onBlur={blurInput}
                placeholder="e.g. +62 21 555 0123"
                style={inputClass("phone")}
              />
            </Field>

            <Field label="Email" hint="Branch contact email">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                onFocus={focusInput}
                onBlur={blurInput}
                placeholder="e.g. branch@company.com"
                style={inputClass("email")}
              />
              {errors.email && touched.email && (
                <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.error, margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                  {errors.email}
                </p>
              )}
            </Field>
          </div>

          {/* Actions */}
          <div style={{
            display: "flex", justifyContent: "flex-end", gap: "12px",
            paddingTop: "16px", borderTop: `1px solid rgba(190,201,193,0.25)`
          }}>
            <Link
              href="/dashboard/branches"
              style={{
                padding: "12px 24px", background: T.surfaceCard,
                border: `1px solid ${T.outlineSoft}`, borderRadius: "12px",
                fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                color: T.onSurface, textDecoration: "none", transition: "all 0.15s",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "12px 28px", background: submitting ? T.outlineSoft : T.primary,
                border: "none", borderRadius: "12px",
                fontFamily: FONT_LABEL, fontSize: "14px", fontWeight: 700,
                color: "#fff", cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: submitting ? "none" : "0 2px 8px rgba(0,79,53,0.2)",
                transition: "all 0.15s",
              }}
            >
              {submitting ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                  Create Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
