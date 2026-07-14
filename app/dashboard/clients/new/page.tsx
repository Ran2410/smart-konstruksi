"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainer: "#e5eeff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainerHigh: "#dce9ff",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.3)",
  errorContainer: "rgba(255,218,214,0.2)",
  success: "#0d7a3f",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "36px",
};

const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "12px 16px",
  background: T.surfaceContainerLow,
  border: `1.5px solid ${T.outlineSoft}66`,
  borderRadius: "10px",
  fontFamily: T.fontBody, fontSize: "14px", lineHeight: "1.5",
  color: T.onSurface, outline: "none",
  transition: "all 0.2s ease",
};

const label: React.CSSProperties = {
  display: "block",
  fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
  color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase",
  marginBottom: "8px",
};

function Field({ label: lbl, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={label}>{lbl}{required && <span style={{ color: T.error, marginLeft: "4px" }}>*</span>}</label>
      {children}
      {hint && <p style={{ margin: "6px 0 0", fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted }}>{hint}</p>}
    </div>
  );
}

export default function NewClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    companyName: "", name: "", email: "", phone: "", address: "", password: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("Name, email, and password are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create client");
      }
      const data = await res.json();
      router.push(`/dashboard/clients/${data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const focusH = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = T.primary);
  const blurH = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = `${T.outlineSoft}66`);

  return (
    <div style={{ padding: "28px 32px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontFamily: T.fontLabel, fontSize: "12px", color: T.onSurfaceMuted }}>
        <Link href="/dashboard/clients" style={{ color: T.onSurfaceMuted, textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceMuted)}>Clients</Link>
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
        <span style={{ color: T.onSurface }}>New Client</span>
      </div>

      <div style={card}>
        <h2 style={{ fontFamily: T.fontDisplay, fontSize: "22px", fontWeight: 700, color: T.onSurface, margin: "0 0 4px" }}>
          Register New Client
        </h2>
        <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: "0 0 32px" }}>
          Create a new client account. A user account with the <strong style={{ color: T.onSurface }}>CLIENT</strong> role will be created automatically.
        </p>

        {error && (
          <div style={{ padding: "12px 16px", background: T.errorLight, borderRadius: "10px", color: T.error, fontFamily: T.fontBody, fontSize: "13px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section: Company */}
          <h3 style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, color: T.primary, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>business</span>
            Company Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
            <Field label="Company Name" hint="Optional. Leave empty for individual clients (B2C)">
            <input style={input} placeholder="e.g. PT. Citra Bangun" value={form.companyName} onChange={handleChange("companyName")} onFocus={focusH} onBlur={blurH} />
            </Field>
            <Field label="Address">
              <input style={input} placeholder="Company address" value={form.address} onChange={handleChange("address")} onFocus={focusH} onBlur={blurH} />
            </Field>
          </div>

          {/* Section: PIC */}
          <h3 style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, color: T.primary, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>contact_mail</span>
            Person in Charge
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <Field label="Full Name" required>
              <input style={input} placeholder="Contact person name" value={form.name} onChange={handleChange("name")} onFocus={focusH} onBlur={blurH} />
            </Field>
            <Field label="Phone">
              <input style={input} placeholder="+62 xxx xxxx" value={form.phone} onChange={handleChange("phone")} onFocus={focusH} onBlur={blurH} />
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
            <Field label="Email" required hint="Used as login credential">
              <input style={input} type="email" placeholder="client@company.com" value={form.email} onChange={handleChange("email")} onFocus={focusH} onBlur={blurH} />
            </Field>
            <Field label="Password" required hint="Min. 8 characters">
              <input style={input} type="password" placeholder="••••••••" value={form.password} onChange={handleChange("password")} onFocus={focusH} onBlur={blurH} />
            </Field>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "24px", borderTop: `1px solid ${T.outlineSoft}44` }}>
            <Link href="/dashboard/clients" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "10px", background: "transparent",
              color: T.onSurfaceMuted, textDecoration: "none",
              fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
              border: `1.5px solid ${T.outlineSoft}66`, cursor: "pointer", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = T.outline; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${T.outlineSoft}66`; }}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "10px 20px", borderRadius: "10px",
              background: submitting ? T.outlineSoft : T.primary,
              color: submitting ? T.onSurfaceMuted : "#fff", border: "none",
              fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer", transition: "all 0.15s",
              opacity: submitting ? 0.7 : 1,
            }}>
              {submitting ? (
                <><span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s linear infinite" }}>sync</span> Creating...</>
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span> Create Client</>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
