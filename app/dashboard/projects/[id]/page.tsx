"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPicker } from "@/components/projects/user-picker";
import { TasksBoard } from "@/components/projects/tasks-board";
import { PhotoUpload } from "@/components/projects/photo-upload";
import { ProgressChart } from "@/components/projects/progress-chart";
import { ReportDetail } from "@/components/projects/report-detail";

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
  infoLight: "rgba(219,234,254,0.6)",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

// ── Styles ────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: `1px solid rgba(190,201,193,0.25)`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
  transition: "box-shadow 0.2s ease",
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "24px",
  paddingBottom: "20px",
  borderBottom: "1px solid rgba(190,201,193,0.25)",
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

// ── Role-based permissions ────────────────────────────────────────────────
const CAN_EDIT_PROJECT = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER"];
const CAN_REPORT = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER", "MANDOR", "QC_INSPECTOR", "K3_OFFICER"];
const CAN_MANAGE_TASKS = ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER", "MANDOR", "K3_OFFICER"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PLANNING:    { label: "Planning",    color: T.info,    bg: T.infoLight,    icon: "edit_note" },
  IN_PROGRESS: { label: "In Progress", color: T.primary, bg: T.primaryLight, icon: "construction" },
  ON_HOLD:     { label: "On Hold",     color: T.warning, bg: T.warningLight, icon: "pause_circle" },
  COMPLETED:   { label: "Completed",   color: T.success, bg: T.successLight, icon: "check_circle" },
  CANCELLED:   { label: "Cancelled",   color: T.error,   bg: T.errorLight,   icon: "cancel" },
};

const STATUS_OPTIONS = ["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"];

// ── Helpers ───────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateDaysLeft(endDate: string): number | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ── Sub-components ────────────────────────────────────────────────────────
function StatusBadge({ status, large }: { status: string; large?: boolean }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: T.outline, bg: T.surfaceContainerLow, icon: "help" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: large ? "8px 20px" : "6px 14px",
        borderRadius: "9999px",
        fontFamily: T.fontLabel,
        fontSize: large ? "13px" : "11px",
        fontWeight: 700,
        color: cfg.color,
        background: cfg.bg,
        whiteSpace: "nowrap",
        border: `1px solid ${cfg.color}20`,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: large ? "18px" : "14px" }}>
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ value, large, showLabel = true }: { value: number; large?: boolean; showLabel?: boolean }) {
  const color = value >= 80 ? T.success : value >= 40 ? T.primary : value >= 20 ? T.warning : T.error;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          flex: 1,
          height: large ? "12px" : "8px",
          background: T.surfaceContainerHigh,
          borderRadius: "9999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(Math.max(value, 0), 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            borderRadius: "9999px",
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: `0 2px 8px ${color}30`,
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontFamily: T.fontLabel,
            fontSize: large ? "18px" : "14px",
            fontWeight: 700,
            color: T.onSurface,
            minWidth: "48px",
            textAlign: "right",
          }}
        >
          {value}%
        </span>
      )}
    </div>
  );
}

function InfoRow({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "16px",
        background: T.surfaceContainerLow,
        borderRadius: "12px",
        border: `1px solid ${T.outlineSoft}30`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && (
          <span className="material-symbols-outlined" style={{ fontSize: "14px", color: T.outline }}>
            {icon}
          </span>
        )}
        <span
          style={{
            fontFamily: T.fontLabel,
            fontSize: "10px",
            fontWeight: 600,
            color: T.outline,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontFamily: T.fontBody,
          fontSize: "14px",
          color: T.onSurface,
          lineHeight: "1.5",
          fontWeight: 500,
        }}
      >
        {children || "—"}
      </span>
    </div>
  );
}

function StatCard({ icon, label, value, color, onClick }: {
  icon: string;
  label: string;
  value: number;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...cardStyle,
        padding: "20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)";
        }
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: `${color}12`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `1.5px solid ${color}20`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color }}>
          {icon}
        </span>
      </div>
      <div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: "28px",
            fontWeight: 700,
            color: T.onSurface,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: T.fontLabel,
            fontSize: "11px",
            fontWeight: 600,
            color: T.outline,
            marginTop: "4px",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, badge }: {
  icon: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div style={sectionHeaderStyle}>
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "14px",
          background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: `0 4px 12px rgba(0,79,53,0.1)`,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "24px", color: T.primary }}>
          {icon}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "20px",
              fontWeight: 700,
              color: T.onSurface,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h3>
          {badge && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: "9999px",
                fontFamily: T.fontLabel,
                fontSize: "11px",
                fontWeight: 600,
                background: T.primaryLight,
                color: T.primary,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: "13px",
              color: T.onSurfaceMuted,
              margin: "4px 0 0",
              lineHeight: "1.4",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
      {/* Header card skeleton */}
      <div style={{ ...cardStyle }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <Skeleton className="h-10 w-10 rounded-[10px]" />
          <div style={{ flex: 1 }}>
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      </div>
      {/* Stat cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ ...cardStyle }}>
            <div style={{ display: "flex", gap: "12px" }}>
              <Skeleton className="h-12 w-12 rounded-[14px]" />
              <div style={{ flex: 1 }}>
                <Skeleton className="h-7 w-10 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function ProjectDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const userRole = (session?.user as any)?.role;

  const canEditProject = CAN_EDIT_PROJECT.includes(userRole || "");
  const canReport = CAN_REPORT.includes(userRole || "");
  const canManageTasks = CAN_MANAGE_TASKS.includes(userRole || "");

  // ── State ──
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "reports">("overview");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [branches, setBranches] = useState<any[]>([]);
  const [projectManagers, setProjectManagers] = useState<any[]>([]);
  const [siteManagers, setSiteManagers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [members, setMembers] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({
    percentage: 0,
    description: "",
    weather: "",
    reportDate: new Date().toISOString().split("T")[0],
  });
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [reportToDelete, setReportToDelete] = useState<any | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [photoIds, setPhotoIds] = useState<string[]>([]);
  const [reportDeleting, setReportDeleting] = useState(false);

  const MEMBER_ROLES = [
    { value: "PROJECT_MANAGER", label: "Project Manager" },
    { value: "SITE_MANAGER", label: "Site Manager" },
    { value: "MANDOR", label: "Mandor" },
    { value: "ESTIMATOR", label: "Estimator" },
    { value: "ARSITEK", label: "Arsitek" },
    { value: "SURVEYOR", label: "Surveyor" },
    { value: "LOGISTIK", label: "Logistik" },
    { value: "QC_INSPECTOR", label: "QC Inspector" },
    { value: "K3_OFFICER", label: "K3 Officer" },
    { value: "ADMIN_KANTOR", label: "Admin Kantor" },
    { value: "FINANCE", label: "Finance" },
  ];

  const WEATHER_OPTIONS = [
    { value: "", label: "— Select Weather —" },
    { value: "Cerah", label: "☀️ Cerah" },
    { value: "Berawan", label: "⛅ Berawan" },
    { value: "Mendung", label: "☁️ Mendung" },
    { value: "Hujan Ringan", label: "🌦 Hujan Ringan" },
    { value: "Hujan Lebat", label: "🌧 Hujan Lebat" },
    { value: "Berkabut", label: "🌫 Berkabut" },
    { value: "Angin Kencang", label: "💨 Angin Kencang" },
  ];

  function getProgressColor(val: number): string {
    if (val >= 80) return T.success;
    if (val >= 40) return T.primary;
    if (val >= 20) return T.warning;
    return T.error;
  }

  function getWeatherIcon(weather: string): string {
    const icons: Record<string, string> = {
      Cerah: "☀️", Berawan: "⛅", Mendung: "☁️",
      "Hujan Ringan": "🌦", "Hujan Lebat": "🌧",
      Berkabut: "🌫", "Angin Kencang": "💨",
    };
    return icons[weather] || "🌤";
  }

  // ── Fetch functions ──
  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error("Project not found");
      setProject(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch members", err);
    }
  }, [projectId]);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-reports?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.data || []);
      }
    } catch {}
    setReportsLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (session && projectId) {
      fetchProject();
      fetchMembers();
      fetchReports();
    }
  }, [session, projectId, fetchProject, fetchMembers, fetchReports]);

  useEffect(() => {
    if (!editMode) return;
    async function loadDropdowns() {
      const [bRes, pmRes, smRes, cRes] = await Promise.all([
        fetch("/api/branches?limit=100"),
        fetch("/api/users?role=PROJECT_MANAGER&limit=100"),
        fetch("/api/users?role=SITE_MANAGER&limit=100"),
        fetch("/api/clients?limit=100"),
      ]);
      if (bRes.ok) setBranches((await bRes.json()).data || []);
      if (pmRes.ok) setProjectManagers((await pmRes.json()).data || []);
      if (smRes.ok) setSiteManagers((await smRes.json()).data || []);
      if (cRes.ok) setClients((await cRes.json()).data || []);
    }
    loadDropdowns();
  }, [editMode]);

  const loadAvailableUsers = async () => {
    try {
      const res = await fetch("/api/users?limit=100");
      if (res.ok) {
        const data = await res.json();
        const currentMemberIds = members.map((m: any) => m.userId);
        setAvailableUsers(data.data.filter((u: any) => !currentMemberIds.includes(u.id)));
      }
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  // ── Actions ──
  const startEdit = () => {
    setEditForm({
      name: project.name || "",
      description: project.description || "",
      address: project.address || "",
      startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
      endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
      budget: String(project.budget || ""),
      actualCost: project.actualCost ? String(project.actualCost) : "",
      progress: String(project.progress || 0),
      status: project.status || "PLANNING",
      branchId: project.branchId || "",
      projectManagerId: project.projectManagerId || "",
      siteManagerId: project.siteManagerId || "",
      clientId: project.clientId || "",
    });
    setEditMode(true);
    setSaveError(null);
  };

  const saveEdit = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          address: editForm.address.trim(),
          startDate: editForm.startDate,
          endDate: editForm.endDate || null,
          budget: Number(editForm.budget),
          actualCost: editForm.actualCost ? Number(editForm.actualCost) : null,
          progress: Number(editForm.progress),
          status: editForm.status,
          branchId: editForm.branchId,
          projectManagerId: editForm.projectManagerId,
          siteManagerId: editForm.siteManagerId || null,
          clientId: editForm.clientId,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update");
      }
      setEditMode(false);
      fetchProject();
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      router.push("/dashboard/projects");
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const addMember = async () => {
    if (!selectedUserId || !selectedRole) {
      setMemberError("Please select a user and role");
      return;
    }
    setAddingMember(true);
    setMemberError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add member");
      }
      setSelectedUserId("");
      setSelectedRole("");
      setShowAddMember(false);
      fetchMembers();
      fetchProject();
    } catch (err: any) {
      setMemberError(err.message);
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (userId: string) => {
    setRemovingMember(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove member");
      fetchMembers();
      fetchProject();
      setMemberToRemove(null);
    } catch (err: any) {
      setMemberError(err.message);
    } finally {
      setRemovingMember(false);
    }
  };

  const submitReport = async () => {
    if (!reportForm.description?.trim()) {
      setReportError("Deskripsi wajib diisi");
      return;
    }
    setReportSubmitting(true);
    setReportError(null);
    try {
      const isEdit = !!editingReport;
      const url = isEdit
        ? `/api/projects/${projectId}/progress-reports/${editingReport.id}`
        : `/api/projects/${projectId}/progress-reports`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reportForm, photoIds }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal menyimpan laporan");
      }
      setShowReportForm(false);
      setEditingReport(null);
      setPhotoIds([]);
      fetchReports();
      fetchProject();
    } catch (err: any) {
      setReportError(err.message);
    }
    setReportSubmitting(false);
  };

  const deleteReport = async (reportId: string) => {
    setReportDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/progress-reports/${reportId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus laporan");
      setReportToDelete(null);
      fetchReports();
      fetchProject();
    } catch (err: any) {
      setReportError(err.message);
    }
    setReportDeleting(false);
  };

  const ef = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setEditForm((f: any) => ({ ...f, [key]: e.target.value }));

  const focusInput = (e: React.FocusEvent<any>) => {
    e.target.style.borderColor = T.primary;
    e.target.style.boxShadow = "0 0 0 4px rgba(0,79,53,0.08)";
    e.target.style.background = "#fff";
  };

  const blurInput = (e: React.FocusEvent<any>) => {
    e.target.style.borderColor = T.outlineSoft;
    e.target.style.boxShadow = "none";
    e.target.style.background = T.surfaceContainerLow;
  };

  // ── Loading & Error States ──
  if (loading) return <DetailSkeleton />;

  if (error || !project) {
    return (
      <div style={{ maxWidth: "600px", margin: "80px auto", padding: "0 16px" }}>
        <div style={{ ...cardStyle, padding: "64px 32px", textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: T.outlineSoft, display: "block", marginBottom: "16px" }}>
            error
          </span>
          <h3 style={{ fontFamily: T.fontDisplay, fontSize: "24px", color: T.onSurface, margin: "0 0 8px" }}>
            {error || "Project tidak ditemukan"}
          </h3>
          <p style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurfaceMuted, margin: "0 0 24px" }}>
            Project yang Anda cari mungkin telah dihapus atau tidak tersedia.
          </p>
          <Link
            href="/dashboard/projects"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              background: T.primary,
              color: "#fff",
              borderRadius: "12px",
              fontFamily: T.fontLabel,
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 12px rgba(0,79,53,0.25)",
              transition: "all 0.2s",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const daysLeft = calculateDaysLeft(project.endDate);
  const budgetUsage = project.budget > 0 ? ((project.actualCost || 0) / project.budget) * 100 : 0;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 16px" }}>
      <style>{`
        .sk-edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .sk-edit-grid .full { grid-column: 1 / -1; }
        .sk-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .sk-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
        @media (max-width: 640px) { .sk-edit-grid { grid-template-columns: 1fr; } .sk-stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .sk-select-edit { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236f7a72' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 40px !important; cursor: pointer; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInUp 0.4s ease forwards; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "20px",
          marginTop: "24px",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", flex: 1 }}>
          <Link
            href="/dashboard/projects"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: T.surfaceCard,
              border: `1px solid ${T.outlineSoft}`,
              color: T.onSurfaceVariant,
              textDecoration: "none",
              flexShrink: 0,
              marginTop: "2px",
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
            <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>arrow_back</span>
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: "12px",
                  fontWeight: 700,
                  color: T.primary,
                  background: T.primaryLight,
                  padding: "4px 12px",
                  borderRadius: "8px",
                  letterSpacing: "0.04em",
                  border: `1px solid ${T.primary}20`,
                }}
              >
                {project.code}
              </span>
              <StatusBadge status={project.status} large />
            </div>
            <h1
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "36px",
                fontWeight: 700,
                color: T.onSurface,
                margin: "0 0 4px",
                letterSpacing: "-0.02em",
                lineHeight: "1.2",
              }}
            >
              {project.name}
            </h1>
            <p
              style={{
                fontFamily: T.fontBody,
                fontSize: "14px",
                color: T.onSurfaceMuted,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>location_on</span>
              {project.address}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          {canEditProject && !editMode && (
            <>
              <button
                onClick={startEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: T.surfaceCard,
                  color: T.onSurfaceVariant,
                  border: `1.5px solid ${T.outlineSoft}`,
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
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
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: T.errorLight,
                  color: T.error,
                  border: `1.5px solid ${T.error}20`,
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,218,214,0.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.errorLight;
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                Delete
              </button>
            </>
          )}
          {editMode && (
            <>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  padding: "10px 20px",
                  background: T.surfaceCard,
                  color: T.onSurfaceVariant,
                  border: `1.5px solid ${T.outlineSoft}`,
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 28px",
                  background: saving ? T.outlineSoft : T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  boxShadow: saving ? "none" : "0 4px 16px rgba(0,79,53,0.25)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = T.primaryHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = T.primary;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>
                      progress_activity
                    </span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>
                    Save Changes
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save Error Banner */}
      {saveError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            background: T.errorLight,
            border: `1px solid ${T.error}20`,
            borderRadius: "14px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.error, flexShrink: 0 }}>
            error
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.error, flex: 1 }}>{saveError}</span>
          <button
            onClick={() => setSaveError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: T.error, padding: "4px" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
          </button>
        </div>
      )}

      {/* ═══ PROGRESS & BUDGET OVERVIEW ═══ */}
      {!editMode && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* Progress Card */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h4
                  style={{
                    fontFamily: T.fontLabel,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.outline,
                    margin: "0 0 8px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Overall Progress
                </h4>
                <div style={{ fontFamily: T.fontDisplay, fontSize: "42px", fontWeight: 700, color: T.onSurface, lineHeight: 1 }}>
                  {project.progress || 0}%
                </div>
              </div>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: `conic-gradient(${getProgressColor(project.progress || 0)} ${project.progress || 0}%, ${T.surfaceContainerHigh} ${project.progress || 0}%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px", color: getProgressColor(project.progress || 0) }}>
                    trending_up
                  </span>
                </div>
              </div>
            </div>
            <ProgressBar value={project.progress || 0} large showLabel={false} />
          </div>

          {/* Budget Card */}
          <div style={cardStyle}>
            <h4
              style={{
                fontFamily: T.fontLabel,
                fontSize: "12px",
                fontWeight: 600,
                color: T.outline,
                margin: "0 0 20px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Budget Overview
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted }}>Total Budget</span>
                <span style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.onSurface }}>
                  {formatCurrency(Number(project.budget))}
                </span>
              </div>
              {project.actualCost > 0 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted }}>Actual Cost</span>
                    <span style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: T.warning }}>
                      {formatCurrency(Number(project.actualCost))}
                    </span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted }}>Budget Usage</span>
                      <span style={{ fontFamily: T.fontLabel, fontSize: "12px", fontWeight: 600, color: budgetUsage > 90 ? T.error : T.warning }}>
                        {budgetUsage.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ height: "6px", background: T.surfaceContainerHigh, borderRadius: "9999px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(budgetUsage, 100)}%`,
                          background: budgetUsage > 90 ? T.error : T.warning,
                          borderRadius: "9999px",
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Timeline Card */}
          <div style={cardStyle}>
            <h4
              style={{
                fontFamily: T.fontLabel,
                fontSize: "12px",
                fontWeight: 600,
                color: T.outline,
                margin: "0 0 20px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Timeline
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted }}>Start Date</span>
                <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: T.onSurface }}>
                  {formatDate(project.startDate)}
                </span>
              </div>
              {project.endDate && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted }}>Target End</span>
                    <span style={{ fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, color: T.onSurface }}>
                      {formatDate(project.endDate)}
                    </span>
                  </div>
                  {daysLeft !== null && (
                    <div
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        background: daysLeft < 0 ? T.errorLight : daysLeft < 30 ? T.warningLight : T.successLight,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: "18px",
                          color: daysLeft < 0 ? T.error : daysLeft < 30 ? T.warning : T.success,
                        }}
                      >
                        {daysLeft < 0 ? "warning" : "schedule"}
                      </span>
                      <span
                        style={{
                          fontFamily: T.fontLabel,
                          fontSize: "13px",
                          fontWeight: 600,
                          color: daysLeft < 0 ? T.error : daysLeft < 30 ? T.warning : T.success,
                        }}
                      >
                        {daysLeft < 0
                          ? `${Math.abs(daysLeft)} days overdue`
                          : daysLeft === 0
                            ? "Due today"
                            : `${daysLeft} days remaining`}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUICK STATS ═══ */}
      {!editMode && (
        <div className="sk-stat-grid" style={{ marginBottom: "24px" }}>
          <StatCard icon="group" label="Team Members" value={project._count?.members || 0} color={T.primary} />
          <StatCard icon="task_alt" label="Tasks" value={project._count?.tasks || 0} color={T.info} onClick={() => setActiveTab("tasks")} />
          <StatCard icon="inventory_2" label="Materials Used" value={project._count?.transactions || 0} color={T.warning} />
          <StatCard icon="description" label="Files" value={project._count?.files || 0} color={T.secondary} />
          <StatCard icon="receipt_long" label="Invoices" value={project._count?.invoices || 0} color={T.success} />
          <StatCard icon="monitoring" label="Reports" value={reports.length} color="#7c3aed" onClick={() => setActiveTab("reports")} />
        </div>
      )}

      {/* ═══ TABS ═══ */}
      {!editMode && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginBottom: "24px",
            background: T.surfaceContainerLow,
            padding: "4px",
            borderRadius: "14px",
            width: "fit-content",
          }}
        >
          {[
            { key: "overview", label: "Overview", icon: "dashboard" },
            { key: "tasks", label: "Tasks", icon: "task_alt" },
            { key: "reports", label: "Reports", icon: "monitoring" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: activeTab === tab.key ? T.surfaceCard : "transparent",
                color: activeTab === tab.key ? T.primary : T.onSurfaceMuted,
                border: "none",
                borderRadius: "12px",
                fontFamily: T.fontLabel,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══ OVERVIEW TAB ═══ */}
      {!editMode && activeTab === "overview" && (
        <>
          <div style={{ ...cardStyle, marginBottom: "24px" }} className="animate-fade-in">
            <SectionHeader icon="info" title="Project Details" subtitle="Complete information about this project" />
            <div className="sk-detail-grid">
              <InfoRow label="Address" icon="location_on">{project.address}</InfoRow>
              <InfoRow label="Branch" icon="business">{project.branch?.name}</InfoRow>
              <InfoRow label="Client" icon="handshake">{project.client?.companyName || project.client?.user?.name}</InfoRow>
              <InfoRow label="Project Manager" icon="badge">{project.projectManager?.name}</InfoRow>
              <InfoRow label="Site Manager" icon="engineering">{project.siteManager?.name}</InfoRow>
              <InfoRow label="Status" icon="info"><StatusBadge status={project.status} /></InfoRow>
            </div>
            {project.description && (
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(190,201,193,0.25)" }}>
                <InfoRow label="Description" icon="description">{project.description}</InfoRow>
              </div>
            )}
          </div>

          {/* Team Members */}
          <div style={{ ...cardStyle, marginBottom: "24px" }} className="animate-fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <SectionHeader icon="group" title="Team Members" subtitle={`${members.length} member${members.length !== 1 ? "s" : ""} assigned`} />
              {canEditProject && (
                <button
                  onClick={() => { setShowAddMember(true); loadAvailableUsers(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    background: T.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,79,53,0.25)",
                    transition: "all 0.2s",
                    flexShrink: 0,
                    marginLeft: "16px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.primaryHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = T.primary;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>
                  Add Member
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 16px" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "48px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>
                  group_off
                </span>
                <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: "0 0 16px" }}>
                  No team members assigned yet
                </p>
                {canEditProject && (
                  <button
                    onClick={() => { setShowAddMember(true); loadAvailableUsers(); }}
                    style={{
                      padding: "10px 24px",
                      background: T.primaryLight,
                      color: T.primary,
                      border: `1.5px solid ${T.primary}30`,
                      borderRadius: "12px",
                      fontFamily: T.fontLabel,
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Add First Member
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {members.map((m: any) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 18px",
                      background: T.surfaceContainerLow,
                      borderRadius: "12px",
                      border: `1px solid ${T.outlineSoft}20`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: T.primary }}>
                        person
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.fontBody, fontSize: "14px", fontWeight: 600, color: T.onSurface }}>
                        {m.user?.name || "Unknown"}
                      </div>
                      <div style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted, marginTop: "2px" }}>
                        {m.user?.email || ""}
                      </div>
                    </div>
                    <span
                      style={{
                        fontFamily: T.fontLabel,
                        fontSize: "11px",
                        fontWeight: 700,
                        color: T.primary,
                        background: T.primaryLight,
                        padding: "5px 12px",
                        borderRadius: "8px",
                        border: `1px solid ${T.primary}20`,
                      }}
                    >
                      {m.role?.replace(/_/g, " ") || "Member"}
                    </span>
                    {canEditProject && (
                      <button
                        onClick={() => setMemberToRemove({ id: m.user?.id || m.id, name: m.user?.name || "Unknown" })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          background: T.errorLight,
                          color: T.error,
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "all 0.2s",
                        }}
                        title="Remove member"
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,218,214,0.6)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = T.errorLight; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div
            style={{
              ...cardStyle,
              padding: "16px 24px",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: "12px",
                color: T.onSurfaceMuted,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_today</span>
              Created: {formatDateTime(project.createdAt)}
            </span>
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: "12px",
                color: T.onSurfaceMuted,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>update</span>
              Last updated: {formatDateTime(project.updatedAt)}
            </span>
          </div>
        </>
      )}

      {/* ═══ TASKS TAB ═══ */}
      {!editMode && activeTab === "tasks" && (
        <div className="animate-fade-in">
          <TasksBoard
            projectId={projectId}
            projectMembers={members}
            canEdit={canManageTasks}
            canCreate={canEditProject}
            onTaskChange={() => fetchProject()}
          />
        </div>
      )}

      {/* ═══ REPORTS TAB ═══ */}
      {!editMode && activeTab === "reports" && (
        <>
          <div className="animate-fade-in" style={{ marginBottom: "20px" }}>
            <ProgressChart reports={reports} />
          </div>
          <div style={cardStyle} className="animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <SectionHeader icon="monitoring" title="Progress Reports" subtitle={`${reports.length} report${reports.length !== 1 ? "s" : ""}`} />
            {canReport && (
              <button
                onClick={() => {
                  setEditingReport(null);
                  setPhotoIds([]);
                  setReportForm({ percentage: project.progress || 0, description: "", weather: "", reportDate: new Date().toISOString().split("T")[0] });
                  setReportError(null);
                  setShowReportForm(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,79,53,0.25)",
                  transition: "all 0.2s",
                  flexShrink: 0,
                  marginLeft: "16px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.primaryHover;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.primary;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Lapor Progress
              </button>
            )}
          </div>

          {reportsLoading ? (
            <div style={{ textAlign: "center", padding: "48px", color: T.onSurfaceMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: "32px", display: "block", marginBottom: "12px", animation: "spin 1s linear infinite" }}>
                progress_activity
              </span>
              <span style={{ fontFamily: T.fontLabel, fontSize: "14px" }}>Loading reports…</span>
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "56px", color: T.outlineSoft, display: "block", marginBottom: "12px" }}>
                monitoring
              </span>
              <p style={{ fontFamily: T.fontBody, fontSize: "15px", color: T.onSurfaceMuted, margin: "0 0 8px" }}>
                Belum ada laporan progress
              </p>
              <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.outlineSoft, margin: "0 0 20px" }}>
                Laporkan progress pekerjaan untuk memulai tracking
              </p>
              {canReport && (
                <button
                  onClick={() => {
                    setEditingReport(null);
                    setPhotoIds([]);
                    setReportForm({ percentage: project.progress || 0, description: "", weather: "", reportDate: new Date().toISOString().split("T")[0] });
                    setShowReportForm(true);
                  }}
                  style={{
                    padding: "12px 24px",
                    background: T.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,79,53,0.25)",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px", verticalAlign: "middle", marginRight: "8px" }}>
                    add
                  </span>
                  Lapor Progress Pertama
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reports.map((r: any, index: number) => {
                const photoCount = r.photos?.length || r._count?.photos || 0;
                return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px 20px",
                    background: T.surfaceContainerLow,
                    borderRadius: "14px",
                    border: `1px solid ${T.outlineSoft}20`,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    animation: `fadeInUp 0.3s ease forwards ${index * 0.05}s`,
                    position: "relative",
                  }}
                  onClick={() => setSelectedReport(r)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.surfaceContainerHigh;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = T.surfaceContainerLow;
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: `conic-gradient(${getProgressColor(r.percentage)} ${r.percentage}%, ${T.surfaceContainerHigh} ${r.percentage}%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        background: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span style={{ fontFamily: T.fontLabel, fontSize: "14px", fontWeight: 700, color: getProgressColor(r.percentage) }}>
                        {r.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.fontBody, fontSize: "14px", color: T.onSurface, lineHeight: 1.5, marginBottom: "8px" }}>
                      {r.description}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, display: "flex", alignItems: "center", gap: "4px" }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>calendar_today</span>
                        {new Date(r.reportDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      {r.weather && (
                        <span style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.outline, display: "flex", alignItems: "center", gap: "4px" }}>
                          {getWeatherIcon(r.weather)} {r.weather}
                        </span>
                      )}
                      <span style={{ fontFamily: T.fontBody, fontSize: "11px", color: T.onSurfaceMuted }}>
                        oleh {r.reporter?.name || "—"}
                      </span>
                      {photoCount > 0 && (
                        <span style={{ fontFamily: T.fontLabel, fontSize: "11px", color: T.primary, display: "flex", alignItems: "center", gap: "4px" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>photo_camera</span>
                          {photoCount} foto
                        </span>
                      )}
                    </div>
                    {/* Photo thumbnails */}
                    {r.photos && r.photos.length > 0 && (
                      <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                        {r.photos.slice(0, 4).map((p: any) => (
                          <div key={p.id} style={{
                            width: "44px", height: "44px", borderRadius: "8px",
                            overflow: "hidden", border: `1px solid ${T.outlineSoft}33`,
                            flexShrink: 0,
                          }}>
                            <img src={p.url || `/api/files/${p.id}`} alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        ))}
                        {r.photos.length > 4 && (
                          <div style={{
                            width: "44px", height: "44px", borderRadius: "8px",
                            background: T.surfaceContainerHigh, display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600,
                            color: T.outline, flexShrink: 0,
                          }}>
                            +{r.photos.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ width: "80px", flexShrink: 0 }}>
                    <div style={{ height: "4px", background: T.surfaceContainerHigh, borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${r.percentage}%`,
                          background: getProgressColor(r.percentage),
                          borderRadius: "4px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  {canReport && (
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0, marginLeft: "4px" }}
                      onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingReport(r);
                          setPhotoIds(r.photos?.map((p: any) => p.id) || []);
                          setReportForm({
                            percentage: r.percentage,
                            description: r.description,
                            weather: r.weather || "",
                            reportDate: new Date(r.reportDate).toISOString().split("T")[0],
                          });
                          setReportError(null);
                          setShowReportForm(true);
                        }}
                        title="Edit"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "transparent", border: "none", cursor: "pointer",
                          color: T.outline, transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.primaryLight; e.currentTarget.style.color = T.primary; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.outline; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>edit</span>
                      </button>
                      <button
                        onClick={() => setReportToDelete(r)}
                        title="Delete"
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "32px", height: "32px", borderRadius: "8px",
                          background: "transparent", border: "none", cursor: "pointer",
                          color: T.outline, transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = T.errorLight; e.currentTarget.style.color = T.error; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.outline; }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          )}
        </div>
        <ReportDetail
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onEdit={canReport ? (r) => {
            setSelectedReport(null);
            setEditingReport(r);
            setPhotoIds(r.photos?.map((p: any) => p.id) || []);
            setReportForm({
              percentage: r.percentage,
              description: r.description,
              weather: r.weather || "",
              reportDate: new Date(r.reportDate).toISOString().split("T")[0],
            });
            setReportError(null);
            setShowReportForm(true);
          } : undefined}
          onDelete={canReport ? (id) => {
            setSelectedReport(null);
            const r = reports.find((x: any) => x.id === id);
            if (r) setReportToDelete(r);
          } : undefined}
        />
      </>)}

      {/* ═══ EDIT MODE ═══ */}
      {editMode && (
        <div style={cardStyle} className="animate-fade-in">
          <SectionHeader icon="edit" title="Edit Project" subtitle="Modify project details and settings" />
          <div className="sk-edit-grid">
            <div className="full">
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Project Name
              </label>
              <input value={editForm.name} onChange={ef("name")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} placeholder="Enter project name" />
            </div>
            <div className="full">
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Description
              </label>
              <textarea value={editForm.description} onChange={ef("description") as any} onFocus={focusInput as any} onBlur={blurInput as any} rows={3} style={{ ...editFieldStyle, resize: "vertical" }} placeholder="Project description" />
            </div>
            <div className="full">
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Address
              </label>
              <input value={editForm.address} onChange={ef("address")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} placeholder="Project address" />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Start Date
              </label>
              <input type="date" value={editForm.startDate} onChange={ef("startDate")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                End Date
              </label>
              <input type="date" value={editForm.endDate} onChange={ef("endDate")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Budget (IDR)
              </label>
              <input type="number" value={editForm.budget} onChange={ef("budget")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} placeholder="0" />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Actual Cost (IDR)
              </label>
              <input type="number" value={editForm.actualCost} onChange={ef("actualCost")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} placeholder="0" />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Progress (%)
              </label>
              <input type="number" min="0" max="100" value={editForm.progress} onChange={ef("progress")} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Status
              </label>
              <select value={editForm.status} onChange={ef("status")} onFocus={focusInput} onBlur={blurInput} className="sk-select-edit" style={{ ...editFieldStyle }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Branch
              </label>
              <select value={editForm.branchId} onChange={ef("branchId")} onFocus={focusInput} onBlur={blurInput} className="sk-select-edit" style={{ ...editFieldStyle }}>
                <option value="">Select branch…</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Client
              </label>
              <select value={editForm.clientId} onChange={ef("clientId")} onFocus={focusInput} onBlur={blurInput} className="sk-select-edit" style={{ ...editFieldStyle }}>
                <option value="">Select client…</option>
                {clients.map((c: any) => <option key={c.id} value={c.id}>{c.companyName || c.user?.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Project Manager
              </label>
              <select value={editForm.projectManagerId} onChange={ef("projectManagerId")} onFocus={focusInput} onBlur={blurInput} className="sk-select-edit" style={{ ...editFieldStyle }}>
                <option value="">Select PM…</option>
                {projectManagers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                Site Manager
              </label>
              <select value={editForm.siteManagerId} onChange={ef("siteManagerId")} onFocus={focusInput} onBlur={blurInput} className="sk-select-edit" style={{ ...editFieldStyle }}>
                <option value="">Select Site Manager…</option>
                {siteManagers.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Add Member Modal */}
      {showAddMember && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
          onClick={() => !addingMember && setShowAddMember(false)}
        >
          <div style={{ ...cardStyle, maxWidth: "480px", width: "100%", padding: "32px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>person_add</span>
              </div>
              <div>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: 0 }}>Add Team Member</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>Assign a new member to this project</p>
              </div>
            </div>

            {memberError && (
              <div style={{ marginBottom: "20px", padding: "12px 16px", background: T.errorLight, border: `1px solid ${T.error}20`, borderRadius: "10px", fontFamily: T.fontBody, fontSize: "13px", color: T.error }}>
                {memberError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Select User
                </label>
                <UserPicker
                  users={availableUsers.map((u: any) => ({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar }))}
                  value={selectedUserId}
                  onChange={setSelectedUserId}
                  placeholder="Search user by name or email…"
                  disabled={addingMember}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Role in Project
                </label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} onFocus={focusInput} onBlur={blurInput} style={{ ...editFieldStyle, cursor: "pointer" }}>
                  <option value="">Choose a role…</option>
                  {MEMBER_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
              <button onClick={() => setShowAddMember(false)} disabled={addingMember} style={{ padding: "12px 24px", background: T.surfaceCard, color: T.onSurfaceVariant, border: `1.5px solid ${T.outlineSoft}`, borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={addMember}
                disabled={addingMember || !selectedUserId || !selectedRole}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: addingMember || !selectedUserId || !selectedRole ? T.outlineSoft : T.primary, color: "#fff", border: "none", borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: addingMember || !selectedUserId || !selectedRole ? "not-allowed" : "pointer", boxShadow: addingMember || !selectedUserId || !selectedRole ? "none" : "0 4px 12px rgba(0,79,53,0.25)", transition: "all 0.2s" }}
              >
                {addingMember ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>progress_activity</span>Adding…</>
                ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>person_add</span>Add Member</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Form Modal */}
      {showReportForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}
          onClick={() => !reportSubmitting && (setShowReportForm(false), setReportError(null))}
        >
          <div style={{ ...cardStyle, maxWidth: "560px", width: "100%", padding: "32px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>monitoring</span>
              </div>
              <div>
                <h3 style={{ fontFamily: T.fontDisplay, fontSize: "18px", fontWeight: 700, color: T.onSurface, margin: 0 }}>{editingReport ? "Edit Laporan" : "Lapor Progress"}</h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>{editingReport ? "Perbarui laporan progress pekerjaan" : "Laporkan progress pekerjaan hari ini"}</p>
              </div>
            </div>

            {reportError && (
              <div style={{ marginBottom: "20px", padding: "12px 16px", background: T.errorLight, border: `1px solid ${T.error}20`, borderRadius: "10px", fontFamily: T.fontBody, fontSize: "13px", color: T.error }}>
                {reportError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Progress (%) *
                  </label>
                  <div style={{ position: "relative", paddingTop: "8px" }}>
                    <input
                      type="range" min="0" max="100"
                      value={reportForm.percentage}
                      onChange={(e) => setReportForm((f: any) => ({ ...f, percentage: Number(e.target.value) }))}
                      style={{ width: "100%", accentColor: getProgressColor(reportForm.percentage), height: "8px", borderRadius: "9999px", cursor: "pointer" }}
                    />
                    <div style={{ position: "absolute", right: "0", top: "-24px", fontFamily: T.fontLabel, fontSize: "24px", fontWeight: 700, color: getProgressColor(reportForm.percentage) }}>
                      {reportForm.percentage}%
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                    Tanggal
                  </label>
                  <input type="date" value={reportForm.reportDate} onChange={(e) => setReportForm((f: any) => ({ ...f, reportDate: e.target.value }))} onFocus={focusInput} onBlur={blurInput} style={editFieldStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Cuaca
                </label>
                <select value={reportForm.weather} onChange={(e) => setReportForm((f: any) => ({ ...f, weather: e.target.value }))} onFocus={focusInput} onBlur={blurInput} style={{ ...editFieldStyle, cursor: "pointer" }}>
                  {WEATHER_OPTIONS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Foto
                </label>
                <PhotoUpload value={photoIds} onChange={setPhotoIds} disabled={reportSubmitting} />
              </div>

              <div>
                <label style={{ display: "block", fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, color: T.outline, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Deskripsi Pekerjaan *
                </label>
                <textarea value={reportForm.description} onChange={(e) => setReportForm((f: any) => ({ ...f, description: e.target.value }))} onFocus={focusInput} onBlur={blurInput} placeholder="Jelaskan progress pekerjaan yang sudah dilakukan hari ini…" rows={4} style={{ ...editFieldStyle, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
              <button onClick={() => (setShowReportForm(false), setReportError(null))} disabled={reportSubmitting} style={{ padding: "12px 24px", background: T.surfaceCard, color: T.onSurfaceVariant, border: `1.5px solid ${T.outlineSoft}`, borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                Batal
              </button>
              <button
                onClick={submitReport}
                disabled={reportSubmitting}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", background: reportSubmitting ? T.outlineSoft : T.primary, color: "#fff", border: "none", borderRadius: "12px", fontFamily: T.fontLabel, fontSize: "13px", fontWeight: 600, cursor: reportSubmitting ? "not-allowed" : "pointer", boxShadow: reportSubmitting ? "none" : "0 4px 12px rgba(0,79,53,0.25)", transition: "all 0.2s" }}
              >
                {reportSubmitting ? (
                  <><span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>progress_activity</span>Menyimpan…</>
                  ) : (
                  <><span className="material-symbols-outlined" style={{ fontSize: "18px" }}>save</span>{editingReport ? "Simpan Perubahan" : "Simpan Laporan"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Report Alert Dialog */}
      <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && !reportDeleting && setReportToDelete(null)}>
        <AlertDialogContent className="">
          <AlertDialogHeader className="">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <AlertDialogMedia className="">
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: T.error }}>delete_forever</span>
              </AlertDialogMedia>
              <div style={{ flex: 1 }}>
                <AlertDialogTitle className="">Hapus Laporan Progress?</AlertDialogTitle>
                <AlertDialogDescription className="">
                  Laporan progress tanggal <strong>{reportToDelete ? new Date(reportToDelete.reportDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}</strong> akan dihapus dari sistem. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel disabled={reportDeleting} className="">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (reportToDelete) deleteReport(reportToDelete.id); }} loading={reportDeleting} className="">
              {reportDeleting ? "Menghapus…" : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Member Alert Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent className="">
          <AlertDialogHeader className="">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <AlertDialogMedia className="">
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: T.error }}>person_remove</span>
              </AlertDialogMedia>
              <div style={{ flex: 1 }}>
                <AlertDialogTitle className="">Remove team member?</AlertDialogTitle>
                <AlertDialogDescription className="">
                  <strong>{memberToRemove?.name}</strong> will be removed from this project. They will lose access to project data and tasks. This action cannot be undone.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel disabled={removingMember} className="">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (memberToRemove) removeMember(memberToRemove.id); }} loading={removingMember} className="">
              {removingMember ? "Removing…" : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Alert Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !deleting && setShowDeleteConfirm(open)}>
        <AlertDialogContent className="">
          <AlertDialogHeader className="">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <AlertDialogMedia className="">
                <span className="material-symbols-outlined" style={{ fontSize: "28px", color: T.error }}>delete_forever</span>
              </AlertDialogMedia>
              <div style={{ flex: 1 }}>
                <AlertDialogTitle className="">Hapus Project?</AlertDialogTitle>
                <AlertDialogDescription className="">
                  Project <strong>{project.code}</strong> akan dihapus permanen dari sistem. Semua data terkait (tasks, materials, files) akan tetap tersimpan untuk audit. Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="">
            <AlertDialogCancel disabled={deleting} className="">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteProject(); }} loading={deleting} className="">
              {deleting ? "Deleting…" : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
