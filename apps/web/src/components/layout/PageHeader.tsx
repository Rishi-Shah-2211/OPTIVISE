"use client";

import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-white/12 bg-[rgba(26,31,46,0.85)] px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <h1 className="font-serif m-0 text-[15px] font-bold text-slate-100">{title}</h1>
          {subtitle && <p className="m-0 text-[11px] text-white/60">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export const glassCard =
  "glass-panel card-lift shimmer-card rounded-[1.75rem] border border-white/12";
