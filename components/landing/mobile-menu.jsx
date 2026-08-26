"use client";

import { useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#workflow", label: "How it works" },
  { href: "#platform", label: "Platform" },
  { href: "#contact", label: "Contact" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="ks-mobile-menu">
      <button
        type="button"
        className="ks-menu-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="ks-mobile-nav"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="material-symbols-outlined" aria-hidden="true">{open ? "close" : "menu"}</span>
      </button>

      {open ? (
        <>
          <button className="ks-menu-scrim" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="ks-menu-panel" id="ks-mobile-nav">
            <span className="ks-menu-index">NAVIGATION / SK</span>
            {LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>
            ))}
            <div className="ks-menu-divider" />
            <Link href="/login" onClick={() => setOpen(false)}>Sign in to dashboard</Link>
            <a href="#contact" className="ks-menu-cta" onClick={() => setOpen(false)}>Discuss a project</a>
          </div>
        </>
      ) : null}
    </div>
  );
}
