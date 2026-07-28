"use client";

import { useState, useRef, useCallback } from "react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

// ── Props ───────────────────────────────────────────────
interface PhotoUploadProps {
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

// ── Component ───────────────────────────────────────────
export function PhotoUpload({ value, onChange, disabled = false }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 10;
  const remaining = MAX_PHOTOS - value.length;

  // ── Upload handler ──
  const uploadFiles = useCallback(
    async (files: FileList) => {
      if (disabled || uploading) return;
      if (remaining <= 0) return;

      const toUpload = Array.from(files).slice(0, remaining);
      if (toUpload.length === 0) return;

      setUploading(true);
      const newIds: string[] = [];

      try {
        for (const file of toUpload) {
          const formData = new FormData();
          formData.append("files", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          if (!res.ok) throw new Error("Upload failed");

          const json = await res.json();
          const uploaded = json.data?.[0] || json;
          if (uploaded?.id) {
            newIds.push(uploaded.id);
          }
        }

        onChange([...value, ...newIds]);
      } catch (err) {
        console.error("Upload error:", err);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, remaining, disabled, uploading]
  );

  // ── Drag / Drop handlers ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        uploadFiles(e.target.files);
        // Reset input so same file can be re-selected
        e.target.value = "";
      }
    },
    [uploadFiles]
  );

  // ── Remove handler ──
  const handleRemove = useCallback(
    (id: string) => {
      onChange(value.filter((v) => v !== id));
    },
    [value, onChange]
  );

  // ── Styles ──
  const dropZoneStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "28px 20px",
    border: `2px dashed ${dragOver ? T.primary : T.outlineSoft}`,
    borderRadius: "12px",
    background: dragOver ? T.primaryLight : T.surfaceContainerLow,
    cursor: disabled || remaining <= 0 ? "not-allowed" : "pointer",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.5 : 1,
    position: "relative",
  };

  const thumbnailStyle: React.CSSProperties = {
    width: "80px",
    height: "80px",
    borderRadius: "10px",
    objectFit: "cover",
    border: `1px solid ${T.outlineSoft}44`,
    display: "block",
  };

  const removeBtnStyle: React.CSSProperties = {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: T.error,
    border: "2px solid #fff",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "12px",
    lineHeight: 1,
    padding: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    zIndex: 2,
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        style={dropZoneStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && remaining > 0 && !uploading) {
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleChange}
          disabled={disabled}
        />

        {uploading ? (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "32px",
              color: T.primary,
              animation: "spin 1s linear infinite",
            }}
          >
            progress_activity
          </span>
        ) : (
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "32px", color: T.onSurfaceMuted }}
          >
            cloud_upload
          </span>
        )}

        {uploading ? (
          <span
            style={{
              fontFamily: T.fontLabel,
              fontSize: "13px",
              color: T.primary,
              fontWeight: 600,
            }}
          >
            Uploading…
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: T.fontBody,
                fontSize: "14px",
                color: T.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              {remaining > 0
                ? `Click or drag photos here (${remaining} of ${MAX_PHOTOS} remaining)`
                : "Maximum 10 photos reached"}
            </span>
            <span
              style={{
                fontFamily: T.fontLabel,
                fontSize: "11px",
                color: T.onSurfaceMuted,
              }}
            >
              JPG, PNG, WEBP — Max 10 photos
            </span>
          </>
        )}
      </div>

      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "14px",
          }}
        >
          {value.map((id) => (
            <div
              key={id}
              style={{ position: "relative", flexShrink: 0 }}
            >
              <img
                src={id.startsWith("http") ? id : `/api/files/${id}`}
                alt="Upload preview"
                style={thumbnailStyle}
                onError={(e) => {
                  // Fallback if image fails to load
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <button
                type="button"
                style={removeBtnStyle}
                onClick={() => handleRemove(id)}
                disabled={disabled}
                title="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
