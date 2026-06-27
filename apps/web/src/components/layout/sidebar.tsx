"use client";

import { usePathname } from "next/navigation";
import { BarChart3, Brain, Home, Settings } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const navItems = [
  { name: "My Shop", icon: Home, href: "/" },
  { name: "Smart Tips", icon: Brain, href: "/insights" },
  { name: "What-If", icon: BarChart3, href: "/simulator" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="fixed left-0 top-0 z-30 h-screen w-[260px] border-r border-white/10 bg-[#0B0F17]">
      <div className="h-full flex flex-col p-4">
        <div className="mb-6 px-2 py-2">
          <div className="text-base font-semibold tracking-tight text-zinc-100">
            Optivise
          </div>
          <div className="mt-1 text-xs text-zinc-400">Your shop stock helper</div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300",
                  "hover:bg-white/5 hover:text-zinc-100 hover:translate-x-0.5",
                  active
                    ? "bg-blue-500/12 border border-blue-400/20 shadow-[0_0_0_1px_rgba(96,165,250,0.18),0_0_24px_rgba(59,130,246,0.14)]"
                    : "text-zinc-300"
                )}
              >
                {/* Active accent */}
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-1.5 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full transition-all duration-300",
                    active ? "bg-blue-400 opacity-100" : "bg-blue-400 opacity-0"
                  )}
                />

                <Icon size={18} className={clsx("shrink-0", active ? "text-blue-100" : "text-zinc-300")} />
                <span className={clsx("text-sm font-medium", active ? "text-white" : "text-zinc-300")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}