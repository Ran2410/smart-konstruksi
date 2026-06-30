"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Step 1: Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // Step 2: Sign in via fetch (bypass signIn() which hangs on Next.js 16)
      const callbackUrl = `${window.location.origin}/dashboard`;
      const body = new URLSearchParams({
        email,
        password,
        csrfToken,
        callbackUrl,
        json: "true",
      });

      const signInRes = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "manual",
      });

      // redirect: "manual" → follow 302 ourselves
      if (signInRes.status === 302 || signInRes.status === 307) {
        const location = signInRes.headers.get("location");
        if (location) {
          window.location.href = location;
          return;
        }
      }

      // If response is OK (json: true mode returns JSON)
      if (signInRes.ok) {
        window.location.href = "/dashboard";
        return;
      }

      // Fallback — check session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      if (session?.user) {
        window.location.href = "/dashboard";
        return;
      }

      setError("Email atau password salah");
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Global styles injected via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=Geist:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        :root {
          --color-primary: #006948;
          --color-primary-container: #00855d;
          --color-on-primary: #ffffff;
          --color-on-primary-fixed: #002114;
          --color-primary-fixed-dim: #68dba9;
          --color-secondary: #565e74;
          --color-secondary-fixed: #dae2fd;
          --color-on-surface: #0b1c30;
          --color-on-surface-variant: #3d4a42;
          --color-surface: #f8f9ff;
          --color-surface-container-lowest: #ffffff;
          --color-surface-container-low: #eff4ff;
          --color-surface-container: #e5eeff;
          --color-surface-dim: #cbdbf5;
          --color-outline: #6d7a72;
          --color-outline-variant: #bccac0;
          --color-error: #ba1a1a;
          --color-error-container: #ffdad6;
          --color-on-error-container: #93000a;
        }

        .sk-body {
          font-family: 'Inter', sans-serif;
          background-color: var(--color-surface);
          color: var(--color-on-surface);
          min-height: 100vh;
          margin: 0;
        }

        .sk-main {
          display: flex;
          min-height: 100vh;
          overflow: hidden;
        }

        /* ─── LEFT SIDE ─── */
        .sk-hero {
          display: none;
          position: relative;
          width: 60%;
          background-color: #F8FAFC;
          flex-direction: column;
          padding: 40px;
          overflow: hidden;
          border-right: 1px solid rgba(188, 202, 192, 0.3);
        }

        @media (min-width: 768px) {
          .sk-hero {
            display: flex;
            width: 45%;
          }
        }

        @media (min-width: 1024px) {
          .sk-hero {
            width: 60%;
          }
        }

        .sk-blueprint {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.4;
        }

        .sk-glow-top {
          position: absolute;
          top: -96px;
          left: -96px;
          width: 384px;
          height: 384px;
          background: rgba(104, 219, 169, 0.3);
          filter: blur(120px);
          border-radius: 9999px;
        }

        .sk-glow-btm {
          position: absolute;
          bottom: 25%;
          right: -96px;
          width: 320px;
          height: 320px;
          background: rgba(218, 226, 253, 0.2);
          filter: blur(100px);
          border-radius: 9999px;
        }

        .sk-logo-wrap {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          animation: fadeIn 1s ease-out forwards;
        }

        .sk-logo-icon {
          width: 40px;
          height: 40px;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,105,72,0.3);
        }

        .sk-logo-icon .material-symbols-outlined {
          color: var(--color-on-primary);
          font-size: 24px;
        }

        .sk-logo-text {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
        }

        /* Hero content */
        .sk-hero-content {
          position: relative;
          z-index: 10;
          margin-top: auto;
          margin-bottom: auto;
          max-width: 640px;
        }

        .sk-display {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: var(--color-on-surface);
          margin: 0 0 16px 0;
        }

        .sk-display .accent {
          color: var(--color-primary);
        }

        .sk-hero-sub {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          line-height: 1.6;
          color: var(--color-on-surface-variant);
          max-width: 512px;
          margin: 0 0 32px 0;
        }

        /* Dashboard mockup */
        .sk-mockup-wrap {
          position: relative;
          margin-top: 32px;
        }

        .sk-mockup {
          border-radius: 16px;
          border: 1px solid var(--color-outline-variant);
          background: rgba(255,255,255,0.5);
          padding: 4px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          overflow: hidden;
          aspect-ratio: 16/9;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sk-mockup:hover {
          transform: scale(1.01);
        }

        .sk-mockup-img {
          width: 100%;
          height: 100%;
          background-size: cover;
          background-position: center;
          border-radius: 12px;
          background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzfom0q81cT_NpK37Avhxq7J4fIMBG5vv4qDsdGPNTWiXoap9hXbr3z0RauQ_pskStG6T6UnSkhVaaqk0AY6WQ7GbJSaldk-vfUh08OtOZxLLrlKi5a6KHuaob5Bq-TnnHpaU8XpFHWmPL_CcED4JoyF5smLs93mpHkkN0PNIzVLkWGmeK6vZZoUhcPOPCrzLjZfqb4EmJ8F1da8w5FOP4-FA3vl4isNVw-2GkElRuTVhW2Xd76FxgRiPzvapLbvjfLrNw7DIYE_EY');
        }

        /* Floating glass cards */
        .sk-float-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.07);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          position: absolute;
        }

        .sk-float-1 {
          top: -24px;
          right: -40px;
          animation: float 6s ease-in-out infinite;
        }

        .sk-float-2 {
          bottom: 48px;
          left: -32px;
          animation: float 6s ease-in-out infinite;
          animation-delay: 2s;
        }

        .sk-float-3 {
          bottom: -32px;
          right: 64px;
          animation: floatReverse 7s ease-in-out infinite;
        }

        .sk-float-icon {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sk-float-icon.primary {
          background: rgba(0, 105, 72, 0.1);
          color: var(--color-primary);
        }

        .sk-float-icon.secondary {
          background: rgba(86, 94, 116, 0.1);
          color: var(--color-secondary);
        }

        .sk-float-icon .material-symbols-outlined {
          font-size: 18px;
        }

        .sk-float-label {
          font-family: 'Geist', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--color-outline);
          display: block;
        }

        .sk-float-value {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: var(--color-on-surface);
          display: block;
        }

        .sk-float-text {
          display: flex;
          flex-direction: column;
        }

        .sk-float-title {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--color-on-surface);
        }

        .sk-progress-bar-bg {
          width: 96px;
          height: 6px;
          background: rgba(188, 202, 192, 0.3);
          border-radius: 9999px;
          margin-top: 4px;
          overflow: hidden;
        }

        .sk-progress-fill {
          height: 100%;
          width: 98%;
          background: var(--color-primary);
        }

        /* Hero footer quote */
        .sk-hero-footer {
          position: relative;
          z-index: 10;
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--color-on-surface-variant);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          font-style: italic;
          opacity: 0.8;
        }

        .sk-hero-footer .material-symbols-outlined {
          color: var(--color-primary);
          font-size: 24px;
          flex-shrink: 0;
        }

        /* ─── RIGHT SIDE ─── */
        .sk-auth {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 16px;
          background: var(--color-surface);
          position: relative;
        }

        @media (min-width: 768px) {
          .sk-auth {
            padding: 40px;
          }
        }

        /* Mobile logo */
        .sk-mobile-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
        }

        @media (min-width: 768px) {
          .sk-mobile-logo {
            display: none;
          }
        }

        .sk-mob-icon {
          width: 32px;
          height: 32px;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .sk-mob-icon .material-symbols-outlined {
          color: var(--color-on-primary);
          font-size: 20px;
        }

        .sk-mob-text {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary);
          margin: 0;
        }

        /* Auth card */
        .sk-auth-wrap {
          width: 100%;
          max-width: 440px;
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .sk-auth-card {
          background: var(--color-surface-container-lowest);
          border: 1px solid var(--color-outline-variant);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(203, 219, 245, 0.2);
        }

        @media (min-width: 768px) {
          .sk-auth-card {
            padding: 40px;
          }
        }

        .sk-auth-header {
          margin-bottom: 32px;
        }

        .sk-auth-title {
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.2;
          color: var(--color-on-surface);
          margin: 0 0 8px 0;
        }

        .sk-auth-sub {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: var(--color-on-surface-variant);
          margin: 0;
        }

        /* Form */
        .sk-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sk-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sk-field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sk-label {
          font-family: 'Geist', monospace;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--color-on-surface);
        }

        .sk-forgot {
          font-family: 'Geist', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--color-primary);
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .sk-forgot:hover {
          text-decoration: underline;
        }

        .sk-input-wrap {
          position: relative;
        }

        .sk-input-wrap .material-symbols-outlined {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--color-outline);
          font-size: 20px;
          transition: color 0.2s;
          pointer-events: none;
        }

        .sk-input-wrap:focus-within .material-symbols-outlined {
          color: var(--color-primary);
        }

        .sk-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 16px 12px 40px;
          background: var(--color-surface-container-low);
          border: 1px solid var(--color-outline-variant);
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: var(--color-on-surface);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
          -webkit-appearance: none;
        }

        .sk-input::placeholder {
          color: var(--color-outline);
        }

        .sk-input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px rgba(0, 105, 72, 0.12);
        }

        .sk-input.password-input {
          padding-right: 48px;
        }

        .sk-toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-outline);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.2s;
        }

        .sk-toggle-pw:hover {
          color: var(--color-on-surface);
        }

        .sk-toggle-pw .material-symbols-outlined {
          font-size: 20px;
          position: static;
          transform: none;
          pointer-events: auto;
        }

        /* Remember me */
        .sk-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 8px;
        }

        .sk-remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid var(--color-outline-variant);
          accent-color: var(--color-primary);
          cursor: pointer;
          flex-shrink: 0;
        }

        .sk-remember label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: var(--color-on-surface-variant);
          cursor: pointer;
        }

        /* Error banner */
        .sk-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: var(--color-error-container);
          border: 1px solid rgba(186, 26, 26, 0.2);
          border-radius: 10px;
          color: var(--color-on-error-container);
          font-family: 'Inter', sans-serif;
          font-size: 14px;
        }

        .sk-error .material-symbols-outlined {
          font-size: 18px;
          flex-shrink: 0;
          color: var(--color-error);
        }

        /* Submit button */
        .sk-submit {
          width: 100%;
          background: var(--color-primary);
          color: var(--color-on-primary);
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 14px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0, 105, 72, 0.2);
          transition: background 0.2s, box-shadow 0.2s, transform 0.1s;
          margin-top: 16px;
        }

        .sk-submit:hover:not(:disabled) {
          background: var(--color-primary-container);
          box-shadow: 0 6px 24px rgba(0, 105, 72, 0.3);
        }

        .sk-submit:active:not(:disabled) {
          transform: scale(0.98);
        }

        .sk-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .sk-submit .material-symbols-outlined {
          font-size: 20px;
        }

        /* Spinner */
        .sk-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        /* Auxiliary links */
        .sk-aux {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
        }

        .sk-aux p {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: var(--color-on-surface-variant);
          margin: 0;
        }

        .sk-aux a {
          color: var(--color-primary);
          font-weight: 600;
          text-decoration: none;
        }

        .sk-aux a:hover {
          text-decoration: underline;
        }

        .sk-footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
          opacity: 0.6;
          margin-top: 16px;
        }

        .sk-footer-links a {
          font-family: 'Geist', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: var(--color-on-surface);
          text-decoration: none;
          transition: color 0.2s;
        }

        .sk-footer-links a:hover {
          color: var(--color-primary);
        }

        /* ─── Animations ─── */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        @keyframes floatReverse {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sk-body">
        <main className="sk-main">

          {/* ── LEFT: Hero ── */}
          <section className="sk-hero">
            <div className="sk-blueprint" />
            <div className="sk-glow-top" />
            <div className="sk-glow-btm" />

            <div className="sk-logo-wrap">
              <div className="sk-logo-icon">
                <span className="material-symbols-outlined">architecture</span>
              </div>
              <h1 className="sk-logo-text">Smart Konstruksi</h1>
            </div>

            <div className="sk-hero-content">
              <h2 className="sk-display">
                The Modern Operating System for{" "}
                <span className="accent">Construction.</span>
              </h2>
              <p className="sk-hero-sub">
                Streamline your project lifecycle from bid to build with the
                industry&apos;s most advanced ERP, designed for heavy infrastructure
                and urban development.
              </p>

              <div className="sk-mockup-wrap">
                <div className="sk-mockup">
                  <div className="sk-mockup-img" role="img" aria-label="Smart Konstruksi dashboard preview" />
                </div>

                <div className="sk-float-card sk-float-1">
                  <div className="sk-float-icon primary">
                    <span className="material-symbols-outlined">engineering</span>
                  </div>
                  <div className="sk-float-text">
                    <span className="sk-float-label">Active Projects</span>
                    <span className="sk-float-value">120+</span>
                  </div>
                </div>

                <div className="sk-float-card sk-float-2">
                  <div className="sk-float-icon secondary">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div className="sk-float-text">
                    <span className="sk-float-label">Project Value</span>
                    <span className="sk-float-value">Rp12B</span>
                  </div>
                </div>

                <div className="sk-float-card sk-float-3">
                  <div className="sk-float-icon primary">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      verified
                    </span>
                  </div>
                  <div className="sk-float-text">
                    <span className="sk-float-title">98% On Time</span>
                    <div className="sk-progress-bar-bg">
                      <div className="sk-progress-fill" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── RIGHT: Auth ── */}
          <section className="sk-auth">
            <div className="sk-mobile-logo">
              <div className="sk-mob-icon">
                <span className="material-symbols-outlined">architecture</span>
              </div>
              <h1 className="sk-mob-text">Smart Konstruksi</h1>
            </div>

            <div className="sk-auth-wrap">
              <div className="sk-auth-card">
                <div className="sk-auth-header">
                  <h2 className="sk-auth-title">Welcome Back</h2>
                  <p className="sk-auth-sub">
                    Enter your credentials to access your project dashboard.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="sk-form">
                  {error && (
                    <div className="sk-error">
                      <span className="material-symbols-outlined">error</span>
                      {error}
                    </div>
                  )}

                  <div className="sk-field">
                    <label htmlFor="email" className="sk-label">
                      Email Address
                    </label>
                    <div className="sk-input-wrap">
                      <span className="material-symbols-outlined">
                        mail
                      </span>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="name@company.com"
                        required
                        className="sk-input"
                      />
                    </div>
                  </div>

                  <div className="sk-field">
                    <div className="sk-field-header">
                      <label htmlFor="password" className="sk-label">
                        Password
                      </label>
                      <a href="#" className="sk-forgot">
                        Forgot Password?
                      </a>
                    </div>
                    <div className="sk-input-wrap">
                      <span className="material-symbols-outlined">
                        lock
                      </span>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        className="sk-input password-input"
                      />
                      <button
                        type="button"
                        className="sk-toggle-pw"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="sk-remember">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember">
                      Keep me logged in for 30 days
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="sk-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="sk-spinner" />
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign In to Dashboard
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="sk-aux">
                <p>
                  Don&apos;t have an account?{" "}
                  <a href="#">Contact Administrator</a>
                </p>
                <footer className="sk-footer-links">
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Status</a>
                </footer>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
