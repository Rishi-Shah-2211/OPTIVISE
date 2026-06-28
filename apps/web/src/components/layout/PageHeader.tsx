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
    <div className="sticky top-0 z-10 flex h-[60px] shrink-0 items-center justify-between border-b border-[#3e4636]/12 bg-[rgba(255,250,241,0.82)] px-8 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <h1 className="font-serif m-0 text-[15px] font-bold text-[#1b1d1b]">{title}</h1>
          {subtitle && <p className="m-0 text-[11px] text-[#1b1d1b]/60">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export const glassCard =
  "glass-panel card-lift shimmer-card rounded-[1.75rem] border border-[#3e4636]/12";
