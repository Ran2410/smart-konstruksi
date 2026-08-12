"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "24px",
};

const btnPrimary: React.CSSProperties = {
  background: T.primary,
  color: "#fff",
  border: "none",
  padding: "10px 20px",
  borderRadius: "10px",
  fontFamily: T.fontLabel,
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "0.02em",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: `1px solid ${T.outlineSoft}`,
  fontFamily: T.fontBody,
  fontSize: "14px",
  color: T.onSurface,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  fontFamily: T.fontLabel,
  fontSize: "12px",
  fontWeight: 600,
  color: T.onSurfaceVariant,
  display: "block",
  marginBottom: "6px",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontFamily: T.fontLabel,
  fontSize: "11px",
  fontWeight: 600,
  color: T.outline,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "14px",
  verticalAlign: "middle",
};

type Document = {
  id: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  categoryId: string;
  projectId: string;
  uploaderId: string;
  status: string;
  expiryDate: string | null;
  isClientVisible: boolean;
  version: number;
  category: { id: string; name: string };
  uploader: { id: string; name: string; email: string };
  project: { id: string; name: string; code: string };
  createdAt: string;
};

type Category = { id: string; name: string; documentCount?: number };
type Project = { id: string; name: string; code: string };

export default function DocumentsPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role as string;
  const sessionReady = status === "authenticated";
  const isClient = role === "CLIENT";
  const canUpload = !isClient && ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "PROJECT_MANAGER", "SITE_MANAGER", "ADMIN_KANTOR", "ARSITEK", "QC_INSPECTOR", "K3_OFFICER", "INTERIOR_DESIGNER"].includes(role);
  const canDelete = !isClient && ["SUPER_ADMIN", "OWNER", "BRANCH_MANAGER", "ADMIN_KANTOR"].includes(role);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal
  const [showUpload, setShowUpload] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    projectId: "",
    isClientVisible: false,
    expiryDate: "",
    file: null as File | null,
  });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (projectFilter) params.set("projectId", projectFilter);
      params.set("page", String(page));
      params.set("limit", "50");

      // Client uses /api/clients/documents (only sees isClientVisible=true)
      const apiBase = isClient ? "/api/clients/documents" : "/api/documents";
      const docRes = await fetch(`${apiBase}?${params}`);
      const docJson = await docRes.json();

      setDocuments(docJson.data || []);
      setTotalPages(docJson.pagination?.totalPages || 0);
      setTotal(docJson.pagination?.total || 0);

      // Only fetch categories and projects for internal users
      if (!isClient) {
        const [catRes, projRes] = await Promise.all([
          fetch("/api/documents/categories?includeCount=true"),
          fetch("/api/projects?limit=200"),
        ]);
        const catJson = await catRes.json();
        const projJson = await projRes.json();
        setCategories(catJson.data || []);
        setProjects(projJson.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, projectFilter, page, isClient, sessionReady]);

  useEffect(() => {
    if (sessionReady) fetchData();
  }, [fetchData, sessionReady]);
  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, projectFilter]);

  const openUpload = () => {
    setUploadForm({
      name: "",
      description: "",
      categoryId: "",
      projectId: "",
      isClientVisible: false,
      expiryDate: "",
      file: null,
    });
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.categoryId || !uploadForm.projectId) {
      alert("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("name", uploadForm.name);
      formData.append("description", uploadForm.description);
      formData.append("categoryId", uploadForm.categoryId);
      formData.append("projectId", uploadForm.projectId);
      formData.append("isClientVisible", String(uploadForm.isClientVisible));
      if (uploadForm.expiryDate) {
        formData.append("expiryDate", uploadForm.expiryDate);
      }

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to upload");
        return;
      }

      setShowUpload(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Archive this document?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Failed to delete");
      return;
    }
    fetchData();
  };

  const toggleVisibility = async (id: string, current: boolean) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClientVisible: !current }),
    });
    if (!res.ok) {
      alert("Failed to update visibility");
      return;
    }
    fetchData();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      pdf: "picture_as_pdf",
      doc: "description",
      docx: "description",
      xls: "table_chart",
      xlsx: "table_chart",
      jpg: "image",
      jpeg: "image",
      png: "image",
    };
    return icons[type] || "insert_drive_file";
  };

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: T.onSurface,
              margin: 0,
            }}
          >
            Documents
          </h1>
          <p
            style={{
              color: T.onSurfaceMuted,
              fontFamily: T.fontBody,
              fontSize: "14px",
              margin: "4px 0 0",
            }}
          >
            Project documents & files management
          </p>
        </div>
        {canUpload && (
          <>
            <Link href="/dashboard/documents/categories">
              <button
                style={{
                  ...btnPrimary,
                  background: "transparent",
                  color: T.primary,
                  border: `1px solid ${T.primary}`,
                  marginRight: "8px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.primary;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = T.primary;
                }}
              >
                Manage Categories
              </button>
            </Link>
            <button
              onClick={openUpload}
              style={btnPrimary}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              + Upload Document
            </button>
          </>
        )}
      </div>

      {/* Summary + Filters */}
      <div
        style={{
          ...card,
          padding: "16px",
          marginBottom: "16px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ padding: "8px 16px", background: T.primaryLight, borderRadius: "10px" }}>
          <span
            style={{
              fontFamily: T.fontLabel,
              fontSize: "11px",
              color: T.onSurfaceMuted,
              display: "block",
            }}
          >
            TOTAL DOCUMENTS
          </span>
          <span
            style={{
              fontFamily: "'Hanken Grotesk', sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: T.primary,
            }}
          >
            {total}
          </span>
        </div>
        <input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...input, maxWidth: "280px" }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ ...input, maxWidth: "200px" }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.documentCount})
            </option>
          ))}
        </select>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{ ...input, maxWidth: "220px" }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} - {p.name}
            </option>
          ))}
        </select>
        <span style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody, fontSize: "13px" }}>
          {documents.length} items
        </span>
      </div>

      {/* Table */}
      <div style={card}>
        {loading ? (
          <div>
            <div
              style={{
                display: "flex",
                gap: "24px",
                marginBottom: "16px",
                paddingBottom: "12px",
                borderBottom: `1px solid ${T.outlineSoft}44`,
              }}
            >
              <Skeleton className="h-3 w-[140px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[60px]" />
              <Skeleton className="h-3 w-[90px]" />
              <Skeleton className="h-3 w-[90px]" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-5 w-[50px]" />
                  <Skeleton className="h-5 w-[60px]" />
                  <Skeleton className="h-5 w-[100px]" />
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: T.onSurfaceMuted, fontFamily: T.fontBody }}>
              No documents found.
            </p>
            {canUpload && (
              <button onClick={openUpload} style={{ ...btnPrimary, marginTop: "12px" }}>
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.fontBody }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.outlineSoft}44` }}>
                    <th style={thStyle}>Document</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Category</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Project</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Size</th>
                    {!isClient && <th style={{ ...thStyle, textAlign: "center" }}>Visible to Client</th>}
                    <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      style={{ transition: "background 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = T.surfaceContainerLow)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "32px", color: T.primary }}
                          >
                            {getFileIcon(doc.fileType)}
                          </span>
                          <div>
                            <a
                              href={`/api/documents/${doc.id}?download=1`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontWeight: 600,
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "14px",
                                color: T.onSurface,
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = T.primary)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = T.onSurface)
                              }
                            >
                              {doc.name}
                            </a>
                            {doc.description && (
                              <div
                                style={{
                                  color: T.onSurfaceMuted,
                                  fontSize: "12px",
                                  marginTop: "2px",
                                }}
                              >
                                {doc.description}
                              </div>
                            )}
                            <div
                              style={{
                                color: T.onSurfaceMuted,
                                fontSize: "11px",
                                marginTop: "2px",
                              }}
                            >
                              Uploaded by {doc.uploader.name} on {formatDate(doc.createdAt)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontFamily: T.fontLabel,
                            fontWeight: 600,
                            background: T.primaryLight,
                            color: T.primary,
                          }}
                        >
                          {doc.category.name}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <span
                          style={{
                            fontFamily: "'Geist', monospace",
                            fontSize: "12px",
                            color: T.onSurfaceMuted,
                          }}
                        >
                          {doc.project.code}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <span
                          style={{
                            fontFamily: "'Geist', monospace",
                            fontSize: "13px",
                            color: T.onSurfaceMuted,
                          }}
                        >
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </td>
                      {!isClient && (
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button
                            onClick={() => toggleVisibility(doc.id, doc.isClientVisible)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontFamily: T.fontLabel,
                              fontWeight: 600,
                              background: doc.isClientVisible ? T.successBg : T.surfaceContainerLow,
                              color: doc.isClientVisible ? T.success : T.onSurfaceMuted,
                              border: `1px solid ${doc.isClientVisible ? T.success + "44" : T.outlineSoft}`,
                              cursor: "pointer",
                            }}
                          >
                            {doc.isClientVisible ? "YES" : "NO"}
                          </button>
                        </td>
                      )}
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end", position: "relative" }}>
                          <a
                            href={`/api/documents/${doc.id}?download=1`}
                            download
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "6px 10px",
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontFamily: "'Geist', monospace",
                              fontWeight: 600,
                              background: T.primaryLight,
                              color: T.primary,
                              border: `1px solid ${T.primary}44`,
                              textDecoration: "none",
                              cursor: "pointer",
                            }}
                          >
                            Download
                          </a>
                          {canDelete && (
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={() => setOpenMenu(openMenu === doc.id ? null : doc.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "6px",
                                  borderRadius: "8px",
                                  color: T.onSurfaceMuted,
                                  display: "inline-flex",
                                  lineHeight: 1,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = T.surfaceContainerLow)
                                }
                                onMouseLeave={(e) => {
                                  if (openMenu !== doc.id) e.currentTarget.style.background = "none";
                                }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                                  more_vert
                                </span>
                              </button>
                              {openMenu === doc.id && (
                                <>
                                  <div
                                    style={{ position: "fixed", inset: 0, zIndex: 50 }}
                                    onClick={() => setOpenMenu(null)}
                                  />
                                  <div
                                    style={{
                                      position: "absolute",
                                      right: 0,
                                      top: "100%",
                                      marginTop: "4px",
                                      zIndex: 51,
                                      background: "#fff",
                                      borderRadius: "12px",
                                      border: `1px solid ${T.outlineSoft}`,
                                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                      minWidth: "160px",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <button
                                      onClick={() => {
                                        handleDelete(doc.id);
                                        setOpenMenu(null);
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        width: "100%",
                                        padding: "10px 16px",
                                        border: "none",
                                        background: "transparent",
                                        fontFamily: "'Inter', sans-serif",
                                        fontSize: "13px",
                                        color: T.error,
                                        cursor: "pointer",
                                        textAlign: "left",
                                      }}
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.background = "#fef2f2")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.background = "transparent")
                                      }
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                        delete
                                      </span>
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 0 && total > 0 && (
              <div
                style={{
                  padding: "16px 0 0",
                  borderTop: `1px solid rgba(190,201,193,0.2)`,
                  marginTop: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Geist', monospace",
                    fontSize: "12px",
                    color: T.onSurfaceMuted,
                    margin: 0,
                  }}
                >
                  Showing {Math.min((page - 1) * 50 + 1, total)} to {Math.min(page * 50, total)} of {total}{" "}
                  documents
                </p>
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "auto",
                      height: "34px",
                      padding: "0 12px",
                      border: `1px solid rgba(190,201,193,0.5)`,
                      borderRadius: "8px",
                      background: "#fff",
                      color: T.onSurfaceVariant,
                      fontFamily: "'Geist', monospace",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                      opacity: page <= 1 ? 0.4 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let n =
                      totalPages <= 5
                        ? i + 1
                        : page <= 3
                        ? i + 1
                        : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "34px",
                          height: "34px",
                          padding: "0 8px",
                          border: `1px solid ${page === n ? T.primary : "rgba(190,201,193,0.5)"}`,
                          borderRadius: "8px",
                          background: page === n ? T.primary : "#fff",
                          color: page === n ? "#fff" : T.onSurfaceVariant,
                          fontFamily: "'Geist', monospace",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          lineHeight: 1,
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span style={{ padding: "0 4px", color: T.outline }}>…</span>}
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: "auto",
                      height: "34px",
                      padding: "0 12px",
                      border: `1px solid rgba(190,201,193,0.5)`,
                      borderRadius: "8px",
                      background: "#fff",
                      color: T.onSurfaceVariant,
                      fontFamily: "'Geist', monospace",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                      opacity: page >= totalPages ? 0.4 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 101,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}
          onClick={() => setShowUpload(false)}
        >
          <div style={{ ...card, width: "520px", maxWidth: "90vw" }} onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: "'Hanken Grotesk', sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                color: T.onSurface,
                margin: "0 0 20px",
              }}
            >
              Upload Document
            </h2>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>File *</label>
              <input
                type="file"
                onChange={(e) =>
                  setUploadForm((f) => ({ ...f, file: e.target.files?.[0] || null }))
                }
                style={input}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              {uploadForm.file && (
                <div style={{ fontSize: "12px", color: T.onSurfaceMuted, marginTop: "4px" }}>
                  {uploadForm.file.name} ({formatFileSize(uploadForm.file.size)})
                </div>
              )}
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Document Name *</label>
              <input
                value={uploadForm.name}
                onChange={(e) => setUploadForm((f) => ({ ...f, name: e.target.value }))}
                style={input}
                placeholder="e.g. Contract Agreement - Project A"
              />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Description</label>
              <textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm((f) => ({ ...f, description: e.target.value }))}
                style={{ ...input, minHeight: "80px", resize: "vertical" }}
                placeholder="Optional description..."
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={label}>Category *</label>
                <select
                  value={uploadForm.categoryId}
                  onChange={(e) => setUploadForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={input}
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={label}>Project *</label>
                <select
                  value={uploadForm.projectId}
                  onChange={(e) => setUploadForm((f) => ({ ...f, projectId: e.target.value }))}
                  style={input}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={label}>Expiry Date (Optional)</label>
              <input
                type="date"
                value={uploadForm.expiryDate}
                onChange={(e) => setUploadForm((f) => ({ ...f, expiryDate: e.target.value }))}
                style={input}
              />
              <div style={{ fontSize: "11px", color: T.onSurfaceMuted, marginTop: "4px" }}>
                For documents with expiry (permits, licenses, etc.)
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={uploadForm.isClientVisible}
                  onChange={(e) =>
                    setUploadForm((f) => ({ ...f, isClientVisible: e.target.checked }))
                  }
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
                <span>Visible to Client</span>
              </label>
              <div style={{ fontSize: "11px", color: T.onSurfaceMuted, marginTop: "4px", marginLeft: "26px" }}>
                Client can view this document in their portal
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowUpload(false)}
                style={{
                  background: "transparent",
                  border: `1px solid ${T.outlineSoft}`,
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 500,
                  color: T.onSurfaceVariant,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={saving}
                style={{
                  ...btnPrimary,
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
