import LandingNav from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import {
  StatsBar,
  About,
  Services,
  Projects,
  Platform,
  HowItWorks,
} from "@/components/landing/sections";
import { ContactCta, FinalCta, Footer } from "@/components/landing/contact";
import { T, SHADOWS } from "@/lib/design-tokens";
import { prisma } from "@/lib/prisma";

// Revalidate the landing page periodically so company-profile changes made
// in /dashboard/settings appear without a full redeploy.
export const revalidate = 60;

// Shown only until the CompanyProfile row exists (or DB is unreachable) —
// the values are also what prisma seeds as schema defaults.
const PROFILE_FALLBACK = {
  companyName: "PT. Kita Satu Intersolusi",
  tagline:
    "Quality construction, delivered with transparency and discipline — on schedule, on budget.",
  address: null,
  phone: "+62 21 0000 0000",
  email: "info@ksi.co.id",
  website: null,
  logoUrl: null,
};

async function getCompanyProfile() {
  try {
    const profile = await prisma.companyProfile.findUnique({
      where: { id: "company" },
    });
    return { ...PROFILE_FALLBACK, ...(profile ?? {}) };
  } catch {
    // Never let a DB hiccup take down the public landing page.
    return PROFILE_FALLBACK;
  }
}

export const metadata = {
  title: "PT. Kita Satu Intersolusi — Construction Services",
  description:
    "PT. Kita Satu Intersolusi is a construction services company delivering quality, transparency, and on-schedule projects — backed by Smart Konstruksi, our in-house project-management system.",
};

// Design tokens + the new "Warm Premium" landing palette, exposed to the CSS
// below as custom properties so colors are never hardcoded twice.
const THEME_VARS = {
  "--ks-primary": T.primary,
  "--ks-primary-hover": T.primaryHover,
  "--ks-ink": T.onSurface, // #0B1C30 navy — dashboard text
  "--ks-muted": T.onSurfaceMuted, // #6F7A72 — dashboard muted
  "--ks-bg": T.surfaceContainerLow, // #EFF4FF — dashboard background
  "--ks-card": T.surfaceCard, // #FFFFFF
  "--ks-border": T.outlineVariant, // #DCE9FF — dashboard border
  "--ks-sand": T.surfaceContainer, // #E5EEFF — section alt background
  "--ks-dark": T.onSurface, // #0B1C30 — dark section background
  "--ks-dark-2": "#0A1520", // footer background (navy, darker)
  "--ks-accent": T.primary, // #004F35 green — dashboard primary
  "--ks-gold": T.tertiaryFixed, // #D4E8DC sage — dark-section accent
  "--ks-shadow-card": SHADOWS.card,
  "--ks-shadow-elevated": SHADOWS.elevated,
  "--ks-shadow-modal": SHADOWS.modal,
};

export default async function LandingPage() {
  const profile = await getCompanyProfile();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Geist:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }

        html { scroll-behavior: smooth; }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .ks-hero-media img { animation: none; }
        }

        /* ── Page shell ───────────────────────────────── */
        .ks-page {
          font-family: 'Inter', sans-serif;
          color: var(--ks-ink);
          background: var(--ks-bg);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .ks-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        /* ── Sections ─────────────────────────────────── */
        .ks-section { padding: 110px 0; scroll-margin-top: 72px; }
        .ks-section:last-of-type { padding-bottom: 96px; }
        .ks-section-sand { background: var(--ks-sand); }
        .ks-section-dark { background: var(--ks-dark); }
        @media (max-width: 768px) { .ks-section { padding: 76px 0; } }

        /* ── Section dividers & transitions ───────────── */
        .ks-divider { display: flex; align-items: center; justify-content: center; padding: 32px 0 0; }
        .ks-divider-line { width: 56px; height: 1px; background: var(--ks-border); }
        .ks-divider-light .ks-divider-line { background: rgba(255,255,255,0.12); }

        /* ── Typography ───────────────────────────────── */
        .ks-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-family: 'Geist', monospace; font-size: 12px; font-weight: 600;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--ks-accent);
        }
        .ks-eyebrow::before {
          content: ""; width: 26px; height: 1px; background: var(--ks-gold);
        }
        .ks-eyebrow-gold { color: var(--ks-gold); }
        .ks-h2 {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: clamp(30px, 4vw, 44px); font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.12; color: var(--ks-ink);
          margin: 18px 0 0; text-wrap: balance;
        }
        .ks-h2-light { color: #ffffff; }
        .ks-sub {
          font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.65;
          color: var(--ks-muted); margin: 18px 0 0; max-width: 620px;
        }
        .ks-sub-light { color: rgba(255,255,255,0.72); }
        .ks-section-head { text-align: center; max-width: 720px; margin: 0 auto 56px; }
        .ks-section-head .ks-sub { margin-left: auto; margin-right: auto; }
        .ks-section-head .ks-eyebrow { justify-content: center; }
        .ks-section-head .ks-eyebrow::before { display: none; }

        /* ── Buttons ──────────────────────────────────── */
        .ks-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 24px; border-radius: 9999px;
          font-family: 'Geist', monospace; font-size: 14px; font-weight: 600;
          letter-spacing: 0.02em; text-decoration: none; cursor: pointer;
          border: 1px solid transparent; line-height: 1; white-space: nowrap;
          transition: all 0.2s ease;
        }
        .ks-btn-lg { padding: 16px 30px; font-size: 15px; }
        .ks-btn-primary {
          background: var(--ks-primary); color: #ffffff; border-color: var(--ks-primary);
          box-shadow: 0 6px 18px rgba(0,79,53,0.22);
        }
        .ks-btn-primary:hover {
          background: var(--ks-primary-hover); border-color: var(--ks-primary-hover);
          transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0,79,53,0.3);
        }
        .ks-btn-white {
          background: #ffffff; color: var(--ks-ink); border-color: #ffffff;
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .ks-btn-white:hover { background: var(--ks-sand); transform: translateY(-1px); }
        .ks-btn-ghost-white { background: transparent; color: #ffffff; border-color: rgba(255,255,255,0.55); }
        .ks-btn-ghost-white:hover { background: rgba(255,255,255,0.1); border-color: #ffffff; }
        .ks-btn-ghost { background: transparent; color: var(--ks-ink); border-color: var(--ks-border); }
        .ks-btn-ghost:hover { border-color: var(--ks-ink); background: rgba(255,255,255,0.6); }

        /* ── Navbar ───────────────────────────────────── */
        .ks-nav {
          position: absolute; top: 0; left: 0; right: 0; z-index: 50;
          height: 76px;
        }
        .ks-nav-inner { display: flex; align-items: center; justify-content: space-between; height: 100%; }
        .ks-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .ks-brand-mark {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          background: #ffffff; padding: 5px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .ks-brand-mark img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
        .ks-brand-name {
          font-family: 'Hanken Grotesk', sans-serif; font-size: 18px;
          font-weight: 700; letter-spacing: -0.01em; white-space: nowrap;
        }
        .ks-nav-links { display: flex; align-items: center; gap: 32px; }
        .ks-nav-link {
          font-family: 'Geist', monospace; font-size: 13.5px; font-weight: 500;
          letter-spacing: 0.04em; text-decoration: none; transition: color 0.15s ease;
        }
        .ks-nav-link:hover { color: var(--ks-accent) !important; }
        .ks-nav-cta { display: flex; align-items: center; gap: 12px; }
        .ks-mobile-menu { display: none; }

        /* ── Hero ─────────────────────────────────────── */
        .ks-hero {
          position: relative; min-height: min(92vh, 860px);
          display: flex; align-items: center;
          padding: 160px 0 130px; overflow: hidden;
        }
        .ks-hero-media { position: absolute; inset: 0; }
        .ks-hero-media img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          animation: ks-hero-zoom 22s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .ks-hero-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(75deg, rgba(11,28,48,0.88) 0%, rgba(11,28,48,0.55) 45%, rgba(11,28,48,0.18) 78%),
            linear-gradient(180deg, rgba(11,28,48,0.5) 0%, rgba(11,28,48,0) 32%, rgba(11,28,48,0.72) 100%);
        }
        .ks-hero-inner { position: relative; z-index: 1; max-width: 680px; }
        .ks-hero-title {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: clamp(40px, 5.6vw, 72px); font-weight: 800;
          letter-spacing: -0.03em; line-height: 1.04; color: #ffffff;
          margin: 26px 0 0; text-wrap: balance;
        }
        .ks-hero-sub {
          font-family: 'Inter', sans-serif; font-size: 17.5px; line-height: 1.65;
          color: rgba(255,255,255,0.84); margin: 26px 0 0; max-width: 560px;
        }
        .ks-hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 38px; }
        .ks-hero-trust {
          display: flex; align-items: center; gap: 9px; margin-top: 32px;
          font-family: 'Inter', sans-serif; font-size: 14px; color: rgba(255,255,255,0.78);
        }
        .ks-hero-trust .material-symbols-outlined { color: var(--ks-gold); font-size: 18px; }


        /* ── About ────────────────────────────────────── */
        .ks-about-grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 72px; align-items: center; }
        .ks-about-media { position: relative; }
        .ks-about-media img {
          width: 100%; height: auto; display: block;
          border-radius: 24px; box-shadow: var(--ks-shadow-modal);
        }
        .ks-about-badge {
          position: absolute; left: 24px; bottom: 24px;
          display: flex; align-items: center; gap: 12px;
          background: #ffffff; border: 1px solid var(--ks-border);
          border-radius: 16px; padding: 14px 18px; box-shadow: var(--ks-shadow-elevated);
        }
        .ks-about-badge-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: var(--ks-sand); color: var(--ks-primary);
          display: flex; align-items: center; justify-content: center;
        }
        .ks-about-badge-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 15px; font-weight: 700; color: var(--ks-ink); }
        .ks-about-badge-sub { font-family: 'Inter', sans-serif; font-size: 12px; color: var(--ks-muted); }
        .ks-about-values { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 28px; margin-top: 30px; }
        .ks-about-value {
          display: flex; align-items: center; gap: 10px;
          font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 500; color: var(--ks-ink);
        }
        .ks-about-value .material-symbols-outlined { color: var(--ks-primary); font-size: 18px; }

        /* ── Services (editorial grid) ──────────────── */
        .ks-services-list {
          display: grid; grid-template-columns: repeat(3, 1fr);
          column-gap: 48px; row-gap: 56px; margin-top: 60px;
        }
        .ks-service-row {
          border-top: 1px solid var(--ks-border); padding-top: 26px;
          transition: background 0.2s ease;
        }
        .ks-service-num {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 42px; font-weight: 800; letter-spacing: -0.02em;
          line-height: 1; color: var(--ks-primary);
        }
        .ks-service-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 21px; font-weight: 700; letter-spacing: -0.01em; color: var(--ks-ink); margin-top: 18px; }
        .ks-service-desc { font-family: 'Inter', sans-serif; font-size: 14.5px; line-height: 1.6; color: var(--ks-muted); margin: 10px 0 0; max-width: 340px; }

        /* ── Projects ─────────────────────────────────── */
        .ks-projects-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .ks-projects-note {
          display: flex; align-items: center; gap: 8px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: var(--ks-muted);
          background: var(--ks-card); border: 1px solid var(--ks-border);
          border-radius: 9999px; padding: 9px 16px;
        }
        .ks-projects-grid { columns: 3; column-gap: 20px; margin-top: 44px; }
        .ks-project-item {
          position: relative; border-radius: 22px; overflow: hidden;
          break-inside: avoid; margin-bottom: 20px; box-shadow: var(--ks-shadow-card);
        }
        .ks-project-item img { width: 100%; height: auto; display: block; transform: scale(1.001); transition: transform 0.55s ease; }
        .ks-project-item:hover img { transform: scale(1.06); }
        .ks-project-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(11,28,48,0) 35%, rgba(11,28,48,0.82) 100%);
          display: flex; align-items: flex-end; padding: 22px;
        }
        .ks-project-head-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ks-project-tag {
          font-family: 'Geist', monospace; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--ks-gold);
        }
        .ks-project-chip {
          font-family: 'Geist', monospace; font-size: 10px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.9);
          border: 1px solid rgba(255,255,255,0.35); border-radius: 999px;
          padding: 4px 10px; background: rgba(11,28,48,0.4);
        }
        .ks-project-label { font-family: 'Hanken Grotesk', sans-serif; font-size: 19px; font-weight: 700; color: #ffffff; margin-top: 5px; }
        .ks-project-meta {
          font-family: 'Geist', monospace; font-size: 11px; font-weight: 500;
          letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.62);
          margin-top: 6px;
        }

        /* ── Platform ─────────────────────────────────── */
        .ks-why-grid { display: grid; grid-template-columns: 1fr 0.85fr; gap: 72px; align-items: center; }
        .ks-platform-features { display: flex; flex-direction: column; margin-top: 44px; }
        .ks-platform-feature {
          display: flex; gap: 16px; align-items: center;
          padding: 18px 0; border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .ks-platform-feature-icon {
          width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
          background: rgba(212,232,220,0.16); color: var(--ks-gold);
          display: flex; align-items: center; justify-content: center;
        }
        .ks-platform-feature-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; }
        .ks-platform-feature-desc { font-family: 'Inter', sans-serif; font-size: 13.5px; line-height: 1.55; color: rgba(255,255,255,0.62); margin: 3px 0 0; }
        .ks-why-frame {
          border-radius: 22px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12); background: #0B1C30;
          box-shadow: 0 34px 60px -24px rgba(0,0,0,0.65);
        }
        .ks-why-frame-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #16273D; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .ks-why-frame-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .ks-why-frame-url { flex: 1; text-align: center; font-family: 'Geist', monospace; font-size: 11px; color: rgba(255,255,255,0.4); }
        .ks-why-frame-body { position: relative; max-height: 460px; overflow: hidden; }
        .ks-why-frame-body img { width: 100%; display: block; }
        .ks-why-frame-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 90px; background: linear-gradient(180deg, rgba(11,28,48,0), #0B1C30); pointer-events: none; }
        .ks-why-caption { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 14px; text-align: center; }

        /* ── How It Works ─────────────────────────────── */
        .ks-workflow-steps {
          position: relative; display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 28px; margin-top: 72px;
        }
        .ks-workflow-steps::before {
          content: ""; position: absolute; top: 24px; left: 10%; right: 10%;
          height: 1px; background: var(--ks-border);
        }
        .ks-workflow-step { position: relative; text-align: center; }
        .ks-workflow-num {
          width: 48px; height: 48px; margin: 0 auto; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--ks-card); border: 1px solid var(--ks-border);
          color: var(--ks-accent); font-family: 'Geist', monospace;
          font-size: 13px; font-weight: 600; position: relative; z-index: 1;
        }
        .ks-workflow-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: var(--ks-ink); margin-top: 20px; }
        .ks-workflow-desc { font-family: 'Inter', sans-serif; font-size: 13.5px; line-height: 1.55; color: var(--ks-muted); margin: 8px auto 0; max-width: 190px; }

        /* ── Contact ──────────────────────────────────── */
        .ks-contact { background: var(--ks-sand); scroll-margin-top: 72px; }
        .ks-contact-grid { display: grid; grid-template-columns: 1fr 1.05fr; gap: 72px; align-items: start; }
        .ks-contact-title {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: clamp(30px, 4vw, 44px); font-weight: 800;
          letter-spacing: -0.02em; line-height: 1.12; color: var(--ks-ink);
          margin: 18px 0 0; text-wrap: balance;
        }
        .ks-contact-sub { font-family: 'Inter', sans-serif; font-size: 17px; line-height: 1.65; color: var(--ks-muted); margin: 18px 0 0; max-width: 520px; }
        .ks-contact-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 32px; }
        .ks-contact-details { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 40px; }
        .ks-contact-detail {
          display: flex; align-items: center; gap: 12px;
          background: #ffffff; border: 1px solid var(--ks-border);
          border-radius: 16px; padding: 13px 18px; box-shadow: var(--ks-shadow-card);
        }
        .ks-contact-detail-icon {
          width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
          background: var(--ks-sand); color: var(--ks-accent);
          display: flex; align-items: center; justify-content: center;
        }
        .ks-contact-detail-label { display: block; font-family: 'Geist', monospace; font-size: 10.5px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ks-muted); }
        .ks-contact-detail-value { font-family: 'Inter', sans-serif; font-size: 14.5px; font-weight: 600; color: var(--ks-ink); }
        a.ks-contact-detail-value { text-decoration: none; }
        a.ks-contact-detail-value:hover { color: var(--ks-primary); text-decoration: underline; }
        /* ── Contact form ─────────────────────────────── */
        .ks-form {
          background: var(--ks-card); border: 1px solid var(--ks-border);
          border-radius: 24px; padding: 36px; box-shadow: var(--ks-shadow-elevated);
        }
        .ks-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .ks-form-field { display: flex; flex-direction: column; gap: 8px; }
        .ks-form-field--full { grid-column: 1 / -1; }
        .ks-form-label {
          font-family: 'Geist', monospace; font-size: 11px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--ks-muted);
        }
        .ks-form-input, .ks-form-select, .ks-form-textarea {
          width: 100%; font-family: 'Inter', sans-serif; font-size: 15px; color: var(--ks-ink);
          background: #ffffff; border: 1px solid var(--ks-border); border-radius: 12px;
          padding: 13px 16px; transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .ks-form-input::placeholder, .ks-form-textarea::placeholder { color: #a49c8d; }
        .ks-form-input:focus, .ks-form-select:focus, .ks-form-textarea:focus {
          outline: none; border-color: var(--ks-primary);
          box-shadow: 0 0 0 3px rgba(0,79,53,0.12);
        }
        .ks-form-textarea { min-height: 120px; resize: vertical; }
        .ks-form-submit { margin-top: 24px; width: 100%; }

        /* ── Final CTA ────────────────────────────────── */
        .ks-final-cta { background: var(--ks-dark); text-align: center; }
        .ks-final-cta .ks-eyebrow { justify-content: center; }
        .ks-final-cta .ks-eyebrow::before { display: none; }
        .ks-final-cta-cta { margin-top: 36px; }

        /* ── Footer ───────────────────────────────────── */
        .ks-footer { background: var(--ks-dark-2); color: rgba(255,255,255,0.78); }
        .ks-footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; }
        .ks-footer-brand { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
        .ks-footer-name { font-family: 'Hanken Grotesk', sans-serif; font-size: 20px; font-weight: 700; color: #ffffff; }
        .ks-footer-tagline { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.55); margin-top: 10px; max-width: 260px; }
        .ks-footer-col-title {
          font-family: 'Geist', monospace; font-size: 12px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4);
          margin: 0 0 18px;
        }
        .ks-footer-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
        .ks-footer-link { font-family: 'Inter', sans-serif; font-size: 14px; color: rgba(255,255,255,0.68); text-decoration: none; transition: color 0.15s ease; }
        .ks-footer-link:hover { color: #ffffff; }
        .ks-footer-bottom {
          margin-top: 60px; padding-top: 26px; border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.42);
        }

        /* ── Motion ───────────────────────────────────── */
        @keyframes ks-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ks-anim { animation: ks-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes ks-hero-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.06); }
        }

        /* ── Responsive ───────────────────────────────── */
        @media (max-width: 1024px) {
          .ks-nav-links { display: none; }
          .ks-mobile-menu { display: block; }
          .ks-about-grid { grid-template-columns: 1fr; gap: 48px; }
          .ks-why-grid { grid-template-columns: 1fr; gap: 56px; }
          .ks-contact-grid { grid-template-columns: 1fr; gap: 48px; }
          .ks-why-visual { max-width: 560px; }
          .ks-projects-grid { columns: 2; }
          .ks-services-list { grid-template-columns: repeat(2, 1fr); column-gap: 40px; }
          .ks-workflow-steps { gap: 18px; margin-top: 60px; }
        }
        @media (max-width: 768px) {
          .ks-nav-cta { display: none; }
          .ks-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .ks-about-values { grid-template-columns: 1fr; }
          .ks-footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
          .ks-footer-brand { grid-column: 1 / -1; }
          .ks-workflow-steps {
            grid-template-columns: 1fr; gap: 0; margin-top: 48px;
          }
          .ks-workflow-steps::before {
            top: 0; bottom: 0; left: 24px; right: auto; width: 1px; height: auto;
          }
          .ks-workflow-step {
            display: grid; grid-template-columns: 48px 1fr; gap: 18px;
            text-align: left; padding: 18px 0; align-items: start;
          }
          .ks-workflow-num { margin: 0; }
          .ks-workflow-title { margin-top: 2px; }
          .ks-workflow-desc { max-width: none; margin-left: 0; margin-right: 0; }
        }
        @media (max-width: 640px) {
          .ks-hero { padding: 150px 0 96px; min-height: auto; }
          .ks-hero-title { font-size: clamp(36px, 10.5vw, 48px); }
          .ks-hero-sub { font-size: 16px; }
          .ks-section { padding: 64px 0; }
          .ks-stats { padding: 40px 0 64px; }
          .ks-services-list { grid-template-columns: 1fr; row-gap: 44px; }
          .ks-projects-grid { columns: 1; }
          .ks-contact-details { flex-direction: column; align-items: stretch; }
          .ks-form-grid { grid-template-columns: 1fr; }
          .ks-footer-grid { grid-template-columns: 1fr; }
          .ks-brand-name { font-size: 15px; }
        }
      `}</style>

      <div className="ks-page" style={THEME_VARS}>
        <LandingNav />
        <main>
          <Hero />
          <About />
          <Services />
          <Projects />
          <Platform />
          <HowItWorks />
            <div className="ks-divider ks-divider-light">
            <div className="ks-divider-line" />
          </div>
          <ContactCta profile={profile} />
          <FinalCta />
        </main>
        <Footer profile={profile} />
      </div>
    </>
  );
}
