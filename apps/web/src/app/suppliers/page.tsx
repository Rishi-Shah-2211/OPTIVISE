"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Truck, MapPin, Package, Clock, BadgeCheck } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
};

interface Supplier {
  id: string; name: string; region: string; reliability: number;
  itemCount: number; avgLeadTime: number; quoteCount: number; topItems: string[];
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  const json = await res.json();
  return json?.data ?? [];
}

function relColor(r: number) {
  return r >= 90 ? "#10b981" : r >= 85 ? "#f59e0b" : "#f43f5e";
}

export default function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 32px", height: 60, background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Truck size={13} style={{ color: "#8b5cf6" }} strokeWidth={2} />
        </div>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>My Suppliers</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0 }}>Who you buy from, and how reliable they are</p>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 32px" }}>
        {isLoading ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Loading...</p>
        ) : suppliers.length === 0 ? (
          <div style={{ ...glass, borderRadius: 18, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>No suppliers yet. Use “Load Sample Data” on My Shop to see suppliers here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {suppliers.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="shimmer-card" style={{ ...glass, borderRadius: 18, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Truck size={16} style={{ color: "#8b5cf6" }} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{s.name}</p>
                      <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.5)" }}><MapPin size={10} /> {s.region}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 999, background: `${relColor(s.reliability)}1a`, border: `1px solid ${relColor(s.reliability)}33` }}>
                    <BadgeCheck size={12} style={{ color: relColor(s.reliability) }} strokeWidth={2.2} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: relColor(s.reliability) }}>{s.reliability}%</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}><Package size={11} /> Items</p>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#0ea5e9" }}>{s.itemCount}</p>
                  </div>
                  <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}><Clock size={11} /> Delivery</p>
                    <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{s.avgLeadTime}d</p>
                  </div>
                </div>

                {s.topItems.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Top items supplied</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {s.topItems.map((it, k) => (
                        <span key={k} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}>{it}</span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
