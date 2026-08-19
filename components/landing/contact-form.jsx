"use client";

import { useState } from "react";

// Contact form — submits to /api/contact which sends an email to the
// company address configured in CompanyProfile (Settings).
const PROJECT_TYPES = [
  "General Construction",
  "Renovation & Remodeling",
  "Engineering & Consultation",
  "Project Management",
  "Fit-Out & Interior Works",
  "Maintenance & Aftercare",
  "Other",
];

export default function ContactForm({ email = "info@ksi.co.id" }) {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const payload = {
      fullName: String(data.get("fullName") || "").trim(),
      company: String(data.get("company") || "").trim() || undefined,
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim() || undefined,
      projectType: String(data.get("projectType") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(result.message || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div
        className="ks-form ks-form-success"
        id="contact-form"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 12,
          minHeight: 280,
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 40, color: "var(--ks-primary)" }}
        >
          check_circle
        </span>
        <h3 style={{ fontFamily: "var(--font-heading, 'Hanken Grotesk')", fontSize: 22, margin: 0 }}>
          Thank you.
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: "var(--ks-muted)", margin: 0 }}>
          We will contact you soon.
        </p>
      </div>
    );
  }

  return (
    <form className="ks-form" id="contact-form" onSubmit={handleSubmit}>
      <div className="ks-form-grid">
        <div className="ks-form-field">
          <label className="ks-form-label" htmlFor="cf-name">
            Full Name
          </label>
          <input
            id="cf-name"
            name="fullName"
            className="ks-form-input"
            type="text"
            required
            placeholder="Your name"
            autoComplete="name"
          />
        </div>

        <div className="ks-form-field">
          <label className="ks-form-label" htmlFor="cf-company">
            Company
          </label>
          <input
            id="cf-company"
            name="company"
            className="ks-form-input"
            type="text"
            placeholder="Company (optional)"
            autoComplete="organization"
          />
        </div>

        <div className="ks-form-field">
          <label className="ks-form-label" htmlFor="cf-email">
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            className="ks-form-input"
            type="email"
            required
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="ks-form-field">
          <label className="ks-form-label" htmlFor="cf-phone">
            Phone
          </label>
          <input
            id="cf-phone"
            name="phone"
            className="ks-form-input"
            type="tel"
            placeholder="+62 ..."
            autoComplete="tel"
          />
        </div>

        <div className="ks-form-field ks-form-field--full">
          <label className="ks-form-label" htmlFor="cf-project-type">
            Project Type
          </label>
          <select
            id="cf-project-type"
            name="projectType"
            className="ks-form-select"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select a project type
            </option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="ks-form-field ks-form-field--full">
          <label className="ks-form-label" htmlFor="cf-message">
            Message
          </label>
          <textarea
            id="cf-message"
            name="message"
            className="ks-form-textarea"
            required
            placeholder="Tell us about your project…"
          />
        </div>
      </div>

      <button
        type="submit"
        className="ks-btn ks-btn-primary ks-btn-lg ks-form-submit"
        disabled={status === "loading"}
        style={status === "loading" ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
      >
        {status === "loading" ? "Sending..." : "Send Request"}
        {status === "loading" ? null : (
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            arrow_forward
          </span>
        )}
      </button>

      {status === "error" && (
        <p
          role="alert"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: "#dc2626",
            margin: "16px 0 0",
          }}
        >
          {errorMessage}
        </p>
      )}
    </form>
  );
}
