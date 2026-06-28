import type { CSSProperties } from "react";

/* ── Palette ── */
export const colors = {
  bg: "#1a1f2e",
  bgSubtle: "#212738",
  surface: "rgba(255,255,255,0.09)",
  surfaceHover: "rgba(255,255,255,0.13)",
  surfaceBright: "rgba(255,255,255,0.16)",
  border: "rgba(255,255,255,0.12)",
  borderHover: "rgba(255,255,255,0.20)",
  borderBright: "rgba(255,255,255,0.18)",
  text: "#edf2f7",
  textSecondary: "rgba(255,255,255,0.60)",
  textMuted: "rgba(255,255,255,0.42)",
  // accents
  cyan: "#0ea5e9",
  cyanRgb: "14,165,233",
  emerald: "#10b981",
  emeraldRgb: "16,185,129",
  amber: "#f59e0b",
  amberRgb: "245,158,11",
  rose: "#f43f5e",
  roseRgb: "244,63,94",
  violet: "#8b5cf6",
  violetRgb: "139,92,246",
} as const;

/* ── Spacing ── */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;

/* ── Radii ── */
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999 } as const;

/* ── Shadows ── */
export const shadows = {
  base: "0 1px 3px rgba(0,0,0,0.22), 0 1px 2px rgba(0,0,0,0.18)",
  raised: "0 4px 16px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
  floating: "0 12px 40px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
  glow: (rgb: string, intensity = 0.25) =>
    `0 4px 20px rgba(${rgb},${intensity}), 0 1px 4px rgba(0,0,0,0.2)`,
  glowHover: (rgb: string, intensity = 0.3) =>
    `0 8px 32px rgba(${rgb},${intensity}), 0 2px 8px rgba(${rgb},${intensity * 0.5}), inset 0 1px 0 rgba(255,255,255,0.06)`,
} as const;

/* ── Motion ── */
export const motion = {
  instant: 0.05,
  fast: 0.1,
  normal: 0.15,
  slow: 0.25,
  easing: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  stagger: 0.025,
  spinner: 0.4,
  pulse: 1,
} as const;

/* ── Glass surfaces ── */
export const glass: CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(10px) saturate(150%)",
  WebkitBackdropFilter: "blur(10px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: shadows.raised,
  borderRadius: radius.xl,
};

export const glassElevated: CSSProperties = {
  background: "rgba(255,255,255,0.13)",
  backdropFilter: "blur(24px) saturate(200%)",
  WebkitBackdropFilter: "blur(24px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: shadows.floating,
  borderRadius: radius.xl,
};

export const glassInput: CSSProperties = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: radius.md,
  color: colors.text,
};

export const glassNeural: CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(28px) saturate(200%)",
  WebkitBackdropFilter: "blur(28px) saturate(200%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow:
    "0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(255,255,255,0.02)",
  borderRadius: radius.xl,
};
