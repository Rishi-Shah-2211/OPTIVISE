"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowLeft, Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { tooltipStyle, gridProps, animationProps, chartPerspectiveHover } from "@/components/charts/chartTheme";
import type { Product, Insight } from "@/types/dashboard";

const ICONS: Record<string, React.ElementType> = { Package, Boxes, Clock, BrainCircuit, ShieldAlert, TrendingUp };

const ACCENT_MAP: Record<string, { color: string; rgb: string; light: string; gradient: string }> = {
  cyan:    { color: "#0ea5e9", rgb: "14,165,233",   light: "rgba(14,165,233,0.10)",   gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)" },
  emerald: { color: "#10b981", rgb: "16,185,129",   light: "rgba(16,185,129,0.10)",   gradient: "linear-gradient(135deg, #10b981, #059669)" },
  amber:   { color: "#f59e0b", rgb: "245,158,11",   light: "rgba(245,158,11,0.10)",   gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  violet:  { color: "#8b5cf6", rgb: "139,92,246",    light: "rgba(139,92,246,0.10)",   gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
  rose:    { color: "#f43f5e", rgb: "244,63,94",     light: "rgba(244,63,94,0.10)",    gradient: "linear-gradient(135deg, #f43f5e, #e11d48)" },
};

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
};

interface MetricConfig {
  id: string;
  title: string;
  icon: string;
  accent: string;
  unit: string;
  description: string;
  getValue: (p: Product[], ins: Insight[]) => number;
  getBreakdown: (p: Product[], ins: Insight[]) => BreakdownItem[];
  getChartData: (p: Product[], ins: Insight[]) => ChartPoint[];
  getInsights: (p: Product[], ins: Insight[]) => InsightItem[];
}

interface BreakdownItem { label: string; value: string; pct: number; color: string }
interface ChartPoint { name: string; value: number; fill?: string }
interface InsightItem { icon: React.ElementType; text: string; type: "success" | "warning" | "critical" }

const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: "total-skus",
    title: "Total Items",
    icon: "Package",
    accent: "cyan",
    unit: "items",
    description: "How many different items your shop keeps. More items means more to look after, so it helps to know which ones really sell.",
    getValue: (p) => p.length,
    getBreakdown: (p) => {
      const healthy = p.filter(x => x.inventory > x.demand);
      const atRisk = p.filter(x => x.inventory <= x.demand && x.inventory > 0);
      const critical = p.filter(x => x.inventory === 0);
      const total = p.length || 1;
      return [
        { label: "Enough Stock", value: `${healthy.length}`, pct: (healthy.length / total) * 100, color: "#059669" },
        { label: "Running Low", value: `${atRisk.length}`, pct: (atRisk.length / total) * 100, color: "#d97706" },
        { label: "Finished", value: `${critical.length}`, pct: (critical.length / total) * 100, color: "#e11d48" },
      ];
    },
    getChartData: (p) => {
      const buckets = [
        { name: "0-50", min: 0, max: 50 },
        { name: "51-200", min: 51, max: 200 },
        { name: "201-500", min: 201, max: 500 },
        { name: "501-1k", min: 501, max: 1000 },
        { name: "1k+", min: 1001, max: Infinity },
      ];
      return buckets.map(b => ({
        name: b.name,
        value: p.filter(x => x.inventory >= b.min && x.inventory <= b.max).length,
      }));
    },
    getInsights: (p) => {
      const zeroStock = p.filter(x => x.inventory === 0).length;
      const highDemand = p.filter(x => x.demand > x.inventory * 2).length;
      const items: InsightItem[] = [];
      if (zeroStock > 0) items.push({ icon: AlertTriangle, text: `${zeroStock} item${zeroStock > 1 ? "s are" : " is"} fully finished — restock now`, type: "critical" });
      if (highDemand > 0) items.push({ icon: TrendingUp, text: `${highDemand} item${highDemand > 1 ? "s are" : " is"} selling much faster than your stock`, type: "warning" });
      items.push({ icon: CheckCircle2, text: `${p.length} items are being watched for you`, type: "success" });
      return items;
    },
  },
  {
    id: "inventory",
    title: "Total Stock",
    icon: "Boxes",
    accent: "emerald",
    unit: "pieces",
    description: "All the pieces sitting in your shop right now, added up. Too much stock means your money is stuck on the shelf.",
    getValue: (p) => p.reduce((s, x) => s + x.inventory, 0),
    getBreakdown: (p) => {
      const sorted = [...p].sort((a, b) => b.inventory - a.inventory);
      const total = p.reduce((s, x) => s + x.inventory, 0) || 1;
      return sorted.slice(0, 5).map(x => ({
        label: x.name,
        value: x.inventory.toLocaleString(),
        pct: (x.inventory / total) * 100,
        color: x.inventory > x.demand * 2 ? "#d97706" : "#059669",
      }));
    },
    getChartData: (p) => {
      return [...p].sort((a, b) => b.inventory - a.inventory).slice(0, 10).map(x => ({
        name: x.name.length > 12 ? x.name.slice(0, 12) + "..." : x.name,
        value: x.inventory,
      }));
    },
    getInsights: (p) => {
      const total = p.reduce((s, x) => s + x.inventory, 0);
      const overstock = p.filter(x => x.inventory > x.demand * 3);
      const overstockUnits = overstock.reduce((s, x) => s + (x.inventory - x.demand * 3), 0);
      const items: InsightItem[] = [];
      if (overstock.length > 0) items.push({ icon: AlertTriangle, text: `${overstock.length} items have too much stock — ${overstockUnits.toLocaleString()} extra pieces with money stuck`, type: "warning" });
      items.push({ icon: Package, text: `Total stock: ${total.toLocaleString()} pieces across ${p.length} items`, type: "success" });
      const avgStock = p.length > 0 ? Math.round(total / p.length) : 0;
      items.push({ icon: CheckCircle2, text: `Average stock per item: ${avgStock.toLocaleString()} pieces`, type: "success" });
      return items;
    },
  },
  {
    id: "lead-time",
    title: "Delivery Time",
    icon: "Clock",
    accent: "amber",
    unit: "days",
    description: "How many days, on average, new stock takes to reach your shop. If it takes long, keep a little extra so items never finish.",
    getValue: (p) => p.length > 0 ? parseFloat((p.reduce((s, x) => s + x.leadTime, 0) / p.length).toFixed(1)) : 0,
    getBreakdown: (p) => {
      const fast = p.filter(x => x.leadTime <= 7);
      const medium = p.filter(x => x.leadTime > 7 && x.leadTime <= 14);
      const slow = p.filter(x => x.leadTime > 14);
      const total = p.length || 1;
      return [
        { label: "Fast (<=7d)", value: `${fast.length} items`, pct: (fast.length / total) * 100, color: "#059669" },
        { label: "Medium (8-14d)", value: `${medium.length} items`, pct: (medium.length / total) * 100, color: "#d97706" },
        { label: "Slow (>14d)", value: `${slow.length} items`, pct: (slow.length / total) * 100, color: "#e11d48" },
      ];
    },
    getChartData: (p) => {
      return [...p].sort((a, b) => b.leadTime - a.leadTime).slice(0, 10).map(x => ({
        name: x.name.length > 12 ? x.name.slice(0, 12) + "..." : x.name,
        value: x.leadTime,
        fill: x.leadTime > 14 ? "#e11d48" : x.leadTime > 7 ? "#d97706" : "#059669",
      }));
    },
    getInsights: (p) => {
      const slow = p.filter(x => x.leadTime > 14);
      const atRisk = p.filter(x => x.leadTime > Math.floor(x.inventory / (x.demand || 1)));
      const items: InsightItem[] = [];
      if (slow.length > 0) items.push({ icon: Clock, text: `${slow.length} items take more than 14 days to arrive — keep a backup supplier`, type: "warning" });
      if (atRisk.length > 0) items.push({ icon: AlertTriangle, text: `${atRisk.length} items may finish before new stock arrives`, type: "critical" });
      const fastest = p.length > 0 ? Math.min(...p.map(x => x.leadTime)) : 0;
      const slowest = p.length > 0 ? Math.max(...p.map(x => x.leadTime)) : 0;
      items.push({ icon: CheckCircle2, text: `Delivery takes from ${fastest} days (fastest) to ${slowest} days (slowest)`, type: "success" });
      return items;
    },
  },
  {
    id: "ai-confidence",
    title: "Tip Accuracy",
    icon: "BrainCircuit",
    accent: "violet",
    unit: "%",
    description: "How sure the helper is about its tips. A higher number means the tips are based on strong, clear data from your shop.",
    getValue: (_, ins) => {
      if (ins.length === 0) return 0;
      return parseFloat((ins.reduce((s, i) => s + (i.confidence <= 1 ? i.confidence * 100 : i.confidence), 0) / ins.length).toFixed(1));
    },
    getBreakdown: (_, ins) => {
      const high = ins.filter(i => (i.confidence <= 1 ? i.confidence * 100 : i.confidence) >= 80);
      const med = ins.filter(i => { const c = i.confidence <= 1 ? i.confidence * 100 : i.confidence; return c >= 60 && c < 80; });
      const low = ins.filter(i => (i.confidence <= 1 ? i.confidence * 100 : i.confidence) < 60);
      const total = ins.length || 1;
      return [
        { label: "High (>=80%)", value: `${high.length} tips`, pct: (high.length / total) * 100, color: "#059669" },
        { label: "Medium (60-79%)", value: `${med.length} tips`, pct: (med.length / total) * 100, color: "#d97706" },
        { label: "Low (<60%)", value: `${low.length} tips`, pct: (low.length / total) * 100, color: "#e11d48" },
      ];
    },
    getChartData: (_, ins) => {
      const types: Record<string, { total: number; count: number }> = {};
      ins.forEach(i => {
        const c = i.confidence <= 1 ? i.confidence * 100 : i.confidence;
        if (!types[i.type]) types[i.type] = { total: 0, count: 0 };
        types[i.type].total += c;
        types[i.type].count += 1;
      });
      return Object.entries(types).map(([name, { total, count }]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: parseFloat((total / count).toFixed(1)),
      }));
    },
    getInsights: (_, ins) => {
      const avgConf = ins.length > 0 ? ins.reduce((s, i) => s + (i.confidence <= 1 ? i.confidence * 100 : i.confidence), 0) / ins.length : 0;
      const items: InsightItem[] = [];
      if (avgConf < 75) items.push({ icon: AlertTriangle, text: `The helper is less than 75% sure — it needs a bit more shop data`, type: "warning" });
      else items.push({ icon: CheckCircle2, text: `The helper is quite sure — ${avgConf.toFixed(1)}%`, type: "success" });
      items.push({ icon: BrainCircuit, text: `${ins.length} tips made from ${new Set(ins.map(i => i.type)).size} kinds of checks`, type: "success" });
      return items;
    },
  },
  {
    id: "critical-alerts",
    title: "Needs Attention",
    icon: "ShieldAlert",
    accent: "rose",
    unit: "items",
    description: "Things that need action right now — like items about to finish or selling much faster than expected. Handle these first.",
    getValue: (_, ins) => ins.filter(i => i.impact > 70).length,
    getBreakdown: (_, ins) => {
      const critical = ins.filter(i => i.impact > 70);
      const types: Record<string, number> = {};
      critical.forEach(i => { types[i.type] = (types[i.type] || 0) + 1; });
      const total = critical.length || 1;
      const colors = ["#e11d48", "#d97706", "#7c3aed", "#0284c7"];
      return Object.entries(types).map(([type, count], idx) => ({
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: `${count} tip${count > 1 ? "s" : ""}`,
        pct: (count / total) * 100,
        color: colors[idx % colors.length],
      }));
    },
    getChartData: (_, ins) => {
      const critical = ins.filter(i => i.impact > 70);
      return critical.slice(0, 8).map(i => ({
        name: i.message.length > 20 ? i.message.slice(0, 20) + "..." : i.message,
        value: Math.round(i.impact),
      }));
    },
    getInsights: (p, ins) => {
      const critical = ins.filter(i => i.impact > 70);
      const items: InsightItem[] = [];
      if (critical.length === 0) items.push({ icon: CheckCircle2, text: "Nothing urgent — everything looks fine", type: "success" });
      else {
        items.push({ icon: ShieldAlert, text: `${critical.length} thing${critical.length > 1 ? "s need" : " needs"} your attention now`, type: "critical" });
        const stockouts = critical.filter(i => i.type === "stockout");
        if (stockouts.length > 0) items.push({ icon: AlertTriangle, text: `${stockouts.length} item${stockouts.length > 1 ? "s" : ""} may finish soon — restock first`, type: "critical" });
      }
      const avgImpact = critical.length > 0 ? (critical.reduce((s, i) => s + i.impact, 0) / critical.length).toFixed(0) : "0";
      items.push({ icon: TrendingUp, text: `Average urgency score: ${avgImpact}`, type: "warning" });
      return items;
    },
  },
  {
    id: "demand-pressure",
    title: "Selling Speed",
    icon: "TrendingUp",
    accent: "amber",
    unit: "%",
    description: "How fast your items sell compared to how much you keep. A high number means items are selling faster than you are stocking them.",
    getValue: (p) => {
      if (p.length === 0) return 0;
      const raw = (p.reduce((s, x) => s + (x.inventory > 0 ? Math.min(x.demand / x.inventory, 1) : 1), 0) / p.length) * 100;
      return parseFloat(Math.min(raw, 100).toFixed(1));
    },
    getBreakdown: (p) => {
      const low = p.filter(x => { const r = x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100; return r <= 50; });
      const med = p.filter(x => { const r = x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100; return r > 50 && r <= 80; });
      const high = p.filter(x => { const r = x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100; return r > 80; });
      const total = p.length || 1;
      return [
        { label: "Selling Slow", value: `${low.length} items`, pct: (low.length / total) * 100, color: "#059669" },
        { label: "Selling Okay", value: `${med.length} items`, pct: (med.length / total) * 100, color: "#d97706" },
        { label: "Selling Fast", value: `${high.length} items`, pct: (high.length / total) * 100, color: "#e11d48" },
      ];
    },
    getChartData: (p) => {
      return [...p].sort((a, b) => {
        const ra = a.inventory > 0 ? a.demand / a.inventory : 1;
        const rb = b.inventory > 0 ? b.demand / b.inventory : 1;
        return rb - ra;
      }).slice(0, 10).map(x => ({
        name: x.name.length > 12 ? x.name.slice(0, 12) + "..." : x.name,
        value: parseFloat((Math.min(x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100, 100)).toFixed(1)),
        fill: (() => { const r = x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100; return r > 80 ? "#e11d48" : r > 50 ? "#d97706" : "#059669"; })(),
      }));
    },
    getInsights: (p) => {
      const highPressure = p.filter(x => (x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100) > 80);
      const items: InsightItem[] = [];
      if (highPressure.length > 0) items.push({ icon: AlertTriangle, text: `${highPressure.length} items are selling very fast — order more now`, type: "critical" });
      const balanced = p.filter(x => { const r = x.inventory > 0 ? (x.demand / x.inventory) * 100 : 100; return r >= 30 && r <= 70; });
      items.push({ icon: CheckCircle2, text: `${balanced.length} items have a good balance of stock and selling`, type: "success" });
      const zeroInv = p.filter(x => x.inventory === 0);
      if (zeroInv.length > 0) items.push({ icon: ShieldAlert, text: `${zeroInv.length} items are fully finished`, type: "critical" });
      return items;
    },
  },
];

function StatCard({ label, value, accent, icon: IconEl }: { label: string; value: string; accent: typeof ACCENT_MAP[string]; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ ...glass, borderRadius: 18, padding: 20, position: "relative", overflow: "hidden" }}
    >
      <div style={{ position: "absolute", top: -10, right: -10, width: 50, height: 50, borderRadius: "50%", background: `radial-gradient(circle, rgba(${accent.rgb},0.15) 0%, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: accent.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <IconEl size={15} style={{ color: accent.color }} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", fontWeight: 500 }}>{label}</span>
      </div>
      <p style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 28, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{value}</p>
    </motion.div>
  );
}

export default function MetricDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { products, insights, isLoading } = useDashboardData();

  const config = useMemo(() => METRIC_CONFIGS.find(m => m.id === id), [id]);

  if (!config) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
        <ShieldAlert size={40} style={{ color: "#e11d48" }} />
        <h2 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>Page not found</h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)" }}>This page does not exist.</p>
        <button onClick={() => router.push("/")} style={{ padding: "8px 20px", borderRadius: 12, background: "linear-gradient(135deg, #0ea5e9, #8b5cf6)", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Back to My Shop
        </button>
      </div>
    );
  }

  const accent = ACCENT_MAP[config.accent] || ACCENT_MAP.cyan;
  const Icon = ICONS[config.icon] || Package;
  const currentValue = config.getValue(products, insights);
  const breakdown = config.getBreakdown(products, insights);
  const chartData = config.getChartData(products, insights);
  const metricInsights = config.getInsights(products, insights);

  const trendIcon = config.id === "critical-alerts"
    ? (currentValue === 0 ? ArrowDownRight : ArrowUpRight)
    : (config.id === "lead-time" ? (currentValue > 14 ? ArrowUpRight : ArrowDownRight) : ArrowUpRight);
  const TrendIcon = trendIcon;

  const displayValue = config.unit === "%" || config.unit === "days"
    ? currentValue.toFixed(1)
    : currentValue >= 1000
      ? `${(currentValue / 1000).toFixed(1)}k`
      : currentValue.toLocaleString();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
          style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.12)", borderTopColor: accent.color }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            style={{
              width: 32, height: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} style={{ color: "#f1f5f9" }} />
          </motion.button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10, background: accent.light,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid rgba(${accent.rgb},0.2)`,
            }}>
              <Icon size={15} style={{ color: accent.color }} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{config.title}</h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", margin: 0 }}>Full details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px" }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>

          {/* Hero value + description */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                ...glass, borderRadius: 22, padding: 28, position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, rgba(${accent.rgb},0.18) 0%, transparent 70%)`, pointerEvents: "none" }} />
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 8 }}>Right Now</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 48, fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>{displayValue}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: accent.color, marginBottom: 6 }}>{config.unit}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 999,
                  background: accent.light, border: `1px solid rgba(${accent.rgb},0.15)`,
                }}>
                  <TrendIcon size={12} style={{ color: accent.color }} strokeWidth={2.5} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: accent.color }}>Live</span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>From {products.length} items & {insights.length} tips</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              style={{ ...glass, borderRadius: 22, padding: 28 }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 12 }}>What This Means</p>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}>{config.description}</p>
            </motion.div>
          </div>

          {/* Chart + Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 24 }}>
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="shimmer-card chart-depth"
              style={{ ...glass, borderRadius: 22, padding: 24, perspective: "1000px" }}
              {...chartPerspectiveHover}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 16 }}>Spread</p>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {config.id === "ai-confidence" ? (
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={accent.color} stopOpacity={0.45} />
                          <stop offset="100%" stopColor={accent.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.48)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.48)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ ...tooltipStyle }}
                      />
                      <Area type="monotone" dataKey="value" stroke={accent.color} strokeWidth={2} fill="url(#areaGrad)" {...animationProps} />
                    </AreaChart>
                  ) : (
                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.48)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "rgba(255,255,255,0.48)" }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ ...tooltipStyle }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} {...animationProps}>
                        {chartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill || accent.color} fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              style={{ ...glass, borderRadius: 22, padding: 24 }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 16 }}>Breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {breakdown.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(item.pct, 100)}%` }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ height: "100%", borderRadius: 999, background: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mini donut */}
              {breakdown.length > 0 && breakdown.length <= 5 && (
                <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
                  <PieChart width={140} height={140}>
                    <Pie
                      data={breakdown.map(b => ({ name: b.label, value: b.pct || 0.1 }))}
                      cx={70} cy={70}
                      innerRadius={40} outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      {...animationProps}
                    >
                      {breakdown.map((b, i) => (
                        <Cell key={i} fill={b.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
              )}
            </motion.div>
          </div>

          {/* Business Insights */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.125 }}
            style={{ ...glass, borderRadius: 22, padding: 24 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 16 }}>Smart Tips</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metricInsights.map((item, i) => {
                const IIcon = item.icon;
                const bg = item.type === "critical" ? "rgba(225,29,72,0.06)" : item.type === "warning" ? "rgba(217,119,6,0.06)" : "rgba(5,150,105,0.06)";
                const border = item.type === "critical" ? "rgba(225,29,72,0.15)" : item.type === "warning" ? "rgba(217,119,6,0.15)" : "rgba(5,150,105,0.15)";
                const iconColor = item.type === "critical" ? "#e11d48" : item.type === "warning" ? "#d97706" : "#059669";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.175 + i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "14px 16px", borderRadius: 14,
                      background: bg, border: `1px solid ${border}`,
                    }}
                  >
                    <IIcon size={16} style={{ color: iconColor, flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", margin: 0 }}>{item.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
