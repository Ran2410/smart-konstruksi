"use client";

import { useState } from "react";
import { T, FONT_DISPLAY, FONT_BODY, FONT_LABEL } from "@/lib/design-tokens";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatRupiahCompact(val) {
  const num = Number(val) || 0;
  if (num >= 1_000_000_000) return `Rp ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `Rp ${(num / 1_000).toFixed(0)}K`;
  return `Rp ${num}`;
}

function formatRupiahFull(val) {
  return (Number(val) || 0).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${T.outlineSoft}`,
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontFamily: FONT_BODY,
        fontSize: "13px",
      }}
    >
      <p style={{ margin: "0 0 8px", fontWeight: 600, color: T.onSurface }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: "2px 0", color: entry.color }}>
          {entry.name}: <strong>{formatRupiahFull(entry.value)}</strong>
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REVENUE TREND (Line Chart) — Payments vs Invoices
// ═══════════════════════════════════════════════════════════════
export function RevenueTrendChart({ data: propData }) {
  const [period, setPeriod] = useState("Month");

  const trendData = propData || {};
  const dataMap = {
    Day: trendData.daily || [],
    Week: trendData.weekly || [],
    Month: trendData.monthly || [],
  };
  const data = dataMap[period] || dataMap.Month;
  const hasData = Array.isArray(data) && data.some((d) => (d?.revenue || 0) > 0 || (d?.sales || 0) > 0);

  const periods = ["Day", "Week", "Month"];

  return (
    <div
      style={{
        background: T.surfaceCard,
        borderRadius: "16px",
        border: `1px solid ${T.outlineSoft}`,
        boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.primary }} />
              <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurface }}>
                Payments
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e" }} />
              <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurface }}>
                Invoices
              </span>
            </div>
          </div>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.outline, margin: 0 }}>
            {period === "Day" ? "Last 14 days" : period === "Week" ? "Last 12 weeks" : "Last 12 months"}
          </p>
        </div>

        {/* Period toggle */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            background: T.surfaceContainerLow,
            borderRadius: "8px",
            padding: "3px",
          }}
        >
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: "6px",
                fontFamily: FONT_LABEL,
                fontSize: "12px",
                fontWeight: period === p ? 600 : 500,
                color: period === p ? "#fff" : T.onSurfaceVariant,
                background: period === p ? T.primary : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div style={{ height: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft }}>monitoring</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.outline, margin: 0 }}>Belum ada data pembayaran / invoice pada periode ini.</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: "220px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.outline, fontSize: 12, fontFamily: FONT_LABEL }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.outline, fontSize: 12, fontFamily: FONT_LABEL }}
                tickFormatter={formatRupiahCompact}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Payments"
                stroke={T.primary}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: T.primary, stroke: "#fff", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                name="Invoices"
                stroke="#1a1a2e"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#1a1a2e", stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY PROFIT (Bar Chart) — Payments vs Invoices per day/week
// ═══════════════════════════════════════════════════════════════
export function WeeklyProfitChart({ data: propData }) {
  const [week, setWeek] = useState("This Week");

  const profitData = propData || {};
  const dataMap = {
    "This Week": profitData.thisWeek || [],
    "Last Week": profitData.lastWeek || [],
    "This Month": profitData.thisMonth || [],
  };
  const data = dataMap[week] || dataMap["This Week"];
  const hasData = Array.isArray(data) && data.some((d) => (d?.sales || 0) > 0 || (d?.revenue || 0) > 0);

  return (
    <div
      style={{
        background: T.surfaceCard,
        borderRadius: "16px",
        border: `1px solid ${T.outlineSoft}`,
        boxShadow: "0 8px 32px rgba(31,38,135,0.07)",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "18px",
            fontWeight: 600,
            color: T.onSurface,
            margin: 0,
          }}
        >
          Payments Overview
        </h3>

        {/* Week selector */}
        <div style={{ position: "relative" }}>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            style={{
              padding: "6px 28px 6px 12px",
              border: `1px solid ${T.outlineSoft}`,
              borderRadius: "8px",
              fontFamily: FONT_LABEL,
              fontSize: "12px",
              fontWeight: 500,
              color: T.onSurface,
              background: "#fff",
              cursor: "pointer",
              appearance: "none",
              outline: "none",
            }}
          >
            <option>This Week</option>
            <option>Last Week</option>
            <option>This Month</option>
          </select>
          <span
            className="material-symbols-outlined"
            style={{
              position: "absolute",
              right: "6px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "16px",
              color: T.outline,
              pointerEvents: "none",
            }}
          >
            expand_more
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.primary }} />
          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 500, color: T.onSurfaceVariant }}>
            Payments
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e" }} />
          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 500, color: T.onSurfaceVariant }}>
            Invoices
          </span>
        </div>
      </div>

      {/* Chart */}
      {!hasData ? (
        <div style={{ height: "200px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "40px", color: T.outlineSoft }}>bar_chart</span>
          <p style={{ fontFamily: FONT_BODY, fontSize: "13px", color: T.outline, margin: 0 }}>Belum ada data pada periode ini.</p>
        </div>
      ) : (
        <div style={{ width: "100%", height: "200px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.outline, fontSize: 12, fontFamily: FONT_LABEL }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: T.outline, fontSize: 12, fontFamily: FONT_LABEL }}
                tickFormatter={formatRupiahCompact}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="sales" name="Payments" fill={T.primary} radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="revenue" name="Invoices" fill="#1a1a2e" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
