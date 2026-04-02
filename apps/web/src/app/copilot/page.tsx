"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, User, Bot,
  Package, TrendingDown, AlertTriangle, Clock, RotateCcw,
  Target, Globe,
} from "lucide-react";

type Role = "user" | "assistant";
interface Message { id: string; role: Role; content: string; timestamp: Date; }

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.92)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)",
};

const SUGGESTED = [
  { Icon: AlertTriangle, text: "Which SKUs are at risk of stockout this week?",            color: "#e11d48" },
  { Icon: Package,       text: "Show me the top overstocked products right now",            color: "#d97706" },
  { Icon: TrendingDown,  text: "How can I reduce inventory holding costs by 20%?",         color: "#7c3aed" },
  { Icon: Clock,         text: "Which suppliers have the longest lead times?",              color: "#059669" },
  { Icon: Target,        text: "What's the optimal reorder quantity for critical items?",   color: "#0284c7" },
  { Icon: Globe,         text: "Compare supplier reliability across regions",               color: "#d97706" },
];

const FOLLOW_UP_MAP: { keywords: string[]; chips: string[] }[] = [
  { keywords: ["stockout", "risk", "out of stock", "deplete"],
    chips: ["Which suppliers can expedite delivery?", "Show reorder recommendations", "What's the financial impact?"] },
  { keywords: ["overstock", "excess", "surplus", "too much"],
    chips: ["How can I liquidate excess inventory?", "Which items have declining demand?", "Show holding cost breakdown"] },
  { keywords: ["lead time", "delivery", "shipping", "transit"],
    chips: ["Compare lead times by region", "Which suppliers are fastest?", "How can I reduce lead times?"] },
  { keywords: ["cost", "saving", "reduce", "holding", "expense"],
    chips: ["Show top cost drivers", "What's the ROI of faster turnover?", "Compare warehouse efficiency"] },
  { keywords: ["supplier", "reliability", "region", "source"],
    chips: ["Rank suppliers by on-time rate", "Show regional risk exposure", "Which suppliers need review?"] },
  { keywords: ["reorder", "quantity", "optimal", "order"],
    chips: ["Show safety stock levels", "What are current reorder points?", "Suggest order schedule"] },
];

function getFollowUps(content: string): string[] {
  const lower = content.toLowerCase();
  for (const entry of FOLLOW_UP_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.chips;
  }
  return ["What should I prioritize this week?", "Show me the biggest risks", "Summarize key metrics"];
}

function FollowUpChips({ content, onChipClick }: { content: string; onChipClick: (text: string) => void }) {
  const chips = getFollowUps(content);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.25 }}
      style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: 38, marginTop: 8 }}
    >
      {chips.map((chip, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35 + i * 0.06 }}
          onClick={() => onChipClick(chip)}
          style={{
            padding: "5px 13px", borderRadius: 999, fontSize: 11, fontWeight: 500,
            background: "rgba(2,132,199,0.06)", border: "1px solid rgba(2,132,199,0.18)",
            color: "#0284c7", cursor: "pointer", transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(2,132,199,0.13)";
            el.style.borderColor = "rgba(2,132,199,0.32)";
            el.style.transform = "translateY(-1px)";
            el.style.boxShadow = "0 2px 8px rgba(2,132,199,0.12)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.background = "rgba(2,132,199,0.06)";
            el.style.borderColor = "rgba(2,132,199,0.18)";
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
          }}
        >
          {chip}
        </motion.button>
      ))}
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "rgba(2,132,199,0.1)", border: "1px solid rgba(2,132,199,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Bot size={13} style={{ color: "#0284c7" }} strokeWidth={2} />
      </div>
      <div style={{ ...glass, padding: "12px 16px", borderRadius: "18px 18px 18px 4px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <motion.div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#0284c7" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, flexDirection: isUser ? "row-reverse" : "row" }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "rgba(124,58,237,0.12)" : "rgba(2,132,199,0.10)",
        border: isUser ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(2,132,199,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isUser ? <User size={13} style={{ color: "#7c3aed" }} strokeWidth={2} /> : <Bot size={13} style={{ color: "#0284c7" }} strokeWidth={2} />}
      </div>

      <div style={{
        maxWidth: "72%", padding: "12px 16px", fontSize: 13, lineHeight: 1.65,
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? "linear-gradient(135deg, rgba(124,58,237,0.10), rgba(124,58,237,0.06))"
          : "rgba(255,255,255,0.88)",
        border: isUser ? "1px solid rgba(124,58,237,0.2)" : "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        color: "#111827",
      }}>
        {message.content.split("\n").map((line, i, arr) => (
          <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
        ))}
        <p style={{ fontSize: 10, marginTop: 7, color: isUser ? "rgba(124,58,237,0.5)" : "#9CA3AF" }}>
          {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </p>
      </div>
    </motion.div>
  );
}

function WelcomeState({ onPrompt }: { onPrompt: (t: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", paddingBottom: 32 }}>
      <motion.div
        style={{ width: 64, height: 64, borderRadius: 22, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(139,92,246,0.10))",
          border: "1px solid rgba(14,165,233,0.25)", boxShadow: "0 8px 32px rgba(14,165,233,0.12)",
        }}
        animate={{ boxShadow: ["0 8px 32px rgba(14,165,233,0.12)", "0 8px 40px rgba(14,165,233,0.22)", "0 8px 32px rgba(14,165,233,0.12)"] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Sparkles size={26} style={{ color: "#0284c7" }} strokeWidth={1.5} />
      </motion.div>

      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6, textAlign: "center" }}>
        Optivise Copilot
      </h2>
      <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 28, textAlign: "center", maxWidth: 300, lineHeight: 1.6 }}>
        Ask me anything about your supply chain. I have full context of your products and AI insights.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 480 }}>
        {SUGGESTED.map((s, i) => {
          const SIcon = s.Icon;
          return (
            <motion.button key={i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.07 }}
              onClick={() => onPrompt(s.text)}
              style={{
                ...glass, padding: "12px 14px", borderRadius: 16, display: "flex", alignItems: "flex-start",
                gap: 10, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.9)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 6px 24px rgba(0,0,0,0.10)"; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)"; el.style.transform = "translateY(0)"; }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 10, background: `${s.color}12`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SIcon size={13} style={{ color: s.color }} strokeWidth={2} />
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "#374151" }}>{s.text}</p>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: t, timestamp: new Date() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json() as { reply?: string; message?: string };
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`, role: "assistant",
        content: data.reply ?? data.message ?? "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`, role: "assistant",
        content: "Connection error. Please check your network and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.06)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.12))", border: "1px solid rgba(14,165,233,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={13} style={{ color: "#0284c7" }} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>AI Copilot</h1>
            <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>Supply chain intelligence · Powered by Groq</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={() => setMessages([])}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
              borderRadius: 10, fontSize: 12, fontWeight: 500,
              background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.10)",
              color: "#374151", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
            <RotateCcw size={12} strokeWidth={2} />
            New Chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 32px" }}>
        {messages.length === 0 ? (
          <WelcomeState onPrompt={send} />
        ) : (
          <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <MessageBubble message={msg} />
                  {msg.role === "assistant" && idx === messages.length - 1 && !isLoading && (
                    <FollowUpChips content={msg.content} onChipClick={send} />
                  )}
                </div>
              ))}
              {isLoading && <TypingIndicator key="typing" />}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 32px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", flexShrink: 0 }}>
        <div
          style={{
            display: "flex", alignItems: "flex-end", gap: 10, maxWidth: 760, margin: "0 auto",
            padding: "10px 12px", borderRadius: 20,
            background: "rgba(255,255,255,0.9)", border: "1px solid rgba(0,0,0,0.10)",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(2,132,199,0.4)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px rgba(2,132,199,0.08), 0 2px 12px rgba(0,0,0,0.06)"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,0,0,0.10)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Ask about your supply chain..."
            rows={1}
            style={{
              flex: 1, resize: "none", background: "transparent", border: "none", outline: "none",
              fontSize: 13, color: "#111827", lineHeight: 1.6, maxHeight: 120, overflowY: "auto",
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isLoading}
            style={{
              width: 32, height: 32, borderRadius: 12, flexShrink: 0, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: input.trim() && !isLoading
                ? "linear-gradient(135deg, #0ea5e9, #8b5cf6)"
                : "rgba(0,0,0,0.06)",
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              boxShadow: input.trim() && !isLoading ? "0 2px 10px rgba(14,165,233,0.3)" : "none",
            }}
          >
            {isLoading
              ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)", borderTopColor: "#0284c7" }} />
                </motion.div>
              : <Send size={13} style={{ color: input.trim() ? "#fff" : "#9CA3AF" }} strokeWidth={2} />
            }
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: 10, color: "#9CA3AF", marginTop: 8 }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}