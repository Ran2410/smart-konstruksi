import Image from "next/image";
import siteImage from "@/public/images/landing/hero-construction-site.jpg";

const PROJECT_SIGNALS = [
  { label: "Budget & costs", value: "Under control", icon: "request_quote" },
  { label: "Site progress", value: "Tracked daily", icon: "monitoring" },
  { label: "Work schedule", value: "Synchronized", icon: "calendar_month" },
  { label: "Project documents", value: "One source of truth", icon: "folder_open" },
];

export default function Hero() {
  return (
    <section className="ks-hero" id="top">
      <div className="ks-hero-blueprint" aria-hidden="true" />

      <div className="ks-container ks-hero-grid">
        <div className="ks-hero-copy">
          <span className="ks-kicker ks-kicker-light ks-reveal">
            PT Kita Satu Intersolusi
          </span>
          <h1 className="ks-hero-title ks-reveal ks-delay-1">
            Build with control,
            <span>not assumptions.</span>
          </h1>
          <p className="ks-hero-sub ks-reveal ks-delay-2">
            We manage construction work from planning through handover, with
            Smart Konstruksi as the control center for costs, progress,
            materials, and project reporting.
          </p>

          <div className="ks-hero-actions ks-reveal ks-delay-3">
            <a href="#contact" className="ks-btn ks-btn-amber ks-btn-lg">
              Discuss your project
              <span className="material-symbols-outlined" aria-hidden="true">
                arrow_forward
              </span>
            </a>
            <a href="#platform" className="ks-btn ks-btn-line-light ks-btn-lg">
              Explore the control system
            </a>
          </div>

          <div className="ks-hero-assurance ks-reveal ks-delay-4">
            <span className="material-symbols-outlined" aria-hidden="true">
              verified
            </span>
            <p>
              One accountable team. One system for a clear view of every
              project.
            </p>
          </div>
        </div>

        <div className="ks-hero-visual ks-reveal ks-delay-2">
          <div className="ks-hero-image-wrap">
            <Image
              src={siteImage}
              alt="Construction team working on an active project site"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
              className="ks-hero-image"
            />
            <div className="ks-hero-image-shade" aria-hidden="true" />
            <div className="ks-site-stamp" aria-hidden="true">
              <span>ACTIVE SITE</span>
              <span>CONTROLLED BUILD</span>
            </div>
            <div className="ks-site-coordinate">
              <span className="ks-live-dot" aria-hidden="true" />
              <span>Active project monitoring</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ks-container ks-signal-shell ks-reveal ks-delay-4">
        <div className="ks-signal-intro">
          <span className="ks-signal-code">SK / LIVE</span>
          <strong>Project control rail</strong>
        </div>
        <div className="ks-signal-grid">
          {PROJECT_SIGNALS.map((signal) => (
            <div className="ks-signal" key={signal.label}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {signal.icon}
              </span>
              <div>
                <span className="ks-signal-label">{signal.label}</span>
                <strong>{signal.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
