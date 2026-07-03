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

function SectionHeader({ icon, title, subtitle, badge }: { icon: string; title: string; subtitle?: string; badge?: string }) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3 style={{
            fontFamily: T.fontDisplay, fontSize: "19px", fontWeight: 700,
            color: T.onSurface, margin: 0, letterSpacing: "-0.01em"
          }}>
            {title}
          </h3>
          {badge && <Badge variant={badge === "Required" ? "warning" : "success"}>{badge}</Badge>}
        </div>
        {subtitle && (
          <p style={{
            fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted,
            margin: "4px 0 0", lineHeight: "1.4"
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { num: 1, label: "Basic Info", icon: "info" },
    { num: 2, label: "Schedule", icon: "calendar_month" },
    { num: 3, label: "Team", icon: "group" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: "0", marginBottom: "40px", padding: "24px 0"
    }}>
      {steps.map((step, i) => (
        <div key={step.num} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: currentStep >= step.num ? T.primary : T.surfaceContainer,
              color: currentStep >= step.num ? "#fff" : T.outline,
              fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700,
              transition: "all 0.3s ease",
              boxShadow: currentStep >= step.num ? "0 4px 12px rgba(0,79,53,0.3)" : "none"
            }}>
              {currentStep > step.num ? (
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
              ) : (
                step.num
              )}
            </div>
            <span style={{
              fontFamily: T.fontLabel,
              fontSize: "10px",
              fontWeight: 600,
              color: currentStep >= step.num ? T.primary : T.outlineSoft,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transition: "color 0.3s ease"
            }}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: "80px", height: "2px",
              background: currentStep > step.num ? T.primary : T.outlineSoft,
              margin: "0 16px", marginBottom: "24px",
              transition: "background 0.3s ease"
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export default function NewProjectPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: "", description: "", address: "",
    startDate: "", endDate: "",
    budget: "", status: "PLANNING",
    branchId: "", projectManagerId: "", siteManagerId: "", clientId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [branches, setBranches] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [siteManagers, setSiteManagers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

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

  useEffect(() => {
    async function load() {
      setLoadingDropdowns(true);
      try {
        const [bRes, pmRes, smRes, cRes] = await Promise.all([
          fetch("/api/branches?limit=100"),
          fetch("/api/users?role=PROJECT_MANAGER&limit=100"),
          fetch("/api/users?role=SITE_MANAGER&limit=100"),
          fetch("/api/clients?limit=100"),
        ]);
        if (bRes.ok) setBranches((await bRes.json()).data || []);
        if (pmRes.ok) setManagers((await pmRes.json()).data || []);
        if (smRes.ok) setSiteManagers((await smRes.json()).data || []);
        if (cRes.ok) setClients(await cRes.json() || []);
      } catch {}
      setLoadingDropdowns(false);
    }
    if (session) load();
  }, [session]);

  const stepValidators = {
    1: () => {
      const errs: Record<string, string> = {};
      if (!form.name.trim()) errs.name = "Project name is required";
      if (!form.address.trim()) errs.address = "Address is required";
      if (!form.branchId) errs.branchId = "Branch is required";
      return errs;
    },
    2: () => {
      const errs: Record<string, string> = {};
      if (!form.startDate) errs.startDate = "Start date is required";
      if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0) errs.budget = "Valid budget is required";
      if (form.endDate && form.startDate && form.endDate < form.startDate) errs.endDate = "End date must be after start date";
      return errs;
    },
    3: () => {
      const errs: Record<string, string> = {};
      if (!form.projectManagerId) errs.projectManagerId = "Project manager is required";
      if (!form.clientId) errs.clientId = "Client is required";
      return errs;
    },
  };

  function validateAll() {
    return Object.assign({}, ...Object.values(stepValidators).map(v => v()));
  }

  function nextStep() {
    const errs = stepValidators[currentStep as keyof typeof stepValidators]();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Mark all fields in this step as touched
      const newTouched: Record<string, boolean> = {};
      Object.keys(errs).forEach(k => newTouched[k] = true);
      setTouched(t => ({ ...t, ...newTouched }));
      return;
    }
    setErrors({});
    setCurrentStep(s => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function prevStep() {
    setErrors({});
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateAll();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Go to first step with error
      if (errs.name || errs.address || errs.branchId) setCurrentStep(1);
      else if (errs.startDate || errs.budget || errs.endDate) setCurrentStep(2);
      else setCurrentStep(3);
      return;
    }
    setSubmitting(true); setSubmitError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          address: form.address.trim(),
          startDate: form.startDate,
          endDate: form.endDate || null,
          budget: Number(form.budget),
          status: form.status,
          branchId: form.branchId,
          projectManagerId: form.projectManagerId,
          siteManagerId: form.siteManagerId || null,
          clientId: form.clientId,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }
      const created = await res.json();
      router.push(`/dashboard/projects/${created.id}`);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) => ({
    ...inputStyle,
    borderColor: errors[field] && touched[field] ? T.error : T.outlineSoft,
    background: errors[field] && touched[field] ? "rgba(255,218,214,0.15)" : T.surfaceContainerLow,
  });

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", padding: "0 16px" }}>
      <style>{`
        .sk-select {
          ${Object.entries({
            ...inputStyle,
            cursor: "pointer",
            appearance: "none" as any,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236f7a72' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 14px center",
            paddingRight: "40px",
          }).map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`).join(" ")}
        }
        .sk-select:focus {
          border-color: ${T.primary} !important;
          box-shadow: 0 0 0 4px rgba(0,79,53,0.08) !important;
          background: #fff !important;
        }
        .sk-select:hover {
          border-color: ${T.outline};
        }
        .sk-field-error {
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
          transition: opacity 0.2s;
        }
        input[type="date"]:hover::-webkit-calendar-picker-indicator {
          opacity: 0.7;
        }
        textarea {
          resize: vertical;
          min-height: 80px;
          line-height: 1.6;
        }
        .progress-bar {
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "20px",
        marginBottom: "32px", marginTop: "20px"
      }}>
        <Link
          href="/dashboard/projects"
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
            fontFamily: T.fontDisplay, fontSize: "32px", fontWeight: 700,
            color: T.onSurface, margin: "0 0 4px", letterSpacing: "-0.02em"
          }}>
            Create New Project
          </h2>
          <p style={{
            fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted,
            margin: 0, lineHeight: "1.5"
          }}>
            Set up a new construction project with all the necessary details.
          </p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 16px", background: T.surfaceContainer,
          borderRadius: "12px", fontFamily: T.fontLabel,
          fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>auto_awesome</span>
          Code auto-generated
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: "100%", height: "4px",
        background: T.surfaceContainer, borderRadius: "2px",
        marginBottom: "8px", overflow: "hidden"
      }}>
        <div className="progress-bar" style={{
          width: `${(currentStep / 3) * 100}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${T.primary}, #007a54)`,
          borderRadius: "2px"
        }} />
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Global Error */}
      {submitError && (
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 20px", marginBottom: "24px",
          background: T.errorContainer,
          border: `1px solid rgba(186,26,26,0.2)`,
          borderRadius: "14px"
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.error, flexShrink: 0 }}>
            error
          </span>
          <div>
            <p style={{
              fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600,
              color: T.error, margin: "0 0 2px"
            }}>
              Failed to create project
            </p>
            <p style={{
              fontFamily: T.fontBody, fontSize: "13px", color: T.error,
              margin: 0, opacity: 0.8
            }}>
              {submitError}
            </p>
          </div>
          <button
            onClick={() => setSubmitError(null)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: T.error, padding: "4px"
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div style={card}>
              <SectionHeader
                icon="description"
                title="Basic Information"
                subtitle="Project identity and location details"
                badge="Required"
              />
              <div className="sk-form-grid">
                <div className="full">
                  <Field label="Project Name" required>
                    <input
                      value={form.name}
                      onChange={set("name")}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      placeholder="e.g. Green Valley Residence Phase 2"
                      style={inputClass("name")}
                      autoFocus
                    />
                    {errors.name && touched.name && (
                      <p className="sk-field-error">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                        {errors.name}
                      </p>
                    )}
                  </Field>
                </div>
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={set("status")}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    className="sk-select"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </Field>
                <Field label="Branch" required>
                  <select
                    value={form.branchId}
                    onChange={set("branchId")}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    className="sk-select"
                    style={{
                      ...inputClass("branchId"),
                      cursor: "pointer",
                    }}
                    disabled={loadingDropdowns}
                  >
                    <option value="">Select branch…</option>
                    {branches.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.branchId && touched.branchId && (
                    <p className="sk-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                      {errors.branchId}
                    </p>
                  )}
                </Field>
                <div className="full">
                  <Field label="Address / Location" required>
                    <input
                      value={form.address}
                      onChange={set("address")}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      placeholder="e.g. Jl. Sudirman No. 12, Jakarta Pusat"
                      style={inputClass("address")}
                    />
                    {errors.address && touched.address && (
                      <p className="sk-field-error">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                        {errors.address}
                      </p>
                    )}
                  </Field>
                </div>
                <div className="full">
                  <Field label="Description" hint="Brief overview of project scope and objectives">
                    <textarea
                      value={form.description}
                      onChange={set("description") as any}
                      onFocus={focusInput as any}
                      onBlur={blurInput as any}
                      placeholder="Describe the project scope, key deliverables, and important notes…"
                      rows={4}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule & Budget */}
          {currentStep === 2 && (
            <div style={card}>
              <SectionHeader
                icon="calendar_month"
                title="Schedule & Budget"
                subtitle="Set project timeline and financial parameters"
                badge="Required"
              />
              <div className="sk-form-grid">
                <Field label="Start Date" required>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={set("startDate")}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    style={inputClass("startDate")}
                  />
                  {errors.startDate && touched.startDate && (
                    <p className="sk-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                      {errors.startDate}
                    </p>
                  )}
                </Field>
                <Field label="Target End Date" hint="Can be adjusted later">
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={set("endDate")}
                    onFocus={focusInput}
                    onBlur={blurInput}
                    min={form.startDate || undefined}
                    style={inputClass("endDate")}
                  />
                  {errors.endDate && touched.endDate && (
                    <p className="sk-field-error">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                      {errors.endDate}
                    </p>
                  )}
                </Field>
                <div className="full">
                  <Field label="Total Budget" required hint="Enter the total project budget in Indonesian Rupiah">
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: "16px", top: "50%",
                        transform: "translateY(-50%)",
                        fontFamily: T.fontLabel, fontSize: "13px",
                        fontWeight: 600, color: T.outline,
                        pointerEvents: "none"
                      }}>
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000000"
                        value={form.budget}
                        onChange={set("budget")}
                        onFocus={focusInput}
                        onBlur={blurInput}
                        placeholder="e.g. 5,000,000,000"
                        style={{
                          ...inputClass("budget"),
                          paddingLeft: "48px",
                        }}
                      />
                    </div>
                    {form.budget && !isNaN(Number(form.budget)) && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        marginTop: "8px", padding: "10px 16px",
                        background: "rgba(0,79,53,0.06)",
                        borderRadius: "10px",
                        fontFamily: T.fontLabel,
                        fontSize: "12px",
                        fontWeight: 600,
                        color: T.primary
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>payments</span>
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(Number(form.budget))}
                      </div>
                    )}
                    {errors.budget && touched.budget && (
                      <p className="sk-field-error">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                        {errors.budget}
                      </p>
                    )}
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Team */}
          {currentStep === 3 && (
            <div style={card}>
              <SectionHeader
                icon="group"
                title="Project Team"
                subtitle="Assign the key people responsible for this project"
                badge="Required"
              />
              {loadingDropdowns ? (
                <div style={{
                  display: "flex", gap: "16px", alignItems: "center",
                  padding: "32px 0", justifyContent: "center"
                }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    border: `2.5px solid ${T.outlineSoft}`,
                    borderTopColor: T.primary,
                    animation: "spin 0.8s linear infinite"
                  }} />
                  <span style={{
                    fontFamily: T.fontLabel, fontSize: "14px",
                    color: T.onSurfaceMuted
                  }}>
                    Loading team options…
                  </span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
                <div className="sk-form-grid">
                  <Field label="Project Manager" required>
                    <select
                      value={form.projectManagerId}
                      onChange={set("projectManagerId")}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      className="sk-select"
                      style={{ ...inputClass("projectManagerId"), cursor: "pointer" }}
                    >
                      <option value="">Select manager…</option>
                      {managers.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {errors.projectManagerId && touched.projectManagerId && (
                      <p className="sk-field-error">
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                        {errors.projectManagerId}
                      </p>
                    )}
                  </Field>
                  <Field label="Site Manager" hint="Optional — assign a site supervisor">
                    <select
                      value={form.siteManagerId}
                      onChange={set("siteManagerId")}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      className="sk-select"
                      style={{ cursor: "pointer" }}
                    >
                      <option value="">None assigned</option>
                      {siteManagers.map((u: any) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="full">
                    <Field label="Client" required>
                      <select
                        value={form.clientId}
                        onChange={set("clientId")}
                        onFocus={focusInput}
                        onBlur={blurInput}
                        className="sk-select"
                        style={{ ...inputClass("clientId"), cursor: "pointer" }}
                      >
                        <option value="">Select client…</option>
                        {clients.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName || c.user?.name || c.name}
                          </option>
                        ))}
                      </select>
                      {errors.clientId && touched.clientId && (
                        <p className="sk-field-error">
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>error</span>
                          {errors.clientId}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            paddingBottom: "48px", gap: "12px"
          }}>
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 24px",
                    background: T.surfaceCard,
                    color: T.onSurfaceVariant,
                    border: `1.5px solid ${T.outlineSoft}`,
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
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
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                  Previous
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <Link
                href="/dashboard/projects"
                style={{
                  display: "inline-flex", alignItems: "center",
                  padding: "12px 24px",
                  background: "transparent",
                  color: T.onSurfaceMuted,
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "14px",
                  fontWeight: 600,
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.surfaceContainerLow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Cancel
              </Link>
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "12px 32px",
                    background: T.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(0,79,53,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.primaryHover;
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,79,53,0.35)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = T.primary;
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,79,53,0.25)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Next
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_forward</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    padding: "12px 32px",
                    background: submitting ? T.outlineSoft : T.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: submitting ? "not-allowed" : "pointer",
                    boxShadow: submitting ? "none" : "0 4px 16px rgba(0,79,53,0.25)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = T.primaryHover;
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,79,53,0.35)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) {
                      e.currentTarget.style.background = T.primary;
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,79,53,0.25)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "50%",
                        border: "2.5px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        animation: "spin 0.8s linear infinite"
                      }} />
                      Creating Project…
                      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>rocket_launch</span>
                      Create Project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}