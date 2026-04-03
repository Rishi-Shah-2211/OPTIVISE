"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowLeft, Package, Boxes, Clock, BrainCircuit,
  ShieldAlert, TrendingUp, Sparkles, CheckCircle2,
  AlertTriangle, Zap, ArrowRight,
} from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import type { Product, Insight } from "@/types/dashboard";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
};

type AccentColor = "cyan" | "emerald" | "amber" | "violet" | "rose";

type MetricConfig = {
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  color: string;
  accent: AccentColor;
  rgb: string;
};

const CONFIGS: Record<string, MetricConfig> = {
  "total-skus":      { title: "Total SKUs",       subtitle: "Product catalog health and coverage", Icon: Package,     color: "#0284c7", accent: "cyan",    rgb: "2,132,199"   },
  inventory:         { title: "Total Inventory",   subtitle: "Stock levels across all warehouses",  Icon: Boxes,       color: "#059669", accent: "emerald", rgb: "5,150,105"   },
  "lead-time":       { title: "Avg Lead Time",     subtitle: "Supplier delivery performance",       Icon: Clock,       color: "#d97706", accent: "amber",   rgb: "217,119,6"   },
  "ai-confidence":   { title: "AI Confidence",     subtitle: "Model certainty across insights",      Icon: BrainCircuit,color: "#7c3aed", accent: "violet",  rgb: "124,58,237"  },
  "critical-alerts": { title: "Critical Alerts",   subtitle: "High-impact supply chain signals",    Icon: ShieldAlert, color: "#e11d48", accent: "rose",    rgb: "225,29,72"   },
  "demand-pressure": { title: "Demand Pressure",   subtitle: "Real-time demand vs inventory load",  Icon: TrendingUp,  color: "#d97706", accent: "amber",   rgb: "217,119,6"   },
};

const ACTIONS: Record<string, { Icon: React.ElementType; action: string; priority: "high" | "medium" | "low" }[]> = {
  "total-skus": [
    { Icon: Zap,          action: "Run demand forecast for the top 20 highest-velocity SKUs to prevent future stockouts.", priority: "high"   },
    { Icon: CheckCircle2, action: "Consolidate slow-moving SKUs with < 5 units sold in 90 days to reduce holding costs.", priority: "medium" },
    { Icon: AlertTriangle,action: "Audit product catalog for duplicate entries that inflate SKU count artificially.",       priority: "low"    },
  ],
  inventory: [
    { Icon: AlertTriangle,action: "Immediately reorder all SKUs below their minimum stock threshold before next cycle.",    priority: "high"   },
    { Icon: Zap,          action: "Reallocate excess stock from low-demand regions to high-demand distribution centers.",   priority: "high"   },
    { Icon: CheckCircle2, action: "Archive inventory with zero movement for 90+ days and negotiate returns with supplier.", priority: "medium" },
  ],
  "lead-time": [
    { Icon: AlertTriangle,action: "Renegotiate delivery terms with suppliers exceeding 14-day lead time immediately.",       priority: "high"   },
    { Icon: Zap,          action: "Identify and onboard backup suppliers for all single-source high-risk SKUs.",            priority: "high"   },
    { Icon: CheckCircle2, action: "Build 2-week buffer stock for items where lead time exceeds current safety stock days.", priority: "medium" },
  ],
  "ai-confidence": [
    { Icon: AlertTriangle,action: "Manually review all insights with confidence below 60% before taking procurement action.", priority: "high"   },
    { Icon: Zap,          action: "Feed last 90 days of actual transaction data to retrain the prediction model.",           priority: "medium" },
    { Icon: CheckCircle2, action: "Set weekly validation cycles comparing AI predictions to actual supply outcomes.",        priority: "low"    },
  ],
  "critical-alerts": [
    { Icon: AlertTriangle,action: "Escalate all impact > 80 alerts to procurement team within 24 hours — time sensitive.",  priority: "high"   },
    { Icon: Zap,          action: "Run simulator scenarios for the top 5 critical SKUs to model mitigation outcomes.",       priority: "high"   },
    { Icon: CheckCircle2, action: "Set automated threshold alerts to notify team before impact exceeds 70.",                priority: "medium" },
  ],
  "demand-pressure": [
    { Icon: AlertTriangle,action: "Emergency restock all products where demand/inventory ratio exceeds 90% right now.",      priority: "high"   },
    { Icon: Zap,          action: "Increase safety stock multiplier for high-volatility seasonal products by 1.5x.",        priority: "high"   },
    { Icon: CheckCircle2, action: "Review pricing strategy for chronically over-demanded products — demand-side relief.",   priority: "medium" },
  ],
};

function getStats(id: string, products: Product[], insights: Insight[]) {
  const normalize = (c: number) => (c <= 1 ? c * 100 : c);
  switch (id) {
    case "total-skus":
      return {
        primary: products.length.toString(),
        secondLabel: "Understocked SKUs",   secondVal: products.filter(p => p.demand > p.inventory).length.toString(),
        thirdLabel:  "Overstocked SKUs",    thirdVal:  products.filter(p => p.inventory > p.demand * 2).length.toString(),
        chart: products.slice(0, 10).map(p => ({ name: p.name.slice(0, 6), value: p.inventory })),
        chartLabel: "Inventory by Product",
      };
    case "inventory":
      return {
        primary: products.reduce((s, p) => s + p.inventory, 0).toLocaleString(),
        secondLabel: "Critical Low (< 50)",  secondVal: products.filter(p => p.inventory < 50).length.toString(),
        thirdLabel:  "Avg Per SKU",           thirdVal:  Math.round(products.reduce((s, p) => s + p.inventory, 0) / (products.length || 1)).toLocaleString(),
        chart: products.slice(0, 10).map(p => ({ name: p.name.slice(0, 6), value: p.inventory })),
        chartLabel: "Stock Levels Per SKU",
      };
    case "lead-time":
      return {
        primary: `${(products.reduce((s, p) => s + p.leadTime, 0) / (products.length || 1)).toFixed(1)}d`,
        secondLabel: "Exceed 14 Days",  secondVal: products.filter(p => p.leadTime > 14).length.toString(),
        thirdLabel:  "Fastest / Slowest", thirdVal: `${Math.min(...products.map(p => p.leadTime).concat([0]))}d / ${Math.max(...products.map(p => p.leadTime).concat([0]))}d`,
        chart: products.slice(0, 10).map(p => ({ name: p.name.slice(0, 6), value: p.leadTime })),
        chartLabel: "Lead Time (days) Per SKU",
      };
    case "ai-confidence":
      return {
        primary: insights.length ? `${(insights.reduce((s, i) => s + normalize(i.confidence), 0) / insights.length).toFixed(1)}%` : "0%",
        secondLabel: "High Confidence (> 80%)", secondVal: insights.filter(i => normalize(i.confidence) > 80).length.toString(),
        thirdLabel:  "Needs Review (< 50%)",     thirdVal:  insights.filter(i => normalize(i.confidence) < 50).length.toString(),
        chart: insights.slice(0, 10).map((ins, i) => ({ name: `#${i + 1}`, value: Math.round(normalize(ins.confidence)) })),
        chartLabel: "Confidence Per Insight",
      };
    case "critical-alerts":
      return {
        primary: insights.filter(i => i.impact > 70).length.toString(),
        secondLabel: "Severity 90+",   secondVal: insights.filter(i => i.impact > 90).length.toString(),
        thirdLabel:  "Severity 70–90", thirdVal:  insights.filter(i => i.impact > 70 && i.impact <= 90).length.toString(),
        chart: insights.filter(i => i.impact > 70).slice(0, 8).map((ins, i) => ({ name: `#${i + 1}`, value: Math.round(ins.impact) })),
        chartLabel: "Impact by Critical Alert",
      };
    default:
      return {
        primary: `${Math.min((products.reduce((s, p) => s + (p.inventory > 0 ? Math.min(p.demand / p.inventory, 1) : 1), 0) / (products.length || 1)) * 100, 100).toFixed(1)}%`,
        secondLabel: "High Pressure (> 80%)", secondVal: products.filter(p => p.inventory > 0 && (p.demand / p.inventory) > 0.8).length.toString(),
        thirdLabel:  "Low Pressure (< 30%)",  thirdVal:  products.filter(p => p.inventory > 0 && (p.demand / p.inventory) < 0.3).length.toString(),
        chart: products.slice(0, 10).map(p => ({ name: p.name.slice(0, 6), value: Math.round(Math.min((p.demand / (p.inventory || 1)) * 100, 100)) })),
        chartLabel: "Demand Pressure % Per SKU",
      };
  }
}

function ChartTooltip({ active, payload, label, color }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; color: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...glass, borderRadius: 12, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#6B7280", marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color }}>{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function MetricDetailPage() {
  const { metric: metricId } = useParams() as { metric: string };
  const router = useRouter();
  const cfg = CONFIGS[metricId];
  const actions = ACTIONS[metricId] ?? [];
  const { products, insights, isLoading } = useDashboardData();

  if (!cfg) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Metric not found.</p>
        <button onClick={() => router.push("/")} style={{ color: "#0284c7", cursor: "pointer", background: "none", border: "none", fontSize: 13 }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const { Icon } = cfg;
  const stats = getStats(metricId, products, insights);

  const trendVal = parseFloat(stats.primary.replace(/[^0-9.]/g, "")) || 50;
  const trendData = Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    value: Math.max(1, trendVal * (0.65 + Math.sin(i * 0.55) * 0.22 + (i / 12) * 0.28)),
  }));

  const priorityStyle = (p: "high" | "medium" | "low") => ({
    high:   { color: "#e11d48", bg: "rgba(225,29,72,0.07)",   border: "rgba(225,29,72,0.15)"   },
    medium: { color: "#d97706", bg: "rgba(217,119,6,0.07)",   border: "rgba(217,119,6,0.15)"   },
    low:    { color: "#059669", bg: "rgba(5,150,105,0.07)",   border: "rgba(5,150,105,0.12)"   },
  }[p]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push("/")}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 12px",
              borderRadius: 10, fontSize: 12, fontWeight: 500,
              background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.10)",
              color: "#374151", cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <ArrowLeft size={13} strokeWidth={2} />
            Dashboard
          </button>
          <div style={{ width: 1, height: 16, background: "rgba(0,0,0,0.08)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 10, background: `rgba(${cfg.rgb},0.10)`, border: `1px solid rgba(${cfg.rgb},0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon size={14} style={{ color: cfg.color }} strokeWidth={2} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827" }}>{cfg.title}</span>
          </div>
        </div>
        <button
          onClick={() => router.push("/copilot")}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
            borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.10))",
            border: "1px solid rgba(14,165,233,0.25)", color: "#0284c7",
            cursor: "pointer", transition: "all 0.15s ease",
          }}
        >
          <Sparkles size={12} strokeWidth={2} />
          Ask Copilot
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 160 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid rgba(${cfg.rgb},0.2)`, borderTopColor: cfg.color, animation: "spin 0.4s linear infinite" }} />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 24 }}>{cfg.subtitle}</p>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Current Value",   value: stats.primary,     color: cfg.color },
                { label: stats.secondLabel, value: stats.secondVal,   color: "#374151" },
                { label: stats.thirdLabel,  value: stats.thirdVal,    color: "#6B7280" },
              ].map((s, i) => (
                <div key={i} style={{ ...glass, borderRadius: 16, padding: "16px 20px" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 8 }}>{s.label}</p>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
              {/* Charts */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ ...glass, borderRadius: 20, padding: 24 }}>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 20 }}>12-Month Trend</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id={`g-${metricId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={cfg.color} stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip color={cfg.color} />} />
                      <Area type="monotone" dataKey="value" stroke={cfg.color} strokeWidth={2} fill={`url(#g-${metricId})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {stats.chart.length > 0 && (
                  <div style={{ ...glass, borderRadius: 20, padding: 24 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 20 }}>{stats.chartLabel}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={stats.chart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip color={cfg.color} />} />
                        <Bar dataKey="value" fill={`rgba(${cfg.rgb},0.15)`} stroke={cfg.color} strokeWidth={1.5} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ ...glass, borderRadius: 20, padding: 20, alignSelf: "start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Sparkles size={14} style={{ color: "#0284c7" }} strokeWidth={1.8} />
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>
                    AI Suggested Actions
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {actions.map((item, i) => {
                    const ActionIcon = item.Icon;
                    const ps = priorityStyle(item.priority);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 + i * 0.035 }}
                        style={{ padding: 12, borderRadius: 14, background: ps.bg, border: `1px solid ${ps.border}` }}
                      >
                        <div style={{ display: "flex", gap: 10 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: `${ps.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ActionIcon size={12} style={{ color: ps.color }} strokeWidth={2} />
                          </div>
                          <div>
                            <p style={{ fontSize: 12, lineHeight: 1.5, color: "#374151" }}>{item.action}</p>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: ps.color, marginTop: 4, display: "block" }}>
                              {item.priority} priority
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  onClick={() => router.push("/copilot")}
                  style={{
                    width: "100%", marginTop: 14, padding: "10px 0",
                    borderRadius: 14, fontSize: 12, fontWeight: 600,
                    background: "linear-gradient(135deg, rgba(14,165,233,0.1), rgba(139,92,246,0.08))",
                    border: "1px solid rgba(14,165,233,0.25)", color: "#0284c7",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(14,165,233,0.15)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
                >
                  <Sparkles size={12} strokeWidth={2} />
                  Discuss with Copilot
                  <ArrowRight size={12} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
