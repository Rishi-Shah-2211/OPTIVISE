"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, Zap, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Insight } from "@/types/dashboard";

interface SStyle { Icon: React.ElementType; color: string; bg: string; border: string; label: string; }

function getStyle(impact: number, type: string): SStyle {
  if (impact > 80) return { Icon: AlertTriangle, color: "#f43f5e", bg: "rgba(244,63,94,0.10)", border: "rgba(244,63,94,0.20)", label: "Urgent" };
  if (impact > 60) return { Icon: Zap, color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.20)", label: "Important" };
  if (type?.toLowerCase().includes("success") || impact < 30) return { Icon: CheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.15)", label: "Done" };
  return { Icon: Info, color: "#0ea5e9", bg: "rgba(14,165,233,0.10)", border: "rgba(14,165,233,0.15)", label: "Good to Know" };
}

function normalize(c: number) { return c <= 1 ? c * 100 : c; }

function safeAgo(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  const m = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const s = getStyle(insight.impact, insight.type);
  const { Icon } = s;
  const conf = normalize(insight.confidence);
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.125 + index * 0.03, duration: 0.175 }}
      className="group shimmer-card"
      style={{
        display: "flex", gap: 12, padding: "12px 14px", borderRadius: 16, marginBottom: 6,
        cursor: "default", transition: "all 0.18s ease",
        background: "transparent", border: "1px solid transparent",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = s.bg;
        el.style.borderColor = s.border;
        el.style.transform = "translateX(4px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = "transparent";
        el.style.borderColor = "transparent";
        el.style.transform = "translateX(0)";
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
        <Icon size={14} style={{ color: s.color }} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 999, background: s.bg, color: s.color }}>
            {s.label}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", textTransform: "capitalize" }}>
            {({ stockout: "running low", overstock: "too much stock", reorder: "order soon", lead_time: "slow delivery" } as Record<string, string>)[insight.type] ?? insight.type?.replace(/_/g, " ")}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", marginLeft: "auto" }}>{safeAgo(insight.createdAt)}</span>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: 10 }}>{insight.message}</p>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.42)" }}>How Sure</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: s.color }}>{Math.round(conf)}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${conf}%` }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 + index * 0.03 }}
                style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${s.color}80, ${s.color})` }}
              />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.42)", display: "block", marginBottom: 2 }}>How Big</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{Math.round(insight.impact)}</span>
          </div>
          <button
            onClick={() => router.push("/insights")}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 8,
              fontSize: 11, fontWeight: 500, cursor: "pointer", border: `1px solid ${s.border}`,
              background: s.bg, color: s.color, opacity: 0, transition: "opacity 0.15s ease",
            }}
            className="group-hover:opacity-100"
          >
            View <ArrowRight size={10} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
