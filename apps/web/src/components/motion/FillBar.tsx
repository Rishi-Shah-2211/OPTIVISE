"use client";

import { motion } from "framer-motion";

export function FillBar({
  pct,
  tone = "accent",
  className = "",
  delay = 0,
}: {
  pct: number;
  tone?: "accent" | "violet" | "muted";
  className?: string;
  delay?: number;
}) {
  const toneClass =
    tone === "violet"
      ? "from-[#c86a33] to-[#6d28d9]"
      : tone === "muted"
        ? "from-[#64748b] to-[#475569]"
        : "from-[#1f7a5c] to-[#154f3d]";

  return (
    <div className={`relative h-1.5 w-full overflow-hidden rounded-full bg-[#fffaf1]/10 ${className}`}>
      <motion.div
        initial={{ width: "0%" }}
        whileInView={{ width: `${Math.min(100, pct)}%` }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
        className={`relative h-full rounded-full bg-gradient-to-r ${toneClass}`}
      >
        <span className="absolute inset-0 shimmer opacity-60" />
      </motion.div>
    </div>
  );
}
