"use client";

import { useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp, ArrowRight } from "lucide-react";
import { Sparkline } from "./SparkLine";
import type { MetricCardConfig, AccentColor } from "@/types/dashboard";

const ICONS: Record<string, React.ElementType> = { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp };

type AccentTokens = { border: string; glowRgb: string; text: string; iconBg: string; badge: string; bgTint: string };

const ACCENTS: Record<AccentColor, AccentTokens> = {
  cyan:    { border: "rgba(2,132,199,0.22)",   glowRgb: "2,132,199",   text: "#0284c7", iconBg: "rgba(2,132,199,0.10)",   badge: "rgba(2,132,199,0.10)",   bgTint: "rgba(2,132,199,0.03)"   },
  amber:   { border: "rgba(217,119,6,0.22)",   glowRgb: "217,119,6",   text: "#d97706", iconBg: "rgba(217,119,6,0.10)",   badge: "rgba(217,119,6,0.10)",   bgTint: "rgba(217,119,6,0.03)"   },
  rose:    { border: "rgba(225,29,72,0.22)",   glowRgb: "225,29,72",   text: "#e11d48", iconBg: "rgba(225,29,72,0.09)",   badge: "rgba(225,29,72,0.09)",   bgTint: "rgba(225,29,72,0.03)"   },
  emerald: { border: "rgba(5,150,105,0.20)",   glowRgb: "5,150,105",   text: "#059669", iconBg: "rgba(5,150,105,0.10)",  badge: "rgba(5,150,105,0.10)",  bgTint: "rgba(5,150,105,0.03)"  },
  violet:  { border: "rgba(124,58,237,0.20)",  glowRgb: "124,58,237",  text: "#7c3aed", iconBg: "rgba(124,58,237,0.09)", badge: "rgba(124,58,237,0.09)", bgTint: "rgba(124,58,237,0.03)" },
};

function fmtValue(v: number, unit: string): string {
  if (unit === "%" || unit === "days") return v.toFixed(1);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
}

function AnimatedValue({ value, unit }: { value: number; unit: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    if (!ref.current) return;
    const from = prevRef.current;
    prevRef.current = value;

    if (from === value) {
      ref.current.textContent = fmtValue(value, unit);
      return;
    }

    const ctrl = animate(from, value, {
      duration: 1.4,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(latest) {
        if (!ref.current) return;
        ref.current.textContent = fmtValue(latest, unit);
      },
    });
    return ctrl.stop;
  }, [value, unit]);

  return <span ref={ref}>{fmtValue(value, unit)}</span>;
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={() => router.push(`/dashboard/${config.id}`)}
      className="group"
      style={{
        position: "relative", overflow: "hidden", borderRadius: 20,
        padding: 20, display: "flex", flexDirection: "column", gap: 14,
        cursor: "pointer",
        background: `rgba(255,255,255,0.78)`,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: `1px solid rgba(255,255,255,0.92)`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
        transition: "all 0.22s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 10px 40px rgba(${a.glowRgb},0.18), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)`;
        el.style.borderColor = a.border;
        el.style.transform = "translateY(-3px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)";
        el.style.borderColor = "rgba(255,255,255,0.92)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Corner glow */}
      <div style={{ position: "absolute", top: -16, right: -16, width: 64, height: 64, borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, rgba(${a.glowRgb},0.20) 0%, transparent 70%)` }} />

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
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 30, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
            <AnimatedValue value={rawValue} unit={unit} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: a.text }}>{unit}</span>
        </div>
        <p style={{ fontSize: 13, marginTop: 6, fontWeight: 600, color: "#374151" }}>{title}</p>
        <p style={{ fontSize: 11, marginTop: 2, color: "#9CA3AF" }}>{description}</p>
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