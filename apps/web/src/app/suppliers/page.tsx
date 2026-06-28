"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, MapPin, Package, Clock, BadgeCheck, Plus, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { useTilt } from "@/lib/ui/useTilt";

const glass: React.CSSProperties = {
  background: "rgba(255,250,241,0.82)",
  border: "1px solid rgba(62,70,54,0.14)",
  boxShadow: "0 4px 24px rgba(27,47,40,0.10), inset 0 1px 0 rgba(255,250,241,0.45)",
};
const input: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 11, fontSize: 14, outline: "none",
  background: "rgba(255,250,241,0.6)", border: "1px solid rgba(62,70,54,0.18)", color: "#1b1d1b",
};

interface RateInfo { itemName: string; rate: number; }
interface Supplier {
  id: string; name: string; region: string; reliability: number;
  itemCount: number; avgLeadTime: number; rates: RateInfo[];
}
interface RateRow { itemName: string; rate: string; }
interface Form { id?: string; name: string; region: string; reliability: string; rates: RateRow[]; }
const EMPTY: Form = { name: "", region: "Local Mandi", reliability: "90", rates: [{ itemName: "", rate: "" }] };

async function fetchSuppliers(): Promise<Supplier[]> {
  const res = await fetch("/api/suppliers");
  const json = await res.json();
  return json?.data ?? [];
}

function relColor(r: number) {
  return r >= 90 ? "#1f7a5c" : r >= 85 ? "#c86a33" : "#c0492f";
}

export default function SuppliersPage() {
  const qc = useQueryClient();
  const { data: suppliers = [], isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers });
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ["suppliers"] });

  const save = async () => {
    if (!form?.name.trim()) return;
    setSaving(true);
    await fetch("/api/suppliers", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: form.id, name: form.name, region: form.region, reliability: Number(form.reliability) || 90,
        rates: form.rates.map((r) => ({ itemName: r.itemName, rate: Number(r.rate) || 0 })),
      }),
    });
    setSaving(false);
    setForm(null);
    refresh();
  };
  const remove = async (id: string) => {
    await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" });
    refresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "0 32px", height: 60, background: "rgba(255,250,241,0.92)", boxShadow: "0 12px 28px -20px rgba(27,47,40,0.5)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(200,106,51,0.12)", border: "1px solid rgba(200,106,51,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={13} style={{ color: "#c86a33" }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 15, fontWeight: 700, color: "#1b1d1b", margin: 0 }}>My Suppliers</h1>
            <p style={{ fontSize: 11, color: "rgba(50,64,54,0.6)", margin: 0 }}>Who you buy from, and how reliable they are</p>
          </div>
        </div>
        <button onClick={() => setForm({ ...EMPTY })} className="btn-premium !py-2 !px-3.5 !text-[12px]">
          <Plus size={14} strokeWidth={2.5} /> Add Supplier
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="page-body">
        {isLoading ? (
          <p style={{ fontSize: 13, color: "rgba(50,64,54,0.5)" }}>Loading...</p>
        ) : suppliers.length === 0 ? (
          <div style={{ ...glass, borderRadius: 18, padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(50,64,54,0.55)" }}>No suppliers yet. Tap “Add Supplier”, or use “Load Sample Data” on My Shop.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {suppliers.map((s, i) => (
              <SupplierCard key={s.id} s={s} i={i}
                onEdit={() => setForm({ id: s.id, name: s.name, region: s.region, reliability: String(s.reliability), rates: s.rates.length ? s.rates.map((r) => ({ itemName: r.itemName, rate: String(r.rate) })) : [{ itemName: "", rate: "" }] })}
                onDelete={() => remove(s.id)} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setForm(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(27,29,27,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()}
              style={{ ...glass, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 16, fontWeight: 700, color: "#1b1d1b" }}>{form.id ? "Edit Supplier" : "Add Supplier"}</h2>
                <button onClick={() => setForm(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(50,64,54,0.5)" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Supplier name"><input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sharma Wholesale" /></Field>
                <Field label="Where they are"><input style={input} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} placeholder="e.g. Local Mandi" /></Field>
                <Field label="How reliable (%)"><input style={input} type="number" min={0} max={100} value={form.reliability} onChange={(e) => setForm({ ...form, reliability: e.target.value })} /></Field>

                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(50,64,54,0.55)", marginBottom: 6 }}>Items they supply & rate (₹)</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.rates.map((r, idx) => (
                      <div key={idx} style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...input, flex: 1 }} placeholder="Item (e.g. Rice)" value={r.itemName}
                          onChange={(e) => setForm({ ...form, rates: form.rates.map((x, j) => j === idx ? { ...x, itemName: e.target.value } : x) })} />
                        <input style={{ ...input, width: 84 }} type="number" placeholder="₹" value={r.rate}
                          onChange={(e) => setForm({ ...form, rates: form.rates.map((x, j) => j === idx ? { ...x, rate: e.target.value } : x) })} />
                        <button onClick={() => setForm({ ...form, rates: form.rates.filter((_, j) => j !== idx) })}
                          style={{ background: "rgba(192,73,47,0.1)", border: "1px solid rgba(192,73,47,0.2)", borderRadius: 9, color: "#c0492f", cursor: "pointer", padding: "0 9px", flexShrink: 0 }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setForm({ ...form, rates: [...form.rates, { itemName: "", rate: "" }] })}
                    style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#1f7a5c", background: "rgba(31,122,92,0.08)", border: "1px solid rgba(31,122,92,0.2)", borderRadius: 9, padding: "6px 11px", cursor: "pointer" }}>
                    <Plus size={13} /> Add item
                  </button>
                </div>

                <button onClick={save} disabled={saving} className="btn-premium" style={{ marginTop: 6, width: "100%", justifyContent: "center" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} strokeWidth={2.5} /> {form.id ? "Save Changes" : "Add Supplier"}</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(50,64,54,0.55)", marginBottom: 5 }}>{label}</p>
      {children}
    </div>
  );
}

function SupplierCard({ s, i, onEdit, onDelete }: { s: Supplier; i: number; onEdit: () => void; onDelete: () => void }) {
  const tilt = useTilt(6);
  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="card-lift"
      style={{ ...glass, borderRadius: 18, padding: 20, rotateX: tilt.rotateX, rotateY: tilt.rotateY, transformPerspective: 800 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(200,106,51,0.12)", border: "1px solid rgba(200,106,51,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Truck size={16} style={{ color: "#c86a33" }} strokeWidth={2} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1b1d1b" }}>{s.name}</p>
            <p style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "rgba(50,64,54,0.5)" }}><MapPin size={10} /> {s.region}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 999, background: `${relColor(s.reliability)}1a`, border: `1px solid ${relColor(s.reliability)}33` }}>
          <BadgeCheck size={12} style={{ color: relColor(s.reliability) }} strokeWidth={2.2} />
          <span style={{ fontSize: 12, fontWeight: 700, color: relColor(s.reliability) }}>{s.reliability}%</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,250,241,0.45)", border: "1px solid rgba(255,250,241,0.7)" }}>
          <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(50,64,54,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}><Package size={11} /> Items</p>
          <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, fontWeight: 700, color: "#1f7a5c" }}>{s.itemCount}</p>
        </div>
        <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,250,241,0.45)", border: "1px solid rgba(255,250,241,0.7)" }}>
          <p style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(50,64,54,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}><Clock size={11} /> Delivery</p>
          <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 18, fontWeight: 700, color: "#c86a33" }}>{s.avgLeadTime}d</p>
        </div>
      </div>

      {s.rates.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 10, color: "rgba(50,64,54,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Items & rates</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {s.rates.slice(0, 5).map((r, k) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "rgba(50,64,54,0.72)" }}>{r.itemName}</span>
                <span style={{ fontWeight: 700, color: "#1f7a5c" }}>₹{r.rate}</span>
              </div>
            ))}
            {s.rates.length > 5 && <span style={{ fontSize: 11, color: "rgba(50,64,54,0.4)" }}>+{s.rates.length - 5} more</span>}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid rgba(62,70,54,0.1)", paddingTop: 12 }}>
        <button onClick={onEdit} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#1f7a5c", background: "rgba(31,122,92,0.1)", border: "1px solid rgba(31,122,92,0.2)", borderRadius: 9, padding: "5px 11px", cursor: "pointer" }}><Pencil size={12} /> Edit</button>
        <button onClick={onDelete} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#c0492f", background: "rgba(192,73,47,0.1)", border: "1px solid rgba(192,73,47,0.2)", borderRadius: 9, padding: "5px 11px", cursor: "pointer" }}><Trash2 size={12} /> Delete</button>
      </div>
    </motion.div>
  );
}
