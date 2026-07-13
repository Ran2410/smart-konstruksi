"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// ── Design Tokens ───────────────────────────────────────
const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  primaryMedium: "rgba(0,79,53,0.15)",
  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#5a6560",
  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  surfaceCard: "#ffffff",
  surfaceContainerLow: "#f5f8f6",
  surfaceContainerHigh: "#eef2ef",
  error: "#ba1a1a",
  errorLight: "rgba(255,218,214,0.4)",
  success: "#15803d",
  fontDisplay: "'Hanken Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontLabel: "'Geist', monospace",
};

const cardStyle: React.CSSProperties = {
  background: T.surfaceCard,
  borderRadius: "20px",
  border: `1px solid rgba(190,201,193,0.25)`,
  boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.04)",
  padding: "24px",
};

// ── Props ───────────────────────────────────────────────
interface Report {
  id: string;
  percentage: number;
  reportDate: string;
  description: string;
}

interface ProgressChartProps {
  reports: Report[];
}

// ── Custom Tooltip ──────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: Report }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;

  return (
    <div
      style={{
        background: T.surfaceCard,
        borderRadius: "12px",
        border: `1px solid ${T.outlineSoft}44`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        padding: "12px 16px",
        minWidth: "160px",
      }}
    >
      <p
        style={{
          fontFamily: T.fontLabel,
          fontSize: "11px",
          fontWeight: 600,
          color: T.onSurfaceMuted,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          margin: "0 0 6px",
        }}
      >
        {new Date(data.reportDate).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
      <p
        style={{
          fontFamily: T.fontLabel,
          fontSize: "20px",
          fontWeight: 700,
          color: T.primary,
          margin: "0 0 4px",
        }}
      >
        {data.percentage}%
      </p>
      {data.description && (
        <p
          style={{
            fontFamily: T.fontBody,
            fontSize: "12px",
            color: T.onSurfaceVariant,
            margin: 0,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {data.description}
        </p>
      )}
    </div>
  );
}

// ── Component ───────────────────────────────────────────
export function ProgressChart({ reports }: ProgressChartProps) {
  // ── Empty state ──
  if (!reports || reports.length === 0) {
    return (
      <div style={cardStyle}>
        <div
          style={{
            textAlign: "center",
            padding: "48px 16px",
            color: T.onSurfaceMuted,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: "56px",
              color: T.outlineSoft,
              display: "block",
              marginBottom: "12px",
            }}
          >
            monitoring
          </span>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: "15px",
              color: T.onSurfaceMuted,
              margin: "0 0 8px",
            }}
          >
            Belum ada data progress
          </p>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: "13px",
              color: T.outlineSoft,
              margin: 0,
            }}
          >
            Laporan progress akan ditampilkan dalam grafik
          </p>
        </div>
      </div>
    );
  }

  // ── Sort reports by date ascending ──
  const sorted = [...reports].sort(
    (a, b) => new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
  );

  // ── Format tick date ──
  const formatXAxis = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={cardStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: T.primaryLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "20px", color: T.primary }}
          >
            trending_up
          </span>
        </div>
        <div>
          <h3
            style={{
              fontFamily: T.fontDisplay,
              fontSize: "16px",
              fontWeight: 700,
              color: T.onSurface,
              margin: 0,
            }}
          >
            Progress Trend
          </h3>
          <p
            style={{
              fontFamily: T.fontBody,
              fontSize: "12px",
              color: T.onSurfaceMuted,
              margin: "2px 0 0",
            }}
          >
            {reports.length} report{reports.length !== 1 ? "s" : ""} over time
          </p>
        </div>
      </div>

      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={sorted}
            margin={{ top: 8, right: 16, left: -8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={T.outlineSoft}
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="reportDate"
              tickFormatter={formatXAxis}
              tick={{
                fontFamily: T.fontLabel,
                fontSize: 11,
                fill: T.onSurfaceMuted,
              }}
              axisLine={{ stroke: T.outlineSoft, strokeOpacity: 0.3 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fontFamily: T.fontLabel,
                fontSize: 11,
                fill: T.onSurfaceMuted,
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${v}%`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: T.outlineSoft, strokeDasharray: "3 3" }} />
            <Line
              type="monotone"
              dataKey="percentage"
              stroke={T.primary}
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: T.surfaceCard,
                stroke: T.primary,
                strokeWidth: 2.5,
              }}
              activeDot={{
                r: 6,
                fill: T.primary,
                stroke: T.surfaceCard,
                strokeWidth: 2.5,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
