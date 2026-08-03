"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Helpers ─────────────────────────────────────────────
function getProgressColor(val: number): string {
  if (val >= 80) return T.success;
  if (val >= 40) return T.primary;
  if (val >= 20) return T.warning;
  return T.error;
}

function getWeatherIcon(weather: string): string {
  const icons: Record<string, string> = {
    Cerah: "☀️",
    Berawan: "⛅",
    Mendung: "☁️",
    "Hujan Ringan": "🌦",
    "Hujan Lebat": "🌧",
    Berkabut: "🌫",
    "Angin Kencang": "💨",
  };
  return icons[weather] || "🌤";
}

// ── Styles ──────────────────────────────────────────────
const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 300,
  padding: "20px",
  animation: "fadeIn 0.2s ease",
};

const modalContentStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  maxWidth: "640px",
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  animation: "fadeInUp 0.25s ease",
};

const lightboxBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 400,
  cursor: "pointer",
  animation: "fadeIn 0.15s ease",
};

// ── Props ───────────────────────────────────────────────
interface ReportDetailProps {
  report: any | null;
  onClose: () => void;
  onEdit?: (report: any) => void;
  onDelete?: (reportId: string) => void;
}

// ── Component ───────────────────────────────────────────
export function ReportDetail({
  report,
  onClose,
  onEdit,
  onDelete,
}: ReportDetailProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Escape key handler ──
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowLeft" && lightboxIndex !== null) {
        e.preventDefault();
        setLightboxIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : prev
        );
      }
      if (e.key === "ArrowRight" && lightboxIndex !== null) {
        e.preventDefault();
        setLightboxIndex((prev) =>
          prev !== null && photos && prev < photos.length - 1 ? prev + 1 : prev
        );
      }
    },
    [lightboxIndex, onClose]
  );

  useEffect(() => {
    if (report || lightboxIndex !== null) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [report, lightboxIndex, handleKeyDown]);

  // ── Derive photos ──
  const photos = useMemo(() => {
    if (!report) return [];
    // photos can be an array of objects with url/id, or an array of strings
    if (Array.isArray(report.photos)) return report.photos;
    if (Array.isArray(report.images)) return report.images;
    if (report._count?.photos && Array.isArray(report.photos)) return report.photos;
    return [];
  }, [report]);

  // ── Not mounted (SSR guard) or no report ──
  if (!mounted || !report) return null;

  // ── Modal body ──
  const modal = (
    <div style={modalBackdropStyle} onClick={onClose}>
      <div
        style={modalContentStyle}
        onClick={(e) => e.stopPropagation()}
        className="report-detail-modal"
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 28px 0",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${T.primaryLight}, ${T.primaryMedium})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "22px", color: T.primary }}
              >
                description
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
                Report Detail
              </h3>
              <p
                style={{
                  fontFamily: T.fontBody,
                  fontSize: "12px",
                  color: T.onSurfaceMuted,
                  margin: "2px 0 0",
                }}
              >
                {new Date(report.reportDate).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: T.surfaceContainerLow,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.onSurfaceMuted,
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.surfaceContainerHigh;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.surfaceContainerLow;
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px" }}
            >
              close
            </span>
          </button>
        </div>

        {/* ── Progress Circle ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            padding: "24px 28px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `conic-gradient(${getProgressColor(report.percentage)} ${report.percentage}%, ${T.surfaceContainerHigh} ${report.percentage}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: T.fontLabel,
                  fontSize: "18px",
                  fontWeight: 700,
                  color: getProgressColor(report.percentage),
                }}
              >
                {report.percentage}%
              </span>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              {report.weather && (
                <span
                  style={{
                    fontFamily: T.fontLabel,
                    fontSize: "12px",
                    fontWeight: 600,
                    color: T.outline,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {getWeatherIcon(report.weather)} {report.weather}
                </span>
              )}
              <span
                style={{
                  fontFamily: T.fontBody,
                  fontSize: "12px",
                  color: T.onSurfaceMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "14px" }}
                >
                  person
                </span>
                oleh {report.reporter?.name || "—"}
              </span>
            </div>
            {report.description && (
              <p
                style={{
                  fontFamily: T.fontBody,
                  fontSize: "14px",
                  color: T.onSurfaceVariant,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {report.description}
              </p>
            )}
          </div>
        </div>

        {/* ── Photo Gallery ── */}
        {photos.length > 0 && (
          <div style={{ padding: "0 28px 24px" }}>
            <p
              style={{
                fontFamily: T.fontLabel,
                fontSize: "11px",
                fontWeight: 600,
                color: T.onSurfaceMuted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 10px",
              }}
            >
              Photos ({photos.length})
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
            >
              {photos.map((photo: any, idx: number) => {
                const src =
                  typeof photo === "string"
                    ? photo
                    : photo.url || (photo.id ? `/api/files/${photo.id}` : "");
                return (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      aspectRatio: "1",
                      background: T.surfaceContainerLow,
                      border: `1px solid ${T.outlineSoft}33`,
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onClick={() => setLightboxIndex(idx)}
                  >
                    <img
                      src={src}
                      alt={`Report photo ${idx + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {(onEdit || onDelete) && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "16px 28px 24px",
              borderTop: `1px solid ${T.outlineSoft}33`,
            }}
          >
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(report);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  background: T.primaryLight,
                  color: T.primary,
                  border: `1px solid ${T.primaryMedium}`,
                  borderRadius: "10px",
                  fontFamily: T.fontLabel,
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = T.primaryMedium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = T.primaryLight;
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  edit
                </span>
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  onDelete(report.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  background: T.errorLight,
                  color: T.error,
                  border: "none",
                  borderRadius: "10px",
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
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  delete
                </span>
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          style={lightboxBackdropStyle}
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.4)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              zIndex: 410,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "24px" }}
            >
              close
            </span>
          </button>

          {/* Previous arrow */}
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
              style={{
                position: "fixed",
                left: "24px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                zIndex: 410,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.4)";
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "28px" }}
              >
                chevron_left
              </span>
            </button>
          )}

          {/* Next arrow */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
              style={{
                position: "fixed",
                right: "24px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                zIndex: 410,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.4)";
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "28px" }}
              >
                chevron_right
              </span>
            </button>
          )}

          {/* Counter */}
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "9999px",
              padding: "6px 16px",
              fontFamily: T.fontLabel,
              fontSize: "13px",
              color: "#fff",
              zIndex: 410,
              pointerEvents: "none",
            }}
          >
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "85vw",
              maxHeight: "85vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 405,
            }}
          >
            {(() => {
              const photo = photos[lightboxIndex];
              const src =
                typeof photo === "string"
                  ? photo
                  : photo.url ||
                    (photo.id ? `/api/files/${photo.id}` : "");
              return (
                <img
                  src={src}
                  alt={`Photo ${lightboxIndex + 1}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "85vh",
                    borderRadius: "12px",
                    objectFit: "contain",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
                    animation: "fadeIn 0.15s ease",
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}
