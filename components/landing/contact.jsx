import ContactForm from "./contact-form";

const CONTACT_DETAILS = [
  {
    icon: "mail",
    label: "Email",
    value: "info@ksi.co.id",
    href: "mailto:info@ksi.co.id",
  },
  {
    icon: "call",
    label: "Phone",
    // Placeholder on purpose — the real number is to be confirmed by the company.
    value: "+62 21 0000 0000",
    href: null,
  },
  {
    icon: "domain",
    label: "Company",
    value: "PT. Kita Satu Intersolusi",
    href: null,
  },
];

export function ContactCta() {
  return (
    <section className="ks-section ks-contact" id="contact">
      <div className="ks-container ks-contact-grid">
        <div>
          <span className="ks-eyebrow">Contact</span>
          <h2 className="ks-contact-title">Let&apos;s build something together.</h2>
          <p className="ks-contact-sub">
            Tell us about your project — a new build, a renovation, or a site
            that needs proper management. We&apos;ll come back with a clear plan
            and an honest estimate.
          </p>

          <div className="ks-contact-cta">
            <a
              href="mailto:info@ksi.co.id"
              className="ks-btn ks-btn-primary ks-btn-lg"
            >
              Contact Us
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                mail
              </span>
            </a>
            <a href="#contact-form" className="ks-btn ks-btn-ghost ks-btn-lg">
              Request a Consultation
            </a>
          </div>

          <div className="ks-contact-details">
            {CONTACT_DETAILS.map((d) => (
              <div className="ks-contact-detail" key={d.label}>
                <span className="ks-contact-detail-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {d.icon}
                  </span>
                </span>
                <span>
                  <span className="ks-contact-detail-label">{d.label}</span>
                  <br />
                  {d.href ? (
                    <a href={d.href} className="ks-contact-detail-value">
                      {d.value}
                    </a>
                  ) : (
                    <span className="ks-contact-detail-value">{d.value}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}

// ── Final CTA band ───────────────────────────────────────────────────────────
export function FinalCta() {
  return (
    <section className="ks-section ks-final-cta">
      <div className="ks-container">
        <span className="ks-eyebrow ks-eyebrow-gold">Smart Konstruksi</span>
        <h2
          className="ks-h2 ks-h2-light"
          style={{ maxWidth: 620, margin: "18px auto 0" }}
        >
          Ready to build with better control?
        </h2>
        <p
          className="ks-sub ks-sub-light"
          style={{ maxWidth: 560, margin: "20px auto 0" }}
        >
          From planning and budgeting to execution and reporting, keep your
          construction project under control with Smart Konstruksi.
        </p>
        <div className="ks-final-cta-cta">
          <a href="#contact" className="ks-btn ks-btn-white ks-btn-lg">
            Request a Consultation
          </a>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLS = [
  {
    title: "Services",
    links: [
      { label: "General Construction", href: "#services" },
      { label: "Renovation & Remodeling", href: "#services" },
      { label: "Project Management", href: "#services" },
      { label: "Fit-Out & Interior Works", href: "#services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#about" },
      { label: "Our Work", href: "#projects" },
      { label: "Platform", href: "#platform" },
      { label: "How It Works", href: "#workflow" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Client Portal", href: "/login" },
      { label: "Back to Top", href: "#top" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="ks-footer">
      <div className="ks-container" style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div className="ks-footer-grid">
          <div className="ks-footer-brand">
            <span className="ks-brand-mark">
              <img src="/smartkonstrunksi.svg" alt="" width={40} height={40} />
            </span>
            <span className="ks-footer-name">Kita Satu Intersolusi</span>
            <p className="ks-footer-tagline">
              Quality construction, delivered with transparency and discipline —
              on schedule, on budget.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <h4 className="ks-footer-col-title">{col.title}</h4>
              <ul className="ks-footer-links">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="ks-footer-link">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ks-footer-bottom">
          <span>© 2026 PT. Kita Satu Intersolusi. All rights reserved.</span>
          <span>Smart Konstruksi — in-house project management</span>
        </div>
      </div>
    </footer>
  );
}
