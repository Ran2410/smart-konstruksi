// Static marketing sections — no data fetching, no client state.

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
              <span className="ks-about-badge-title">Quality first</span>
              <br />
              <span className="ks-about-badge-sub">Discipline on every phase</span>
            </span>
          </div>
        </div>

        <div>
          <span className="ks-eyebrow">About Us</span>
          <h2 className="ks-h2">Built on quality. Delivered with discipline.</h2>

          <p className="ks-sub" style={{ marginTop: 24 }}>
            PT. Kita Satu Intersolusi (KSI) is a construction services company
            built on experience and discipline. From site development to
            interior fit-out, we take responsibility for every phase —
            planning, execution, and handover — so quality, transparency, and
            accountability are never afterthoughts.
          </p>
          <p className="ks-sub" style={{ marginTop: 16 }}>
            Every KSI project runs on Smart Konstruksi, our in-house ERP —
            budgets, materials, reports, and invoices tracked in one place and
            shared openly with clients.
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
    title: "General Construction",
    desc: "New buildings and civil works, managed end-to-end from site preparation to structural completion.",
  },
  {
    title: "Renovation & Remodeling",
    desc: "Refreshing and reworking existing spaces with minimal disruption to your operations.",
  },
  {
    title: "Engineering & Consultation",
    desc: "Feasibility studies, structural advice, and value engineering before you commit.",
  },
  {
    title: "Project Management",
    desc: "Schedule, cost, and vendor coordination — one accountable team across every phase.",
  },
  {
    title: "Fit-Out & Interior Works",
    desc: "Turnkey interior fit-out for offices, retail, and hospitality spaces.",
  },
  {
    title: "Maintenance & Aftercare",
    desc: "Planned maintenance and warranty care that protects your asset long after handover.",
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

        <div className="ks-services-list">
          {SERVICES.map((s, i) => (
            <div className="ks-service-row" key={s.title}>
              <span className="ks-service-num">
                {String(i + 1).padStart(2, "0")}
              </span>
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
    alt: "Tower crane above a commercial construction site",
    name: "Commercial Construction",
    meta: "Commercial · Jakarta",
  },
  {
    src: "/images/landing/project-building.jpg",
    alt: "Mid-rise building under construction",
    name: "Mid-Rise Development",
    meta: "Residential · Jakarta",
  },
  {
    src: "/images/landing/hero-construction-site.jpg",
    alt: "Workers on an active construction site",
    name: "Site Development",
    meta: "Infrastructure · Jakarta",
  },
  {
    src: "/images/landing/hero-engineer.jpg",
    alt: "Construction engineer reviewing plans on site",
    name: "Field Engineering",
    meta: "Engineering · Jakarta",
  },
  {
    src: "/images/landing/project-interior.jpg",
    alt: "Finished interior space with a modern fit-out",
    name: "Fit-Out & Interior",
    meta: "Interior · Jakarta",
  },
  {
    src: "/images/landing/project-architecture.jpg",
    alt: "Modern architectural design detail",
    name: "Modern Architecture",
    meta: "Architecture · Jakarta",
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
        </div>

        <div className="ks-projects-grid">
          {PROJECT_ITEMS.map((p) => (
            <figure className="ks-project-item" key={p.name}>
              <img src={p.src} alt={p.alt} loading="lazy" />
              <figcaption className="ks-project-overlay">
                <div>
                  <div className="ks-project-head-row">
                    <span className="ks-project-tag">Sample</span>
                    <span className="ks-project-chip">Reference</span>
                  </div>
                  <div className="ks-project-label">{p.name}</div>
                  <div className="ks-project-meta">{p.meta}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Platform / Smart Konstruksi ─────────────────────────────────────────────
// The product section: our in-house ERP, the transparency differentiator.
const PLATFORM_FEATURES = [
  {
    icon: "request_quote",
    title: "Budget & RAB",
    desc: "Itemized budgets with approval workflows — every line agreed before work begins.",
  },
  {
    icon: "inventory_2",
    title: "Materials & Stock",
    desc: "Live stock visibility and low-stock alerts keep the site moving, not stalled.",
  },
  {
    icon: "payments",
    title: "Finance & Invoices",
    desc: "Per-project income, expenses, and invoicing clients can verify in real time.",
  },
  {
    icon: "monitoring",
    title: "Progress & Reports",
    desc: "Structured daily reports and progress shared openly, not lost in email threads.",
  },
];

export function Platform() {
  return (
    <section className="ks-section ks-section-dark" id="platform">
      <div className="ks-container ks-why-grid">
        <div>
          <span className="ks-eyebrow ks-eyebrow-gold">The Platform</span>
          <h2 className="ks-h2 ks-h2-light">
            One system. Every project under control.
          </h2>
          <p className="ks-sub ks-sub-light">
            Smart Konstruksi is the in-house ERP that runs KSI&apos;s projects —
            RAB &amp; budgets, tasks, materials, progress, reports, invoices,
            and documents — one source of truth, shared with clients in real
            time.
          </p>

          <div className="ks-platform-features">
            {PLATFORM_FEATURES.map((f) => (
              <div className="ks-platform-feature" key={f.title}>
                <span className="ks-platform-feature-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                    {f.icon}
                  </span>
                </span>
                <div>
                  <div className="ks-platform-feature-title">{f.title}</div>
                  <p className="ks-platform-feature-desc">{f.desc}</p>
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
            Smart Konstruksi — one system for every project
          </p>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ────────────────────────────────────────────────────────────
// A real construction process, not an app onboarding flow.
const WORKFLOW_STEPS = [
  {
    title: "Plan",
    desc: "Site surveys, scope definition, and design alignment before anything breaks ground.",
  },
  {
    title: "Budget & RAB",
    desc: "Itemized budgets and RAB approval — every cost agreed up front.",
  },
  {
    title: "Execute",
    desc: "Construction managed end-to-end, with crews and materials scheduled.",
  },
  {
    title: "Track Progress",
    desc: "Daily reports and real-time progress visible to you, not just our team.",
  },
  {
    title: "Report & Handover",
    desc: "Documented completion, final reports, and aftercare that continues.",
  },
];

export function HowItWorks() {
  return (
    <section className="ks-section ks-section-sand" id="workflow">
      <div className="ks-container">
        <div className="ks-section-head">
          <span className="ks-eyebrow">How It Works</span>
          <h2 className="ks-h2">A clear process, from plan to handover</h2>
          <p className="ks-sub">
            Five steps keep every project disciplined — and every client in the
            loop from the first sketch to the final walkthrough.
          </p>
        </div>

        <div className="ks-workflow-steps">
          {WORKFLOW_STEPS.map((step, i) => (
            <div className="ks-workflow-step" key={step.title}>
              <span className="ks-workflow-num">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="ks-workflow-title">{step.title}</h3>
                <p className="ks-workflow-desc">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
