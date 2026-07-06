"use client";

import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const T = {
  primary: "#004f35",
  primaryLight: "rgba(0,79,53,0.08)",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  if (current <= 3) {
    pages.push(1, 2, 3, 4, "...", total);
  } else if (current >= total - 2) {
    pages.push(1, "...", total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }

  return pages;
}

function getShowingText(page: number, limit: number, total: number): string {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}-${end} of ${total} records`;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  const baseBtnStyle: React.CSSProperties = {
    height: 36,
    minWidth: 36,
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 10px",
    cursor: "pointer",
    border: "1px solid",
    borderColor: T.outlineSoft,
    background: T.surfaceCard,
    color: T.outline,
    fontFamily: T.fontLabel,
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s ease",
    outline: "none",
  };

  const activeStyle: React.CSSProperties = {
    ...baseBtnStyle,
    background: T.primary,
    color: "#ffffff",
    borderColor: T.primary,
    cursor: "default",
  };

  const disabledStyle: React.CSSProperties = {
    ...baseBtnStyle,
    opacity: 0.4,
    cursor: "not-allowed",
  };

  const ellipsisStyle: React.CSSProperties = {
    height: 36,
    minWidth: 36,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: T.fontLabel,
    fontSize: 13,
    color: T.outline,
    cursor: "default",
    userSelect: "none",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 0",
      }}
    >
      <span
        style={{
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.outline,
        }}
      >
        {getShowingText(page, limit, total)}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* Previous */}
        <button
          onClick={() => {
            if (page > 1) onPageChange(page - 1);
          }}
          disabled={page <= 1}
          style={page <= 1 ? disabledStyle : baseBtnStyle}
          onMouseEnter={(e) => {
            if (page > 1) {
              e.currentTarget.style.background = T.primaryLight;
            }
          }}
          onMouseLeave={(e) => {
            if (page > 1) {
              e.currentTarget.style.background = T.surfaceCard;
            }
          }}
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} style={ellipsisStyle}>
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => {
                if (p !== page) onPageChange(p as number);
              }}
              style={p === page ? activeStyle : baseBtnStyle}
              onMouseEnter={(e) => {
                if (p !== page) {
                  e.currentTarget.style.background = T.primaryLight;
                }
              }}
              onMouseLeave={(e) => {
                if (p !== page) {
                  e.currentTarget.style.background = T.surfaceCard;
                }
              }}
            >
              {p}
            </button>
          )
        )}

        {/* Next */}
        <button
          onClick={() => {
            if (page < totalPages) onPageChange(page + 1);
          }}
          disabled={page >= totalPages}
          style={page >= totalPages ? disabledStyle : baseBtnStyle}
          onMouseEnter={(e) => {
            if (page < totalPages) {
              e.currentTarget.style.background = T.primaryLight;
            }
          }}
          onMouseLeave={(e) => {
            if (page < totalPages) {
              e.currentTarget.style.background = T.surfaceCard;
            }
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
