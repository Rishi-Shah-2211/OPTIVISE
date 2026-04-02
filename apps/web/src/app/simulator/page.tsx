"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical, Search, Play,
  AlertTriangle, CheckCircle2, TrendingDown,
  DollarSign, Gauge, Lightbulb, BarChart2,
  Minus, Plus,
} from "lucide-react";
import type { Product } from "@/types/dashboard";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.92)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
};

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

interface SimResult {
  riskLevel: "low" | "medium" | "high" | "critical";
  stockoutDays: number;
  overstockScore: number;
  costImpact: number;
  costDirection: "save" | "loss";
  recommendation: string;
  insights: { icon: React.ElementType; text: string; type: "warn" | "ok" | "info" }[];
  optimization: string;
}

const AVG_UNIT_COST = 24;
const AVG_HOLDING_RATE = 0.22;
const STOCKOUT_PENALTY = 48;

function simulate(product: Product, demand: number, inventory: number, leadTime: number): SimResult {
  const daysStock = demand > 0 ? Math.floor(inventory / demand) : 999;
  const stockoutRisk = daysStock < leadTime;
  const criticalRisk = daysStock < leadTime * 0.5;
  const overstockRatio = inventory / (demand || 1);
  const overstock = overstockRatio > 3;
  const pressure = Math.min((demand / (inventory || 1)) * 100, 100);

  let riskLevel: SimResult["riskLevel"] = "low";
  if (criticalRisk) riskLevel = "critical";
  else if (stockoutRisk) riskLevel = "high";
  else if (daysStock < leadTime * 1.5) riskLevel = "medium";

  // Cost impact calculation
  let costImpact = 0;
  let costDirection: "save" | "loss" = "save";

  if (stockoutRisk) {
    const unmetDemand = (leadTime - daysStock) * demand;
    costImpact = unmetDemand * STOCKOUT_PENALTY;
    costDirection = "loss";
  } else if (overstock) {
    const excessUnits = inventory - demand * 60;
    const holdingCost = Math.max(0, excessUnits) * AVG_UNIT_COST * (AVG_HOLDING_RATE / 12);
    costImpact = holdingCost;
    costDirection = excessUnits > 0 ? "loss" : "save";
  } else {
    const safetyStock = demand * leadTime * 1.5;
    const savedUnits = Math.max(0, safetyStock - inventory);
    costImpact = savedUnits * AVG_UNIT_COST * (AVG_HOLDING_RATE / 12);
    costDirection = "save";
  }

  // Insights
  const insights: SimResult["insights"] = [];

  if (criticalRisk)
    insights.push({ icon: AlertTriangle, text: `CRITICAL: Stock depletes in ${daysStock}d but lead time is ${leadTime}d. Stockout in ${Math.max(0, daysStock)}d.`, type: "warn" });
  else if (stockoutRisk)
    insights.push({ icon: AlertTriangle, text: `Stock runs out ${leadTime - daysStock}d before your next delivery arrives. Buffer reorder needed now.`, type: "warn" });
  else
    insights.push({ icon: CheckCircle2, text: `Current stock covers ${daysStock}d of demand — ${daysStock - leadTime}d safety buffer above lead time.`, type: "ok" });

  if (overstock)
    insights.push({ icon: TrendingDown, text: `Overstock detected: inventory = ${(overstockRatio).toFixed(1)}× monthly demand. Holding costs accumulating daily.`, type: "warn" });
  else if (demand > 0)
    insights.push({ icon: CheckCircle2, text: `Inventory-to-demand ratio is healthy at ${overstockRatio.toFixed(1)}×. No excess holding costs.`, type: "ok" });

  if (leadTime > 21)
    insights.push({ icon: AlertTriangle, text: `Lead time of ${leadTime} days is high. Explore dual-sourcing to reduce supplier dependency risk.`, type: "warn" });
  else if (leadTime > 14)
    insights.push({ icon: Lightbulb, text: `Lead time is moderately high (${leadTime}d). Consider pre-positioning stock for peak seasons.`, type: "info" });

  if (pressure > 85)
    insights.push({ icon: Lightbulb, text: `Demand pressure at ${Math.round(pressure)}%. Consider pricing adjustment or demand smoothing strategy.`, type: "info" });

  const recommendation =
    riskLevel === "critical" ? `Emergency action required for ${product.name}. Place an expedited order covering at least ${leadTime * demand * 2} units immediately. Cost of inaction: ~$${Math.round(costImpact).toLocaleString()} in lost revenue.`
    : riskLevel === "high"   ? `Reorder ${product.name} within 24–48 hours. Current trajectory leads to stockout before next delivery. Minimum order: ${Math.round(demand * leadTime * 1.3)} units.`
    : riskLevel === "medium" ? `Monitor ${product.name} closely. Buffer is thin — consider a precautionary order of ${Math.round(demand * 7)} units within the next 5 days.`
    : overstock              ? `Reduce next order for ${product.name} by ~${Math.round((inventory - demand * 45))} units. Consider a promotional push to reduce excess stock.`
    : `${product.name} inventory is well-positioned. No immediate action required. Schedule next review in ${Math.max(7, Math.round(daysStock / 4))} days.`;

  const optimization =
    riskLevel === "critical" ? `Set automated reorder at ${Math.round(demand * leadTime * 1.8)} units (${Math.round(leadTime * 1.8)}d supply) to prevent recurrence.`
    : riskLevel === "high"   ? `Optimal safety stock for this demand/lead time profile: ${Math.round(demand * (leadTime + 7))} units. Adjust min-stock threshold in your ERP.`
    : overstock              ? `Optimal order quantity at current demand: ${Math.round(demand * 30)} units/month (30-day supply). Reduces holding cost by ~${Math.round(AVG_HOLDING_RATE * 100 * 0.4)}%.`
    : `Your current parameters align with an Economic Order Quantity of ~${Math.round(demand * leadTime * 1.25)} units. Maintain this cadence for optimal cost efficiency.`;

  return {
    riskLevel, stockoutDays: Math.min(daysStock, 999),
    overstockScore: Math.min(Math.round((overstockRatio / 5) * 100), 100),
    costImpact: Math.round(costImpact),
    costDirection,
    recommendation, optimization,
    insights,
  };
}

const RISK_STYLES = {
  critical: { color: "#e11d48", bg: "rgba(225,29,72,0.07)", border: "rgba(225,29,72,0.2)", label: "Critical Risk"  },
  high:     { color: "#e11d48", bg: "rgba(225,29,72,0.06)", border: "rgba(225,29,72,0.15)", label: "High Risk"     },
  medium:   { color: "#d97706", bg: "rgba(217,119,6,0.07)", border: "rgba(217,119,6,0.18)", label: "Medium Risk"   },
  low:      { color: "#059669", bg: "rgba(5,150,105,0.07)", border: "rgba(5,150,105,0.15)", label: "Low Risk"      },
};

function StepButton({ direction, color, onClick }: {
  direction: "minus" | "plus"; color: string; onClick: () => void;
}) {
  const Icon = direction === "minus" ? Minus : Plus;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.12, boxShadow: `0 4px 14px ${color}30` }}
      whileTap={{ scale: 0.88 }}
      style={{
        width: 28, height: 28, borderRadius: 9,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: `${color}12`, border: `1px solid ${color}30`,
        color, cursor: "pointer", transition: "all 0.15s ease",
        flexShrink: 0,
      }}
    >
      <Icon size={13} strokeWidth={2.5} />
    </motion.button>
  );
}

function SliderControl({ label, value, onChange, min, max, color, format, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; color: string; format?: (v: number) => string; step?: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  return (
    <div style={{ ...glass, borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StepButton direction="minus" color={color} onClick={() => onChange(clamp(value - step))} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color, minWidth: 48, textAlign: "center" }}>{format ? format(value) : value.toLocaleString()}</span>
          <StepButton direction="plus" color={color} onClick={() => onChange(clamp(value + step))} />
        </div>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 6, borderRadius: 999, appearance: "none", outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(0,0,0,0.10) ${pct}%, rgba(0,0,0,0.10) 100%)`,
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${color}; box-shadow: 0 2px 8px ${color}50; cursor: pointer; border: 2px solid white; }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: ${color}; box-shadow: 0 2px 8px ${color}50; cursor: pointer; border: 2px solid white; }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{format ? format(min) : min}</span>
        <span style={{ fontSize: 10, color: "#9CA3AF" }}>{format ? format(max) : max}</span>
      </div>
    </div>
  );
}

export default function SimulatorPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [demand, setDemand] = useState(100);
  const [inventory, setInventory] = useState(500);
  const [leadTime, setLeadTime] = useState(7);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const searchFiltered = search.trim()
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : products;

  const selectedProduct = products.find(p => p.id === selectedId);

  useEffect(() => {
    if (selectedProduct) {
      setDemand(selectedProduct.demand);
      setInventory(selectedProduct.inventory);
      setLeadTime(selectedProduct.leadTime);
      setResult(null);
    }
  }, [selectedId]);

  useEffect(() => {
    if (products.length > 0 && !selectedId) setSelectedId(products[0].id);
  }, [products]);

  const runSim = async () => {
    if (!selectedProduct) return;
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, demand, inventory, leadTime }),
      });
      const data = await res.json();
      if (res.ok && data?.riskLevel) setResult(data as SimResult);
      else setResult(simulate(selectedProduct, demand, inventory, leadTime));
    } catch {
      setResult(simulate(selectedProduct, demand, inventory, leadTime));
    } finally {
      setTimeout(() => setIsRunning(false), 700);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 32px", height: 60,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlaskConical size={13} style={{ color: "#059669" }} strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>Scenario Simulator</h1>
          <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>Model outcomes before they happen</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 8 }}>Select Product</p>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  style={{
                    width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    borderRadius: 12, fontSize: 13, outline: "none",
                    background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.10)",
                    color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                />
              </div>
              <div style={{ ...glass, borderRadius: 16, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                {isLoading
                  ? <p style={{ padding: 14, fontSize: 13, color: "#9CA3AF" }}>Loading products...</p>
                  : searchFiltered.length === 0
                    ? <p style={{ padding: 14, fontSize: 13, color: "#9CA3AF" }}>No products found</p>
                    : searchFiltered.map(p => (
                        <button key={p.id} onClick={() => setSelectedId(p.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", background: selectedId === p.id ? "rgba(5,150,105,0.08)" : "transparent",
                            borderBottom: "1px solid rgba(0,0,0,0.04)", color: selectedId === p.id ? "#059669" : "#374151",
                            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                            transition: "background 0.12s ease", textAlign: "left",
                          }}
                          onMouseEnter={(e) => { if (selectedId !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.03)"; }}
                          onMouseLeave={(e) => { if (selectedId !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                        >
                          <BarChart2 size={13} style={{ color: "inherit", flexShrink: 0 }} strokeWidth={2} />
                          {p.name}
                        </button>
                      ))
                }
              </div>
            </div>

            {selectedProduct && (
              <>
                <SliderControl label="Daily Demand" value={demand} onChange={(v) => { setDemand(v); setResult(null); }} min={0} max={2000} color="#0284c7" />
                <SliderControl label="Current Inventory" value={inventory} onChange={(v) => { setInventory(v); setResult(null); }} min={0} max={10000} color="#059669" />
                <SliderControl label="Lead Time" value={leadTime} onChange={(v) => { setLeadTime(v); setResult(null); }} min={1} max={90} color="#d97706" format={(v) => `${v}d`} />

                <motion.button
                  onClick={runSim}
                  disabled={isRunning}
                  whileHover={!isRunning ? { scale: 1.02, boxShadow: "0 8px 24px rgba(5,150,105,0.25)" } : {}}
                  whileTap={!isRunning ? { scale: 0.98 } : {}}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "14px 0", borderRadius: 16, fontSize: 14, fontWeight: 700,
                    background: isRunning ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg, rgba(5,150,105,0.15), rgba(2,132,199,0.12))",
                    border: isRunning ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(5,150,105,0.35)",
                    color: isRunning ? "#9CA3AF" : "#059669",
                    cursor: isRunning ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {isRunning
                    ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.12)", borderTopColor: "#059669" }} /></motion.div> Analysing...</>
                    : <><Play size={15} strokeWidth={2.5} /> Run Simulation</>
                  }
                </motion.button>
              </>
            )}
          </div>

          {/* Results */}
          <div>
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 300, gap: 16 }}>
                  <div style={{ position: "relative", width: 56, height: 56 }}>
                    <motion.div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(5,150,105,0.15)" }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} />
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid rgba(5,150,105,0.15)", borderTopColor: "#059669", animation: "spin 0.8s linear infinite" }} />
                  </div>
                  <p style={{ fontSize: 13, color: "#6B7280" }}>Running scenario analysis...</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </motion.div>
              ) : result && selectedProduct ? (
                <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Risk banner */}
                  {(() => {
                    const rs = RISK_STYLES[result.riskLevel];
                    return (
                      <div style={{ ...glass, borderRadius: 20, padding: 20, background: rs.bg, border: `1px solid ${rs.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <AlertTriangle size={16} style={{ color: rs.color }} strokeWidth={2} />
                          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: rs.color }}>{rs.label}</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: "#374151" }}>{result.recommendation}</p>
                      </div>
                    );
                  })()}

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {[
                      { Icon: Gauge,      label: "Days Until Stockout", value: result.stockoutDays > 365 ? "365+" : `${result.stockoutDays}d`, color: result.stockoutDays < 14 ? "#e11d48" : "#059669" },
                      { Icon: BarChart2,  label: "Overstock Score",      value: `${result.overstockScore}/100`,  color: result.overstockScore > 60 ? "#d97706" : "#059669" },
                      { Icon: DollarSign, label: `Est. ${result.costDirection === "loss" ? "Cost Exposure" : "Cost Saving"}`, value: `$${result.costImpact.toLocaleString()}`, color: result.costDirection === "loss" ? "#e11d48" : "#059669" },
                    ].map((s, i) => (
                      <div key={i} style={{ ...glass, borderRadius: 16, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                          <s.Icon size={13} style={{ color: "#9CA3AF" }} strokeWidth={2} />
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>{s.label}</span>
                        </div>
                        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14 }}>Scenario Breakdown</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.insights.map((ins, i) => {
                        const InsIcon = ins.icon;
                        const ic = ins.type === "warn" ? "#e11d48" : ins.type === "ok" ? "#059669" : "#0284c7";
                        const ibg = ins.type === "warn" ? "rgba(225,29,72,0.07)" : ins.type === "ok" ? "rgba(5,150,105,0.07)" : "rgba(2,132,199,0.07)";
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            style={{ display: "flex", gap: 10, padding: 12, borderRadius: 14, background: ibg, border: `1px solid ${ic}20` }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: `${ic}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <InsIcon size={13} style={{ color: ic }} strokeWidth={2} />
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.5, color: "#374151" }}>{ins.text}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optimization */}
                  <div style={{ ...glass, borderRadius: 20, padding: 20, background: "rgba(250,250,255,0.85)", border: "1px solid rgba(139,92,246,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Lightbulb size={14} style={{ color: "#7c3aed" }} strokeWidth={1.8} />
                      <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#111827" }}>Optimization Recommendation</p>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "#374151" }}>{result.optimization}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FlaskConical size={26} style={{ color: "#059669" }} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#374151", textAlign: "center" }}>Ready to Simulate</h3>
                  <p style={{ fontSize: 13, color: "#6B7280", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
                    Select a product, adjust demand, inventory, and lead time parameters, then run the simulation.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}