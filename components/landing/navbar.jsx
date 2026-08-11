"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MobileMenu from "./mobile-menu";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#platform", label: "Platform" },
  { href: "#contact", label: "Contact" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // At the top of the page the nav sits transparent over the dark hero photo,
  // so links are white; once scrolled it becomes a solid warm bar with dark text.
  const ink = "var(--ks-ink)";
  const white = "#ffffff";

  return (
    <header
      className="ks-nav"
      style={{
        background: scrolled ? "rgba(247,245,240,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid var(--ks-border)" : "none",
        boxShadow: scrolled ? "0 8px 30px rgba(27,24,19,0.08)" : "none",
      }}
    >
      <div className="ks-container ks-nav-inner">
        <a href="#top" className="ks-brand" aria-label="PT. Kita Satu Intersolusi — home">
          <span className="ks-brand-mark">
            {/* Brand mark sits on a white chip so it reads on both dark and light states */}
            <img src="/smartkonstrunksi.svg" alt="" width={40} height={40} />
          </span>
          <span className="ks-brand-name" style={{ color: scrolled ? ink : white }}>
            Kita Satu Intersolusi
          </span>
        </a>

        <nav className="ks-nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="ks-nav-link"
              style={{ color: scrolled ? ink : white }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ks-nav-cta">
          <Link
            href="/login"
            className="ks-btn"
            style={{
              background: "transparent",
              color: scrolled ? ink : white,
              borderColor: scrolled ? "var(--ks-border)" : "rgba(255,255,255,0.55)",
            }}
          >
            Sign In
          </Link>
          <a href="#contact" className="ks-btn ks-btn-primary">
            Contact Us
          </a>
        </div>

        <MobileMenu scrolled={scrolled} />
      </div>
    </header>
  );
}
