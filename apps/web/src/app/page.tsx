"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, ChevronRight, TrendingUp, Package, Clock, Database, Check, Loader2 } from "lucide-react";
import { useState as useStateImport } from "react";
import { useRouter } from "next/navigation";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { SkeletonMetricCard, SkeletonInsightCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState, ErrorState } from "@/components/dashboard/EmptyState";
import type { Product } from "@/types/dashboard";

const glass = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
} as React.CSSProperties;

function LoadRealDataButton({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useStateImport<"idle" | "loading" | "success" | "error">("idle");
  const [summary, setSummary] = useStateImport<string>("");

  const handleLoad = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/load-real-data", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setState("success");
        setSummary(`${data.summary.products} products, ${data.summary.suppliers} suppliers loaded`);
        onComplete();
        setTimeout(() => setState("idle"), 4000);
      } else {
        setState("error");
        setSummary(data.error || "Failed");
        setTimeout(() => setState("idle"), 3000);
      }
    } catch {
      setState("error");
      setSummary("Network error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <motion.button
      onClick={handleLoad}
      disabled={state === "loading"}
      whileHover={state === "idle" ? { scale: 1.02 } : {}}
      whileTap={state === "idle" ? { scale: 0.97 } : {}}
      style={{
        display: "flex", alignItems: "center", gap: 7, padding: "6px 14px",
        borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: state === "loading" ? "wait" : "pointer",
        background: state === "success"
          ? "rgba(5,150,105,0.1)"
          : state === "error"
            ? "rgba(225,29,72,0.1)"
            : "linear-gradient(135deg, rgba(5,150,105,0.12), rgba(14,165,233,0.10))",
        border: state === "success"
          ? "1px solid rgba(5,150,105,0.3)"
          : state === "error"
            ? "1px solid rgba(225,29,72,0.3)"
            : "1px solid rgba(5,150,105,0.3)",
        color: state === "success" ? "#059669" : state === "error" ? "#e11d48" : "#059669",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 4px rgba(5,150,105,0.1)",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {state === "loading" ? (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={13} strokeWidth={2} />
        </motion.div>
      ) : state === "success" ? (
        <Check size={13} strokeWidth={2.5} />
      ) : (
        <Database size={13} strokeWidth={2} />
      )}
      {state === "loading" ? "Loading Dataset..." : state === "success" ? summary : state === "error" ? summary : "Load Real Market Dataset"}
    </motion.button>
  );
}

function DashboardHeader({ isLoading, isRefreshing, lastUpdated, onRefetch }: {
  isLoading: boolean; isRefreshing: boolean; lastUpdated: Date | null; onRefetch: () => void;
}) {
  const router = useRouter();
  const spinning = isLoading || isRefreshing;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 32px", height: 60, borderBottom: "1px solid rgba(0,0,0,0.06)",
      background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
          Command Center
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <motion.div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span style={{ fontSize: 11, color: "#6B7280" }}>
            Live
            {lastUpdated && !spinning && (
              <span style={{ marginLeft: 6, color: "#9CA3AF" }}>
                · Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
            {spinning && <span style={{ marginLeft: 6, color: "#0284c7" }}>· Refreshing...</span>}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LoadRealDataButton onComplete={onRefetch} />
        <button
          onClick={onRefetch}
          disabled={spinning}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: spinning ? "not-allowed" : "pointer",
            background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.10)",
            color: "#374151", transition: "all 0.15s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            opacity: spinning ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!spinning) { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"; el.style.borderColor = "rgba(0,0,0,0.15)"; } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; el.style.borderColor = "rgba(0,0,0,0.10)"; }}
        >
          <motion.div
            animate={spinning ? { rotate: 360 } : { rotate: 0 }}
            transition={spinning ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
          >
            <RefreshCw size={13} strokeWidth={2} />
          </motion.div>
          Refresh
        </button>

        <button
          onClick={() => router.push("/copilot")}
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "6px 14px",
            borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.10))",
            border: "1px solid rgba(14,165,233,0.3)", color: "#0284c7",
            transition: "all 0.15s ease", boxShadow: "0 1px 4px rgba(14,165,233,0.1)",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(139,92,246,0.15))"; el.style.boxShadow = "0 4px 12px rgba(14,165,233,0.2)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.10))"; el.style.boxShadow = "0 1px 4px rgba(14,165,233,0.1)"; }}
        >
          <Sparkles size={12} strokeWidth={2} />
          AI Copilot
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ViewAllLink({ label, href }: { label: string; href: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500,
        color: "#0284c7", cursor: "pointer", background: "none", border: "none", padding: 0,
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.7"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
    >
      {label}
      <ChevronRight size={12} strokeWidth={2.5} />
    </button>
  );
}

function ProductsTable({ products }: { products: Product[] }) {
  const sorted = [...products].sort((a, b) => b.demand - a.demand).slice(0, 6);
  if (products.length === 0) return <EmptyState title="No products" description="Add products to see them here." />;

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 72px 72px 52px",
        padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "#9CA3AF",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        <span>Product</span>
        <span style={{ textAlign: "right" }}>Stock</span>
        <span style={{ textAlign: "right" }}>Demand</span>
        <span style={{ textAlign: "right" }}>Lead</span>
      </div>

      {sorted.map((p, idx) => {
        const pressure = p.inventory > 0 ? Math.min((p.demand / p.inventory) * 100, 100) : 100;
        const pc = pressure > 80 ? "#e11d48" : pressure > 50 ? "#d97706" : "#059669";

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + idx * 0.04 }}
            style={{
              display: "grid", gridTemplateColumns: "1fr 72px 72px 52px",
              padding: "10px 16px", borderBottom: "1px solid rgba(0,0,0,0.04)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.025)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={11} style={{ color: "#9CA3AF" }} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, color: "#6B7280", textAlign: "right", alignSelf: "center" }}>{p.inventory.toLocaleString()}</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, alignSelf: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: pc }}>{p.demand.toLocaleString()}</span>
              <TrendingUp size={10} style={{ color: pc }} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, color: "#9CA3AF", textAlign: "right", alignSelf: "center" }}>{p.leadTime}d</span>
          </motion.div>
        );
      })}
    </div>
  );
}

function CopilotTeaser() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      onClick={() => router.push("/copilot")}
      style={{
        marginTop: 12, padding: 14, borderRadius: 16, cursor: "pointer",
        background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.07))",
        border: "1px solid rgba(14,165,233,0.18)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.13), rgba(139,92,246,0.11))"; el.style.boxShadow = "0 4px 16px rgba(14,165,233,0.1)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.07))"; el.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} style={{ color: "#0284c7" }} strokeWidth={1.8} />
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0284c7" }}>Ask Copilot about inventory risks</span>
        <ChevronRight size={12} style={{ color: "#0284c7", marginLeft: "auto" }} />
      </div>
      <p style={{ fontSize: 11, marginTop: 5, paddingLeft: 22, color: "#6B7280" }}>
        "Which SKUs are at risk of stockout this week?"
      </p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { products, insights, metricCards, isLoading, isRefreshing, lastUpdated, isError, errorMessage, refetch } = useDashboardData();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <DashboardHeader isLoading={isLoading} isRefreshing={isRefreshing} lastUpdated={lastUpdated} onRefetch={refetch} />

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <AnimatePresence mode="wait">
          {isError ? (
            <ErrorState key="error" message={errorMessage} onRetry={refetch} />
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              {/* KPI Grid */}
              <section style={{ marginBottom: 28 }}>
                <SectionHeader
                  title="Key Metrics"
                  subtitle="Computed live from all monitored SKUs and AI insights"
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {isLoading
                    ? Array.from({ length: 6 }, (_, i) => <SkeletonMetricCard key={i} index={i} />)
                    : metricCards.map((card, idx) => <MetricCard key={card.id} config={card} index={idx} />)}
                </div>
              </section>

              {/* Bottom grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
                <section>
                  <SectionHeader
                    title="AI Insights"
                    subtitle={`${insights.length} active signal${insights.length !== 1 ? "s" : ""}`}
                    action={<ViewAllLink label="View all" href="/insights" />}
                  />
                  <div style={{ ...glass, borderRadius: 20, padding: 12 }}>
                    {isLoading
                      ? Array.from({ length: 3 }, (_, i) => <SkeletonInsightCard key={i} index={i} />)
                      : insights.length === 0
                        ? <EmptyState title="No insights" description="Run the AI engine to generate insights." />
                        : insights.slice(0, 5).map((ins, idx) => (
                            <InsightCard key={ins.id ?? `insight-${idx}`} insight={ins} index={idx} />
                          ))
                    }
                  </div>
                </section>

                <section>
                  <SectionHeader
                    title="Top Products"
                    subtitle="Sorted by demand pressure"
                    action={<ViewAllLink label="Manage" href="/simulator" />}
                  />
                  <div style={{ ...glass, borderRadius: 20, overflow: "hidden" }}>
                    {isLoading
                      ? <div style={{ padding: 12 }}>{Array.from({ length: 4 }, (_, i) => <SkeletonInsightCard key={i} index={i} />)}</div>
                      : <ProductsTable products={products} />
                    }
                  </div>
                  <CopilotTeaser />
                </section>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}