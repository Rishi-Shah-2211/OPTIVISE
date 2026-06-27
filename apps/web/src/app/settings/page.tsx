"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Bell, RefreshCw, BarChart2, Activity,
  Check, Save, ChevronRight, Wifi, Database, Zap,
  Clock, Shield,
} from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(255,250,241,0.82)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(62,70,54,0.14)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,250,241,0.45)",
};

const STORAGE_KEY = "optivise_settings_v2";

interface Settings {
  displayName: string;
  role: string;
  company: string;
  timezone: string;
  notifyStockout: boolean;
  notifyHighImpact: boolean;
  notifyDailyDigest: boolean;
  refreshInterval: number;
  dataRetentionDays: number;
}

const DEFAULTS: Settings = {
  displayName: "Shop Owner",
  role: "Shop Owner",
  company: "My Shop",
  timezone: "Asia/Kolkata",
  notifyStockout: true,
  notifyHighImpact: true,
  notifyDailyDigest: false,
  refreshInterval: 30,
  dataRetentionDays: 90,
};

type Tab = "profile" | "notifications" | "data" | "usage" | "status";

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",        Icon: User       },
  { key: "notifications", label: "Alerts",         Icon: Bell       },
  { key: "data",          label: "Data",           Icon: Database   },
  { key: "usage",         label: "Usage",          Icon: BarChart2  },
  { key: "status",        label: "Status",         Icon: Activity   },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(50,64,54,0.42)", marginBottom: 12 }}>{children}</p>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,250,241,0.82)" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1d1b" }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: "rgba(50,64,54,0.42)", marginTop: 2 }}>{hint}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: 200, padding: "8px 12px", borderRadius: 10, fontSize: 13, outline: "none",
        background: "rgba(255,250,241,0.55)", border: "1px solid rgba(62,70,54,0.14)",
        color: "#1b1d1b", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "border-color 0.15s",
      }}
      onFocus={(e) => { e.target.style.borderColor = "rgba(31,122,92,0.4)"; }}
      onBlur={(e) => { e.target.style.borderColor = "rgba(62,70,54,0.14)"; }}
    />
  );
}

/* DROPDOWN FIX: uses position:fixed + getBoundingClientRect to escape overflow:auto clipping */
function SelectInput({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const selected = options.find(o => o.value === value);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target as Node))
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onRepos = () => updatePos();
    window.addEventListener("scroll", onRepos, true);
    window.addEventListener("resize", onRepos);
    return () => {
      window.removeEventListener("scroll", onRepos, true);
      window.removeEventListener("resize", onRepos);
    };
  }, [open, updatePos]);

  return (
    <div ref={ref} style={{ position: "relative", width: 200 }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13, textAlign: "left",
          background: "rgba(255,250,241,0.55)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: open ? "1px solid rgba(31,122,92,0.35)" : "1px solid rgba(62,70,54,0.14)",
          color: "#1b1d1b", cursor: "pointer",
          boxShadow: open ? "0 0 0 3px rgba(31,122,92,0.10), 0 1px 4px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.2)",
          transition: "all 0.15s ease",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span>{selected?.label ?? value}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.1 }}
          width="12" height="12" viewBox="0 0 12 12" fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(50,64,54,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.075 }}
              style={{
                position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999,
                borderRadius: 14, overflow: "hidden",
                background: "rgba(255,250,241,0.96)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(62,70,54,0.14)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,250,241,0.4)",
                padding: "4px",
              }}
            >
              {options.map((o) => {
                const isActive = o.value === value;
                return (
                  <button
                    key={o.value}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 10, fontSize: 13,
                      textAlign: "left", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isActive ? "rgba(31,122,92,0.12)" : "transparent",
                      color: isActive ? "#1f7a5c" : "rgba(50,64,54,0.65)",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,250,241,0.55)"; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span>{o.label}</span>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={13} strokeWidth={2.5} style={{ color: "#1f7a5c" }} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function Toggle({ checked, onChange, accent = "#1f7a5c" }: { checked: boolean; onChange: (v: boolean) => void; accent?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: "relative", border: "none", cursor: "pointer",
        background: checked ? `${accent}20` : "rgba(62,70,54,0.14)",
        outline: `1px solid ${checked ? accent + "40" : "rgba(62,70,54,0.14)"}`,
        transition: "all 0.2s ease",
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
          background: checked ? accent : "rgba(50,64,54,0.42)",
          boxShadow: checked ? `0 2px 8px ${accent}60` : "none",
        }}
      />
    </button>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#1f7a5c" : "#c0492f", boxShadow: online ? "0 0 8px rgba(31,122,92,0.5)" : "0 0 8px rgba(192,73,47,0.4)" }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: online ? "#1f7a5c" : "#c0492f" }}>{online ? "Working" : "Down"}</span>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [apiCalls] = useState({ today: 142, week: 891, limit: 10000 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setS({ ...DEFAULTS, ...JSON.parse(stored) });
    } catch { /* ignore */ }
  }, []);

  const update = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(prev => ({ ...prev, [k]: v }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSaved(true);
    setTimeout(() => setSaved(false), 1100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(255,250,241,0.82)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(62,70,54,0.14)",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 15, fontWeight: 700, color: "#1b1d1b", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 11, color: "rgba(50,64,54,0.42)", margin: 0 }}>Manage your shop settings</p>
        </div>

        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          className={`${saved ? "btn-ghost !text-[#1f7a5c]" : "btn-premium"} !py-2 !text-[13px]`}
        >
          <AnimatePresence mode="wait">
            {saved
              ? <motion.div key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Check size={14} strokeWidth={2.5} /></motion.div>
              : <motion.div key="save" initial={{ scale: 0.6 }} animate={{ scale: 1 }}><Save size={14} strokeWidth={2} /></motion.div>
            }
          </AnimatePresence>
          {saved ? "Saved!" : "Save Changes"}
        </motion.button>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, minHeight: 0, padding: "16px 12px", borderRight: "1px solid rgba(62,70,54,0.14)", overflowY: "auto" }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.Icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 12, marginBottom: 2,
                  fontSize: 13, fontWeight: 500, textAlign: "left", border: "none", cursor: "pointer",
                  background: active ? "linear-gradient(135deg, rgba(31,122,92,0.12), rgba(31,122,92,0.05))" : "transparent",
                  color: active ? "#1f7a5c" : "rgba(50,64,54,0.58)",
                  outline: active ? "1px solid rgba(31,122,92,0.18)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.color = "rgba(50,64,54,0.8)"; el.style.background = "rgba(255,250,241,0.82)"; } }}
                onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.color = "rgba(50,64,54,0.58)"; el.style.background = "transparent"; } }}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#1f7a5c" : "inherit", flexShrink: 0 }} />
                {t.label}
                {active && <ChevronRight size={12} strokeWidth={2.5} style={{ color: "#1f7a5c", marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "28px 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.09 }}>

              {/* Profile */}
              {tab === "profile" && (
                <div>
                  <Label>Your Details</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Your Name" hint="Shown in the app">
                      <TextInput value={s.displayName} onChange={v => update("displayName", v)} />
                    </FieldRow>
                    <FieldRow label="You Are" hint="What you do at the shop">
                      <SelectInput value={s.role} onChange={v => update("role", v)} options={[
                        { value: "Shop Owner",  label: "Shop Owner"  },
                        { value: "Manager",     label: "Manager"     },
                        { value: "Helper",      label: "Helper"      },
                        { value: "Cashier",     label: "Cashier"     },
                      ]} />
                    </FieldRow>
                    <FieldRow label="Shop Name" hint="Your shop's name">
                      <TextInput value={s.company} onChange={v => update("company", v)} placeholder="Your shop" />
                    </FieldRow>
                    <FieldRow label="Time Zone" hint="For showing correct times">
                      <SelectInput value={s.timezone} onChange={v => update("timezone", v)} options={[
                        { value: "UTC",           label: "UTC"             },
                        { value: "Asia/Kolkata",  label: "IST (UTC+5:30)"  },
                        { value: "America/New_York", label: "EST (UTC-5)"  },
                        { value: "America/Los_Angeles", label: "PST (UTC-8)" },
                        { value: "Europe/London", label: "GMT (UTC+0)"     },
                        { value: "Europe/Berlin", label: "CET (UTC+1)"     },
                      ]} />
                    </FieldRow>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {tab === "notifications" && (
                <div>
                  <Label>Alerts</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Low Stock Alerts" hint="Tell me when an item is about to finish">
                      <Toggle checked={s.notifyStockout} onChange={v => update("notifyStockout", v)} />
                    </FieldRow>
                    <FieldRow label="Important Tips" hint="Tell me about the big tips only">
                      <Toggle checked={s.notifyHighImpact} onChange={v => update("notifyHighImpact", v)} accent="#c0492f" />
                    </FieldRow>
                    <FieldRow label="Daily Summary" hint="A short summary every morning">
                      <Toggle checked={s.notifyDailyDigest} onChange={v => update("notifyDailyDigest", v)} accent="#c86a33" />
                    </FieldRow>
                  </div>

                  <div style={{ ...glass, borderRadius: 16, padding: 16, background: "rgba(200,106,51,0.06)", border: "1px solid rgba(200,106,51,0.15)" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Bell size={14} style={{ color: "#c86a33", flexShrink: 0, marginTop: 1 }} strokeWidth={1.8} />
                      <p style={{ fontSize: 12, color: "rgba(50,64,54,0.55)", lineHeight: 1.6 }}>
                        For now, alerts show up inside the app — in the side menu and at the top of My Shop. Email alerts can be added later.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Controls */}
              {tab === "data" && (
                <div>
                  <Label>Auto Update</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Update How Often" hint="How often the app checks for new numbers">
                      <SelectInput value={String(s.refreshInterval)} onChange={v => update("refreshInterval", Number(v))} options={[
                        { value: "15",  label: "Every 15 seconds" },
                        { value: "30",  label: "Every 30 seconds" },
                        { value: "60",  label: "Every minute"     },
                        { value: "300", label: "Every 5 minutes"  },
                        { value: "0",   label: "Only when I tap"   },
                      ]} />
                    </FieldRow>
                    <FieldRow label="Keep History For" hint="How long to keep old tips and numbers">
                      <SelectInput value={String(s.dataRetentionDays)} onChange={v => update("dataRetentionDays", Number(v))} options={[
                        { value: "30",  label: "30 days"  },
                        { value: "60",  label: "60 days"  },
                        { value: "90",  label: "90 days"  },
                        { value: "180", label: "6 months" },
                        { value: "365", label: "1 year"   },
                      ]} />
                    </FieldRow>
                  </div>

                  <Label>Reset</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20, border: "1px solid rgba(192,73,47,0.18)" }}>
                    <p style={{ fontSize: 12, color: "rgba(50,64,54,0.48)", marginBottom: 14 }}>This cannot be undone.</p>
                    <button
                      onClick={() => { localStorage.removeItem(STORAGE_KEY); setS(DEFAULTS); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
                        borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "rgba(192,73,47,0.10)", border: "1px solid rgba(192,73,47,0.22)", color: "#c0492f",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(192,73,47,0.18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(192,73,47,0.10)"; }}
                    >
                      <Shield size={14} strokeWidth={2} />
                      Reset All Settings
                    </button>
                  </div>
                </div>
              )}

              {/* API Usage */}
              {tab === "usage" && (
                <div>
                  <Label>App Usage</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Used Today",      value: apiCalls.today.toLocaleString(),   icon: Zap,       color: "#1f7a5c" },
                      { label: "Used This Week",   value: apiCalls.week.toLocaleString(),    icon: Clock,     color: "#c86a33" },
                      { label: "Monthly Limit",    value: apiCalls.limit.toLocaleString(),   icon: BarChart2, color: "#1f7a5c" },
                    ].map((c, i) => {
                      const CIcon = c.icon;
                      return (
                        <div key={i} style={{ ...glass, borderRadius: 18, padding: 18 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 10, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <CIcon size={13} style={{ color: c.color }} strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: 11, color: "rgba(50,64,54,0.48)" }}>{c.label}</span>
                          </div>
                          <p style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <Label>Where It's Used</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    {[
                      { endpoint: "/api/products",      calls: 58, pct: 41 },
                      { endpoint: "/api/insights-data", calls: 51, pct: 36 },
                      { endpoint: "/api/copilot",       calls: 23, pct: 16 },
                      { endpoint: "/api/simulate",      calls: 10, pct: 7  },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,250,241,0.82)" : "none" }}>
                        <code style={{ fontSize: 12, background: "rgba(255,250,241,0.55)", padding: "2px 8px", borderRadius: 6, color: "rgba(50,64,54,0.6)", fontFamily: "monospace", width: 200, flexShrink: 0 }}>
                          {r.endpoint}
                        </code>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,250,241,0.55)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.pct}%` }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #1f7a5c, #c86a33)" }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(50,64,54,0.6)", width: 60, textAlign: "right" }}>{r.calls} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Status */}
              {tab === "status" && (
                <div>
                  <Label>What's Working</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    {[
                      { label: "Items",        endpoint: "/api/products",       icon: Database, online: true  },
                      { label: "Smart Tips",   endpoint: "/api/insights-data",  icon: Activity, online: true  },
                      { label: "What-If Tool", endpoint: "/api/simulate",       icon: Zap,      online: true  },
                      { label: "AI Helper",    endpoint: "/api/copilot",        icon: Wifi,     online: !!process.env.NEXT_PUBLIC_GROQ_ENABLED },
                      { label: "Storage",      endpoint: "PostgreSQL via Neon", icon: Database, online: true  },
                    ].map((svc, i) => {
                      const SIcon = svc.icon;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(255,250,241,0.82)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,250,241,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <SIcon size={14} style={{ color: "rgba(50,64,54,0.45)" }} strokeWidth={1.8} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: "#1b1d1b" }}>{svc.label}</p>
                              <code style={{ fontSize: 10, color: "rgba(50,64,54,0.3)" }}>{svc.endpoint}</code>
                            </div>
                          </div>
                          <StatusDot online={svc.online} />
                        </div>
                      );
                    })}
                  </div>

                  <Label>About</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    {[
                      { key: "App Version",     val: "1.0.0"        },
                      { key: "AI Helper",       val: "Llama 3.3 70B (Groq)" },
                      { key: "Storage",         val: "PostgreSQL"   },
                      { key: "Data Version",    val: "v1.0.0"       },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,250,241,0.82)" : "none" }}>
                        <span style={{ fontSize: 13, color: "rgba(50,64,54,0.48)" }}>{row.key}</span>
                        <code style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(50,64,54,0.6)", background: "rgba(255,250,241,0.55)", padding: "2px 8px", borderRadius: 6 }}>{row.val}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
