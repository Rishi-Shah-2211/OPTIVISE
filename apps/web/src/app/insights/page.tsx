"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Search, AlertTriangle, Zap, Info, CheckCircle,
  Filter, RefreshCw, TrendingDown, ChevronDown,
} from "lucide-react";
import type { Insight } from "@/types/dashboard";

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
};

async function fetchInsights(): Promise<Insight[]> {
  const res = await fetch("/api/insights-data");
  if (!res.ok) throw new Error("Failed to fetch insights");
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

type FilterTab = "all" | "critical" | "high" | "advisory";
type SortKey = "impact" | "confidence" | "date";

function getSeverity(impact: number): FilterTab {
  if (impact > 80) return "critical";
  if (impact > 60) return "high";
  return "advisory";
}

type SStyle = { color: string; bg: string; border: string; Icon: React.ElementType; label: string };

function getStyle(impact: number): SStyle {
  if (impact > 80) return { color: "#f43f5e", bg: "rgba(244,63,94,0.10)",  border: "rgba(244,63,94,0.18)",  Icon: AlertTriangle, label: "Urgent"       };
  if (impact > 60) return { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.18)",  Icon: Zap,           label: "Important"    };
  return               { color: "#0ea5e9", bg: "rgba(14,165,233,0.08)",   border: "rgba(14,165,233,0.15)",  Icon: Info,          label: "Good to Know" };
}

function normalize(c: number) { return c <= 1 ? c * 100 : c; }

function safeAgo(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  const m = Math.floor((Date.now() - dt.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function InsightRow({ insight, index }: { insight: Insight; index: number }) {
  const s = getStyle(insight.impact);
  const { Icon } = s;
  const conf = normalize(insight.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.0175, duration: 0.14 }}
      style={{
        ...glass, borderRadius: 28, padding: 20, position: "relative",
        overflow: "hidden", transition: "box-shadow 0.2s ease, transform 0.15s ease",
      }}
      className="card-lift shimmer-card"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Left accent bar */}
      <div style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, borderRadius: "0 2px 2px 0", background: s.color }} />

      <div style={{ display: "flex", gap: 14, paddingLeft: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: s.bg, border: `1px solid ${s.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} style={{ color: s.color }} strokeWidth={2} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
              padding: "3px 8px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`,
            }}>
              {s.label}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", textTransform: "capitalize" }}>
              {({ stockout: "running low", overstock: "too much stock", reorder: "order soon", lead_time: "slow delivery" } as Record<string, string>)[insight.type] ?? insight.type?.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", marginLeft: "auto" }}>{safeAgo(insight.createdAt)}</span>
          </div>

          <p style={{ fontSize: 14, fontWeight: 500, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 14 }}>
            {insight.message}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1, maxWidth: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.48)" }}>How Sure</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{Math.round(conf)}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${conf}%` }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 + index * 0.0175 }}
                  style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${s.color}80, ${s.color})` }}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <TrendingDown size={14} style={{ color: s.color }} strokeWidth={2} />
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{Math.round(insight.impact)}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.48)" }}>how big</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function InsightsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("impact");
  const [sortOpen, setSortOpen] = useState(false);

  const { data: insights = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    let r = [...insights];
    if (filter !== "all") r = r.filter(i => getSeverity(i.impact) === filter);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      r = r.filter(i =>
        i.message?.toLowerCase().includes(q) ||
        i.type?.toLowerCase().includes(q)
      );
    }
    r.sort((a, b) => {
      if (sort === "impact") return b.impact - a.impact;
      if (sort === "confidence") return normalize(b.confidence) - normalize(a.confidence);
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });
    return r;
  }, [insights, filter, search, sort]);

  const counts = useMemo(() => ({
    all: insights.length,
    critical: insights.filter(i => i.impact > 80).length,
    high: insights.filter(i => i.impact > 60 && i.impact <= 80).length,
    advisory: insights.filter(i => i.impact <= 60).length,
  }), [insights]);

  const TABS: { key: FilterTab; label: string; color: string }[] = [
    { key: "all",      label: "All",          color: "#f1f5f9" },
    { key: "critical", label: "Urgent",       color: "#f43f5e" },
    { key: "high",     label: "Important",    color: "#f59e0b" },
    { key: "advisory", label: "Good to Know", color: "#0ea5e9" },
  ];

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "impact",     label: "Most Important" },
    { key: "confidence", label: "Most Sure"      },
    { key: "date",       label: "Newest First"   },
  ];

  const currentSort = SORT_OPTIONS.find(o => o.key === sort)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: "20px 32px", flexShrink: 0,
        background: "rgba(26,31,46,0.85)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.12)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-fraunces), ui-serif, serif", fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>Smart Tips</h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", marginTop: 4 }}>
              {insights.length} helpful tips for your shop
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost !py-2 !text-[11px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <motion.div animate={isFetching ? { rotate: 360 } : { rotate: 0 }} transition={isFetching ? { duration: 0.4, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw size={13} />
            </motion.div>
            Refresh
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
            <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.48)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tips..."
              className="input-premium !pl-9 !py-2"
            />
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", gap: 4, padding: 4, borderRadius: 12,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 10px", borderRadius: 9,
                  fontSize: 12, fontWeight: 500,
                  border: "none", cursor: "pointer",
                  background: filter === tab.key ? "rgba(255,255,255,0.12)" : "transparent",
                  color: filter === tab.key ? tab.color : "rgba(255,255,255,0.58)",
                  boxShadow: filter === tab.key ? "0 1px 6px rgba(0,0,0,0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
                  background: filter === tab.key ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.10)",
                  color: filter === tab.key ? tab.color : "rgba(255,255,255,0.42)",
                }}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Sort dropdown — custom, no native select styling issues */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setSortOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
                borderRadius: 12, fontSize: 12, fontWeight: 500,
                background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#f1f5f9", cursor: "pointer",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)", whiteSpace: "nowrap",
              }}
            >
              {currentSort.label}
              <ChevronDown size={13} strokeWidth={2} style={{ transform: sortOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.15s ease" }} />
            </button>

            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.06 }}
                  style={{
                    position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                    background: "rgba(30,35,50,0.95)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14, overflow: "hidden", minWidth: 160,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.30)",
                  }}
                >
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => { setSort(opt.key); setSortOpen(false); }}
                      style={{
                        display: "block", width: "100%", padding: "10px 14px",
                        fontSize: 13, fontWeight: 500, textAlign: "left",
                        background: sort === opt.key ? "rgba(14,165,233,0.10)" : "transparent",
                        color: sort === opt.key ? "#0ea5e9" : "#f1f5f9",
                        border: "none", cursor: "pointer",
                        transition: "background 0.12s ease",
                      }}
                      onMouseEnter={(e) => { if (sort !== opt.key) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.10)"; }}
                      onMouseLeave={(e) => { if (sort !== opt.key) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {sortOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setSortOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "24px 32px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <motion.div key={i} animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }}
                style={{ height: 110, borderRadius: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }} />
            ))}
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <p style={{ color: "#f43f5e", marginBottom: 12 }}>Could not load tips.</p>
            <button onClick={() => refetch()} style={{ color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", fontSize: 13 }}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, gap: 10 }}>
            <Filter size={28} style={{ color: "rgba(255,255,255,0.2)" }} strokeWidth={1.5} />
            <p style={{ color: "rgba(255,255,255,0.60)", fontSize: 14 }}>
              {search.trim() ? `No tips match "${search}"` : "No tips here right now"}
            </p>
            {(search.trim() || filter !== "all") && (
              <button onClick={() => { setSearch(""); setFilter("all"); }}
                style={{ color: "#0ea5e9", cursor: "pointer", background: "none", border: "none", fontSize: 12 }}>
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((insight, idx) => (
                <InsightRow key={insight.id ?? `insight-${idx}`} insight={insight} index={idx} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
