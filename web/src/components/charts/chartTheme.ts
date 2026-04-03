import type { CSSProperties } from "react";
import { motion } from "@/lib/ui/system";

/* ── Shared axis & grid config ── */
export const axisTickStyle = { fontSize: 10, fill: "rgba(255,255,255,0.48)" };
export const axisProps = { axisLine: false, tickLine: false } as const;

export const gridProps = {
  strokeDasharray: "3 3",
  stroke: "rgba(255,255,255,0.08)",
  vertical: false,
} as const;

/* ── Tooltip glass ── */
export const tooltipStyle: CSSProperties = {
  background: "rgba(30,35,50,0.95)",
  backdropFilter: "blur(16px) saturate(180%)",
  WebkitBackdropFilter: "blur(16px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 14,
  boxShadow: "0 8px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
  padding: "10px 14px",
  fontSize: 12,
  color: "#edf2f7",
};

/* ── Animation props for <Bar>, <Area>, <Pie> ── */
export const animationProps = {
  isAnimationActive: true,
  animationDuration: motion.slow * 2200,
  animationEasing: "ease-in-out" as const,
  animationBegin: 0,
};

export const staggeredAnimationProps = (index: number) => ({
  ...animationProps,
  animationBegin: index * motion.stagger * 1600,
});

/* ── Chart container wrapper style ── */
export const chartContainerGlass: CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 20,
  boxShadow:
    "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
  padding: 20,
};

/* ── Hover variant (merge with container) ── */
export const chartHoverMotion = {
  whileHover: {
    y: -2,
    boxShadow:
      "0 12px 40px rgba(0,0,0,0.30), 0 4px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  transition: { duration: motion.normal },
} as const;

export const chartPerspectiveHover = {
  whileHover: {
    y: -2,
    boxShadow: "0 16px 48px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
  },
  transition: { type: "spring" as const, stiffness: 400, damping: 25 },
} as const;

/* ── Gradient palette for charts ── */
export const chartGradients = {
  cyan: { start: "#22d3ee", end: "#0284c7", startOpacity: 0.85, endOpacity: 0.35 },
  emerald: { start: "#34d399", end: "#059669", startOpacity: 0.85, endOpacity: 0.35 },
  amber: { start: "#fbbf24", end: "#d97706", startOpacity: 0.85, endOpacity: 0.35 },
  violet: { start: "#a78bfa", end: "#7c3aed", startOpacity: 0.85, endOpacity: 0.35 },
  rose: { start: "#fb7185", end: "#e11d48", startOpacity: 0.85, endOpacity: 0.35 },
} as const;
