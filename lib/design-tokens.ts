// ============================================================
// Smart Konstruksi — Design Tokens
// Single source of truth for all design values.
// Import these constants instead of redefining inline.
// ============================================================

// ── Colors ────────────────────────────────────────────────
export const T = {
  primary: "#004f35",
  primaryHover: "#003d29",
  primaryLight: "rgba(0,79,53,0.08)",
  primaryMedium: "rgba(0,79,53,0.15)",
  primaryGlow: "rgba(0,79,53,0.12)",

  secondary: "#565e74",
  secondaryContainer: "#d7dff9",

  onSurface: "#0b1c30",
  onSurfaceVariant: "#3f4943",
  onSurfaceMuted: "#6f7a72",

  outline: "#6f7a72",
  outlineSoft: "#bec9c1",
  outlineVariant: "#dce9ff",

  surfaceCard: "#ffffff",
  surfaceContainer: "#e5eeff",
  surfaceContainerLow: "#eff4ff",
  surfaceContainerHigh: "#dce9ff",

  error: "#ba1a1a",
  errorContainer: "rgba(255,218,214,0.2)",
  errorLight: "rgba(186,26,26,0.08)",

  warning: "#b45309",
  warningBg: "rgba(253,230,138,0.3)",
  warningLight: "rgba(253,230,138,0.15)",

  success: "#15803d",
  successBg: "rgba(220,252,231,0.6)",
  successLight: "rgba(220,252,231,0.3)",

  info: "#2563eb",
  infoLight: "rgba(219,234,254,0.6)",
  infoMedium: "rgba(37,99,235,0.1)",

  tertiary: "#424545",
  tertiaryFixed: "#d4e8dc",

  muted: "#6f7a72",
  mutedBg: "rgba(111,122,114,0.08)",

  // Font aliases (backward compat with old T.fontLabel usage)
  fontDisplay: "var(--font-hanken-grotesk), sans-serif",
  fontBody: "var(--font-inter), sans-serif",
  fontLabel: "var(--font-geist-sans), sans-serif",
} as const;

// ── Fonts ─────────────────────────────────────────────────
export const FONT_DISPLAY = "var(--font-hanken-grotesk), sans-serif";
export const FONT_BODY = "var(--font-inter), sans-serif";
export const FONT_LABEL = "var(--font-geist-sans), sans-serif";

// ── Spacing ───────────────────────────────────────────────
export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "40px",
} as const;

// ── Border Radius ─────────────────────────────────────────
export const RADIUS = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "20px",
} as const;

// ── Shadows ───────────────────────────────────────────────
export const SHADOWS = {
  card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  elevated: "0 4px 12px rgba(0,0,0,0.08)",
  modal:
    "0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
  dropdown: "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
} as const;
