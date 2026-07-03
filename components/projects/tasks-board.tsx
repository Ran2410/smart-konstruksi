"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { UserPicker } from "./user-picker";

// ── Design Tokens ───────────────────────────────────────
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
  surfaceContainerHigh: "#eef2ef",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.4)",
  success: "#15803d",
  warning: "#b45309",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: `1px solid rgba(190,201,193,0.25)`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "32px",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 200,
  padding: "20px",
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

const STATUSES = [
  { value: "TODO", label: "To Do", color: "#6f7a72", icon: "radio_button_unchecked" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#2563eb", icon: "progress_activity" },
  { value: "REVIEW", label: "Review", color: "#b45309", icon: "rate_review" },
  { value: "DONE", label: "Done", color: "#15803d", icon: "check_circle" },
  { value: "BLOCKED", label: "Blocked", color: "#ba1a1a", icon: "block" },
];

const PRIORITIES: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "#dc2626" },
  HIGH: { label: "High", color: "#ea580c" },
  MEDIUM: { label: "Medium", color: "#ca8a04" },
  LOW: { label: "Low", color: "#6f7a72" },
};

// ── Helper Styles ──────────────────────────────────────
const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "20px",
};

// ── Types ──────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  startDate: string;
  dueDate: string;
  completedAt?: string | null;
  assignee?: { id: string; name: string; email: string; avatar?: string | null } | null;
}

interface TasksBoardProps {
  projectId: string;
  projectMembers: { id: string; userId: string; role?: string; user: { id: string; name: string; email: string; avatar?: string | null } }[];
  canEdit: boolean;
  canCreate?: boolean;
  onTaskChange: () => void;
}

// ── Utility ────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date();
}

// ============================================================
// TASK CARD
// ============================================================
function TaskCard({
  task,
  members,
  canEdit,
  onClick,
  onDragStart,
}: {
  task: Task;
  members: { id: string; userId: string; role?: string; user: { id: string; name: string; email: string; avatar?: string | null } }[];
  canEdit: boolean;
  onClick: () => void;
  onDragStart?: (taskId: string) => void;
}) {
  const priority = PRIORITIES[task.priority] || PRIORITIES.MEDIUM;
  const assignee = task.assignee;
  const overdue = task.status !== "DONE" && isOverdue(task.dueDate);

  const handleDragStart = (e: React.DragEvent) => {
    if (!canEdit) return;
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    // Add slight opacity to the drag ghost
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "0.5";
    onDragStart?.(task.id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = "1";
    el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)";
    el.style.borderColor = overdue ? "rgba(186,26,26,0.15)" : "rgba(190,201,193,0.25)";
    el.style.transform = "translateY(0)";
  };

  return (
    <div
      draggable={canEdit}
      onClick={onClick}
      style={{
        background: T.surfaceCard,
        borderRadius: "12px",
        border: `1px solid ${overdue ? "rgba(186,26,26,0.15)" : "rgba(190,201,193,0.25)"}`,
        padding: "14px 14px 12px",
        cursor: canEdit ? "grab" : "default",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        if (canEdit) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)";
          e.currentTarget.style.borderColor = T.primary;
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)";
        e.currentTarget.style.borderColor = overdue ? "rgba(186,26,26,0.15)" : "rgba(190,201,193,0.25)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: priority.color,
          borderRadius: "12px 12px 0 0",
        }}
      />

      {/* Priority badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span
          style={{
            fontFamily: T.fontLabel,
            fontSize: "9px",
            fontWeight: 700,
            color: priority.color,
            background: `${priority.color}12`,
            padding: "2px 8px",
            borderRadius: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            lineHeight: "16px",
          }}
        >
          {priority.label}
        </span>
        {task.status === "DONE" && (
          <span
            style={{
              fontFamily: T.fontLabel,
              fontSize: "9px",
              fontWeight: 700,
              color: T.success,
              background: "rgba(21,128,61,0.1)",
              padding: "2px 8px",
              borderRadius: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: "16px",
            }}
          >
            Done
          </span>
        )}
        {overdue && (
          <span
            style={{
              fontFamily: T.fontLabel,
              fontSize: "9px",
              fontWeight: 700,
              color: T.error,
              background: "rgba(186,26,26,0.08)",
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              lineHeight: "16px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "10px" }}>warning</span>
            Overdue
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: "13px",
          fontWeight: 600,
          color: T.onSurface,
          marginBottom: "10px",
          lineHeight: 1.4,
        }}
      >
        {task.title}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(190,201,193,0.2)", marginBottom: "8px" }} />

      {/* Bottom row: assignee + due date */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        {assignee ? (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "9999px",
                background: T.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "13px", color: T.primary }}>
                person
              </span>
            </div>
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: "11px",
                fontWeight: 500,
                color: T.onSurfaceVariant,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {assignee.name}
            </span>
          </div>
        ) : (
          <span style={{ fontFamily: T.fontBody, fontSize: "11px", color: T.outlineSoft, fontStyle: "italic" }}>
            Unassigned
          </span>
        )}

        <span
          style={{
            fontFamily: T.fontLabel,
            fontSize: "10px",
            fontWeight: 600,
            color: overdue ? T.error : T.outline,
            display: "flex",
            alignItems: "center",
            gap: "4px",
            flexShrink: 0,
            background: overdue ? "rgba(186,26,26,0.06)" : "transparent",
            padding: overdue ? "2px 6px" : "0",
            borderRadius: "4px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
            {overdue ? "warning" : "calendar_today"}
          </span>
          {formatDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// TASKS BOARD
// ============================================================
export function TasksBoard({ projectId, projectMembers, canEdit, canCreate, onTaskChange }: TasksBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // Create/Edit form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formPriority, setFormPriority] = useState("MEDIUM");
  const [formStatus, setFormStatus] = useState("TODO");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks?projectId=${projectId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Group tasks by status
  const grouped = STATUSES.map((s) => ({
    ...s,
    tasks: tasks.filter((t) => t.status === s.value),
  }));

  // ── Open create modal ──
  const members = projectMembers || [];

  const openCreate = () => {
    setFormTitle("");
    setFormDesc("");
    setFormAssignee("");
    setFormPriority("MEDIUM");
    setFormStatus("TODO");
    setFormStartDate(new Date().toISOString().split("T")[0]);
    const future = new Date();
    future.setDate(future.getDate() + 14);
    setFormDueDate(future.toISOString().split("T")[0]);
    setFormError(null);
    setIsEditing(false);
    setShowCreate(true);
  };

  // ── Open edit modal ──
  const openDetail = (task: Task) => {
    setShowDetail(task);
    setFormTitle(task.title);
    setFormDesc(task.description || "");
    setFormAssignee(task.assignee?.id || "");
    setFormPriority(task.priority);
    setFormStatus(task.status);
    setFormStartDate(task.startDate?.split("T")[0] || "");
    setFormDueDate(task.dueDate?.split("T")[0] || "");
    setFormError(null);
    setIsEditing(true);
    setShowCreate(true);
  };

  // ── Submit create / update ──
  const handleSubmit = async () => {
    if (!formTitle.trim()) { setFormError("Title is required"); return; }
    if (!formStartDate) { setFormError("Start date is required"); return; }
    if (!formDueDate) { setFormError("Due date is required"); return; }
    setFormSubmitting(true);
    setFormError(null);

    try {
      const body: Record<string, unknown> = {
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        assigneeId: formAssignee || null,
        priority: formPriority,
        startDate: formStartDate,
        dueDate: formDueDate,
      };

      let res: Response;
      if (isEditing && showDetail) {
        body.status = formStatus;
        res = await fetch(`/api/tasks/${showDetail.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        body.projectId = projectId;
        body.status = formStatus;
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save task");
      }

      setShowCreate(false);
      setShowDetail(null);
      fetchTasks();
      onTaskChange();
    } catch (err: any) {
      setFormError(err.message);
    }
    setFormSubmitting(false);
  };

  // ── Quick status change ──
  const quickStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchTasks();
        onTaskChange();
      }
    } catch {}
  };

  // ── Delete task ──
  const deleteTask = async () => {
    if (!showDetail) return;
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${showDetail.id}`, { method: "DELETE" });
      if (res.ok) {
        setShowCreate(false);
        setShowDetail(null);
        fetchTasks();
        onTaskChange();
      }
    } catch {}
  };

  // ── Render ──
  return (
    <div style={{ marginTop: "32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={sectionHeaderStyle}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: T.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>
              task_alt
            </span>
          </div>
          <div>
            <h3
              style={{
                fontFamily: T.fontDisplay,
                fontSize: "18px",
                fontWeight: 600,
                color: T.onSurface,
                margin: 0,
              }}
            >
              Tasks
            </h3>
            <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.outline, margin: "2px 0 0" }}>
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} · Click card to edit
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              background: T.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontFamily: T.fontLabel,
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,79,53,0.25)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              add
            </span>
            New Task
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "32px",
            justifyContent: "center",
            color: T.outline,
            fontFamily: T.fontLabel,
            fontSize: "14px",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px", animation: "spin 1s linear infinite" }}>
            progress_activity
          </span>
          Loading tasks…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <>
          {/* Board Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "12px",
              overflowX: "auto",
            }}
          >
            {grouped.map((col) => (
              <div
                key={col.value}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: `1px solid ${dropTarget === col.value ? "rgba(0,79,53,0.4)" : "rgba(190,201,193,0.15)"}`,
                  boxShadow: dropTarget === col.value ? "0 0 0 2px rgba(0,79,53,0.08)" : "0 1px 4px rgba(0,0,0,0.03)",
                  padding: "16px 12px 12px",
                  minHeight: "200px",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
                onDragOver={(e) => {
                  if (!canEdit || !draggedTaskId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTarget(col.value);
                }}
                onDragLeave={(e) => {
                  // Only clear if we're actually leaving this column (not entering a child)
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX;
                  const y = e.clientY;
                  if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                    setDropTarget((prev) => prev === col.value ? null : prev);
                  }
                }}
                onDrop={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData("text/plain");
                  setDropTarget(null);
                  setDraggedTaskId(null);
                  if (taskId) {
                    const currentTask = tasks.find((t) => t.id === taskId);
                    if (currentTask && currentTask.status !== col.value) {
                      quickStatusChange(taskId, col.value);
                    }
                  }
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                    paddingBottom: "10px",
                    borderBottom: `2px solid ${col.color}15`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: col.color }}>
                      {col.icon}
                    </span>
                    <span
                      style={{
                        fontFamily: T.fontLabel,
                        fontSize: "12px",
                        fontWeight: 700,
                        color: T.onSurface,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {col.label}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: T.fontLabel,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.outline,
                      background: "rgba(111,122,114,0.08)",
                      padding: "2px 9px",
                      borderRadius: "6px",
                      minWidth: "20px",
                      textAlign: "center",
                    }}
                  >
                    {col.tasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  {col.tasks.length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "24px 8px",
                        color: dropTarget === col.value ? T.primary : T.outlineSoft,
                        fontFamily: T.fontBody,
                        fontSize: "12px",
                        borderRadius: "8px",
                        background: dropTarget === col.value ? "rgba(0,79,53,0.04)" : "transparent",
                        border: dropTarget === col.value ? `2px dashed ${T.primary}40` : "2px dashed transparent",
                        transition: "all 0.15s ease",
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "28px", display: "block", marginBottom: "4px" }}>
                        {dropTarget === col.value ? "add_location" : col.value === "DONE" ? "celebration" : "drag_indicator"}
                      </span>
                      {dropTarget === col.value && draggedTaskId
                        ? `Drop here`
                        : col.value === "TODO"
                          ? "No tasks yet"
                          : col.value === "DONE"
                            ? "No completed tasks"
                            : "Move tasks here"}
                    </div>
                  ) : (
                    col.tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        members={projectMembers}
                        canEdit={canEdit}
                        onClick={() => canEdit && openDetail(task)}
                        onDragStart={setDraggedTaskId}
                      />
                    ))
                  )}
                </div>

                {/* Quick status button (for TODO column) */}
                {canCreate && col.value === "TODO" && (
                  <button
                    onClick={openCreate}
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      padding: "8px",
                      background: "transparent",
                      border: `1px dashed ${T.outlineSoft}`,
                      borderRadius: "8px",
                      color: T.outline,
                      fontFamily: T.fontLabel,
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                      add
                    </span>
                    Add Task
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Drag & Drop Hint Bar */}
          {canEdit && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                padding: "14px 16px",
                background: "rgba(0,79,53,0.04)",
                border: "1px dashed rgba(0,79,53,0.2)",
                borderRadius: "10px",
                alignItems: "center",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px", color: T.primary }}>
                touch_app
              </span>
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: "12px",
                  fontWeight: 500,
                  color: T.onSurface,
                }}
              >
                <strong>Drag & drop</strong> task cards between columns to change status
              </span>
              <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                {STATUSES.map((s) => (
                  <span
                    key={s.value}
                    style={{
                      fontFamily: T.fontLabel,
                      fontSize: "10px",
                      color: s.color,
                      background: `${s.color}10`,
                      padding: "3px 8px",
                      borderRadius: "5px",
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreate &&
        typeof document !== "undefined" &&
        createPortal(
          <div style={modalBackdropStyle} onClick={() => !formSubmitting && (setShowCreate(false), setShowDetail(null))}>
            <div
              style={{ ...cardStyle, maxWidth: "520px", width: "100%", padding: "32px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,79,53,0.1)",
                  flexShrink: 0,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "22px", color: T.primary }}>
                  {isEditing ? "edit" : "add_task"}
                </span>
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: "18px",
                    fontWeight: 700,
                    color: T.onSurface,
                    margin: 0,
                  }}
                >
                  {isEditing ? "Edit Task" : "New Task"}
                </h3>
                <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "2px 0 0" }}>
                  {isEditing ? "Update task details and status" : "Create a new task for this project"}
                </p>
              </div>
            </div>

            {formError && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "12px 16px",
                  background: T.errorLight,
                  border: `1px solid ${T.error}20`,
                  borderRadius: "10px",
                  fontFamily: T.fontBody,
                  fontSize: "13px",
                  color: T.error,
                }}
              >
                {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Title */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontLabel,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: T.outline,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Title *
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Pour foundation concrete"
                  style={editFieldStyle}
                />
              </div>

              {/* Status + Priority */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: T.fontLabel,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.outline,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    style={{ ...editFieldStyle, cursor: "pointer" }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: T.fontLabel,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.outline,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value)}
                    style={{ ...editFieldStyle, cursor: "pointer" }}
                  >
                    {Object.entries(PRIORITIES).map(([key, p]) => (
                      <option key={key} value={key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontLabel,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: T.outline,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  Assignee
                </label>
                <UserPicker
                  users={members.map((m: any) => ({
                    id: m.userId || m.user?.id || m.id,
                    name: m.user?.name || m.name || "Unknown",
                    email: m.user?.email || m.email || "",
                    role: m.role || undefined,
                  }))}
                  value={formAssignee}
                  onChange={setFormAssignee}
                  placeholder="Assign to team member…"
                  disabled={formSubmitting}
                />
              </div>

              {/* Dates */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: T.fontLabel,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.outline,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    style={editFieldStyle}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: T.fontLabel,
                      fontSize: "11px",
                      fontWeight: 600,
                      color: T.outline,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    style={editFieldStyle}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontFamily: T.fontLabel,
                    fontSize: "11px",
                    fontWeight: 600,
                    color: T.outline,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                }}
                >
                  Description
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Add details about this task…"
                  rows={3}
                  style={{ ...editFieldStyle, resize: "vertical", fontFamily: T.fontBody }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "28px" }}>
              <button
                onClick={() => (setShowCreate(false), setShowDetail(null))}
                disabled={formSubmitting}
                style={{
                  padding: "12px 24px",
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
              {isEditing && (
                <button
                  onClick={deleteTask}
                  disabled={formSubmitting}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 20px",
                    background: T.errorLight,
                    color: T.error,
                    border: `1.5px solid ${T.error}20`,
                    borderRadius: "12px",
                    fontFamily: T.fontLabel,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    delete
                  </span>
                  Delete
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={formSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: formSubmitting ? T.outlineSoft : T.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: formSubmitting ? "not-allowed" : "pointer",
                  boxShadow: formSubmitting ? "none" : "0 4px 16px rgba(0,79,53,0.25)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!formSubmitting) {
                    e.currentTarget.style.background = T.primaryHover;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!formSubmitting) {
                    e.currentTarget.style.background = T.primary;
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                {formSubmitting ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px", animation: "spin 1s linear infinite" }}>
                      progress_activity
                    </span>
                    Saving…
                  </>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                      add
                    </span>
                    Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
          document.body
        )}
    </div>
  );
}
