import LandingNav from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import {
  StatsBar,
  About,
  Services,
  Projects,
  WhyUs,
} from "@/components/landing/sections";
import { ContactCta, Footer } from "@/components/landing/contact";
import { T, SHADOWS } from "@/lib/design-tokens";

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
  "--ks-ink": "#1B1813", // warm near-black headings
  "--ks-muted": "#5F5A52", // warm gray body text
  "--ks-bg": "#F7F5F0", // warm off-white page background
  "--ks-card": "#FFFFFF", // card surface
  "--ks-border": "#E9E4DA", // warm border
  "--ks-sand": "#EFEBE2", // section alt background
  "--ks-dark": "#1B1813", // dark section background
  "--ks-dark-2": "#131110", // footer background
  "--ks-accent": "#B3522F", // burnt orange
  "--ks-gold": "#BD963B", // gold (sparingly)
  "--ks-shadow-card": SHADOWS.card,
  "--ks-shadow-elevated": SHADOWS.elevated,
  "--ks-shadow-modal": SHADOWS.modal,
};

export default function LandingPage() {
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
        .ks-section-sand { background: var(--ks-sand); }
        .ks-section-dark { background: var(--ks-dark); }
        @media (max-width: 768px) { .ks-section { padding: 76px 0; } }

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
        .ks-btn-white:hover { background: #f5f1e8; transform: translateY(-1px); }
        .ks-btn-ghost-white { background: transparent; color: #ffffff; border-color: rgba(255,255,255,0.55); }
        .ks-btn-ghost-white:hover { background: rgba(255,255,255,0.1); border-color: #ffffff; }
        .ks-btn-ghost { background: transparent; color: var(--ks-ink); border-color: var(--ks-border); }
        .ks-btn-ghost:hover { border-color: var(--ks-ink); background: rgba(255,255,255,0.6); }

        /* ── Navbar ───────────────────────────────────── */
        .ks-nav {
          position: sticky; top: 0; z-index: 50;
          height: 76px; transition: background 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
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
          /* Pull the hero up under the transparent sticky navbar */
          margin-top: -76px;
        }
        .ks-hero-media { position: absolute; inset: 0; }
        .ks-hero-media img {
          width: 100%; height: 100%; object-fit: cover; object-position: center;
          animation: ks-hero-zoom 22s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .ks-hero-overlay {
          position: absolute; inset: 0;
          background:
            linear-gradient(75deg, rgba(15,12,8,0.88) 0%, rgba(15,12,8,0.55) 45%, rgba(15,12,8,0.18) 78%),
            linear-gradient(180deg, rgba(15,12,8,0.5) 0%, rgba(15,12,8,0) 32%, rgba(15,12,8,0.72) 100%);
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

        /* ── Stats bar ────────────────────────────────── */
        .ks-stats { background: var(--ks-bg); padding: 0 0 110px; }
        .ks-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .ks-stat-card {
          background: var(--ks-card); border: 1px solid var(--ks-border);
          border-radius: 20px; padding: 26px 24px; box-shadow: var(--ks-shadow-card);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .ks-stat-card:hover { transform: translateY(-3px); box-shadow: var(--ks-shadow-elevated); }
        .ks-stat-icon {
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--ks-sand); color: var(--ks-accent);
          display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .ks-stat-value {
          font-family: 'Hanken Grotesk', sans-serif; font-size: 26px; font-weight: 800;
          letter-spacing: -0.01em; line-height: 1.1; color: var(--ks-ink);
        }
        .ks-stat-label {
          font-family: 'Geist', monospace; font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--ks-accent);
          margin-top: 8px;
        }
        .ks-stat-note { font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; color: var(--ks-muted); margin-top: 8px; }
        .ks-stats-foot {
          text-align: center; margin-top: 30px;
          font-family: 'Inter', sans-serif; font-size: 13px; color: var(--ks-muted);
        }

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

        /* ── Services ─────────────────────────────────── */
        .ks-services-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; }
        .ks-service-card {
          background: var(--ks-card); border: 1px solid var(--ks-border);
          border-radius: 22px; padding: 30px 28px; box-shadow: var(--ks-shadow-card);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .ks-service-card:hover {
          transform: translateY(-5px); box-shadow: var(--ks-shadow-elevated); border-color: #d9d1c0;
        }
        .ks-service-icon {
          width: 50px; height: 50px; border-radius: 14px;
          background: var(--ks-sand); color: var(--ks-accent);
          display: flex; align-items: center; justify-content: center; margin-bottom: 20px;
        }
        .ks-service-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 19px; font-weight: 700; color: var(--ks-ink); }
        .ks-service-desc { font-family: 'Inter', sans-serif; font-size: 15px; line-height: 1.6; color: var(--ks-muted); margin: 10px 0 0; }

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
          background: linear-gradient(180deg, rgba(15,12,8,0) 38%, rgba(15,12,8,0.72) 100%);
          display: flex; align-items: flex-end; padding: 24px;
        }
        .ks-project-tag {
          font-family: 'Geist', monospace; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--ks-gold);
        }
        .ks-project-label { font-family: 'Hanken Grotesk', sans-serif; font-size: 19px; font-weight: 700; color: #ffffff; margin-top: 5px; }

        /* ── Why Us ───────────────────────────────────── */
        .ks-why-grid { display: grid; grid-template-columns: 1fr 0.85fr; gap: 72px; align-items: center; }
        .ks-why-features { display: grid; grid-template-columns: 1fr 1fr; gap: 26px 32px; margin-top: 40px; }
        .ks-why-feature { display: flex; gap: 14px; align-items: flex-start; }
        .ks-why-feature-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(189,150,59,0.14); color: var(--ks-gold);
          display: flex; align-items: center; justify-content: center;
        }
        .ks-why-feature-title { font-family: 'Hanken Grotesk', sans-serif; font-size: 17px; font-weight: 700; color: #ffffff; }
        .ks-why-feature-desc { font-family: 'Inter', sans-serif; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.66); margin: 6px 0 0; }
        .ks-why-frame {
          border-radius: 22px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12); background: #100e0b;
          box-shadow: 0 34px 60px -24px rgba(0,0,0,0.65);
        }
        .ks-why-frame-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #221e18; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .ks-why-frame-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .ks-why-frame-url { flex: 1; text-align: center; font-family: 'Geist', monospace; font-size: 11px; color: rgba(255,255,255,0.4); }
        .ks-why-frame-body { position: relative; max-height: 460px; overflow: hidden; }
        .ks-why-frame-body img { width: 100%; display: block; }
        .ks-why-frame-fade { position: absolute; left: 0; right: 0; bottom: 0; height: 90px; background: linear-gradient(180deg, rgba(16,14,11,0), #100e0b); pointer-events: none; }
        .ks-why-caption { font-family: 'Inter', sans-serif; font-size: 13px; color: rgba(255,255,255,0.5); margin-top: 14px; text-align: center; }

        /* ── Contact ──────────────────────────────────── */
        .ks-contact { background: var(--ks-sand); scroll-margin-top: 72px; }
        .ks-contact-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 64px; align-items: center; }
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
        .ks-contact-media { position: relative; }
        .ks-contact-media img {
          width: 100%; display: block; object-fit: cover;
          aspect-ratio: 1.18 / 1; border-radius: 24px; box-shadow: var(--ks-shadow-modal);
        }

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
          .ks-contact-media { max-width: 560px; }
          .ks-why-visual { max-width: 560px; }
          .ks-services-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .ks-nav-cta { display: none; }
          .ks-stats-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .ks-about-values { grid-template-columns: 1fr; }
          .ks-why-features { grid-template-columns: 1fr; gap: 22px; }
          .ks-projects-grid { columns: 2; }
          .ks-footer-grid { grid-template-columns: 1fr 1fr; gap: 36px; }
          .ks-footer-brand { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .ks-hero { padding: 150px 0 96px; min-height: auto; }
          .ks-hero-title { font-size: clamp(36px, 10.5vw, 48px); }
          .ks-hero-sub { font-size: 16px; }
          .ks-section { padding: 64px 0; }
          .ks-stats { padding: 0 0 64px; }
          .ks-services-grid { grid-template-columns: 1fr; }
          .ks-projects-grid { columns: 1; }
          .ks-contact-details { flex-direction: column; align-items: stretch; }
          .ks-footer-grid { grid-template-columns: 1fr; }
          .ks-brand-name { font-size: 15px; }
        }
      `}</style>

      <div className="ks-page" style={THEME_VARS}>
        <LandingNav />
        <main>
          <Hero />
          <StatsBar />
          <About />
          <Services />
          <Projects />
          <WhyUs />
          <ContactCta />
        </main>
        <Footer />
      </div>
    </>
  );
}
