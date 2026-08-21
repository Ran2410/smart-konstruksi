"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { T, FONT_BODY, FONT_DISPLAY, FONT_LABEL } from "@/lib/design-tokens";

type Project = {
  id: string;
  code: string;
  name: string;
  status: string;
  branch?: { name: string } | null;
  projectManager?: { name: string } | null;
  siteManager?: { name: string } | null;
  _count?: { members?: number; tasks?: number };
};

const statusLabels: Record<string, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function ResourceAllocationPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/projects?limit=100")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load project resources");
        return response.json();
      })
      .then((payload) => {
        if (active) setProjects(payload.data || []);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Failed to load project resources");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(
    () => ({
      assigned: projects.filter((project) => project.projectManager).length,
      members: projects.reduce((sum, project) => sum + (project._count?.members || 0), 0),
    }),
    [projects]
  );

  return (
    <div className="sk-resources-page">
      <style>{`
        .sk-resources-page { display: flex; flex-direction: column; gap: 24px; }
        .sk-resource-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .sk-resource-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .sk-resource-card { min-width: 0; }
        @media (max-width: 900px) { .sk-resource-list { grid-template-columns: 1fr; } }
        @media (max-width: 640px) {
          .sk-resource-summary { grid-template-columns: 1fr; gap: 10px; }
          .sk-resource-card { padding: 18px !important; }
          .sk-resource-title-row { align-items: flex-start !important; flex-direction: column; }
        }
      `}</style>

      <header>
        <p style={{ fontFamily: FONT_LABEL, color: T.primary, fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Project operations
        </p>
        <h1 style={{ fontFamily: FONT_DISPLAY, color: T.onSurface, fontSize: 28, margin: "4px 0" }}>Resource Allocation</h1>
        <p style={{ fontFamily: FONT_BODY, color: T.onSurfaceMuted, fontSize: 14, margin: 0 }}>
          Review project ownership and team coverage from one place.
        </p>
      </header>

      <section className="sk-resource-summary">
        {[
          ["architecture", projects.length, "Visible projects"],
          ["engineering", totals.assigned, "PM assigned"],
          ["groups", totals.members, "Team members"],
        ].map(([icon, value, label]) => (
          <div key={String(label)} style={{ background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: 14, padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
            <span className="material-symbols-outlined" style={{ color: T.primary, background: T.primaryLight, borderRadius: 10, padding: 10 }}>{icon}</span>
            <div>
              <strong style={{ display: "block", fontFamily: FONT_DISPLAY, color: T.onSurface, fontSize: 24 }}>{value}</strong>
              <span style={{ fontFamily: FONT_LABEL, color: T.onSurfaceMuted, fontSize: 12 }}>{label}</span>
            </div>
          </div>
        ))}
      </section>

      {loading && <p style={{ fontFamily: FONT_BODY, color: T.onSurfaceMuted }}>Loading resource allocation…</p>}
      {error && <p role="alert" style={{ fontFamily: FONT_BODY, color: T.error }}>{error}</p>}

      {!loading && !error && (
        <section className="sk-resource-list">
          {projects.map((project) => (
            <article key={project.id} className="sk-resource-card" style={{ background: T.surfaceCard, border: `1px solid ${T.outlineSoft}`, borderRadius: 16, padding: 22, boxShadow: "0 4px 16px rgba(31,38,135,0.05)" }}>
              <div className="sk-resource-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontFamily: FONT_LABEL, color: T.primary, fontSize: 11, fontWeight: 700 }}>{project.code}</span>
                  <h2 style={{ fontFamily: FONT_DISPLAY, color: T.onSurface, fontSize: 18, margin: "3px 0 0", overflowWrap: "anywhere" }}>{project.name}</h2>
                </div>
                <span style={{ flexShrink: 0, fontFamily: FONT_LABEL, fontSize: 11, fontWeight: 600, color: T.primary, background: T.primaryLight, padding: "5px 9px", borderRadius: 999 }}>
                  {statusLabels[project.status] || project.status}
                </span>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 20 }}>
                <ResourceRow icon="person" label="Project manager" value={project.projectManager?.name || "Not assigned"} />
                <ResourceRow icon="engineering" label="Site manager" value={project.siteManager?.name || "Not assigned"} />
                <ResourceRow icon="domain" label="Branch" value={project.branch?.name || "Not assigned"} />
                <ResourceRow icon="groups" label="Team" value={`${project._count?.members || 0} members`} />
              </div>
              <Link href={`/dashboard/projects/${project.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, color: T.primary, fontFamily: FONT_LABEL, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                Open project <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
              </Link>
            </article>
          ))}
          {projects.length === 0 && <p style={{ fontFamily: FONT_BODY, color: T.onSurfaceMuted }}>No projects are available for your account.</p>}
        </section>
      )}
    </div>
  );
}

function ResourceRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "22px minmax(105px, auto) 1fr", alignItems: "center", gap: 8, minWidth: 0 }}>
      <span className="material-symbols-outlined" style={{ color: T.onSurfaceMuted, fontSize: 18 }}>{icon}</span>
      <span style={{ fontFamily: FONT_LABEL, color: T.onSurfaceMuted, fontSize: 12 }}>{label}</span>
      <strong style={{ fontFamily: FONT_BODY, color: T.onSurface, fontSize: 13, textAlign: "right", overflowWrap: "anywhere" }}>{value}</strong>
    </div>
  );
}
