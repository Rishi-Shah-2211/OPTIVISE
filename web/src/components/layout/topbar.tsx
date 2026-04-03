"use client";

import { UserCircle2 } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-[60px] border-b border-white/10 bg-[#111827] flex items-center px-6 md:px-8">
      {/* Left placeholder (breadcrumbs/title slot) */}
      <div className="w-[220px] shrink-0" aria-hidden="true" />

      <div className="w-[220px] shrink-0 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition-all duration-300 hover:bg-white/10"
          aria-label="User profile"
        >
          <UserCircle2 size={18} className="text-zinc-200" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}