"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";

const card: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "16px",
  border: `1px solid ${T.outlineSoft}33`,
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  padding: "32px",
  maxWidth: 600,
};

export default function CreateRABPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [leads, setLeads] = useState<any[]>([]);
  const [leadId, setLeadId] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [marginPercent, setMarginPercent] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Fetch leads for dropdown
  useEffect(() => {
    fetch("/api/leads?limit=100", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        setLeads(json.data || []);
      })
      .catch(() => {})
      .finally(() => setLoadingLeads(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) { setError("Please select a lead"); return; }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/rab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, title, notes: notes || null, marginPercent }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create RAB");
      }

      const rab = await res.json();
      router.push(`/dashboard/rab/${rab.data?.id || rab.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedLead = leads.find((l) => l.id === leadId);

  return (
    <div style={{ padding: "24px 32px", maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <Link href="/dashboard/rab" style={{ color: T.onSurfaceMuted, textDecoration: "none", display: "flex" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>arrow_back</span>
        </Link>
        <div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "24px", fontWeight: 700, color: T.onSurface, margin: 0 }}>New RAB</h1>
          <p style={{ fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted, margin: "4px 0 0" }}>
            Create a Rencana Anggaran Biaya from a lead
          </p>
        </div>
      </div>

      <div style={card}>
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: "10px", background: "rgba(255,218,214,0.3)",
            border: "1px solid rgba(186,26,26,0.2)", color: T.error,
            fontFamily: T.fontBody, fontSize: "13px", marginBottom: "20px",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Lead Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, display: "block", marginBottom: "6px" }}>
              Lead <span style={{ color: T.error }}>*</span>
            </label>
            {loadingLeads ? (
              <div style={{ padding: "10px 14px", fontFamily: T.fontBody, fontSize: "13px", color: T.onSurfaceMuted }}>Loading leads...</div>
            ) : (
              <select
                value={leadId}
                onChange={(e) => {
                  setLeadId(e.target.value);
                  const lead = leads.find((l) => l.id === e.target.value);
                  if (lead && !title) setTitle(lead.name);
                }}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "10px",
                  border: `1px solid ${T.outlineSoft}55`, fontFamily: T.fontBody, fontSize: "13px",
                  color: T.onSurface, background: T.surfaceCard, cursor: "pointer", outline: "none",
                  boxSizing: "border-box",
                }}
                required
              >
                <option value="">Select a lead...</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} {lead.company ? `(${lead.company})` : ""} — {lead.status}
                  </option>
                ))}
              </select>
            )}
            {selectedLead && (
              <div style={{ marginTop: "8px", padding: "10px 14px", background: T.surfaceContainerLow, borderRadius: "8px", fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceVariant }}>
                <strong>Location:</strong> {selectedLead.location || "—"} &middot; <strong>Project Type:</strong> {selectedLead.type || "—"}
              </div>
            )}
          </div>

          {/* RAB Title */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, display: "block", marginBottom: "6px" }}>
              RAB Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-filled from lead name"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: `1px solid ${T.outlineSoft}55`, fontFamily: T.fontBody, fontSize: "13px",
                color: T.onSurface, background: T.surfaceCard, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, display: "block", marginBottom: "6px" }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this RAB..."
              rows={3}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "10px",
                border: `1px solid ${T.outlineSoft}55`, fontFamily: T.fontBody, fontSize: "13px",
                color: T.onSurface, background: T.surfaceCard, outline: "none", resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Markup / Margin */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontFamily: T.fontLabel, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: T.onSurfaceMuted, display: "block", marginBottom: "6px" }}>
              Overhead & Profit Margin (%)
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <input
                type="number"
                min={0}
                max={100}
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value))}
                style={{
                  width: "100px", padding: "10px 14px", borderRadius: "10px",
                  border: `1px solid ${T.outlineSoft}55`, fontFamily: T.fontLabel, fontSize: "13px",
                  color: T.onSurface, background: T.surfaceCard, outline: "none",
                  textAlign: "center", boxSizing: "border-box",
                }}
              />
              <span style={{ fontFamily: T.fontBody, fontSize: "12px", color: T.onSurfaceMuted }}>
                Standard construction margin typically 10–20%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link href="/dashboard/rab" style={{
              padding: "10px 24px", borderRadius: "12px",
              border: `1px solid ${T.outlineSoft}55`,
              fontFamily: T.fontBody, fontSize: "13px", fontWeight: 500,
              color: T.onSurface, textDecoration: "none", transition: "all 0.15s",
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} style={{
              padding: "10px 24px", borderRadius: "12px",
              background: T.primary, color: "#fff", border: "none",
              fontFamily: T.fontBody, fontSize: "13px", fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1,
              transition: "all 0.15s",
            }}>
              {submitting ? "Creating..." : "Create RAB"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
