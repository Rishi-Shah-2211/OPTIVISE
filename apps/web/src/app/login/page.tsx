"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Loader2, ArrowRight } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14, outline: "none",
  background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.14)",
  color: "#f1f5f9", marginBottom: 12,
};

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
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network problem. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 24 }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ ...glass, borderRadius: 24, padding: 32, width: "100%", maxWidth: 380 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, rgba(14,165,233,0.22), rgba(14,165,233,0.08))", border: "1px solid rgba(14,165,233,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Store size={18} style={{ color: "#0ea5e9" }} strokeWidth={2} />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>Optivise</span>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
          {mode === "login" ? "Welcome back! Log in to your shop." : "Create your shop account to begin."}
        </p>

        <form onSubmit={submit}>
          <AnimatePresence mode="popLayout">
            {mode === "signup" && (
              <motion.div key="signup-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <input style={inputStyle} placeholder="Shop name (e.g. Sharma Kirana Store)" value={shopName} onChange={(e) => setShopName(e.target.value)} />
                <input style={inputStyle} placeholder="Your name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </motion.div>
            )}
          </AnimatePresence>
          <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          {error && <p style={{ fontSize: 12, color: "#f43f5e", marginBottom: 12 }}>{error}</p>}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer",
              background: "linear-gradient(135deg, rgba(14,165,233,0.9), rgba(2,132,199,0.9))",
              border: "1px solid rgba(14,165,233,0.4)", color: "#fff",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <>{mode === "login" ? "Log In" : "Create Account"} <ArrowRight size={15} strokeWidth={2.5} /></>}
          </motion.button>
        </form>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", marginTop: 20 }}>
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: "#0ea5e9", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontSize: 13 }}
          >
            {mode === "login" ? "Create a shop account" : "Log in"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
