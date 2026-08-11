"use client";

// UI-only contact form. On submit it opens the visitor's mail client with a
// pre-filled message to the company email (from CompanyProfile settings) —
// no backend, no fake "sent" state.
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
  function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const fullName = String(data.get("fullName") || "").trim();
    const company = String(data.get("company") || "").trim();
    const formEmail = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const projectType = String(data.get("projectType") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = `New project inquiry — ${fullName}${company ? ` (${company})` : ""}`;
    const body = [
      `Name: ${fullName}`,
      `Company: ${company || "—"}`,
      `Email: ${formEmail}`,
      `Phone: ${phone || "—"}`,
      `Project type: ${projectType}`,
      "",
      "Message:",
      message,
    ].join("\n");

    window.location.href = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
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

      <button type="submit" className="ks-btn ks-btn-primary ks-btn-lg ks-form-submit">
        Send Request
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          arrow_forward
        </span>
      </button>
    </form>
  );
}
