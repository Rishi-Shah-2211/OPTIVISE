"use client";

import { useMemo } from "react";
import type { AccentColor } from "@/types/dashboard";

const ACCENTS: Record<AccentColor, { stroke: string }> = {
  cyan:    { stroke: "#0ea5e9" },
  amber:   { stroke: "#f59e0b" },
  rose:    { stroke: "#f43f5e" },
  emerald: { stroke: "#10b981" },
  violet:  { stroke: "#8b5cf6" },
};

export function Sparkline({ data, accent, width = 100, height = 36 }: { data: number[]; accent: AccentColor; width?: number; height?: number }) {
  const { stroke } = ACCENTS[accent];

  const { linePath, areaPath } = useMemo(() => {
    if (!data || data.length < 2) return { linePath: "", areaPath: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pad = 3;
    const pts = data.map((v, i) => ({
      x: (i / (data.length - 1)) * (width - pad * 2) + pad,
      y: height - pad - ((v - min) / range) * (height - pad * 2.5),
    }));
    const line = pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x},${pt.y}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + pt.x) / 2;
      return `${acc} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`;
    }, "");
    const area = `${line} L ${pts[pts.length - 1].x},${height} L ${pts[0].x},${height} Z`;
    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (!linePath) return null;
  const gradId = `sg-${accent}-${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stroke} stopOpacity="0.42" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
