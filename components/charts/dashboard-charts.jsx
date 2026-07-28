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

// Fallback generators (used when no prop data at all)
function generateMonthlyData() {
  const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  return months.map((m, i) => ({
    name: m,
    revenue: Math.floor(40 + Math.random() * 60 + i * 5),
    sales: Math.floor(30 + Math.random() * 50 + i * 4),
  }));
}

function generateWeeklyData() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d) => ({
    name: d,
    sales: Math.floor(10 + Math.random() * 40),
    revenue: Math.floor(15 + Math.random() * 45),
  }));
}

function generateDailyData() {
  const now = new Date();
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }));
  }
  return days.map((name, i) => ({
    name,
    sales: Math.floor(5 + Math.random() * 15 + i),
    revenue: Math.floor(8 + Math.random() * 20 + i),
  }));
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
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REVENUE TREND (Line Chart)
// ═══════════════════════════════════════════════════════════════
export function RevenueTrendChart({ data: propData }) {
  const [period, setPeriod] = useState("Month");

  const trendData = propData || {};
  const dataMap = {
    Day: trendData.daily || generateDailyData(),
    Week: trendData.weekly || generateWeeklyData(),
    Month: trendData.monthly || generateMonthlyData(),
  };
  const data = dataMap[period] || dataMap.Month;

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
                Total Revenue
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e" }} />
              <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 600, color: T.onSurface }}>
                Total Sales
              </span>
            </div>
          </div>
          <p style={{ fontFamily: FONT_LABEL, fontSize: "11px", color: T.outline, margin: 0 }}>
            {period === "Day" ? "Last 14 days" : period === "Week" ? "Last 12 weeks" : "01.01.2025 - 12.05.2025"}
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
      <div style={{ width: "100%", height: "220px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={T.primary}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: T.primary, stroke: "#fff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#1a1a2e"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#1a1a2e", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WEEKLY PROFIT (Bar Chart)
// ═══════════════════════════════════════════════════════════════
export function WeeklyProfitChart({ data: propData }) {
  const [week, setWeek] = useState("This Week");

  // propData now comes as { thisWeek: [...], lastWeek: [...], thisMonth: [...] }
  const profitData = propData || {};
  const dataMap = {
    "This Week": profitData.thisWeek || generateWeeklyData(),
    "Last Week": profitData.lastWeek || generateWeeklyData(),
    "This Month": profitData.thisMonth || generateWeeklyData(),
  };
  const data = dataMap[week] || dataMap["This Week"];

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
          Profit this week
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
            Sales
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#1a1a2e" }} />
          <span style={{ fontFamily: FONT_LABEL, fontSize: "12px", fontWeight: 500, color: T.onSurfaceVariant }}>
            Revenue
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
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
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="sales" name="Sales" fill={T.primary} radius={[4, 4, 0, 0]} barSize={20} />
            <Bar dataKey="revenue" name="Revenue" fill="#1a1a2e" radius={[4, 4, 0, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
