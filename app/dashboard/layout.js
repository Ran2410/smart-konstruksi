import { DashboardShell } from "@/components/layout/dashboard-shell";

export const metadata = {
  title: "Smart Konstruksi | Dashboard",
  description: "Construction Management Platform",
};

export default function DashboardLayout({ children }) {
  return (
    <>
      <style>{`
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

        .sk-bg-pattern {
          background-color: #f8f9ff;
          background-image: radial-gradient(#e5e7eb 0.5px, transparent 0.5px);
          background-size: 24px 24px;
          min-height: 100vh;
        }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #bec9c1; border-radius: 10px; }
      `}</style>

      <div className="sk-bg-pattern">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </>
  );
}
