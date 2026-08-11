export default function Hero() {
  return (
    <section className="ks-hero" id="top">
      <div className="ks-hero-media">
        <img
          src="/images/landing/hero-construction-site.jpg"
          alt="Construction workers on an active building site"
          fetchPriority="high"
        />
      </div>
      <div className="ks-hero-overlay" aria-hidden />

      <div className="ks-container ks-hero-inner">
        <span className="ks-eyebrow ks-eyebrow-gold ks-anim">
          PT. Kita Satu Intersolusi
        </span>

        <h1 className="ks-hero-title ks-anim" style={{ animationDelay: "0.06s" }}>
          We build structures that stand the test of time.
        </h1>

        <p className="ks-hero-sub ks-anim" style={{ animationDelay: "0.12s" }}>
          A construction services company built on quality, transparency, and
          discipline. From site preparation to final handover, we deliver
          projects on schedule and on budget — with reporting you can actually
          see.
        </p>

        <div
          className="ks-hero-cta ks-anim"
          style={{ animationDelay: "0.18s" }}
        >
          <a href="#contact" className="ks-btn ks-btn-white ks-btn-lg">
            Start a Project
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              arrow_forward
            </span>
          </a>
          <a href="#projects" className="ks-btn ks-btn-ghost-white ks-btn-lg">
            View Our Work
          </a>
        </div>

        <p className="ks-hero-trust ks-anim" style={{ animationDelay: "0.24s" }}>
          <span className="material-symbols-outlined">check_circle</span>
          Transparent project reporting — budgets, progress, and invoices,
          always visible
        </p>
      </div>
    </section>
  );
}
