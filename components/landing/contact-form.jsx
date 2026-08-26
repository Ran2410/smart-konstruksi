"use client";

import { useState } from "react";

const PROJECT_TYPES = [
  "General construction",
  "Renovation & remodeling",
  "Engineering & consultation",
  "Project management",
  "Fit-out & interiors",
  "Maintenance",
  "Other",
];

export default function ContactForm() {
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(result.message || "Your message was not sent. Please try again.");
        return;
      }

      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage("There is a connection problem. Check your network and try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="ks-form ks-form-success" id="contact-form" role="status">
        <span className="material-symbols-outlined" aria-hidden="true">check_circle</span>
        <span className="ks-form-index">REQUEST RECEIVED</span>
        <h3>Thank you.</h3>
        <p>We have received your request. Our team will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form className="ks-form" id="contact-form" onSubmit={handleSubmit}>
      <div className="ks-form-heading">
        <span className="ks-form-index">PROJECT INQUIRY / 01</span>
        <h3>Tell us what you need</h3>
      </div>

      <div className="ks-form-grid">
        <div className="ks-form-field">
          <label htmlFor="cf-name">Full name</label>
          <input id="cf-name" name="fullName" type="text" required placeholder="Your name" autoComplete="name" />
        </div>
        <div className="ks-form-field">
          <label htmlFor="cf-company">Company</label>
          <input id="cf-company" name="company" type="text" placeholder="Optional" autoComplete="organization" />
        </div>
        <div className="ks-form-field">
          <label htmlFor="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" required placeholder="name@company.com" autoComplete="email" />
        </div>
        <div className="ks-form-field">
          <label htmlFor="cf-phone">Phone number</label>
          <input id="cf-phone" name="phone" type="tel" placeholder="+62 ..." autoComplete="tel" />
        </div>
        <div className="ks-form-field ks-form-field-full">
          <label htmlFor="cf-project-type">Project type</label>
          <select id="cf-project-type" name="projectType" required defaultValue="">
            <option value="" disabled>Select a project type</option>
            {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="ks-form-field ks-form-field-full">
          <label htmlFor="cf-message">Project overview</label>
          <textarea
            id="cf-message"
            name="message"
            required
            placeholder="Location, scope, target timeline, or project challenges..."
          />
        </div>
      </div>

      <button type="submit" className="ks-btn ks-btn-dark ks-btn-lg ks-form-submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send request"}
        {status === "loading" ? null : <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>}
      </button>

      {status === "error" ? <p className="ks-form-error" role="alert">{errorMessage}</p> : null}
    </form>
  );
}
