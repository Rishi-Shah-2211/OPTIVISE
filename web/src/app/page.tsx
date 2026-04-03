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
import type { Product } from "@/types/dashboard";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
};

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
          ? "rgba(16,185,129,0.12)"
          : state === "error"
            ? "rgba(244,63,94,0.12)"
            : "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(14,165,233,0.12))",
        border: state === "success"
          ? "1px solid rgba(16,185,129,0.3)"
          : state === "error"
            ? "1px solid rgba(244,63,94,0.3)"
            : "1px solid rgba(16,185,129,0.3)",
        color: state === "success" ? "#10b981" : state === "error" ? "#f43f5e" : "#10b981",
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
      padding: "0 32px", height: 60, borderBottom: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)", flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
    }}>
      <div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
          Command Center
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <motion.div
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
            Live
            {lastUpdated && !spinning && (
              <span style={{ marginLeft: 6, color: "rgba(255,255,255,0.3)" }}>
                · Updated {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            )}
            {spinning && <span style={{ marginLeft: 6, color: "#0ea5e9" }}>· Refreshing...</span>}
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
            background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.6)", transition: "all 0.15s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            opacity: spinning ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!spinning) { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.22)"; el.style.borderColor = "rgba(255,255,255,0.20)"; } }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.2)"; el.style.borderColor = "rgba(255,255,255,0.12)"; }}
        >
          <motion.div
            animate={spinning ? { rotate: 360 } : { rotate: 0 }}
            transition={spinning ? { duration: 0.4, repeat: Infinity, ease: "linear" } : { duration: 0 }}
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
            background: "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(139,92,246,0.12))",
            border: "1px solid rgba(14,165,233,0.3)", color: "#0ea5e9",
            transition: "all 0.15s ease", boxShadow: "0 1px 4px rgba(14,165,233,0.15)",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.22), rgba(139,92,246,0.18))"; el.style.boxShadow = "0 4px 16px rgba(14,165,233,0.25)"; }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(139,92,246,0.12))"; el.style.boxShadow = "0 1px 4px rgba(14,165,233,0.15)"; }}
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
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{subtitle}</p>}
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
        color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", padding: 0,
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
        letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
      }}>
        <span>Product</span>
        <span style={{ textAlign: "right" }}>Stock</span>
        <span style={{ textAlign: "right" }}>Demand</span>
        <span style={{ textAlign: "right" }}>Lead</span>
      </div>

      {sorted.map((p, idx) => {
        const pressure = p.inventory > 0 ? Math.min((p.demand / p.inventory) * 100, 100) : 100;
        const pc = pressure > 80 ? "#f43f5e" : pressure > 50 ? "#f59e0b" : "#10b981";

        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + idx * 0.02 }}
            style={{
              display: "grid", gridTemplateColumns: "1fr 72px 72px 52px",
              padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)",
              transition: "background 0.15s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Package size={11} style={{ color: "rgba(255,255,255,0.42)" }} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "right", alignSelf: "center" }}>{p.inventory.toLocaleString()}</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, alignSelf: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: pc }}>{p.demand.toLocaleString()}</span>
              <TrendingUp size={10} style={{ color: pc }} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)", textAlign: "right", alignSelf: "center" }}>{p.leadTime}d</span>
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
      style={{
        marginTop: 12, padding: 14, borderRadius: 16, cursor: "pointer",
        background: "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.06))",
        border: "1px solid rgba(14,165,233,0.15)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(139,92,246,0.10))"; el.style.boxShadow = "0 4px 16px rgba(14,165,233,0.15)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.background = "linear-gradient(135deg, rgba(14,165,233,0.08), rgba(139,92,246,0.06))"; el.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Sparkles size={14} style={{ color: "#0ea5e9" }} strokeWidth={1.8} />
        <span style={{ fontSize: 12, fontWeight: 500, color: "#0ea5e9" }}>Ask Copilot about inventory risks</span>
        <ChevronRight size={12} style={{ color: "#0ea5e9", marginLeft: "auto" }} />
      </div>
      <p style={{ fontSize: 11, marginTop: 5, paddingLeft: 22, color: "rgba(255,255,255,0.42)" }}>
        "Which SKUs are at risk of stockout this week?"
      </p>
    </motion.div>
  );
}

const REGION_COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#22d3ee", "#34d399", "#fbbf24"];

function CategoryChart({ data }: { data: { name: string; inventory: number; demand: number }[] }) {
  if (data.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth"
      style={{ ...chartContainerGlass, perspective: "1000px" }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
          Category Performance
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 3 }}>
          Inventory vs demand across product categories
        </p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barCategoryGap="20%">
            <defs>
              <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gDem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" tick={axisTickStyle} {...axisProps} />
            <YAxis tick={axisTickStyle} {...axisProps} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip contentStyle={chartTooltip} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
            <Bar dataKey="inventory" name="Stock" fill="url(#gInv)" radius={[8, 8, 0, 0]} {...animationProps} />
            <Bar dataKey="demand" name="Demand" fill="url(#gDem)" radius={[8, 8, 0, 0]} {...animationProps} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 8 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.48)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(180deg, #10b981, rgba(16,185,129,0.3))" }} /> Stock
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.48)" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: "linear-gradient(180deg, #0ea5e9, rgba(14,165,233,0.3))" }} /> Demand
        </span>
      </div>
    </motion.div>
  );
}

function DemandPressureChart({ data }: { data: { name: string; pressure: number; fill: string }[] }) {
  if (data.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth"
      style={{ ...chartContainerGlass, perspective: "1000px" }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
          Demand Pressure Index
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 3 }}>
          Products under highest demand-to-stock pressure
        </p>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
            <CartesianGrid {...gridProps} horizontal={false} />
            <XAxis type="number" tick={axisTickStyle} {...axisProps}
              domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" tick={{ ...axisTickStyle, fill: "rgba(255,255,255,0.58)" }} {...axisProps} width={90} />
            <Tooltip contentStyle={chartTooltip} formatter={(v) => [`${v}%`, "Pressure"]} cursor={{ fill: "rgba(255,255,255,0.06)" }} />
            <Bar dataKey="pressure" radius={[0, 8, 8, 0]} barSize={18} {...animationProps}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
        {[{ c: "#f43f5e", l: "Critical >80%" }, { c: "#f59e0b", l: "Watch >50%" }, { c: "#10b981", l: "Healthy" }].map(({ c, l }) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.48)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} /> {l}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function RegionDonutChart({ data }: { data: { name: string; value: number; avgReliability: number; fill: string }[] }) {
  if (data.length === 0) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="shimmer-card chart-depth"
      style={{ ...chartContainerGlass, display: "flex", flexDirection: "column", perspective: "1000px" }}
      {...chartPerspectiveHover}
    >
      <div style={{ marginBottom: 12 }}>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
          Supplier Geography
        </p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 3 }}>
          Supply chain distribution by region
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
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{total}</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.42)", margin: 0 }}>products</p>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", justifyContent: "center", marginTop: 6 }}>
        {data.map((d, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "rgba(255,255,255,0.48)" }}>
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
          fill: prs > 80 ? "#f43f5e" : prs > 50 ? "#f59e0b" : "#10b981",
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

              {/* Analytics — asymmetric premium layout */}
              {!isLoading && products.length > 0 && (
                <section style={{ marginBottom: 28 }}>
                  <SectionHeader
                    title="Analytics"
                    subtitle="Live performance breakdown across categories, products & supply regions"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
                    <CategoryChart data={categoryData} />
                    <RegionDonutChart data={regionData} />
                  </div>
                  <DemandPressureChart data={demandPressureData} />
                </section>
              )}

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
