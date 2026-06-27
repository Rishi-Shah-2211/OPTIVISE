"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Pencil, Trash2, Search, Upload, X, Check, Loader2 } from "lucide-react";
import type { Product } from "@/types/dashboard";

const glass: React.CSSProperties = {
  background: "rgba(255,250,241,0.82)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(62,70,54,0.14)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,250,241,0.45)",
};
const input: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 13, outline: "none",
  background: "rgba(255,250,241,0.55)", border: "1px solid rgba(62,70,54,0.18)", color: "#1b1d1b",
};

interface Form { id?: string; name: string; category: string; price: string; inventory: string; demand: string; leadTime: string; }
const EMPTY: Form = { name: "", category: "General", price: "", inventory: "", demand: "", leadTime: "3" };

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  const json = await res.json();
  return Array.isArray(json) ? json : (json?.data ?? []);
}

export default function ItemsPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["products"] });
  const filtered = search.trim() ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : products;

  const save = async () => {
    if (!form?.name.trim()) return;
    setSaving(true);
    const payload = {
      id: form.id,
      name: form.name, category: form.category,
      price: Number(form.price) || 0,
      inventory: Number(form.inventory) || 0,
      demand: Number(form.demand) || 0,
      leadTime: Number(form.leadTime) || 3,
    };
    await fetch("/api/products", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setForm(null);
    refresh();
  };

  const remove = async (id: string) => {
    await fetch(`/api/products?id=${id}`, { method: "DELETE" });
    refresh();
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("Reading file...");
    const text = await file.text();
    const lines = text.trim().split("\n");
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes("name");
    const rows = (hasHeader ? lines.slice(1) : lines);
    let ok = 0;
    for (const line of rows) {
      const c = line.split(",");
      if (!c[0]?.trim()) continue;
      await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c[0].trim(), category: c[1]?.trim() || "General",
          price: Number(c[2]) || 0, inventory: Number(c[3]) || 0, demand: Number(c[4]) || 0, leadTime: 3,
        }),
      });
      ok++;
    }
    setImportMsg(`Added ${ok} items ✓`);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
    setTimeout(() => setImportMsg(""), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 60, background: "rgba(255,250,241,0.82)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(62,70,54,0.14)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(31,122,92,0.12)", border: "1px solid rgba(31,122,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={13} style={{ color: "#1f7a5c" }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 15, fontWeight: 700, color: "#1b1d1b", margin: 0 }}>My Items</h1>
            <p style={{ fontSize: 11, color: "rgba(50,64,54,0.6)", margin: 0 }}>Add, change or remove your shop items</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={fileRef} type="file" accept=".csv" onChange={onImport} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,250,241,0.55)", border: "1px solid rgba(62,70,54,0.18)", color: "rgba(50,64,54,0.75)" }}>
            <Upload size={13} strokeWidth={2} /> {importMsg || "Import CSV"}
          </button>
          <button onClick={() => setForm({ ...EMPTY })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg, rgba(31,122,92,0.9), rgba(21,79,61,0.9))", border: "1px solid rgba(31,122,92,0.4)", color: "#fff" }}>
            <Plus size={14} strokeWidth={2.5} /> Add Item
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 32px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#7a8473" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." style={{ ...input, paddingLeft: 36 }} />
        </div>

        {/* Table */}
        <div style={{ ...glass, borderRadius: 18, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 80px 80px 90px 70px 80px", padding: "10px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(50,64,54,0.4)", borderBottom: "1px solid rgba(62,70,54,0.14)" }}>
            <span>Item</span><span>Type</span><span style={{ textAlign: "right" }}>Rate ₹</span><span style={{ textAlign: "right" }}>In Stock</span><span style={{ textAlign: "right" }}>Sells/mo</span><span style={{ textAlign: "right" }}>Days</span><span style={{ textAlign: "right" }}>Edit</span>
          </div>
          {isLoading ? (
            <p style={{ padding: 20, fontSize: 13, color: "rgba(50,64,54,0.5)" }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: 20, fontSize: 13, color: "rgba(50,64,54,0.5)" }}>No items yet. Tap “Add Item” or “Import CSV”, or use “Load Sample Data” on My Shop.</p>
          ) : filtered.map((p) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 80px 80px 90px 70px 80px", padding: "11px 16px", fontSize: 13, color: "rgba(50,64,54,0.8)", borderBottom: "1px solid rgba(62,70,54,0.1)", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span style={{ color: "rgba(50,64,54,0.5)", fontSize: 12 }}>{p.category}</span>
              <span style={{ textAlign: "right" }}>{p.price ?? 0}</span>
              <span style={{ textAlign: "right" }}>{p.inventory}</span>
              <span style={{ textAlign: "right" }}>{p.demand}</span>
              <span style={{ textAlign: "right", color: "rgba(50,64,54,0.5)" }}>{p.leadTime}</span>
              <span style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setForm({ id: p.id, name: p.name, category: p.category || "General", price: String(p.price ?? 0), inventory: String(p.inventory), demand: String(p.demand), leadTime: String(p.leadTime) })} style={{ background: "none", border: "none", cursor: "pointer", color: "#1f7a5c" }}><Pencil size={14} /></button>
                <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0492f" }}><Trash2 size={14} /></button>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {form && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setForm(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 24 }}>
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} style={{ ...glass, borderRadius: 20, padding: 24, width: "100%", maxWidth: 420 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <h2 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 16, fontWeight: 700, color: "#1b1d1b" }}>{form.id ? "Edit Item" : "Add Item"}</h2>
                <button onClick={() => setForm(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(50,64,54,0.5)" }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Field label="Item name"><input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rice" /></Field>
                <Field label="Type"><input style={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Grains & Flour" /></Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Rate (₹)"><input style={input} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
                  <Field label="In stock now"><input style={input} type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} /></Field>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="Sells per month"><input style={input} type="number" value={form.demand} onChange={(e) => setForm({ ...form, demand: e.target.value })} /></Field>
                  <Field label="Days to arrive"><input style={input} type="number" value={form.leadTime} onChange={(e) => setForm({ ...form, leadTime: e.target.value })} /></Field>
                </div>
                <button onClick={save} disabled={saving} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "wait" : "pointer", background: "linear-gradient(135deg, rgba(31,122,92,0.9), rgba(21,79,61,0.9))", border: "1px solid rgba(31,122,92,0.4)", color: "#fff" }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} strokeWidth={2.5} /> {form.id ? "Save Changes" : "Add Item"}</>}
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
      <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(50,64,54,0.5)", marginBottom: 5 }}>{label}</p>
      {children}
    </div>
  );
}
