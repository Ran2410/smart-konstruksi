import Image from "next/image";
import blueprintImage from "@/public/images/landing/hero-blueprint.jpg";
import craneImage from "@/public/images/landing/hero-crane.jpg";
import buildingImage from "@/public/images/landing/project-building.jpg";
import interiorImage from "@/public/images/landing/project-interior.jpg";
import dashboardImage from "@/public/dashboard-preview.png";

const PRINCIPLES = [
  {
    code: "COST",
    title: "Costs are clear from day one",
    desc: "Budgets, expenses, and approvals are recorded so decisions never depend on memory or scattered conversations.",
  },
  {
    code: "FIELD",
    title: "Site conditions stay visible",
    desc: "Progress, tasks, materials, and daily reports flow through the same monitoring process.",
  },
  {
    code: "OWNER",
    title: "Accountability stays clear",
    desc: "One team carries the project from planning and execution through documented handover.",
  },
];

export function About() {
  return (
    <section className="ks-section ks-about" id="about">
      <div className="ks-container">
        <div className="ks-about-heading" data-reveal>
          <div>
            <span className="ks-kicker">How we build</span>
            <h2 className="ks-display">
              Physical work on site.
              <span>Project control in one place.</span>
            </h2>
          </div>
          <div className="ks-about-summary">
            <span>CONSTRUCTION + PROJECT SYSTEM</span>
            <p className="ks-lead">
              PT Kita Satu Intersolusi combines disciplined construction
              execution with an operating system that makes project information
              easier to see, verify, and act on.
            </p>
          </div>
        </div>

        <div className="ks-about-body" data-reveal>
          <div className="ks-blueprint-visual">
            <Image
              src={blueprintImage}
              alt="Construction drawings and project safety equipment"
              fill
              sizes="(max-width: 900px) 100vw, 48vw"
            />
            <div className="ks-blueprint-label">
              <span>PLAN / BUILD / CONTROL</span>
              <strong>One operating flow</strong>
            </div>
          </div>

          <div className="ks-principles">
            {PRINCIPLES.map((item) => (
              <article className="ks-principle" key={item.code}>
                <span className="ks-principle-code">{item.code}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const CAPABILITIES = [
  {
    image: craneImage,
    code: "01 / BUILD",
    title: "General construction",
    desc: "Building and civil works managed from site preparation through structural completion.",
    alt: "Workers and a crane on a construction site",
  },
  {
    image: interiorImage,
    code: "02 / IMPROVE",
    title: "Renovation & fit-out",
    desc: "Space upgrades coordinated to protect quality while minimizing disruption to on-site activity.",
    alt: "Modern completed interior space",
  },
  {
    image: buildingImage,
    code: "03 / CONTROL",
    title: "Engineering & project management",
    desc: "Scope, cost, schedule, vendor, and reporting coordination under one line of accountability.",
    alt: "Building structure and cranes on a project site",
  },
];

export function Services() {
  return (
    <section className="ks-section ks-capabilities" id="services">
      <div className="ks-container">
        <div className="ks-section-intro" data-reveal>
          <div>
          <span className="ks-kicker ks-kicker-light">Capabilities</span>
            <h2 className="ks-display ks-display-light">
              From defined scope to
              <span>coordinated delivery.</span>
            </h2>
          </div>
          <p className="ks-lead ks-lead-light">
            One coordination path for core work, site changes, and the
            information needed to keep the project moving.
          </p>
        </div>

        <div className="ks-capability-list">
          {CAPABILITIES.map((item, index) => (
            <article className="ks-capability" key={item.code} data-reveal data-reveal-delay={index + 1}>
              <div className="ks-capability-image">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 760px) 100vw, 34vw"
                />
              </div>
              <span className="ks-capability-code">{item.code}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>

        <div className="ks-scope-note" data-reveal>
          <span className="material-symbols-outlined" aria-hidden="true">architecture</span>
          <p>
            Every project begins with a review of its needs and scope. Our team
            will help determine the right delivery approach.
          </p>
          <a href="#contact">Discuss your project</a>
        </div>
      </div>
    </section>
  );
}

const WORKFLOW_STEPS = [
  {
    code: "01",
    title: "Understand the need",
    desc: "Goals, site conditions, scope, and project constraints are aligned first.",
  },
  {
    code: "02",
    title: "Plan & budget",
    desc: "Work methods, material needs, schedule, and costs are set out in a clear working plan.",
  },
  {
    code: "03",
    title: "Coordinate execution",
    desc: "Teams, vendors, tasks, and site changes are managed through one operating flow.",
  },
  {
    code: "04",
    title: "Monitor & report",
    desc: "Progress, costs, documents, and daily reports are updated through Smart Konstruksi.",
  },
  {
    code: "05",
    title: "Inspect & hand over",
    desc: "Completed work is verified and documented before the project is closed.",
  },
];

export function HowItWorks() {
  return (
    <section className="ks-section ks-workflow" id="workflow">
      <div className="ks-container ks-workflow-grid">
        <div className="ks-workflow-intro" data-reveal>
          <span className="ks-kicker">Project workflow</span>
          <h2 className="ks-display">
            Every stage has a
            <span>basis for decisions.</span>
          </h2>
          <p className="ks-lead">
            A visible process helps teams reduce miscommunication and keeps
            every decision connected to actual site conditions.
          </p>
          <a href="#platform" className="ks-text-link">
            See how the system supports the process
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </div>

        <ol className="ks-workflow-list">
          {WORKFLOW_STEPS.map((step, index) => (
            <li className="ks-workflow-step" key={step.code} data-reveal data-reveal-delay={(index % 3) + 1}>
              <span className="ks-workflow-code">{step.code}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const PLATFORM_FEATURES = [
  { icon: "request_quote", label: "Budgets, cost plans, and approvals" },
  { icon: "inventory_2", label: "Materials and stock availability" },
  { icon: "task_alt", label: "Tasks, progress, and daily reports" },
  { icon: "payments", label: "Transactions, invoices, and project documents" },
];

export function Platform() {
  return (
    <section className="ks-section ks-platform" id="platform">
      <div className="ks-platform-gridline" aria-hidden="true" />
      <div className="ks-container">
        <div className="ks-platform-heading" data-reveal>
          <div>
            <span className="ks-kicker ks-kicker-amber">Smart Konstruksi</span>
            <h2 className="ks-display ks-display-light">
              One control center.
              <span>Every project stays visible.</span>
            </h2>
          </div>
          <div className="ks-platform-copy">
            <p>
              Smart Konstruksi is our in-house system connecting cost data,
              field work, materials, finance, and project documents.
            </p>
            <div className="ks-platform-features">
              {PLATFORM_FEATURES.map((feature) => (
                <div className="ks-platform-feature" key={feature.label}>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="ks-dashboard-stage" data-reveal>
          <div className="ks-dashboard-toolbar">
            <div>
              <span className="ks-live-dot" aria-hidden="true" />
              <span>SMART KONSTRUKSI / PROJECT VIEW</span>
            </div>
            <span>CONNECTED DATA</span>
          </div>
          <div className="ks-dashboard-screen">
            <Image
              src={dashboardImage}
              alt="Smart Konstruksi dashboard interface"
              sizes="(max-width: 1200px) 100vw, 1120px"
              placeholder="blur"
            />
          </div>
          <div className="ks-dashboard-caption">
            <span>01 / VISIBILITY</span>
            <p>
              Office and field teams work from the same information as the
              basis for project coordination.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
