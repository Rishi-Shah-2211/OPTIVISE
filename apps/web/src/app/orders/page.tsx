"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, AlertTriangle, ChevronDown, Truck, Wallet } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,250,241,0.82)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(62,70,54,0.14)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,250,241,0.45)",
};

interface RateOpt { supplierName: string; rate: number; }
interface OrderItem {
  id: string; name: string; category: string; inventory: number; demand: number;
  leadTime: number; daysOfStock: number; suggestQty: number;
  cheapest: RateOpt; options: RateOpt[]; estCost: number; urgent: boolean;
}

async function fetchReorder(): Promise<{ data: OrderItem[]; totalCost: number }> {
  const res = await fetch("/api/reorder");
  const json = await res.json();
  return { data: json?.data ?? [], totalCost: json?.totalCost ?? 0 };
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reorder"], queryFn: fetchReorder });
  const [open, setOpen] = useState<string | null>(null);
  const items = data?.data ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(255,250,241,0.82)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(62,70,54,0.14)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(200,106,51,0.12)", border: "1px solid rgba(200,106,51,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={13} style={{ color: "#c86a33" }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 15, fontWeight: 700, color: "#1b1d1b", margin: 0 }}>Order List</h1>
            <p style={{ fontSize: 11, color: "rgba(50,64,54,0.6)", margin: 0 }}>What to buy, how much, and from the cheapest supplier</p>
          </div>
        </div>
        {items.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 10, background: "rgba(31,122,92,0.10)", border: "1px solid rgba(31,122,92,0.25)" }}>
            <Wallet size={14} style={{ color: "#1f7a5c" }} strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f7a5c" }}>Total ≈ ₹{data?.totalCost.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 32px" }}>
        {isLoading ? (
          <p style={{ fontSize: 13, color: "rgba(50,64,54,0.5)" }}>Loading...</p>
        ) : items.length === 0 ? (
          <div style={{ ...glass, borderRadius: 18, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#1f7a5c", fontWeight: 600, marginBottom: 6 }}>All good! 🎉</p>
            <p style={{ fontSize: 13, color: "rgba(50,64,54,0.55)" }}>No item needs ordering right now. Add items or load sample data to see this in action.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.map((it, i) => (
              <motion.div key={it.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} style={{ ...glass, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 110px 1fr 100px 34px", padding: "14px 18px", alignItems: "center", gap: 10 }}>
                  {/* Item */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      {it.urgent && <AlertTriangle size={13} style={{ color: "#c0492f" }} strokeWidth={2.2} />}
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1b1d1b" }}>{it.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(50,64,54,0.45)" }}>{it.category}</span>
                  </div>
                  {/* Days left */}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 16, fontWeight: 700, color: it.urgent ? "#c0492f" : "#c86a33" }}>{it.daysOfStock}d</p>
                    <p style={{ fontSize: 9, color: "rgba(50,64,54,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>stock left</p>
                  </div>
                  {/* Suggested qty */}
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 16, fontWeight: 700, color: "#1f7a5c" }}>{it.suggestQty}</p>
                    <p style={{ fontSize: 9, color: "rgba(50,64,54,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>order qty</p>
                  </div>
                  {/* Cheapest supplier */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(31,122,92,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Truck size={12} style={{ color: "#1f7a5c" }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(50,64,54,0.85)" }}>{it.cheapest.supplierName}</p>
                      <p style={{ fontSize: 11, color: "#1f7a5c" }}>₹{it.cheapest.rate}/unit · cheapest</p>
                    </div>
                  </div>
                  {/* Est cost */}
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 15, fontWeight: 700, color: "#1b1d1b" }}>₹{it.estCost.toLocaleString()}</p>
                    <p style={{ fontSize: 9, color: "rgba(50,64,54,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>est. cost</p>
                  </div>
                  {/* Expand */}
                  <button onClick={() => setOpen(open === it.id ? null : it.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(50,64,54,0.5)", display: "flex", justifyContent: "center" }}>
                    <motion.div animate={{ rotate: open === it.id ? 180 : 0 }}><ChevronDown size={16} /></motion.div>
                  </button>
                </div>

                {/* Rate compare */}
                <AnimatePresence>
                  {open === it.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", borderTop: "1px solid rgba(255,250,241,0.7)", background: "rgba(0,0,0,0.15)" }}>
                      <div style={{ padding: "12px 18px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(50,64,54,0.42)", marginBottom: 8 }}>Compare suppliers</p>
                        {it.options.map((o, k) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                            <span style={{ fontSize: 13, color: k === 0 ? "#1f7a5c" : "rgba(50,64,54,0.7)", fontWeight: k === 0 ? 600 : 400 }}>
                              {o.supplierName} {k === 0 && "✓"}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: k === 0 ? "#1f7a5c" : "rgba(50,64,54,0.6)" }}>
                              ₹{o.rate}/unit → ₹{(o.rate * it.suggestQty).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
