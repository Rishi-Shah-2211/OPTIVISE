"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Sparkles, ChevronRight, TrendingUp, Package, Clock, Database, Check, Loader2 } from "lucide-react";
import { useState as useStateImport, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { SkeletonMetricCard, SkeletonInsightCard } from "@/components/dashboard/SkeletonCard";
import { EmptyState, ErrorState } from "@/components/dashboard/EmptyState";
import { tooltipStyle as chartTooltip, axisTickStyle, axisProps, gridProps, animationProps, chartContainerGlass, chartPerspectiveHover } from "@/components/charts/chartTheme";
import { useTilt } from "@/lib/ui/useTilt";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { MagneticButton } from "@/components/motion/MagneticButton";
import type { Product } from "@/types/dashboard";

const glassPanel = "glass-panel card-lift shimmer-card rounded-[1.75rem] border border-[#3e4636]/12";

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
        setTimeout(() => setState("idle"), 2000);
      } else {
        setState("error");
        setSummary(data.error || "Failed");
        setTimeout(() => setState("idle"), 1500);
      }
    } catch {
      setState("error");
      setSummary("Network error");
      setTimeout(() => setState("idle"), 1500);
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
          ? "rgba(31,122,92,0.12)"
          : state === "error"
            ? "rgba(192,73,47,0.12)"
            : "linear-gradient(135deg, rgba(31,122,92,0.14), rgba(31,122,92,0.12))",
        border: state === "success"
          ? "1px solid rgba(31,122,92,0.3)"
          : state === "error"
            ? "1px solid rgba(192,73,47,0.3)"
            : "1px solid rgba(31,122,92,0.3)",
        color: state === "success" ? "#1f7a5c" : state === "error" ? "#c0492f" : "#1f7a5c",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        opacity: state === "loading" ? 0.7 : 1,
      }}
    >
      {state === "loading" ? (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}>
          <Loader2 size={13} strokeWidth={2} />
        </motion.div>
      ) : state === "success" ? (
        <Check size={13} strokeWidth={2.5} />
      ) : (
        <Database size={13} strokeWidth={2} />
      )}
      {state === "loading" ? "Loading..." : state === "success" ? summary : state === "error" ? summary : "Load Sample Data"}
    </motion.button>
  );
}

function DashboardHeader({ isLoading, isRefreshing, lastUpdated, onRefetch }: {
  isLoading: boolean; isRefreshing: boolean; lastUpdated: Date | null; onRefetch: () => void;
}) {
  const router = useRouter();
  const spinning = isLoading || isRefreshing;

  return (
    <div className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#3e4636]/12 bg-[rgba(255,250,241,0.82)] px-8 backdrop-blur-xl">
      <div>
        <h1 className="font-serif m-0 text-[15px] font-bold text-[#1b1d1b]">My Shop</h1>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f7a5c] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1f7a5c] shadow-[0_0_6px_rgba(31,122,92,0.5)]" />
          </span>
          <span className="text-[11px] text-[#1b1d1b]/45">
            Live
            {lastUpdated && !spinning && (
              <span className="ml-1.5 text-[#1b1d1b]/30">
                · Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
            {spinning && <span className="ml-1.5 text-[#1f7a5c]">· Refreshing...</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <LoadRealDataButton onComplete={onRefetch} />
        <button
          onClick={onRefetch}
          disabled={spinning}
          className="btn-ghost !py-2 !text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <motion.div
            animate={spinning ? { rotate: 360 } : { rotate: 0 }}
            transition={spinning ? { duration: 0.4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
          >
            <RefreshCw size={13} strokeWidth={2} />
          </motion.div>
          Refresh
        </button>
        <MagneticButton onClick={() => router.push("/copilot")} className="btn-premium !py-2 !text-[12px]">
          <Sparkles size={12} strokeWidth={2} />
          AI Helper
        </MagneticButton>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="font-serif m-0 text-sm font-bold text-[#1b1d1b]">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[11px] text-[#1b1d1b]/42">{subtitle}</p>}
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
      className="link-sweep flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[11px] font-medium text-[#1f7a5c]"
    >
      {label}
      <ChevronRight size={12} strokeWidth={2.5} />
    </button>
  );
}

function ProductsTable({ products }: { products: Product[] }) {
  const sorted = [...products].sort((a, b) => b.demand - a.demand).slice(0, 6);
  if (products.length === 0) return <EmptyState title="No items" description="Load sample data to see your items." />;

  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 72px 72px 52px",
        padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "rgba(50,64,54,0.3)",
        borderBottom: "1px solid rgba(62,70,54,0.14)",
      }}>
        <span>Item</span>
        <span style={{ textAlign: "right" }}>In Stock</span>
        <span style={{ textAlign: "right" }}>Sells</span>
        <span style={{ textAlign: "right" }}>Days</span>
      </div>

      {sorted.map((p, idx) => {
        const pressure = p.inventory > 0 ? Math.min((p.demand / p.inventory) * 100, 100) : 100;
        const pc = pressure > 80 ? "#c0492f" : pressure > 50 ? "#c86a33" : "#1f7a5c";

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + idx * 0.02 }}
            style={{
              display: "grid", gridTemplateColumns: "1fr 72px 72px 52px",
              padding: "10px 16px", borderBottom: "1px solid rgba(255,250,241,0.7)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,250,241,0.4)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,250,241,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={11} style={{ color: "rgba(50,64,54,0.42)" }} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(50,64,54,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, color: "rgba(50,64,54,0.45)", textAlign: "right", alignSelf: "center" }}>{p.inventory.toLocaleString()}</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, alignSelf: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: pc }}>{p.demand.toLocaleString()}</span>
              <TrendingUp size={10} style={{ color: pc }} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, color: "rgba(50,64,54,0.42)", textAlign: "right", alignSelf: "center" }}>{p.leadTime}d</span>
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
      transition={{ delay: 0.4 }}
      onClick={() => router.push("/copilot")}
      className="card-lift mt-3 cursor-pointer rounded-[1.4rem] border border-[#1f7a5c]/15 bg-gradient-to-br from-[#256a52]/8 to-violet-500/6 p-3.5 transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(31,122,92,0.15)]"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} style={{ color: "#1f7a5c" }} strokeWidth={1.8} />
        <span style={{ fontSize: 12, fontWeight: 500, color: "#1f7a5c" }}>Ask the Helper about your stock</span>
        <ChevronRight size={12} style={{ color: "#1f7a5c", marginLeft: "auto" }} />
      </div>
      <p style={{ fontSize: 11, marginTop: 5, paddingLeft: 22, color: "rgba(50,64,54,0.42)" }}>
        "Which items will finish this week?"
      </p>
    </motion.div>
  );
}

const REGION_COLORS = ["#1f7a5c", "#1f7a5c", "#c86a33", "#c86a33", "#c0492f", "#2f9e76", "#3fa07d", "#e0935a"];

function CategoryChart({ data }: { data: { name: string; inventory: number; demand: number }[] }) {
  const tilt = useTilt(5);
  if (data.length === 0) return null;
  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth card-lift"
      style={{ ...chartContainerGlass, perspective: "1000px", rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 1000 }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 18 }}>
        <p className="font-serif m-0 text-sm font-bold text-[#1b1d1b]">
          Stock by Type
        </p>
        <p style={{ fontSize: 11, color: "rgba(50,64,54,0.42)", marginTop: 3 }}>
          How much you have vs how much sells, by item type
        </p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
            <defs>
              <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f7a5c" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1f7a5c" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gDem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1f7a5c" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#1f7a5c" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" tick={axisTickStyle} {...axisProps} />
            <YAxis tick={axisTickStyle} {...axisProps} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(255,250,241,0.4)" }} />
            <Bar dataKey="inventory" name="In Stock" fill="url(#gInv)" radius={[8, 8, 0, 0]} {...animationProps} />
            <Bar dataKey="demand" name="Sells" fill="url(#gDem)" radius={[8, 8, 0, 0]} {...animationProps} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(50,64,54,0.48)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(180deg, #1f7a5c, rgba(31,122,92,0.3))" }} /> In Stock
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(50,64,54,0.48)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(180deg, #1f7a5c, rgba(31,122,92,0.3))" }} /> Sells
        </span>
      </div>
    </motion.div>
  );
}

function DemandPressureChart({ data }: { data: { name: string; pressure: number; fill: string }[] }) {
  const tilt = useTilt(5);
  if (data.length === 0) return null;
  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth card-lift"
      style={{ ...chartContainerGlass, perspective: "1000px", rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 1000 }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 18 }}>
        <p className="font-serif m-0 text-sm font-bold text-[#1b1d1b]">
          Selling Fast
        </p>
        <p style={{ fontSize: 11, color: "rgba(50,64,54,0.42)", marginTop: 3 }}>
          Items selling faster than you are restocking
        </p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid {...gridProps} horizontal={false} />
            <XAxis type="number" tick={axisTickStyle} {...axisProps}
              domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ ...axisTickStyle, fill: "rgba(50,64,54,0.58)" }} {...axisProps} width={90} />
            <Tooltip contentStyle={chartTooltip} formatter={(v) => [`${v}%`, "Selling vs stock"]} cursor={{ fill: "rgba(255,250,241,0.4)" }} />
            <Bar dataKey="pressure" radius={[0, 8, 8, 0]} barSize={18} {...animationProps}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
        {[{ c: "#c0492f", l: "Order now" }, { c: "#c86a33", l: "Keep an eye" }, { c: "#1f7a5c", l: "All good" }].map(({ c, l }) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(50,64,54,0.48)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} /> {l}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function RegionDonutChart({ data }: { data: { name: string; value: number; avgReliability: number; fill: string }[] }) {
  const tilt = useTilt(5);
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth card-lift"
      style={{ ...chartContainerGlass, display: "flex", flexDirection: "column", perspective: "1000px", rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 1000 }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 12 }}>
        <p className="font-serif m-0 text-sm font-bold text-[#1b1d1b]">
          Your Suppliers
        </p>
        <p style={{ fontSize: 11, color: "rgba(50,64,54,0.42)", marginTop: 3 }}>
          Where your suppliers are
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flex: 1, minHeight: 180 }}>
        <PieChart width={190} height={190}>
          <Pie data={data} cx={95} cy={95} innerRadius={52} outerRadius={82}
            paddingAngle={3} dataKey="value" strokeWidth={0} {...animationProps}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
          </Pie>
          <Tooltip contentStyle={chartTooltip}
            formatter={(v, _, props) => {
              const p = (props as { payload?: { name?: string; avgReliability?: number } }).payload;
              return [`${v} products · ${p?.avgReliability ?? 0}% reliable`, p?.name ?? ""];
            }} />
        </PieChart>
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          textAlign: "center", pointerEvents: "none",
        }}>
          <p className="font-serif m-0 text-[22px] font-bold text-[#1b1d1b]">{total}</p>
          <p style={{ fontSize: 10, color: "rgba(50,64,54,0.42)", margin: 0 }}>products</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center", marginTop: 6 }}>
        {data.map((d, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(50,64,54,0.48)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: d.fill, flexShrink: 0 }} />
            {d.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { products, insights, metricCards, isLoading, isRefreshing, lastUpdated, isError, errorMessage, refetch } = useDashboardData();

  const categoryData = useMemo(() => {
    const map = new Map<string, { inventory: number; demand: number }>();
    products.forEach(p => {
      const cat = p.category || "General";
      const cur = map.get(cat) || { inventory: 0, demand: 0 };
      cur.inventory += p.inventory;
      cur.demand += p.demand;
      map.set(cat, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, inventory: v.inventory, demand: v.demand }))
      .sort((a, b) => (b.inventory + b.demand) - (a.inventory + a.demand))
      .slice(0, 8);
  }, [products]);

  const demandPressureData = useMemo(() => {
    return [...products]
      .filter(p => p.inventory > 0)
      .map(p => {
        const prs = parseFloat(((p.demand / p.inventory) * 100).toFixed(1));
        return {
          name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
          pressure: Math.min(prs, 100),
          fill: prs > 80 ? "#c0492f" : prs > 50 ? "#c86a33" : "#1f7a5c",
        };
      })
      .sort((a, b) => b.pressure - a.pressure)
      .slice(0, 8);
  }, [products]);

  const regionData = useMemo(() => {
    const map = new Map<string, { count: number; reliability: number[] }>();
    products.forEach(p => {
      const region = p.supplier?.region || "Unknown";
      const cur = map.get(region) || { count: 0, reliability: [] };
      cur.count += 1;
      if (p.supplier?.reliability != null) cur.reliability.push(p.supplier.reliability);
      map.set(region, cur);
    });
    return Array.from(map.entries())
      .map(([name, v], i) => ({
        name,
        value: v.count,
        avgReliability: v.reliability.length > 0
          ? parseFloat((v.reliability.reduce((a, b) => a + b, 0) / v.reliability.length * 100).toFixed(1))
          : 0,
        fill: REGION_COLORS[i % REGION_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <DashboardHeader isLoading={isLoading} isRefreshing={isRefreshing} lastUpdated={lastUpdated} onRefetch={refetch} />

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <AnimatePresence mode="wait">
          {isError ? (
            <ErrorState key="error" message={errorMessage} onRetry={refetch} />
          ) : (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

              <Reveal>
                <section className="mb-7">
                  <SectionHeader
                    title="Quick Numbers"
                    subtitle="Updated live from all your items"
                  />
                  <Stagger className="grid grid-cols-3 gap-4">
                    {isLoading
                      ? Array.from({ length: 6 }, (_, i) => (
                          <StaggerItem key={i}><SkeletonMetricCard index={i} /></StaggerItem>
                        ))
                      : metricCards.map((card, idx) => (
                          <StaggerItem key={card.id}><MetricCard config={card} index={idx} /></StaggerItem>
                        ))}
                  </Stagger>
                </section>
              </Reveal>

              {!isLoading && products.length > 0 && (
                <Reveal delay={0.1}>
                  <section className="mb-7">
                    <SectionHeader
                      title="Your Shop at a Glance"
                      subtitle="How your items and suppliers are doing"
                    />
                    <div className="mb-4 grid grid-cols-[1.4fr_1fr] gap-4">
                      <CategoryChart data={categoryData} />
                      <RegionDonutChart data={regionData} />
                    </div>
                    <DemandPressureChart data={demandPressureData} />
                  </section>
                </Reveal>
              )}

              <div className="grid grid-cols-[1fr_360px] gap-5">
                <Reveal delay={0.15}>
                  <section>
                    <SectionHeader
                      title="Smart Tips"
                      subtitle={`${insights.length} tip${insights.length !== 1 ? "s" : ""}`}
                      action={<ViewAllLink label="View all" href="/insights" />}
                    />
                    <div className={`${glassPanel} p-3`}>
                      {isLoading
                        ? Array.from({ length: 3 }, (_, i) => <SkeletonInsightCard key={i} index={i} />)
                        : insights.length === 0
                          ? <EmptyState title="No tips yet" description="Load sample data to see helpful tips." />
                          : insights.slice(0, 5).map((ins, idx) => (
                              <InsightCard key={ins.id ?? `insight-${idx}`} insight={ins} index={idx} />
                            ))
                      }
                    </div>
                  </section>
                </Reveal>

                <Reveal delay={0.2}>
                  <section>
                    <SectionHeader
                      title="Top Sellers"
                      subtitle="Your fastest-selling items"
                      action={<ViewAllLink label="Open" href="/simulator" />}
                    />
                    <div className={`${glassPanel} overflow-hidden`}>
                      {isLoading
                        ? <div className="p-3">{Array.from({ length: 4 }, (_, i) => <SkeletonInsightCard key={i} index={i} />)}</div>
                        : <ProductsTable products={products} />
                      }
                    </div>
                    <CopilotTeaser />
                  </section>
                </Reveal>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
