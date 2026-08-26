import Image from "next/image";
import Link from "next/link";
import ContactForm from "./contact-form";

export function ContactCta({ profile }) {
  const companyName = profile?.companyName || "PT Kita Satu Intersolusi";
  const email = profile?.email || "info@ksi.co.id";
  const phone = profile?.phone || "+62 21 0000 0000";

  return (
    <section className="ks-section ks-contact" id="contact">
      <div className="ks-container">
        <div className="ks-contact-heading" data-reveal>
          <span className="ks-kicker">Start a conversation</span>
          <h2 className="ks-contact-title">
            Bring us your project needs.
            <span>We will help make them clear.</span>
          </h2>
        </div>

        <div className="ks-contact-grid" data-reveal>
          <div className="ks-contact-info">
            <p className="ks-contact-lead">
              Tell us about the location, type of work, target timeline, or
              challenge you are facing. Our team will review the initial needs
              and contact you about the next step.
            </p>

            <dl className="ks-contact-list">
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${email}`}>{email}</a></dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{phone}</dd>
              </div>
              <div>
                <dt>Company</dt>
                <dd>{companyName}</dd>
              </div>
            </dl>

            <div className="ks-contact-promise">
              <span className="material-symbols-outlined" aria-hidden="true">handshake</span>
              <p>
                The initial conversation focuses on your needs and scope
                feasibility, with no obligation to proceed.
              </p>
            </div>
          </div>

          <ContactForm email={email} />
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="ks-final-cta">
      <div className="ks-container ks-final-cta-inner" data-reveal>
        <span className="ks-final-index">SK / 2026</span>
        <h2>A strong project starts with clear control.</h2>
        <a href="#contact" className="ks-btn ks-btn-amber ks-btn-lg">
          Discuss a project
          <span className="material-symbols-outlined" aria-hidden="true">north_east</span>
        </a>
      </div>
    </section>
  );
}

const FOOTER_LINKS = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#workflow" },
  { label: "Smart Konstruksi", href: "#platform" },
  { label: "Contact", href: "#contact" },
];

export function Footer({ profile }) {
  const companyName = profile?.companyName || "PT Kita Satu Intersolusi";
  const email = profile?.email || "info@ksi.co.id";
  const phone = profile?.phone || "+62 21 0000 0000";

  return (
    <footer className="ks-footer">
      <div className="ks-container">
        <div className="ks-footer-manifesto" data-reveal>
          <span className="ks-footer-manifesto-label">FIELD TO FINANCE / ONE SYSTEM</span>
          <div className="ks-footer-manifesto-row">
            <h2>
              Built on site.
              <span>Controlled in one system.</span>
            </h2>
            <a href={`mailto:${email}`} className="ks-footer-contact-link">
              Start a conversation
              <span className="material-symbols-outlined" aria-hidden="true">north_east</span>
            </a>
          </div>
        </div>

        <div className="ks-footer-top" data-reveal>
          <div className="ks-footer-brand">
            <span className="ks-brand-mark ks-brand-mark-footer">
              <Image src="/smartkonstrunksi.svg" alt="" width={40} height={40} />
            </span>
            <div>
              <strong>{companyName}</strong>
              <p>Integrated construction with digital project control.</p>
            </div>
          </div>

          <nav className="ks-footer-nav" aria-label="Footer navigation">
            {FOOTER_LINKS.map((link) => (
              <a href={link.href} key={link.href}>{link.label}</a>
            ))}
          </nav>

          <div className="ks-footer-access">
            <span>Team access</span>
            <Link href="/login">
              Sign in to dashboard
              <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>

          <div className="ks-footer-contact">
            <span>Contact</span>
            <a href={`mailto:${email}`}>{email}</a>
            <p>{phone}</p>
          </div>
        </div>

        <div className="ks-footer-bottom">
          <span>© 2026 {companyName}. All rights reserved.</span>
          <a href={`mailto:${email}`}>{email}</a>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
