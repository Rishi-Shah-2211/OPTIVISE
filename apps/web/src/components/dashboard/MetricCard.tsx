"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Sparkline } from "./SparkLine";
import { useAnimatedCounter } from "@/lib/animations/counter";
import type { MetricCardConfig, AccentColor } from "@/types/dashboard";

const ICONS: Record<string, React.ElementType> = { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp };

type AccentTokens = { border: string; glowRgb: string; text: string; iconBg: string; badge: string; bgTint: string };

const ACCENTS: Record<AccentColor, AccentTokens> = {
  cyan:    { border: "rgba(14,165,233,0.20)",  glowRgb: "14,165,233",  text: "#0ea5e9", iconBg: "rgba(14,165,233,0.12)",  badge: "rgba(14,165,233,0.12)",  bgTint: "rgba(14,165,233,0.04)"  },
  amber:   { border: "rgba(245,158,11,0.20)",  glowRgb: "245,158,11",  text: "#f59e0b", iconBg: "rgba(245,158,11,0.12)",  badge: "rgba(245,158,11,0.12)",  bgTint: "rgba(245,158,11,0.04)"  },
  rose:    { border: "rgba(244,63,94,0.20)",   glowRgb: "244,63,94",   text: "#f43f5e", iconBg: "rgba(244,63,94,0.10)",   badge: "rgba(244,63,94,0.10)",   bgTint: "rgba(244,63,94,0.04)"   },
  emerald: { border: "rgba(16,185,129,0.18)",  glowRgb: "16,185,129",  text: "#10b981", iconBg: "rgba(16,185,129,0.12)",  badge: "rgba(16,185,129,0.12)",  bgTint: "rgba(16,185,129,0.04)"  },
  violet:  { border: "rgba(139,92,246,0.18)",  glowRgb: "139,92,246",  text: "#8b5cf6", iconBg: "rgba(139,92,246,0.10)",  badge: "rgba(139,92,246,0.10)",  bgTint: "rgba(139,92,246,0.04)"  },
};

function fmtValue(v: number, unit: string): string {
  if (unit === "%" || unit === "days") return v.toFixed(1);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
}

function TrendBadge({ trend, accent }: { trend: "up" | "down" | "neutral"; accent: AccentColor }) {
  const { badge, text } = ACCENTS[accent];
  const label = trend === "up" ? "↑ Rising" : trend === "down" ? "↓ Watch" : "→ Stable";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: badge, color: text, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {label}
    </span>
  );
}

export function MetricCard({ config, index }: { config: MetricCardConfig; index: number }) {
  const { title, rawValue, unit, description, accent, icon, trend, sparkData } = config;
  const a = ACCENTS[accent];
  const Icon = ICONS[icon] ?? Package;
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const { ref: counterRef, displayValue } = useAnimatedCounter(rawValue, {
    duration: 600,
    format: (v) => fmtValue(v, unit),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.225, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -3,
        boxShadow: `0 10px 40px rgba(${a.glowRgb},0.22), 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`,
        borderColor: a.border,
      }}
      onClick={() => router.push(`/dashboard/${config.id}`)}
      className="group shimmer-card glass-noise"
      style={{
        position: "relative", overflow: "hidden", borderRadius: 20,
        padding: 20, display: "flex", flexDirection: "column", gap: 14,
        cursor: "pointer",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
        transition: "all 0.22s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Corner glow */}
      <motion.div
        animate={{ scale: hovered ? 1.5 : 1, opacity: hovered ? 1 : 0.6 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, rgba(${a.glowRgb},0.15) 0%, transparent 70%)` }}
      />

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: a.iconBg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid rgba(${a.glowRgb},0.15)` }}>
          <Icon size={16} style={{ color: a.text }} strokeWidth={1.9} />
        </div>
        <TrendBadge trend={trend} accent={accent} />
      </div>

      {/* Value */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
          <span ref={counterRef as React.Ref<HTMLSpanElement>} style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
            {displayValue}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: a.text }}>{unit}</span>
        </div>
        <p style={{ fontSize: 13, marginTop: 6, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{title}</p>
        <p style={{ fontSize: 11, marginTop: 2, color: "rgba(255,255,255,0.42)" }}>{description}</p>
      </div>

      {/* Sparkline + hint */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Sparkline data={sparkData} accent={accent} width={100} height={32} />
        <span style={{ fontSize: 10, fontWeight: 600, color: a.text, display: "flex", alignItems: "center", gap: 3, opacity: 0, transition: "opacity 0.15s ease" }}
          className="group-hover:opacity-100">
          Details <ArrowRight size={10} strokeWidth={2.5} />
        </span>
      </div>

      {/* Bottom line */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgba(${a.glowRgb},0.5), transparent)` }} />
    </motion.div>
  );
}
