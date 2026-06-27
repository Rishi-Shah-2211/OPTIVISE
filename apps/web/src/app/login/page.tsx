"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Loader2, ArrowRight, AlertTriangle, Wallet, Truck,
  PackagePlus, ListChecks, ShoppingBasket,
} from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
};
const input: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14, outline: "none",
  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)",
  color: "#f1f5f9", marginBottom: 12,
};

const PROBLEMS = [
  { Icon: AlertTriangle, color: "#f43f5e", title: "Items run out", desc: "Fast-selling stock finishes and you lose sales. Optivise warns you before it happens." },
  { Icon: Wallet, color: "#f59e0b", title: "Money gets stuck", desc: "Too much of slow items blocks your cash. See exactly where money is sitting idle." },
  { Icon: Truck, color: "#10b981", title: "Guessing suppliers", desc: "Don't know who's cheapest? Optivise picks the lowest-rate supplier for each item." },
];

const STEPS = [
  { Icon: PackagePlus, title: "Add your items", desc: "Type them in or load a ready sample shop." },
  { Icon: ListChecks, title: "Get smart tips", desc: "See what's low, what's extra, and what to order." },
  { Icon: ShoppingBasket, title: "Order smartly", desc: "Buy the right amount from the cheapest supplier." },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body = mode === "login" ? { email, password } : { email, password, shopName, ownerName };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network problem. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
      <div style={{ width: "100%", maxWidth: 1040, display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 40, alignItems: "center" }} className="login-grid">
        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(14,165,233,0.08))", border: "1px solid rgba(14,165,233,0.35)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(14,165,233,0.25)" }}>
              <Store size={19} style={{ color: "#0ea5e9" }} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-fraunces), 'Syne', serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>Optivise</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>for kirana & general stores</div>
            </div>
          </div>

          <h1 style={{ fontFamily: "var(--font-fraunces), 'Syne', serif", fontSize: 42, fontWeight: 700, lineHeight: 1.08, color: "#f1f5f9", letterSpacing: "-0.02em", marginBottom: 16 }}>
            Stop guessing<br />your{" "}
            <span style={{ fontFamily: "var(--font-instrument), serif", fontStyle: "italic", fontWeight: 400, background: "linear-gradient(120deg, #0ea5e9, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>shop stock.</span>
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "rgba(255,255,255,0.62)", maxWidth: 440, marginBottom: 30 }}>
            Optivise tells you <b style={{ color: "#cbd5e1" }}>what to buy, how much, and when</b> — so items never finish and your money never sits idle on the shelf.
          </p>

          {/* Problems */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>Problems we solve</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 30 }}>
            {PROBLEMS.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}
                style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${p.color}1a`, border: `1px solid ${p.color}33`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <p.Icon size={16} style={{ color: p.color }} strokeWidth={2} />
                </div>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: "#f1f5f9" }}>{p.title}</p>
                  <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Workflow */}
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {STEPS.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}
                style={{ padding: "14px 12px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", position: "relative" }}>
                <div style={{ position: "absolute", top: 10, right: 12, fontFamily: "var(--font-fraunces), serif", fontSize: 13, fontWeight: 700, color: "rgba(14,165,233,0.4)" }}>{i + 1}</div>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <s.Icon size={15} style={{ color: "#0ea5e9" }} strokeWidth={2} />
                </div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#f1f5f9", marginBottom: 3 }}>{s.title}</p>
                <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Auth card ── */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ ...glass, borderRadius: 24, padding: 30 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces), 'Syne', serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
            {mode === "login" ? "Welcome back" : "Create your shop"}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 22 }}>
            {mode === "login" ? "Log in to your shop." : "Free to start. Takes 20 seconds."}
          </p>

          <form onSubmit={submit}>
            <AnimatePresence mode="popLayout">
              {mode === "signup" && (
                <motion.div key="su" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <input style={input} placeholder="Shop name (e.g. Sharma Kirana Store)" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                  <input style={input} placeholder="Your name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>
            <input style={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input style={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

            {error && <p style={{ fontSize: 12, color: "#f43f5e", marginBottom: 12 }}>{error}</p>}

            <motion.button type="submit" disabled={loading} whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", background: "linear-gradient(135deg, rgba(14,165,233,0.95), rgba(2,132,199,0.95))", border: "1px solid rgba(14,165,233,0.4)", color: "#fff", boxShadow: "0 4px 18px rgba(14,165,233,0.25)" }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{mode === "login" ? "Log In" : "Create Account"} <ArrowRight size={15} strokeWidth={2.5} /></>}
            </motion.button>
          </form>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", marginTop: 20 }}>
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
              {mode === "login" ? "Create a shop account" : "Log in"}
            </button>
          </p>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .login-grid { grid-template-columns: 1fr !important; gap: 28px !important; max-width: 460px !important; }
        }
      `}</style>
    </div>
  );
}
