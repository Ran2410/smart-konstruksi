"use client";

import { useState } from "react";
import Link from "next/link";
import { FONT_LABEL, SHADOWS } from "@/lib/design-tokens";

const LINKS = [
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#platform", label: "Platform" },
  { href: "#contact", label: "Contact" },
];

export default function MobileMenu({ scrolled = false }) {
  const [open, setOpen] = useState(false);
  const iconColor = scrolled ? "var(--ks-ink)" : "#ffffff";

  return (
    <div className="ks-mobile-menu" style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: 10,
          background: open
            ? scrolled
              ? "var(--ks-sand)"
              : "rgba(255,255,255,0.16)"
            : "transparent",
          border: scrolled
            ? `1px solid ${open ? "var(--ks-ink)" : "var(--ks-border)"}`
            : `1px solid ${open ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)"}`,
          cursor: "pointer",
          color: iconColor,
          transition: "all 0.15s ease",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {open ? "close" : "menu"}
        </span>
      </button>

      {open && (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 55 }}
          />
          <div
            role="menu"
            style={{
              position: "absolute",
              top: 52,
              right: 0,
              width: 264,
              background: "#ffffff",
              border: "1px solid var(--ks-border)",
              borderRadius: 16,
              boxShadow: SHADOWS.modal,
              padding: 12,
              zIndex: 60,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontFamily: FONT_LABEL,
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ks-ink)",
                  textDecoration: "none",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--ks-sand)";
                  e.currentTarget.style.color = "var(--ks-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--ks-ink)";
                }}
              >
                {l.label}
              </a>
            ))}
            <div style={{ borderTop: "1px solid var(--ks-border)", margin: "8px 0" }} />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="ks-btn ks-btn-ghost"
            >
              Sign In
            </Link>
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="ks-btn ks-btn-primary"
            >
              Contact Us
            </a>
          </div>
        </>
      )}
    </div>
  );
}
