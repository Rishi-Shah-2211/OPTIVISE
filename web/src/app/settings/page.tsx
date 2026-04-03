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
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
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
  displayName: "Supply Chain Admin",
  role: "Operations Manager",
  company: "My Organization",
  timezone: "UTC",
  notifyStockout: true,
  notifyHighImpact: true,
  notifyDailyDigest: false,
  refreshInterval: 30,
  dataRetentionDays: 90,
};

type Tab = "profile" | "notifications" | "data" | "usage" | "status";

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",        Icon: User       },
  { key: "notifications", label: "Notifications",  Icon: Bell       },
  { key: "data",          label: "Data Controls",  Icon: Database   },
  { key: "usage",         label: "API Usage",      Icon: BarChart2  },
  { key: "status",        label: "System Status",  Icon: Activity   },
];

function Label({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.42)", marginBottom: 12 }}>{children}</p>;
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>{label}</p>
        {hint && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{hint}</p>}
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
        background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)",
        color: "#f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "border-color 0.15s",
      }}
      onFocus={(e) => { e.target.style.borderColor = "rgba(14,165,233,0.4)"; }}
      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
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
          background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: open ? "1px solid rgba(14,165,233,0.35)" : "1px solid rgba(255,255,255,0.12)",
          color: "#f1f5f9", cursor: "pointer",
          boxShadow: open ? "0 0 0 3px rgba(14,165,233,0.10), 0 1px 4px rgba(0,0,0,0.2)" : "0 1px 4px rgba(0,0,0,0.2)",
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
          <path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
                background: "rgba(30,35,50,0.95)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
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
                      background: isActive ? "rgba(14,165,233,0.12)" : "transparent",
                      color: isActive ? "#0ea5e9" : "rgba(255,255,255,0.65)",
                      fontWeight: isActive ? 600 : 400,
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span>{o.label}</span>
                    {isActive && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check size={13} strokeWidth={2.5} style={{ color: "#0ea5e9" }} />
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

function Toggle({ checked, onChange, accent = "#0ea5e9" }: { checked: boolean; onChange: (v: boolean) => void; accent?: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, position: "relative", border: "none", cursor: "pointer",
        background: checked ? `${accent}20` : "rgba(255,255,255,0.12)",
        outline: `1px solid ${checked ? accent + "40" : "rgba(255,255,255,0.12)"}`,
        transition: "all 0.2s ease",
      }}
    >
      <motion.div
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
          background: checked ? accent : "rgba(255,255,255,0.42)",
          boxShadow: checked ? `0 2px 8px ${accent}60` : "none",
        }}
      />
    </button>
  );
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#10b981" : "#f43f5e", boxShadow: online ? "0 0 8px rgba(16,185,129,0.5)" : "0 0 8px rgba(244,63,94,0.4)" }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: online ? "#10b981" : "#f43f5e" }}>{online ? "Operational" : "Degraded"}</span>
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)",
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0 }}>Manage your Optivise workspace</p>
        </div>

        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
            borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
            background: saved ? "rgba(16,185,129,0.12)" : "linear-gradient(135deg, rgba(14,165,233,0.14), rgba(139,92,246,0.12))",
            border: saved ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(14,165,233,0.3)",
            color: saved ? "#10b981" : "#0ea5e9", transition: "all 0.2s ease",
            boxShadow: saved ? "0 2px 10px rgba(16,185,129,0.15)" : "0 2px 10px rgba(14,165,233,0.12)",
          }}
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

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, padding: "16px 12px", borderRight: "1px solid rgba(255,255,255,0.12)", overflowY: "auto" }}>
          {TABS.map(t => {
            const active = tab === t.key;
            const Icon = t.Icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 12, marginBottom: 2,
                  fontSize: 13, fontWeight: 500, textAlign: "left", border: "none", cursor: "pointer",
                  background: active ? "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(14,165,233,0.05))" : "transparent",
                  color: active ? "#0ea5e9" : "rgba(255,255,255,0.58)",
                  outline: active ? "1px solid rgba(14,165,233,0.18)" : "1px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.color = "rgba(255,255,255,0.8)"; el.style.background = "rgba(255,255,255,0.09)"; } }}
                onMouseLeave={(e) => { if (!active) { const el = e.currentTarget as HTMLButtonElement; el.style.color = "rgba(255,255,255,0.58)"; el.style.background = "transparent"; } }}
              >
                <Icon size={14} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#0ea5e9" : "inherit", flexShrink: 0 }} />
                {t.label}
                {active && <ChevronRight size={12} strokeWidth={2.5} style={{ color: "#0ea5e9", marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.09 }}>

              {/* Profile */}
              {tab === "profile" && (
                <div>
                  <Label>Personal Information</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Display Name" hint="Used in reports and exports">
                      <TextInput value={s.displayName} onChange={v => update("displayName", v)} />
                    </FieldRow>
                    <FieldRow label="Role" hint="Your position in the organization">
                      <SelectInput value={s.role} onChange={v => update("role", v)} options={[
                        { value: "Operations Manager",     label: "Operations Manager"     },
                        { value: "Supply Chain Analyst",   label: "Supply Chain Analyst"   },
                        { value: "Procurement Lead",       label: "Procurement Lead"       },
                        { value: "Logistics Coordinator",  label: "Logistics Coordinator"  },
                        { value: "C-Suite Executive",      label: "C-Suite Executive"      },
                      ]} />
                    </FieldRow>
                    <FieldRow label="Company" hint="Organization name">
                      <TextInput value={s.company} onChange={v => update("company", v)} placeholder="Your company" />
                    </FieldRow>
                    <FieldRow label="Timezone" hint="Used for time-based reporting">
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
                  <Label>Alert Preferences</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Stockout Risk Alerts" hint="Notify when products approach zero stock coverage">
                      <Toggle checked={s.notifyStockout} onChange={v => update("notifyStockout", v)} />
                    </FieldRow>
                    <FieldRow label="High Impact Insights" hint="Notify for insights with impact score > 70">
                      <Toggle checked={s.notifyHighImpact} onChange={v => update("notifyHighImpact", v)} accent="#f43f5e" />
                    </FieldRow>
                    <FieldRow label="Daily Digest" hint="Receive a summary of all insights each morning">
                      <Toggle checked={s.notifyDailyDigest} onChange={v => update("notifyDailyDigest", v)} accent="#8b5cf6" />
                    </FieldRow>
                  </div>

                  <div style={{ ...glass, borderRadius: 16, padding: 16, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Bell size={14} style={{ color: "#8b5cf6", flexShrink: 0, marginTop: 1 }} strokeWidth={1.8} />
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                        Notification delivery requires email configuration. Alerts are currently shown as in-app indicators in the sidebar and dashboard header.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Controls */}
              {tab === "data" && (
                <div>
                  <Label>Data Refresh</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    <FieldRow label="Auto-Refresh Interval" hint="How often dashboard polls for updated data">
                      <SelectInput value={String(s.refreshInterval)} onChange={v => update("refreshInterval", Number(v))} options={[
                        { value: "15",  label: "Every 15 seconds" },
                        { value: "30",  label: "Every 30 seconds" },
                        { value: "60",  label: "Every minute"     },
                        { value: "300", label: "Every 5 minutes"  },
                        { value: "0",   label: "Manual only"      },
                      ]} />
                    </FieldRow>
                    <FieldRow label="Data Retention" hint="How many days of historical insights to retain">
                      <SelectInput value={String(s.dataRetentionDays)} onChange={v => update("dataRetentionDays", Number(v))} options={[
                        { value: "30",  label: "30 days"  },
                        { value: "60",  label: "60 days"  },
                        { value: "90",  label: "90 days"  },
                        { value: "180", label: "6 months" },
                        { value: "365", label: "1 year"   },
                      ]} />
                    </FieldRow>
                  </div>

                  <Label>Danger Zone</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20, border: "1px solid rgba(244,63,94,0.18)" }}>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.48)", marginBottom: 14 }}>These actions are irreversible.</p>
                    <button
                      onClick={() => { localStorage.removeItem(STORAGE_KEY); setS(DEFAULTS); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 6, padding: "9px 16px",
                        borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
                        background: "rgba(244,63,94,0.10)", border: "1px solid rgba(244,63,94,0.22)", color: "#f43f5e",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.10)"; }}
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
                  <Label>API Usage This Period</Label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                    {[
                      { label: "Calls Today",     value: apiCalls.today.toLocaleString(),   icon: Zap,       color: "#0ea5e9" },
                      { label: "Calls This Week",  value: apiCalls.week.toLocaleString(),    icon: Clock,     color: "#8b5cf6" },
                      { label: "Monthly Limit",    value: apiCalls.limit.toLocaleString(),   icon: BarChart2, color: "#10b981" },
                    ].map((c, i) => {
                      const CIcon = c.icon;
                      return (
                        <div key={i} style={{ ...glass, borderRadius: 18, padding: 18 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 10, background: `${c.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <CIcon size={13} style={{ color: c.color }} strokeWidth={2} />
                            </div>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>{c.label}</span>
                          </div>
                          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: c.color }}>{c.value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <Label>Usage Breakdown</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    {[
                      { endpoint: "/api/products",      calls: 58, pct: 41 },
                      { endpoint: "/api/insights-data", calls: 51, pct: 36 },
                      { endpoint: "/api/copilot",       calls: 23, pct: 16 },
                      { endpoint: "/api/simulate",      calls: 10, pct: 7  },
                    ].map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.09)" : "none" }}>
                        <code style={{ fontSize: 12, background: "rgba(255,255,255,0.10)", padding: "2px 8px", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", width: 200, flexShrink: 0 }}>
                          {r.endpoint}
                        </code>
                        <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${r.pct}%` }}
                            transition={{ duration: 0.4, delay: i * 0.05 }}
                            style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #0ea5e9, #8b5cf6)" }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", width: 60, textAlign: "right" }}>{r.calls} calls</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Status */}
              {tab === "status" && (
                <div>
                  <Label>Service Health</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: "0 20px", marginBottom: 20 }}>
                    {[
                      { label: "Products API",       endpoint: "/api/products",       icon: Database, online: true  },
                      { label: "Insights API",        endpoint: "/api/insights-data",  icon: Activity, online: true  },
                      { label: "Simulation Engine",   endpoint: "/api/simulate",       icon: Zap,      online: true  },
                      { label: "Copilot AI (Groq)",   endpoint: "/api/copilot",        icon: Wifi,     online: !!process.env.NEXT_PUBLIC_GROQ_ENABLED },
                      { label: "Database (Prisma)",   endpoint: "PostgreSQL via Neon", icon: Database, online: true  },
                    ].map((svc, i) => {
                      const SIcon = svc.icon;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.09)" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <SIcon size={14} style={{ color: "rgba(255,255,255,0.45)" }} strokeWidth={1.8} />
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 500, color: "#f1f5f9" }}>{svc.label}</p>
                              <code style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{svc.endpoint}</code>
                            </div>
                          </div>
                          <StatusDot online={svc.online} />
                        </div>
                      );
                    })}
                  </div>

                  <Label>Environment</Label>
                  <div style={{ ...glass, borderRadius: 20, padding: 20 }}>
                    {[
                      { key: "Next.js Version",      val: "16.2.1"        },
                      { key: "Prisma Client",         val: "5.22.0"        },
                      { key: "Groq Model",            val: "llama-3.1-8b-instant" },
                      { key: "Data Schema",           val: "v1.0.0"        },
                    ].map((row, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.09)" : "none" }}>
                        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.48)" }}>{row.key}</span>
                        <code style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.10)", padding: "2px 8px", borderRadius: 6 }}>{row.val}</code>
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
