"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MotionConfig, motion, AnimatePresence } from "framer-motion";
import { Geist, Geist_Mono, Fraunces, Instrument_Serif } from "next/font/google";
import {
  LayoutDashboard,
  Lightbulb,
  FlaskConical,
  Settings,
  Zap,
  Activity,
  LogOut,
  Package,
  ClipboardList,
  Truck,
} from "lucide-react";
import { QueryProvider } from "@/providers/QueryProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const NAV_ITEMS = [
  { href: "/",          label: "My Shop",    Icon: LayoutDashboard },
  { href: "/items",     label: "My Items",   Icon: Package         },
  { href: "/insights",  label: "Smart Tips", Icon: Lightbulb       },
  { href: "/simulator", label: "What-If",    Icon: FlaskConical    },
  { href: "/orders",    label: "Order List", Icon: ClipboardList   },
  { href: "/suppliers", label: "Suppliers",  Icon: Truck           },
  { href: "/copilot",   label: "AI Helper",  Icon: Zap             },
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
    <span className="font-mono text-[11px] tabular-nums text-[#1b1d1b]/45">
      {time}
    </span>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
  hover,
  onHover,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
  hover: string | null;
  onHover: (href: string | null) => void;
}) {
  const highlighted = hover === href || (active && hover === null);

  return (
    <Link
      href={href}
      onMouseEnter={() => onHover(href)}
      className="relative flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium no-underline transition-colors duration-300"
    >
      <AnimatePresence>
        {highlighted && (
          <motion.span
            layoutId="sidebar-indicator"
            className="absolute inset-0 -z-[1] rounded-full bg-gradient-to-br from-[#256a52]/20 to-violet-500/10 border border-[#1f7a5c]/25 shadow-[0_4px_20px_rgba(31,122,92,0.12)]"
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          />
        )}
      </AnimatePresence>
      <Icon
        size={15}
        strokeWidth={highlighted ? 2.2 : 1.8}
        className={`shrink-0 transition-colors duration-300 ${highlighted ? "text-[#1f7a5c]" : "text-[#1b1d1b]/55"}`}
      />
      <span className={highlighted ? "text-[#154f3d]" : "text-[#1b1d1b]/58"}>{label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(31,122,92,0.5)]" />
      )}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navHover, setNavHover] = useState<string | null>(null);

  // Enter fullscreen on the user's first interaction (browsers block auto-fullscreen
  // without a gesture). User can leave anytime with Esc / browser controls.
  useEffect(() => {
    const goFs = () => {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      }
      window.removeEventListener("pointerdown", goFs);
      window.removeEventListener("keydown", goFs);
    };
    window.addEventListener("pointerdown", goFs);
    window.addEventListener("keydown", goFs);
    return () => {
      window.removeEventListener("pointerdown", goFs);
      window.removeEventListener("keydown", goFs);
    };
  }, []);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Optivise — Simple Stock Helper for Your Shop</title>
        <meta name="description" content="A simple app that tells a shopkeeper what to buy, how much, and when — so items never finish and money never gets stuck." />
      </head>
      <body className="min-h-full">
        <div className="grain" aria-hidden />
        <div className="aurora" aria-hidden>
          <span className="aurora-blob aurora-blob--a" />
          <span className="aurora-blob aurora-blob--b" />
          <span className="aurora-blob aurora-blob--c" />
        </div>

        <MotionConfig reducedMotion="user">
          <QueryProvider>
            {pathname === "/login" ? (
            <div className="relative z-10 min-h-dvh">{children}</div>
            ) : (
            <div className="relative z-10 flex h-dvh min-h-dvh overflow-hidden">
              <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#3e4636]/12 bg-[rgba(255,250,241,0.82)] shadow-[2px_0_16px_rgba(0,0,0,0.22)] backdrop-blur-2xl backdrop-saturate-180">
                <div className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-[#3e4636]/12 px-5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-[#1f7a5c]/30 bg-gradient-to-br from-[#256a52]/22 to-[#154f3d]/8 shadow-[0_2px_8px_rgba(31,122,92,0.25)]">
                    <Activity size={13} className="text-[#1f7a5c]" strokeWidth={2.2} />
                  </div>
                  <div className="leading-none">
                    <span className="font-serif text-[15px] font-bold tracking-tight text-[#1b1d1b]">
                      Optivise
                    </span>
                    <p className="font-editorial mt-0.5 text-[10px] text-[#1b1d1b]/40">your shop, optimized</p>
                  </div>
                </div>

                <nav
                  className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4"
                  onMouseLeave={() => setNavHover(null)}
                >
                  <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.13em] text-[#1b1d1b]/42">
                    Menu
                  </p>
                  {NAV_ITEMS.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      Icon={item.Icon}
                      hover={navHover}
                      onHover={setNavHover}
                      active={
                        item.href === "/"
                          ? pathname === "/" || pathname.startsWith("/dashboard")
                          : pathname.startsWith(item.href)
                      }
                    />
                  ))}
                </nav>

                <div className="shrink-0 border-t border-[#3e4636]/12 px-5 py-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1b1d1b]/42">Status</span>
                    <LiveClock />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1f7a5c] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1f7a5c] shadow-[0_0_6px_rgba(31,122,92,0.5)]" />
                    </span>
                    <span className="text-[10px] text-[#1b1d1b]/48">Everything is working</span>
                  </div>
                  <button
                    onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-rose-500/22 bg-rose-500/10 py-2 text-[12px] font-semibold text-rose-400 transition hover:bg-rose-500/18"
                  >
                    <LogOut size={13} strokeWidth={2} /> Log Out
                  </button>
                </div>
              </aside>

              <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
                {children}
              </main>
            </div>
            )}
          </QueryProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
