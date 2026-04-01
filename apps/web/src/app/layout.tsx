"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Lightbulb,
  FlaskConical,
  Settings,
  Zap,
  Activity,
} from "lucide-react";
import { QueryProvider } from "@/providers/QueryProvider";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/insights",  label: "Insights",   Icon: Lightbulb       },
  { href: "/simulator", label: "Simulator",  Icon: FlaskConical    },
  { href: "/copilot",   label: "Copilot",    Icon: Zap             },
  { href: "/settings",  label: "Settings",   Icon: Settings        },
];

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-[11px] tabular-nums" style={{ color: "#6B7280" }}>
      {time}
    </span>
  );
}

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: React.ElementType; active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: "none",
        color: active ? "#0284c7" : "#6B7280",
        background: active
          ? "linear-gradient(135deg, rgba(14,165,233,0.12), rgba(14,165,233,0.06))"
          : "transparent",
        border: active ? "1px solid rgba(14,165,233,0.2)" : "1px solid transparent",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.color = "#374151";
          el.style.background = "rgba(0,0,0,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          const el = e.currentTarget as HTMLAnchorElement;
          el.style.color = "#6B7280";
          el.style.background = "transparent";
        }
      }}
    >
      <Icon size={15} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? "#0284c7" : "inherit", flexShrink: 0 }} />
      <span>{label}</span>
      {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#0284c7", boxShadow: "0 0 8px rgba(2,132,199,0.5)" }} />}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Optivise — Supply Chain Intelligence</title>
        <meta name="description" content="AI-powered supply chain decision intelligence platform" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
        />
      </head>
      <body>
        <QueryProvider>
          <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
            {/* Sidebar */}
            <aside style={{
              width: 220,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              background: "rgba(255,255,255,0.82)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRight: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
            }}>
              {/* Logo */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "0 20px",
                height: 60, borderBottom: "1px solid rgba(0,0,0,0.06)", flexShrink: 0,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(14,165,233,0.08))",
                  border: "1px solid rgba(14,165,233,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(14,165,233,0.2)",
                }}>
                  <Activity size={13} style={{ color: "#0284c7" }} strokeWidth={2.2} />
                </div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: "-0.02em" }}>
                  Optivise
                </span>
              </div>

              {/* Nav */}
              <nav style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#9CA3AF", padding: "0 12px", marginBottom: 8 }}>
                  Platform
                </p>
                {NAV_ITEMS.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    Icon={item.Icon}
                    active={item.href === "/" ? pathname === "/" || pathname.startsWith("/dashboard") : pathname.startsWith(item.href)}
                  />
                ))}
              </nav>

              {/* Footer */}
              <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>System</span>
                  <LiveClock />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.5)", animation: "pulse-slow 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 10, color: "#6B7280" }}>All systems operational</span>
                </div>
              </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}