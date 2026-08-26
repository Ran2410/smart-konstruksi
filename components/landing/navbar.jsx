import Image from "next/image";
import Link from "next/link";
import MobileMenu from "./mobile-menu";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#workflow", label: "How it works" },
  { href: "#platform", label: "Platform" },
];

export default function LandingNav() {
  return (
    <header className="ks-nav">
      <div className="ks-container ks-nav-inner">
        <a href="#top" className="ks-brand" aria-label="Kita Satu Intersolusi, back to top">
          <span className="ks-brand-mark">
            <Image src="/smartkonstrunksi.svg" alt="" width={38} height={38} />
          </span>
          <span className="ks-brand-copy">
            <strong>Kita Satu</strong>
            <span>Intersolusi</span>
          </span>
        </a>

        <nav className="ks-nav-links" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="ks-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ks-nav-actions">
          <Link href="/login" className="ks-nav-signin">
            Sign in
          </Link>
          <a href="#contact" className="ks-btn ks-btn-amber">
            Discuss a project
          </a>
        </div>

        <MobileMenu />
      </div>
    </header>
  );
}
