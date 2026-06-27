"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FlaskConical, Search, Play,
  AlertTriangle, CheckCircle2,
  DollarSign, Gauge, Lightbulb, BarChart2,
  Minus, Plus,
} from "lucide-react";
import type { Product } from "@/types/dashboard";
import { runScenario, type ScenarioResult } from "@/lib/simulation/engine";
import { glassCard } from "@/components/layout/PageHeader";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
};

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

// Result shape comes from the shared scenario engine (see lib/simulation/engine.ts).
// The same engine runs on the server (/api/simulate) and here as a fallback,
// so the numbers are always identical.
type SimResult = ScenarioResult;

const RISK_STYLES = {
  critical: { color: "#f43f5e", bg: "rgba(244,63,94,0.10)", border: "rgba(244,63,94,0.2)", label: "Act Now"     },
  high:     { color: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.15)", label: "Order Soon"  },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.18)", label: "Keep Watch" },
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.10)", border: "rgba(16,185,129,0.15)", label: "All Good"   },
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
    <div className={`${glassCard} p-[16px_18px]`}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StepButton direction="minus" color={color} onClick={() => onChange(clamp(value - step))} />
          <span style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 18, fontWeight: 700, color, minWidth: 48, textAlign: "center" }}>{format ? format(value) : value.toLocaleString()}</span>
          <StepButton direction="plus" color={color} onClick={() => onChange(clamp(value + step))} />
        </div>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 6, borderRadius: 999, appearance: "none", outline: "none", cursor: "pointer",
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.12) ${pct}%, rgba(255,255,255,0.12) 100%)`,
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: ${color}; box-shadow: 0 2px 8px ${color}50; cursor: pointer; border: 2px solid white; }
        input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: ${color}; box-shadow: 0 2px 8px ${color}50; cursor: pointer; border: 2px solid white; }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.48)" }}>{format ? format(min) : min}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.48)" }}>{format ? format(max) : max}</span>
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
        body: JSON.stringify({ productId: selectedProduct.id, name: selectedProduct.name, demand, inventory, leadTime }),
      });
      const data = await res.json();
      if (res.ok && data?.riskLevel) setResult(data as SimResult);
      else setResult(runScenario({ name: selectedProduct.name, demand, inventory, leadTime }));
    } catch {
      setResult(runScenario({ name: selectedProduct.name, demand, inventory, leadTime }));
    } finally {
      setTimeout(() => setIsRunning(false), 350);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 32px", height: 60,
        background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(5,150,105,0.12)", border: "1px solid rgba(5,150,105,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FlaskConical size={13} style={{ color: "#059669" }} strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>What-If Tool</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", margin: 0 }}>See what happens before you buy</p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", marginBottom: 8 }}>Pick an Item</p>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search items..."
                  style={{
                    width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                    borderRadius: 12, fontSize: 13, outline: "none",
                    background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                />
              </div>
              <div style={{ ...glass, borderRadius: 16, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
                {isLoading
                  ? <p style={{ padding: 14, fontSize: 13, color: "rgba(255,255,255,0.48)" }}>Loading items...</p>
                  : searchFiltered.length === 0
                    ? <p style={{ padding: 14, fontSize: 13, color: "rgba(255,255,255,0.48)" }}>No items found</p>
                    : searchFiltered.map(p => (
                        <button key={p.id} onClick={() => setSelectedId(p.id)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 10,
                            padding: "10px 14px", background: selectedId === p.id ? "rgba(16,185,129,0.12)" : "transparent",
                            borderBottom: "1px solid rgba(255,255,255,0.08)", color: selectedId === p.id ? "#10b981" : "rgba(255,255,255,0.7)",
                            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                            transition: "background 0.12s ease", textAlign: "left",
                          }}
                          onMouseEnter={(e) => { if (selectedId !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; }}
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
                <SliderControl label="Sells Per Day" value={demand} onChange={(v) => { setDemand(v); setResult(null); }} min={0} max={2000} color="#0284c7" />
                <SliderControl label="In Stock Now" value={inventory} onChange={(v) => { setInventory(v); setResult(null); }} min={0} max={10000} color="#059669" />
                <SliderControl label="Days to Arrive" value={leadTime} onChange={(v) => { setLeadTime(v); setResult(null); }} min={1} max={90} color="#d97706" format={(v) => `${v}d`} />

                <motion.button
                  onClick={runSim}
                  disabled={isRunning}
                  className="btn-premium w-full !py-3.5 !text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRunning
                    ? <><motion.div animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}><div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.12)", borderTopColor: "#059669" }} /></motion.div> Checking...</>
                    : <><Play size={15} strokeWidth={2.5} /> See Result</>
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
                      animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 0.7, repeat: Infinity }} />
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", border: "3px solid rgba(5,150,105,0.15)", borderTopColor: "#059669", animation: "spin 0.4s linear infinite" }} />
                  </div>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)" }}>Working it out...</p>
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
                          <span style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 15, fontWeight: 700, color: rs.color }}>{rs.label}</span>
                        </div>
                        <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>{result.recommendation}</p>
                      </div>
                    );
                  })()}

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                    {[
                      { Icon: Gauge,      label: "Days Till It Finishes", value: result.stockoutDays > 365 ? "365+" : `${result.stockoutDays}d`, color: result.stockoutDays < 14 ? "#e11d48" : "#059669" },
                      { Icon: BarChart2,  label: "Too-Much Score",        value: `${result.overstockScore}/100`,  color: result.overstockScore > 60 ? "#d97706" : "#059669" },
                      { Icon: DollarSign, label: result.costDirection === "loss" ? "Money at Risk" : "Money Saved", value: `₹${result.costImpact.toLocaleString()}`, color: result.costDirection === "loss" ? "#e11d48" : "#059669" },
                    ].map((s, i) => (
                      <div key={i} style={{ ...glass, borderRadius: 16, padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                          <s.Icon size={13} style={{ color: "rgba(255,255,255,0.48)" }} strokeWidth={2} />
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.48)" }}>{s.label}</span>
                        </div>
                        <p style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Insights */}
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    <p style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>What This Means</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.insights.map((ins, i) => {
                        const InsIcon = ins.type === "warn" ? AlertTriangle : ins.type === "ok" ? CheckCircle2 : Lightbulb;
                        const ic = ins.type === "warn" ? "#e11d48" : ins.type === "ok" ? "#059669" : "#0284c7";
                        const ibg = ins.type === "warn" ? "rgba(225,29,72,0.10)" : ins.type === "ok" ? "rgba(5,150,105,0.10)" : "rgba(2,132,199,0.10)";
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            style={{ display: "flex", gap: 10, padding: 12, borderRadius: 14, background: ibg, border: `1px solid ${ic}20` }}>
                            <div style={{ width: 26, height: 26, borderRadius: 8, background: `${ic}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <InsIcon size={13} style={{ color: ic }} strokeWidth={2} />
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.7)" }}>{ins.text}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optimization */}
                  <div style={{ ...glass, borderRadius: 20, padding: 20, background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Lightbulb size={14} style={{ color: "#7c3aed" }} strokeWidth={1.8} />
                      <p style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>Best Move</p>
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>{result.optimization}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(5,150,105,0.08)", border: "1px solid rgba(5,150,105,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FlaskConical size={26} style={{ color: "#059669" }} strokeWidth={1.5} />
                  </div>
                  <h3 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", textAlign: "center" }}>Ready to Check</h3>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", textAlign: "center", maxWidth: 280, lineHeight: 1.5 }}>
                    Pick an item, set how much sells, how much you have, and delivery days — then tap See Result.
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
