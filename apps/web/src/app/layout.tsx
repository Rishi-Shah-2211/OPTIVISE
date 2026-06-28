"use client";

import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { Geist, Geist_Mono, Fraunces, Instrument_Serif } from "next/font/google";
import {
  LayoutDashboard, Lightbulb, FlaskConical, Settings, Zap, Activity,
  LogOut, Package, ClipboardList, Truck,
} from "lucide-react";
import { QueryProvider } from "@/providers/QueryProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });
const instrumentSerif = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

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

function TopNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/dashboard") : pathname.startsWith(href);

  return (
    <header className="z-20 flex h-[58px] shrink-0 items-center gap-4 shadow-[0_12px_28px_-20px_rgba(27,47,40,0.5)] bg-[rgba(255,250,241,0.92)] px-6">
      {/* Logo */}
      <div className="flex shrink-0 items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[#1f7a5c]/30 bg-gradient-to-br from-[#256a52]/22 to-[#256a52]/8 shadow-[0_2px_8px_rgba(31,122,92,0.25)]">
          <Activity size={14} className="text-[#1f7a5c]" strokeWidth={2.2} />
        </div>
        <span className="font-serif text-[17px] font-bold tracking-tight text-[#1b1d1b]">Optivise</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto px-2">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all duration-300 ${
                active
                  ? "bg-[#1f7a5c]/12 text-[#154f3d] shadow-[inset_0_0_0_1px_rgba(31,122,92,0.2)]"
                  : "text-[#324036]/70 hover:bg-[#1f7a5c]/6 hover:text-[#154f3d]"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} className={active ? "text-[#1f7a5c]" : ""} />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#c0492f]/25 bg-[#c0492f]/8 px-3.5 py-2 text-[12px] font-semibold text-[#c0492f] transition hover:bg-[#c0492f]/15"
      >
        <LogOut size={13} strokeWidth={2} /> Log Out
      </button>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
              <div className="relative z-10 flex h-dvh min-h-dvh flex-col overflow-hidden">
                <TopNav />
                <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
              </div>
            )}
          </QueryProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
