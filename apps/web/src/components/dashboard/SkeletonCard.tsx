"use client";

import { motion } from "framer-motion";

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 8,
        background: "linear-gradient(90deg, rgba(62,70,54,0.08) 0%, rgba(255,250,241,0.55) 50%, rgba(62,70,54,0.08) 100%)",
        backgroundSize: "400px 100%",
        animation: "shimmer-light 1.6s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonMetricCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.025 }}
      style={{
        borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14,
        background: "rgba(255,250,241,0.7)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(62,70,54,0.14)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Shimmer style={{ width: 36, height: 36, borderRadius: 12 }} />
        <Shimmer style={{ width: 56, height: 20, borderRadius: 999 }} />
      </div>
      <div>
        <Shimmer style={{ width: 80, height: 30, marginBottom: 8 }} />
        <Shimmer style={{ width: 100, height: 14, marginBottom: 5 }} />
        <Shimmer style={{ width: 70, height: 11 }} />
      </div>
      <Shimmer style={{ width: "100%", height: 32 }} />
    </motion.div>
  );
}

export function SkeletonInsightCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + index * 0.025 }}
      style={{ display: "flex", gap: 12, padding: "12px 14px", marginBottom: 6 }}
    >
      <Shimmer style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Shimmer style={{ width: 52, height: 16, borderRadius: 999 }} />
          <Shimmer style={{ width: 70, height: 16 }} />
        </div>
        <Shimmer style={{ width: "100%", height: 14 }} />
        <Shimmer style={{ width: "75%", height: 14 }} />
        <Shimmer style={{ width: "100%", height: 6, borderRadius: 999 }} />
      </div>
    </motion.div>
  );
}
