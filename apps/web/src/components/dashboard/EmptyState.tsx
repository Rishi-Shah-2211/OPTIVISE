"use client";

import { motion } from "framer-motion";
import { DatabaseZap, RefreshCw, WifiOff } from "lucide-react";

export function EmptyState({ title = "No data yet", description = "Once data is available, it will appear here." }: { title?: string; description?: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(2,132,199,0.08)", border: "1px solid rgba(2,132,199,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <DatabaseZap size={20} style={{ color: "#0284c7" }} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#9CA3AF", maxWidth: 220, lineHeight: 1.6 }}>{description}</p>
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
        <WifiOff size={20} style={{ color: "#e11d48" }} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 5 }}>Failed to load data</h3>
      <p style={{ fontSize: 12, color: "#9CA3AF", maxWidth: 260, lineHeight: 1.6, marginBottom: 16 }}>
        {message ?? "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={onRetry} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
        borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer",
        background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.2)", color: "#e11d48",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(225,29,72,0.14)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(225,29,72,0.08)"; }}
      >
        <RefreshCw size={13} strokeWidth={2} />
        Retry
      </button>
    </motion.div>
  );
}