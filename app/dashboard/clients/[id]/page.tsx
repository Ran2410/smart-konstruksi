"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

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
  fontFamily: FONT_BODY, fontSize: "14px", lineHeight: "1.5",
  color: T.onSurface, outline: "none",
  transition: "all 0.2s ease",
};

const lbl: React.CSSProperties = {
  display: "block",
  fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600,
  color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase",
  marginBottom: "8px",
};

// ── Helpers ───────────────────────────────────────────────────────────────
const PROJECT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  PLANNING: { label: "Planning", color: "#2563eb", bg: "rgba(37,99,235,0.08)" },
  IN_PROGRESS: { label: "In Progress", color: "#15803d", bg: "rgba(21,128,61,0.08)" },
  ON_HOLD: { label: "On Hold", color: "#b45309", bg: "rgba(180,83,9,0.08)" },
  COMPLETED: { label: "Completed", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
  CANCELLED: { label: "Cancelled", color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
};

function displayName(client: any): string {
  return client.companyName || client.user?.name || "Individual";
}

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getInitials(n: string | null | undefined) {
  return n?.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() || "??";
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: T.error, marginLeft: "4px" }}>*</span>}</label>
      {children}
      {hint && <p style={{ margin: "6px 0 0", fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted }}>{hint}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const canManage = role === "SUPER_ADMIN" || role === "OWNER" || role === "BRANCH_MANAGER";

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { fetchClient(); }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setClient(data);
      setForm({
        companyName: data.companyName || "",
        address: data.address || "",
        name: data.user?.name || "",
        email: data.user?.email || "",
        phone: data.user?.phone || "",
        password: "",
      });
    } catch { setClient(null); }
    finally { setLoading(false); }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev: any) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Failed to update"); }
      setSuccess("Changes saved successfully");
      setEditMode(false);
      fetchClient();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleToggleStatus = async () => {
    if (!confirm(`Set this client as ${client?.user?.isActive ? "inactive" : "active"}?`)) return;
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !client.user.isActive }),
      });
      if (res.ok) fetchClient();
    } catch {}
  };

  const focusH = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = T.primary);
  const blurH = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => (e.currentTarget.style.borderColor = `${T.outlineSoft}66`);
  const cancelEdit = () => {
    setEditMode(false);
    setForm({
      companyName: client.companyName || "",
      address: client.address || "",
      name: client.user?.name || "",
      email: client.user?.email || "",
      phone: client.user?.phone || "",
      password: "",
    });
    setError("");
  };

  if (loading) return (
    <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Breadcrumb skeleton */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="h-3 w-3 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>

      {/* Profile Card skeleton */}
      <div style={card}>
        {/* Header with avatar skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Skeleton className="h-[52px] w-[52px] rounded-[14px]" />
            <div>
              <Skeleton className="h-6 w-[200px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Skeleton className="h-[34px] w-[70px] rounded-[10px]" />
            <Skeleton className="h-[34px] w-[100px] rounded-[10px]" />
          </div>
        </div>
        {/* Fields skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Projects section skeleton */}
      <div style={{ ...card, marginTop: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Skeleton className="h-[22px] w-[22px] rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 18px", borderRadius: "12px", background: T.surfaceContainerLow }}>
              <div style={{ flex: 1 }}>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-[180px]" />
              </div>
              <Skeleton className="h-[6px] w-[100px] rounded-full" />
              <Skeleton className="h-5 w-[60px] rounded-[20px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!client) return (
    <div style={{ padding: "28px 32px", textAlign: "center", paddingTop: "80px" }}>
      <span className="material-symbols-outlined" style={{ fontSize: "56px", display: "block", marginBottom: "12px", color: `${T.outlineSoft}88`, fontVariationSettings: "'FILL' 1" }}>groups</span>
      <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: "0 0 4px" }}>Client not found</h2>
      <Link href="/dashboard/clients" style={{ color: T.primary, fontFamily: FONT_BODY, fontSize: "14px" }}>Back to Clients</Link>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", fontFamily: FONT_LABEL, fontSize: "12px", color: T.onSurfaceMuted }}>
        <Link href="/dashboard/clients" style={{ color: T.onSurfaceMuted, textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = T.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = T.onSurfaceMuted)}>Clients</Link>
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>chevron_right</span>
        <span style={{ color: T.onSurface }}>{displayName(client)}</span>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: "12px 16px", background: T.errorLight, borderRadius: "10px", color: T.error, fontFamily: FONT_BODY, fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>error</span>{error}
        </div>
      )}
      {success && (
        <div style={{ padding: "12px 16px", background: T.successBg, borderRadius: "10px", color: T.success, fontFamily: FONT_BODY, fontSize: "13px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check_circle</span>{success}
        </div>
      )}

      {/* Profile Card */}
      <div style={card}>
        {/* Header with avatar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "14px",
              background: T.primaryLight, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontFamily: FONT_LABEL, fontSize: "18px", fontWeight: 700, color: T.primary }}>
                {getInitials(displayName(client))}
              </span>
            </div>
            <div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0, lineHeight: 1.2 }}>{displayName(client)}</h1>
              <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
                {client.user.name} &middot; {client._count?.projects || 0} project{(client._count?.projects || 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 14px", borderRadius: "20px",
              background: client.user.isActive ? T.successBg : T.errorContainer,
              color: client.user.isActive ? T.success : T.error,
              fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: client.user.isActive ? T.success : T.error }} />
              {client.user.isActive ? "Active" : "Inactive"}
            </span>

            {canManage && !editMode && (
              <>
                <button onClick={() => setEditMode(true)} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "10px",
                  background: T.primaryLight, color: T.primary, border: "none",
                  fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = T.primaryMedium)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = T.primaryLight)}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>Edit
                </button>
                <button onClick={handleToggleStatus} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "8px 16px", borderRadius: "10px",
                  background: "transparent", color: T.onSurfaceMuted,
                  border: `1px solid ${T.outlineSoft}66`,
                  fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = T.outline; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${T.outlineSoft}66`; }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>{client.user.isActive ? "block" : "check_circle"}</span>
                  {client.user.isActive ? "Deactivate" : "Activate"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Edit Form / View Mode */}
        {editMode ? (
          <>
            <h3 style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.primary, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>edit</span>Edit Client Information
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <Field label="Company Name" required><input style={input} value={form.companyName} onChange={handleChange("companyName")} onFocus={focusH} onBlur={blurH} /></Field>
              <Field label="Address"><input style={input} value={form.address || ""} onChange={handleChange("address")} onFocus={focusH} onBlur={blurH} /></Field>
              <Field label="PIC Name"><input style={input} value={form.name} onChange={handleChange("name")} onFocus={focusH} onBlur={blurH} /></Field>
              <Field label="Phone"><input style={input} value={form.phone || ""} onChange={handleChange("phone")} onFocus={focusH} onBlur={blurH} /></Field>
              <Field label="Email"><input style={input} value={form.email} onChange={handleChange("email")} onFocus={focusH} onBlur={blurH} /></Field>
              <Field label="New Password" hint="Leave blank to keep current"><input style={input} type="password" placeholder="••••••••" value={form.password || ""} onChange={handleChange("password")} onFocus={focusH} onBlur={blurH} /></Field>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "20px", borderTop: `1px solid ${T.outlineSoft}44` }}>
              <button onClick={cancelEdit} style={{
                padding: "10px 20px", borderRadius: "10px", background: "transparent", color: T.onSurfaceMuted,
                border: `1.5px solid ${T.outlineSoft}66`, fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = T.outline; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = `${T.outlineSoft}66`; }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                padding: "10px 20px", borderRadius: "10px", background: saving ? T.outlineSoft : T.primary,
                color: saving ? T.onSurfaceMuted : "#fff", border: "none",
                fontFamily: FONT_LABEL, fontSize: "13px", fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer", transition: "all 0.15s",
                opacity: saving ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: "6px",
              }}>
                {saving ? <>Saving...</> : <>Save Changes</>}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
            <div>
              <p style={lbl}>Company Name</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>
                {displayName(client)}
                {!client.companyName && <span style={{ fontFamily: FONT_LABEL, fontSize: "10px", color: T.onSurfaceMuted, marginLeft: "6px" }}>(Individual)</span>}
              </p>
            </div>
            <div>
              <p style={lbl}>Address</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>{client.address || "—"}</p>
            </div>
            <div>
              <p style={lbl}>PIC Name</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>{client.user.name}</p>
            </div>
            <div>
              <p style={lbl}>Phone</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>{client.user.phone || "—"}</p>
            </div>
            <div>
              <p style={lbl}>Email</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>{client.user.email}</p>
            </div>
            <div>
              <p style={lbl}>Last Login</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurface, margin: 0 }}>{fmtDate(client.user.lastLogin)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Projects Section */}
      <div style={{ ...card, marginTop: "20px" }}>
        <h3 style={{
          fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 700, color: T.onSurface,
          margin: "0 0 20px", display: "flex", alignItems: "center", gap: "8px",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary, fontVariationSettings: "'FILL' 1" }}>architecture</span>
          Projects ({client._count?.projects || 0})
        </h3>

        {(!client.projects || client.projects.length === 0) ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", display: "block", marginBottom: "8px", color: `${T.outlineSoft}88`, fontVariationSettings: "'FILL' 1" }}>folder_off</span>
            <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceMuted, margin: 0 }}>No projects associated with this client yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {client.projects.map((project: any) => {
              const st = PROJECT_STATUS[project.status] || PROJECT_STATUS.PLANNING;
              return (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: "12px", textDecoration: "none",
                  background: T.surfaceContainerLow, border: `1px solid ${T.outlineSoft}44`,
                  transition: "all 0.15s", gap: "16px",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.surfaceContainerHigh; e.currentTarget.style.borderColor = T.outline; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = T.surfaceContainerLow; e.currentTarget.style.borderColor = `${T.outlineSoft}44`; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, marginBottom: "2px", letterSpacing: "0.04em" }}>{project.code}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: "14px", fontWeight: 600, color: T.onSurface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                    <div style={{ width: "100px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontFamily: FONT_LABEL, fontSize: "10px", color: T.onSurfaceMuted }}>
                        <span>Progress</span><span>{project.progress}%</span>
                      </div>
                      <div style={{ height: "4px", background: T.outlineSoft, borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${project.progress}%`, background: project.progress >= 100 ? T.success : T.primary, borderRadius: "2px", transition: "width 0.3s" }} />
                      </div>
                    </div>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", background: st.bg, color: st.color, fontFamily: FONT_LABEL, fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap" }}>{st.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: T.onSurfaceMuted }}>chevron_right</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta */}
      <div style={{ marginTop: "16px", fontFamily: FONT_LABEL, fontSize: "11px", color: T.onSurfaceMuted, textAlign: "right" }}>
        Registered: {fmtDate(client.createdAt)}
        {client.updatedAt && ` · Updated: ${fmtDate(client.updatedAt)}`}
      </div>
    </div>
  );
}
