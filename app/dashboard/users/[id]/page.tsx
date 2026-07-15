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

function FormSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
      <div style={{ ...card, height: "80px" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
      <div style={{ ...card }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20 mb-[10px]" />
              <Skeleton className="h-[44px] w-full rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 16px", textAlign: "center" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>person_off</span>
      <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", color: T.onSurface, margin: "0 0 8px" }}>User not found</h3>
      <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.outline, margin: "0 0 16px" }}>The user you're looking for doesn't exist or has been deleted.</p>
      <Link href="/dashboard/users" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 20px", background: T.primary, color: "#fff", border: "none", borderRadius: "8px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
        Back to Users
      </Link>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function EditUserPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const userRole = (session?.user as any)?.role;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    branchId: "",
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch user ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || !userId) return;
    setLoading(true);
    fetch(`/api/users/${userId}`, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setUser(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "",
          branchId: data.branchId || "",
          isActive: data.isActive ?? true,
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [session, userId]);

  // ── Fetch branches ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    fetch("/api/branches?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.data) setBranches(d.data); })
      .catch(() => {});
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
    if (!form.role) errs.role = "Role is required";
    if (newPassword && newPassword.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setTouched({ name: true, email: true, role: true, ...(errs.password ? { password: true } : {}) });
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const body: Record<string, any> = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive,
      };
      if (form.branchId) body.branchId = form.branchId;
      else body.branchId = null;
      if (form.phone.trim()) body.phone = form.phone.trim();
      else body.phone = null;
      if (newPassword) body.password = newPassword;

      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user");
      }
      setSaveSuccess(true);
      setNewPassword("");
      // Re-fetch user data
      const updated = await fetch(`/api/users/${userId}`, { credentials: "include" }).then(r => r.json());
      setUser(updated);
      router.push("/dashboard/users");
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        router.push("/dashboard/users");
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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

  if (loading) return <FormSkeleton />;
  if (error || !user) return <NotFound />;

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
        .sk-toggle-track {
          width: 48px; height: 26px; border-radius: 13px;
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center;
          padding: 3px;
        }
        .sk-toggle-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
            Edit User
          </h2>
          <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: 0, lineHeight: "1.5" }}>
            Update account details for <strong style={{ color: T.onSurface }}>{user.name || user.email}</strong>.
          </p>
        </div>
      </div>

      {/* Success message */}
      {saveSuccess && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", marginBottom: "24px",
          background: "rgba(220,252,231,0.6)",
          border: `1px solid rgba(21,128,61,0.2)`,
          borderRadius: "12px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.success }}>check_circle</span>
          <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.success, flex: 1 }}>User updated successfully!</span>
        </div>
      )}

      {/* Error message */}
      {saveError && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", marginBottom: "24px",
          background: T.errorContainer,
          border: `1px solid rgba(186,26,26,0.2)`,
          borderRadius: "12px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error }}>error</span>
          <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error, flex: 1 }}>{saveError}</span>
          <button onClick={() => setSaveError(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.error }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div style={card}>
          {/* Section Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid rgba(190,201,193,0.25)` }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,79,53,0.1)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>person</span>
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: 700, color: T.onSurface, margin: 0, letterSpacing: "-0.01em" }}>Account Details</h3>
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0", lineHeight: "1.4" }}>Modify the user's account information.</p>
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

            {/* Phone */}
            <Field label="Phone Number">
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
            <Field label="Branch">
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

            {/* Status Toggle */}
            <Field label="Status">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  className="sk-toggle-track"
                  style={{ background: form.isActive ? T.primary : T.outlineSoft }}
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                >
                  <div
                    className="sk-toggle-thumb"
                    style={{
                      transform: form.isActive ? "translateX(22px)" : "translateX(0)",
                      background: "#fff",
                    }}
                  />
                </div>
                <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: form.isActive ? T.primary : T.outline }}>
                  {form.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </Field>
          </div>
        </div>

        {/* Reset Password Section */}
        <div style={{ ...card, marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid rgba(190,201,193,0.25)` }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `linear-gradient(135deg, ${T.errorContainer}, rgba(255,218,214,0.4))`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.error }}>lock</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: 700, color: T.onSurface, margin: 0, letterSpacing: "-0.01em" }}>Reset Password</h3>
                <Badge variant="warning">Optional</Badge>
              </div>
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0", lineHeight: "1.4" }}>Leave blank to keep the current password.</p>
            </div>
          </div>

          <div className="sk-form-grid">
            <Field label="New Password" hint="Minimum 6 characters">
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setTouched((t) => ({ ...t, password: true }));
                  if (errors.password) {
                    setErrors((er) => { const n = { ...er }; delete n.password; return n; });
                  }
                }}
                onFocus={focusInput}
                onBlur={blurInput}
                style={inputFieldStyle("password")}
              />
              {errors.password && touched.password && <p className="sk-error-msg">{errors.password}</p>}
            </Field>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px", paddingBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          {/* Delete */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: "12px 24px", background: "none",
              color: T.error, border: `1px solid rgba(186,26,26,0.2)`,
              borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
            Delete User
          </button>

          {/* Save */}
          <div style={{ display: "flex", gap: "12px" }}>
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
              disabled={saving}
              style={{
                padding: "12px 32px", background: saving ? T.outline : T.primary,
                color: "#fff", border: "none", borderRadius: "12px",
                fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: saving ? "none" : "0 2px 8px rgba(0,79,53,0.2)",
                transition: "all 0.15s",
              }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                  Saving...
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                  Save Changes
                </span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <>
          <div
            onClick={() => !deleting && setShowDeleteConfirm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 49, backdropFilter: "blur(4px)" }}
          />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: T.surfaceCard, borderRadius: "20px", padding: "32px",
            boxShadow: "0 24px 48px rgba(0,0,0,0.15)",
            zIndex: 50, width: "min(440px, 90vw)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "rgba(255,218,214,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.error }}>warning</span>
              </div>
              <div>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Delete User</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>This action cannot be undone.</p>
              </div>
            </div>
            <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceVariant, margin: "0 0 24px", lineHeight: 1.6 }}>
              Are you sure you want to delete <strong>{user.name || user.email}</strong>? All their data will be permanently removed.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  padding: "10px 20px", background: T.surfaceCard, color: T.onSurfaceVariant,
                  border: `1px solid ${T.outlineSoft}`, borderRadius: "10px",
                  fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 24px", background: deleting ? T.outline : T.error,
                  color: "#fff", border: "none", borderRadius: "10px",
                  fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700,
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px",
                }}
              >
                {deleting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
