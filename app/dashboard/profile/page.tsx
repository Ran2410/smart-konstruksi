"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "32px",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  border: `1px solid ${T.outlineSoft}`,
  borderRadius: "10px",
  fontFamily: FONT_BODY,
  fontSize: "14px",
  color: T.onSurface,
  background: T.surfaceCard,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  return name
    ?.split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";
}

const AVATAR_COLORS = [
  "#004f35", "#2563eb", "#7c3aed", "#b45309", "#15803d",
  "#be123c", "#4f46e5", "#0d9488", "#9333ea", "#ca8a04",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fmtRole(r: string) {
  return r
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <div style={{ width: "160px", height: "28px", background: "#e5e7eb", borderRadius: "8px", marginBottom: "8px" }} />
        <div style={{ width: "240px", height: "16px", background: "#e5e7eb", borderRadius: "8px" }} />
      </div>
      <div style={{ ...card }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "9999px", background: "#e5e7eb" }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: "140px", height: "20px", background: "#e5e7eb", borderRadius: "6px", marginBottom: "8px" }} />
            <div style={{ width: "100px", height: "14px", background: "#e5e7eb", borderRadius: "6px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════════════════════
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 999,
        background: type === "success" ? "#15803d" : "#ba1a1a",
        color: "#fff",
        padding: "14px 24px",
        borderRadius: "12px",
        fontFamily: FONT_BODY,
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        animation: "slideIn 0.3s ease",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
        {type === "success" ? "check_circle" : "error"}
      </span>
      {message}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ══════════════════════════════════════════════════════════════════════════════
function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: "18px", fontWeight: 600, color: T.onSurface, margin: 0 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.onSurfaceVariant, margin: "4px 0 0" }}>
          {description}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  // State
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (session) fetchProfile();
  }, [session]);

  // Save profile
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      const updated = await res.json();
      setProfile(updated);
      // Update session so sidebar reflects new name
      await update({ name: updated.name });
      setToast({ message: "Profile updated successfully", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update profile", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // Change password
  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: "New passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      setToast({ message: "Password changed successfully", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setToast({ message: err.message || "Failed to change password", type: "error" });
    } finally {
      setChangingPassword(false);
    }
  }

  if (!session) return null;
  if (loading) return <ProfileSkeleton />;

  const initials = getInitials(profile?.name);
  const avatarColor = getAvatarColor(profile?.name || "User");

  return (
    <>
      <style>{`
        .sk-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .sk-profile-full { grid-column: 1 / -1; }
        @media (max-width: 768px) {
          .sk-profile-grid { grid-template-columns: 1fr; }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        input:focus { border-color: ${T.primary} !important; box-shadow: 0 0 0 3px ${T.primaryLight}; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "28px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
          Profile
        </h2>
        <p style={{ fontFamily: FONT_BODY, fontSize: "15px", color: T.onSurfaceVariant, margin: "4px 0 0" }}>
          Manage your personal information and security settings.
        </p>
      </div>

      {/* ── Avatar + Info Card ──────────────────────────────────────────── */}
      <div style={{ ...card, display: "flex", gap: "28px", alignItems: "center", flexWrap: "wrap" }}>
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "9999px",
            background: avatarColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: "36px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
            {initials}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>
            {profile?.name || "User"}
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurfaceVariant, margin: "4px 0 0" }}>
            {profile?.email}
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{
              fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600,
              color: T.primary, background: T.primaryLight,
              padding: "4px 12px", borderRadius: "9999px",
            }}>
              {profile?.role ? fmtRole(profile.role) : "-"}
            </span>
            <span style={{
              fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 500,
              color: T.onSurfaceMuted, background: T.surfaceContainerLow,
              padding: "4px 12px", borderRadius: "9999px",
            }}>
              {profile?.branch?.name || "No Branch"}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.outline, margin: 0 }}>Last Login</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", fontWeight: 500, color: T.onSurface, margin: "2px 0 0" }}>
            {fmtDate(profile?.lastLogin)}
          </p>
        </div>
      </div>

      {/* ── Edit Profile ────────────────────────────────────────────────── */}
      <div style={{ ...card, marginTop: "24px" }}>
        <SectionHeader title="Edit Profile" description="Update your name and contact information." />
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px" }}>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Full Name
            </label>
            <input
              style={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              style={{ ...input, background: T.surfaceContainerLow, color: T.onSurfaceMuted, cursor: "not-allowed" }}
              value={profile?.email || ""}
              disabled
            />
            <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.outline, margin: "4px 0 0" }}>
              Email cannot be changed.
            </p>
          </div>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Phone Number
            </label>
            <input
              style={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+62 xxx-xxxx-xxxx"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 32px",
                background: T.primary,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontFamily: FONT_LABEL,
                fontSize: "14px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = T.primaryHover; }}
              onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = T.primary; }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      <div style={{ ...card, marginTop: "24px" }}>
        <SectionHeader title="Change Password" description="Update your password to keep your account secure." />
        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "480px" }}>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Current Password
            </label>
            <input
              type="password"
              style={input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              New Password
            </label>
            <input
              type="password"
              style={input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>
          <div>
            <label style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurfaceVariant, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              style={input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              minLength={6}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={changingPassword}
              style={{
                padding: "12px 32px",
                background: T.onSurface,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontFamily: FONT_LABEL,
                fontSize: "14px",
                fontWeight: 600,
                cursor: changingPassword ? "not-allowed" : "pointer",
                opacity: changingPassword ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!changingPassword) e.currentTarget.style.background = "#1a2c3e"; }}
              onMouseLeave={(e) => { if (!changingPassword) e.currentTarget.style.background = T.onSurface; }}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Account info footer */}
      <div style={{ ...card, marginTop: "24px", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.outline, margin: 0 }}>Account Created</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: "14px", color: T.onSurface, margin: "2px 0 0" }}>
            {fmtDate(profile?.createdAt)}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "12px", color: T.outline, margin: 0 }}>User ID</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: "12px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>
            {profile?.id || "-"}
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
