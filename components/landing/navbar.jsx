import Link from "next/link";
import MobileMenu from "./mobile-menu";

const NAV_LINKS = [
  { href: "#services", label: "Services" },
  { href: "#projects", label: "Projects" },
  { href: "#platform", label: "Platform" },
  { href: "#contact", label: "Contact" },
];

// The nav is positioned absolutely over the hero and scrolls away with the
// page (no sticky behavior), so it always renders transparent with white text.
export default function LandingNav() {
  return (
    <header className="ks-nav">
      <div className="ks-container ks-nav-inner">
        <a href="#top" className="ks-brand" aria-label="PT. Kita Satu Intersolusi — home">
          <span className="ks-brand-mark">
            {/* Brand mark sits on a white chip so it reads on the dark hero */}
            <img src="/smartkonstrunksi.svg" alt="" width={40} height={40} />
          </span>
          <span className="ks-brand-name" style={{ color: "#ffffff" }}>
            Kita Satu Intersolusi
          </span>
        </a>

        <nav className="ks-nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="ks-nav-link"
              style={{ color: "#ffffff" }}
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
              color: "#ffffff",
              borderColor: "rgba(255,255,255,0.55)",
            }}
          >
            Sign In
          </Link>
          <a href="#contact" className="ks-btn ks-btn-primary">
            Contact Us
          </a>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
