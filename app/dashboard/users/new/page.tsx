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
  primaryMedium: "rgba(0,79,53,0.15)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  surfaceContainer: "#eef2ef",
  error: "#ba1a1a",
  errorContainer: "rgba(255,218,214,0.4)",
  success: "#0d7a3f",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

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

// ── Role Groups ───────────────────────────────────────────────────────────
const ROLE_GROUPS = [
  { label: "Management", roles: ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER"] },
  { label: "Project", roles: ["PROJECT_MANAGER", "SITE_MANAGER", "ESTIMATOR", "MANDOR"] },
  { label: "Technical", roles: ["ARSITEK", "INTERIOR_DESIGNER", "QC_INSPECTOR", "K3_OFFICER", "SURVEYOR", "LOGISTIK"] },
  { label: "Support", roles: ["ADMIN_KANTOR", "FINANCE", "KONSULTAN"] },
  { label: "External", roles: ["CLIENT", "VENDOR", "HOME_OWNER"] },
];

function formatRole(role: string): string {
  return role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Components ────────────────────────────────────────────────────────────
function Badge({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" }) {
  const colors = {
    default: { bg: T.surfaceContainer, color: T.onSurfaceVariant },
    success: { bg: "rgba(13,122,63,0.1)", color: T.success },
    warning: { bg: "rgba(237,123,0,0.1)", color: "#ed7b00" },
  };
  const c = colors[variant];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "4px 12px", borderRadius: "20px",
      background: c.bg, color: c.color,
      fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
      letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: T.error }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{
          fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted,
          margin: "6px 0 0", display: "flex", alignItems: "center", gap: "4px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
          {hint}
        </p>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function NewUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    branchId: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // ── Fetch branches ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    setLoadingDropdowns(true);
    fetch("/api/branches?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.data) setBranches(d.data); })
      .catch(() => {})
      .finally(() => setLoadingDropdowns(false));
  }, [session]);

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = T.primary;
    e.target.style.boxShadow = "0 0 0 4px rgba(0,79,53,0.08)";
    e.target.style.background = "#fff";
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = T.outlineSoft;
    e.target.style.boxShadow = "none";
    e.target.style.background = T.surfaceContainerLow;
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTouched((t) => ({ ...t, [key]: true }));
    if (errors[key]) {
      setErrors((er) => { const n = { ...er }; delete n[key]; return n; });
    }
  };

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (!form.role) errs.role = "Role is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ name: true, email: true, password: true, role: true });
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const body: Record<string, string> = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.branchId) body.branchId = form.branchId;
      if (form.phone.trim()) body.phone = form.phone.trim();

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }
      router.push("/dashboard/users");
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputFieldStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
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

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
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
          gap: 24px;
        }
        .sk-form-grid .full {
          grid-column: 1 / -1;
        }
        @media (max-width: 640px) {
          .sk-form-grid {
            grid-template-columns: 1fr;
          }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0.4;
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "32px", marginTop: "20px" }}>
        <Link
          href="/dashboard/users"
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
          <h2 style={{ fontFamily: T.fontDisplay, fontSize: "32px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            Create New User
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: 0, lineHeight: "1.5" }}>
            Add a new user account to the system.
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
          <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error, flex: 1 }}>{submitError}</span>
          <button onClick={() => setSubmitError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.error }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div style={card}>
          {/* Section: Basic Info */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid rgba(190,201,193,0.25)` }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,79,53,0.1)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>person_add</span>
            </div>
            <div>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: 700, color: T.onSurface, margin: 0, letterSpacing: "-0.01em" }}>Account Details</h3>
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0", lineHeight: "1.4" }}>Provide the basic information for the new user.</p>
            </div>
          </div>

          <div className="sk-form-grid">
            {/* Name */}
            <Field label="Full Name" required>
              <input
                type="text"
                placeholder="e.g. John Smith"
                value={form.name}
                onChange={set("name")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("name")}
              />
              {errors.name && touched.name && <p className="sk-error-msg">{errors.name}</p>}
            </Field>

            {/* Email */}
            <Field label="Email Address" required>
              <input
                type="email"
                placeholder="e.g. john@company.com"
                value={form.email}
                onChange={set("email")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("email")}
              />
              {errors.email && touched.email && <p className="sk-error-msg">{errors.email}</p>}
            </Field>

            {/* Password */}
            <Field label="Password" required hint="Minimum 6 characters">
              <input
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={set("password")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("password")}
              />
              {errors.password && touched.password && <p className="sk-error-msg">{errors.password}</p>}
            </Field>

            {/* Phone */}
            <Field label="Phone Number" hint="Optional">
              <input
                type="tel"
                placeholder="e.g. +62 812 3456 7890"
                value={form.phone}
                onChange={set("phone")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("phone")}
              />
            </Field>

            {/* Role */}
            <Field label="Role" required>
              <select
                value={form.role}
                onChange={set("role")}
                onFocus={focusInput}
                onBlur={blurInput}
                style={selectStyle("role")}
              >
                <option value="">Select a role...</option>
                {ROLE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.roles.map((r) => (
                      <option key={r} value={r}>{formatRole(r)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {errors.role && touched.role && <p className="sk-error-msg">{errors.role}</p>}
            </Field>

            {/* Branch */}
            {form.role === "BRANCH_MANAGER" ? (
              <Field label="Branch" hint="Auto-assigned to their own branch">
                <div style={{
                  ...inputStyle,
                  background: T.surfaceContainerLow,
                  color: T.outline,
                  display: "flex", alignItems: "center", gap: "8px",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>lock</span>
                  <span>Auto-assigned</span>
                </div>
              </Field>
            ) : (
              <Field label="Branch" hint="Optional">
                <select
                  value={form.branchId}
                  onChange={set("branchId")}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  style={selectStyle("branchId")}
                >
                  <option value="">No branch assigned</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingBottom: "32px" }}>
          <Link
            href="/dashboard/users"
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
                Creating...
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                Create User
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
