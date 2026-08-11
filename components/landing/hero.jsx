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
          Construction projects, fully under control.
        </h1>

        <p className="ks-hero-sub ks-anim" style={{ animationDelay: "0.12s" }}>
          PT. Kita Satu Intersolusi is a construction services company backed
          by Smart Konstruksi — our in-house ERP for RAB budgets, progress, and
          reporting. You see the numbers in real time, from site prep to
          handover.
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
          <a href="#platform" className="ks-btn ks-btn-ghost-white ks-btn-lg">
            View Platform
          </a>
        </div>

        <p className="ks-hero-trust ks-anim" style={{ animationDelay: "0.24s" }}>
          <span className="material-symbols-outlined">check_circle</span>
          Real-time reporting — budgets, progress, and invoices, always visible
        </p>
      </div>
    </section>
  );
}
