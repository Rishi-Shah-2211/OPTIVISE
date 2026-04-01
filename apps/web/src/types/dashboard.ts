// ─── Prisma-aligned types ────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  inventory: number;
  demand: number;
  leadTime: number;
  createdAt: string;
}

export interface Insight {
  id: string;
  type: string;
  message: string;
  impact: number;
  confidence: number;
  createdAt: string;
}

// ─── Computed KPIs ───────────────────────────────────────────────────────────

export interface DashboardKPIs {
  totalSKUs: number;
  totalInventory: number;
  avgLeadTime: number;
  avgConfidence: number;
  criticalAlerts: number;
  demandPressure: number;
}

// ─── Metric card config ──────────────────────────────────────────────────────

export type AccentColor = "cyan" | "amber" | "rose" | "emerald" | "violet";

export interface MetricCardConfig {
  id: string;
  title: string;
  rawValue: number;
  displayValue: string;
  unit: string;
  description: string;
  accent: AccentColor;
  icon: string;
  trend: "up" | "down" | "neutral";
  sparkData: number[];
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}