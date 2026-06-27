"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp, ArrowRight } from "lucide-react";
import { useState, useRef } from "react";
import { Sparkline } from "./SparkLine";
import { useAnimatedCounter } from "@/lib/animations/counter";
import type { MetricCardConfig, AccentColor } from "@/types/dashboard";

const ICONS: Record<string, React.ElementType> = { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp };

type AccentTokens = {
  border: string;
  glowRgb: string;
  text: string;
  iconBg: string;
  badge: string;
  bgTint: string;
  beam: string;
  halo: string;
};

const ACCENTS: Record<AccentColor, AccentTokens> = {
  cyan: {
    border: "rgba(31,122,92,0.20)",
    glowRgb: "14,165,233",
    text: "#1f7a5c",
    iconBg: "rgba(31,122,92,0.12)",
    badge: "rgba(31,122,92,0.12)",
    bgTint: "rgba(31,122,92,0.04)",
    beam: "rgba(168,216,194,0.18)",
    halo: "rgba(31,122,92,0.22)",
  },
  amber: {
    border: "rgba(200,106,51,0.20)",
    glowRgb: "245,158,11",
    text: "#c86a33",
    iconBg: "rgba(200,106,51,0.12)",
    badge: "rgba(200,106,51,0.12)",
    bgTint: "rgba(200,106,51,0.04)",
    beam: "rgba(245,217,193,0.14)",
    halo: "rgba(200,106,51,0.20)",
  },
  rose: {
    border: "rgba(192,73,47,0.20)",
    glowRgb: "244,63,94",
    text: "#c0492f",
    iconBg: "rgba(192,73,47,0.10)",
    badge: "rgba(192,73,47,0.10)",
    bgTint: "rgba(192,73,47,0.04)",
    beam: "rgba(212,119,95,0.14)",
    halo: "rgba(192,73,47,0.18)",
  },
  emerald: {
    border: "rgba(31,122,92,0.18)",
    glowRgb: "16,185,129",
    text: "#1f7a5c",
    iconBg: "rgba(31,122,92,0.12)",
    badge: "rgba(31,122,92,0.12)",
    bgTint: "rgba(31,122,92,0.04)",
    beam: "rgba(168,216,194,0.14)",
    halo: "rgba(31,122,92,0.18)",
  },
  violet: {
    border: "rgba(200,106,51,0.18)",
    glowRgb: "139,92,246",
    text: "#c86a33",
    iconBg: "rgba(200,106,51,0.10)",
    badge: "rgba(200,106,51,0.10)",
    bgTint: "rgba(200,106,51,0.04)",
    beam: "rgba(245,217,193,0.14)",
    halo: "rgba(200,106,51,0.20)",
  },
};

function fmtValue(v: number, unit: string): string {
  if (unit === "%" || unit === "days") return v.toFixed(1);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return Math.round(v).toLocaleString();
}

function TrendBadge({ trend, accent }: { trend: "up" | "down" | "neutral"; accent: AccentColor }) {
  const token = ACCENTS[accent];
  const label = trend === "up" ? "Rising" : trend === "down" ? "Watch" : "Stable";
  const symbol = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        padding: "4px 9px",
        borderRadius: 999,
        background: `linear-gradient(135deg, ${token.badge}, rgba(62,70,54,0.08))`,
        color: token.text,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        border: `1px solid rgba(${token.glowRgb},0.16)`,
        boxShadow: `inset 0 1px 0 rgba(255,250,241,0.7), 0 2px 12px rgba(${token.glowRgb},0.10)`,
      }}
    >
      <span>{symbol}</span>
      <span>{label}</span>
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

  // ── Mouse-follow 3D tilt ──
  const cardRef = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 240, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-7, 7]), { stiffness: 240, damping: 18 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const handleLeave = () => {
    setHovered(false);
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.225, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        scale: 1.01,
        boxShadow: `0 18px 48px rgba(${a.glowRgb},0.20), 0 10px 18px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,250,241,0.7)`,
        borderColor: a.border,
      }}
      ref={cardRef}
      onClick={() => router.push(`/dashboard/${config.id}`)}
      className="group shimmer-card glass-noise card-lift"
      style={{
        position: "relative",
        rotateX,
        rotateY,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
        overflow: "hidden",
        borderRadius: 28,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        cursor: "pointer",
        background: `
          radial-gradient(circle at top right, ${a.halo} 0%, transparent 34%),
          linear-gradient(155deg, rgba(62,70,54,0.14) 0%, ${a.bgTint} 42%, rgba(245,239,226,0.72) 100%)
        `,
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(62,70,54,0.14)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,250,241,0.45)",
        transition: "box-shadow 0.22s ease, border-color 0.22s ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div
        animate={{ scale: hovered ? 1.5 : 1, opacity: hovered ? 1 : 0.6 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 64,
          height: 64,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, rgba(${a.glowRgb},0.15) 0%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 1,
          borderRadius: 21,
          pointerEvents: "none",
          background: `
            linear-gradient(125deg, rgba(50,64,54,0.18) 0%, transparent 24%, transparent 72%, rgba(255,250,241,0.45) 100%),
            radial-gradient(circle at 14% 8%, rgba(62,70,54,0.18), transparent 22%)
          `,
          opacity: 0.9,
        }}
      />
      <motion.div
        animate={{ opacity: hovered ? 1 : 0.72, x: hovered ? 10 : 0, y: hovered ? -6 : 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        style={{
          position: "absolute",
          right: -34,
          bottom: -42,
          width: 156,
          height: 156,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, ${a.beam} 0%, transparent 66%)`,
          filter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 20,
          width: 78,
          height: 78,
          borderRadius: "50%",
          border: `1px solid rgba(${a.glowRgb},0.10)`,
          opacity: 0.45,
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: `linear-gradient(145deg, ${a.iconBg}, rgba(255,250,241,0.45))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `1px solid rgba(${a.glowRgb},0.15)`,
            boxShadow: `0 8px 22px rgba(${a.glowRgb},0.16), inset 0 1px 0 rgba(255,250,241,0.7)`,
          }}
        >
          <Icon size={16} style={{ color: a.text }} strokeWidth={1.9} />
        </div>
        <TrendBadge trend={trend} accent={accent} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ width: 28, height: 1, background: `linear-gradient(90deg, rgba(${a.glowRgb},0.9), transparent)` }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(50,64,54,0.42)" }}>
            Live Number
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
          <span
            ref={counterRef as React.Ref<HTMLSpanElement>}
            style={{
              fontFamily: "var(--font-fraunces), ui-serif, serif",
              fontSize: 32,
              fontWeight: 700,
              color: "#1b1d1b",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              textShadow: "0 4px 18px rgba(0,0,0,0.22)",
            }}
          >
            {displayValue}
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: a.text }}>{unit}</span>
        </div>
        <p style={{ fontSize: 14, marginTop: 8, fontWeight: 700, color: "rgba(50,64,54,0.82)" }}>{title}</p>
        <p style={{ fontSize: 11, marginTop: 4, color: "rgba(50,64,54,0.48)", maxWidth: "90%" }}>{description}</p>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: 10,
          borderTop: "1px solid rgba(255,250,241,0.7)",
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "10px 12px 8px",
            borderRadius: 14,
            background: "linear-gradient(180deg, rgba(255,250,241,0.45), rgba(50,64,54,0.015))",
            border: "1px solid rgba(255,250,241,0.4)",
          }}
        >
          <Sparkline data={sparkData} accent={accent} width={112} height={36} />
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: a.text,
            display: "flex",
            alignItems: "center",
            gap: 3,
            opacity: 0,
            transition: "opacity 0.15s ease",
          }}
          className="group-hover:opacity-100"
        >
          Details <ArrowRight size={10} strokeWidth={2.5} />
        </span>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgba(${a.glowRgb},0.65), transparent)` }} />
    </motion.div>
  );
}
