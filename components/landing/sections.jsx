// Static marketing sections — no data fetching, no client state.

// ── Stats bar ───────────────────────────────────────────────────────────────
// Honest, verifiable facts about the company's in-house management system.
// No fabricated "100+ projects" style numbers — track-record figures are left
// for the company to confirm.
const STATS = [
  {
    icon: "workspace_premium",
    value: "12",
    label: "Core Modules",
    note: "Planning, budgeting, and operations under one roof",
  },
  {
    icon: "groups",
    value: "16+",
    label: "Team Roles",
    note: "Owners, managers, site teams, and clients",
  },
  {
    icon: "bar_chart",
    value: "Real-time",
    label: "Reporting",
    note: "Budgets, stock, and progress, always current",
  },
  {
    icon: "domain",
    value: "Multi-branch",
    label: "Support",
    note: "Projects managed across locations",
  },
];

export function StatsBar() {
  return (
    <section className="ks-stats" aria-label="Company capabilities">
      <div className="ks-container">
        <div className="ks-stats-grid">
          {STATS.map((s) => (
            <div className="ks-stat-card" key={s.label}>
              <div className="ks-stat-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  {s.icon}
                </span>
              </div>
              <div className="ks-stat-value">{s.value}</div>
              <div className="ks-stat-label">{s.label}</div>
              <p className="ks-stat-note">{s.note}</p>
            </div>
          ))}
        </div>
        <p className="ks-stats-foot">
          * Capabilities of Smart Konstruksi, our in-house project-management
          system. Company track-record figures to be confirmed.
        </p>
      </div>
    </section>
  );
}

// ── About / Who We Are ──────────────────────────────────────────────────────
const ABOUT_VALUES = [
  "Safety-first site management",
  "Transparent budgeting & reporting",
  "On-time, on-budget delivery",
  "Responsible project ownership",
];

export function About() {
  return (
    <section className="ks-section" id="about">
      <div className="ks-container ks-about-grid">
        <div className="ks-about-media">
          <img
            src="/images/landing/hero-blueprint.jpg"
            alt="Architectural blueprint on a construction site table"
          />
          <div className="ks-about-badge">
            <span className="ks-about-badge-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                verified
              </span>
            </span>
            <span>
              <span className="ks-about-badge-title">Trusted by clients</span>
              <br />
              <span className="ks-about-badge-sub">Committed to quality delivery</span>
            </span>
          </div>
        </div>

        <div>
          <span className="ks-eyebrow">About Us</span>
          <h2 className="ks-h2">Built on quality. Delivered with discipline.</h2>

          <p className="ks-sub" style={{ marginTop: 24 }}>
            PT. Kita Satu Intersolusi (KSI) is a construction services company
            focused on doing quality work, on schedule and on budget. From site
            development to interior fit-out, we take responsibility for every
            phase — planning, execution, and handover.
          </p>
          <p className="ks-sub" style={{ marginTop: 16 }}>
            We believe great construction is built on transparency. That is why
            every KSI project runs on our own management system, Smart
            Konstruksi — budgets, materials, daily reports, and invoices tracked
            in real time and shared openly with our clients.
          </p>

          <div className="ks-about-values">
            {ABOUT_VALUES.map((v) => (
              <div className="ks-about-value" key={v}>
                <span className="material-symbols-outlined">check_circle</span>
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Services ────────────────────────────────────────────────────────────────
// Generic, plausible service list — the client will confirm the real scope.
const SERVICES = [
  {
    icon: "construction",
    title: "General Construction",
    desc: "New buildings and civil works managed end-to-end, from site preparation to structural completion.",
  },
  {
    icon: "handyman",
    title: "Renovation & Remodeling",
    desc: "Refresh and rework existing spaces with minimal disruption to your operations.",
  },
  {
    icon: "engineering",
    title: "Engineering & Consultation",
    desc: "Feasibility studies, structural consultation, and value-engineering advice before you commit.",
  },
  {
    icon: "architecture",
    title: "Project Management",
    desc: "Schedule, cost, and vendor coordination — one accountable team across every phase.",
  },
  {
    icon: "hardware",
    title: "Fit-Out & Interior Works",
    desc: "Turnkey interior fit-out for offices, retail, and hospitality spaces.",
  },
  {
    icon: "roofing",
    title: "Maintenance & Aftercare",
    desc: "Planned maintenance and warranty care that keeps your asset performing long after handover.",
  },
];

export function Services() {
  return (
    <section className="ks-section ks-section-sand" id="services">
      <div className="ks-container">
        <div className="ks-section-head">
          <span className="ks-eyebrow">What We Do</span>
          <h2 className="ks-h2">Full-service construction, under one roof</h2>
          <p className="ks-sub">
            One accountable team from the first sketch to the final walkthrough —
            so nothing is lost between contractors, consultants, and vendors.
          </p>
        </div>

        <div className="ks-services-grid">
          {SERVICES.map((s) => (
            <div className="ks-service-card" key={s.title}>
              <div className="ks-service-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                  {s.icon}
                </span>
              </div>
              <h3 className="ks-service-title">{s.title}</h3>
              <p className="ks-service-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Projects gallery ────────────────────────────────────────────────────────
// Sample photography — NOT real client projects. The note below keeps that honest.
const PROJECT_ITEMS = [
  {
    src: "/images/landing/hero-crane.jpg",
    tag: "Sample",
    label: "Commercial Construction",
  },
  {
    src: "/images/landing/project-building.jpg",
    tag: "Sample",
    label: "Mid-Rise Development",
  },
  {
    src: "/images/landing/hero-construction-site.jpg",
    tag: "Sample",
    label: "Site Development",
  },
  {
    src: "/images/landing/hero-engineer.jpg",
    tag: "Sample",
    label: "Field Engineering",
  },
];

export function Projects() {
  return (
    <section className="ks-section" id="projects">
      <div className="ks-container">
        <div className="ks-projects-head">
          <div>
            <span className="ks-eyebrow">Our Work</span>
            <h2 className="ks-h2" style={{ marginBottom: 0 }}>
              A look at how we build
            </h2>
          </div>
          <p className="ks-projects-note">
            Sample photos — real project galleries to be added
          </p>
        </div>

        <div className="ks-projects-grid">
          {PROJECT_ITEMS.map((p) => (
            <figure className="ks-project-item" key={p.label}>
              <img src={p.src} alt={p.label} loading="lazy" />
              <figcaption className="ks-project-overlay">
                <div>
                  <div className="ks-project-tag">{p.tag}</div>
                  <div className="ks-project-label">{p.label}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why Us / The Smart Konstruksi difference ────────────────────────────────
// Framed as OUR operational discipline — the in-house system is the differentiator.
const WHY_FEATURES = [
  {
    icon: "request_quote",
    title: "Budget & RAB Control",
    desc: "Detailed budgets (RAB) with approval workflows, so every line item is agreed before work begins.",
  },
  {
    icon: "hardware",
    title: "Material & Stock Tracking",
    desc: "Real-time stock visibility and low-stock alerts keep the site moving, not stalled.",
  },
  {
    icon: "receipt_long",
    title: "Finance & Invoices",
    desc: "Income, expenses, and invoicing tracked per project — clients see exactly what they pay for.",
  },
  {
    icon: "description",
    title: "Daily Reports",
    desc: "Structured daily reports keep owners, managers, and clients aligned every single day.",
  },
];

export function WhyUs() {
  return (
    <section className="ks-section ks-section-dark" id="why">
      <div className="ks-container ks-why-grid">
        <div>
          <span className="ks-eyebrow ks-eyebrow-gold">How We Work</span>
          <h2 className="ks-h2 ks-h2-light">
            Every project tracked. Every rupiah accounted for.
          </h2>
          <p className="ks-sub ks-sub-light">
            We built Smart Konstruksi — our in-house project-management system —
            so our team works with a discipline most contractors can only claim.
            Every budget line, material order, invoice, and daily report lives in
            one place, and our clients see it in real time.
          </p>

          <div className="ks-why-features">
            {WHY_FEATURES.map((f) => (
              <div className="ks-why-feature" key={f.title}>
                <span className="ks-why-feature-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {f.icon}
                  </span>
                </span>
                <div>
                  <div className="ks-why-feature-title">{f.title}</div>
                  <p className="ks-why-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ks-why-visual">
          <div className="ks-why-frame">
            <div className="ks-why-frame-bar">
              <span className="ks-why-frame-dot" style={{ background: "#ff5f57" }} />
              <span className="ks-why-frame-dot" style={{ background: "#febc2e" }} />
              <span className="ks-why-frame-dot" style={{ background: "#28c840" }} />
              <span className="ks-why-frame-url">Smart Konstruksi — Project Dashboard</span>
            </div>
            <div className="ks-why-frame-body">
              <img
                src="/dashboard-preview.png"
                alt="Smart Konstruksi project dashboard preview"
                loading="lazy"
              />
              <div className="ks-why-frame-fade" aria-hidden />
            </div>
          </div>
          <p className="ks-why-caption">
            Smart Konstruksi — our in-house project-management system
          </p>
        </div>
      </div>
    </section>
  );
}
