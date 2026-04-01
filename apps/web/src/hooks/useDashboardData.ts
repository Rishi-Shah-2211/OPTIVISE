"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import type { Product, Insight, DashboardKPIs, MetricCardConfig } from "@/types/dashboard";

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error(`Products API failed: ${res.status}`);
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

async function fetchInsights(): Promise<Insight[]> {
  const res = await fetch("/api/insights-data");
  if (!res.ok) throw new Error(`Insights API failed: ${res.status}`);
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function computeKPIs(products: Product[], insights: Insight[]): DashboardKPIs {
  const totalSKUs = products.length;
  const totalInventory = products.reduce((s, p) => s + (p.inventory ?? 0), 0);
  const avgLeadTime = products.length > 0
    ? products.reduce((s, p) => s + (p.leadTime ?? 0), 0) / products.length : 0;
  const avgConfidence = insights.length > 0
    ? insights.reduce((s, i) => {
        const c = i.confidence ?? 0;
        return s + (c <= 1 ? c * 100 : c);
      }, 0) / insights.length : 0;
  const criticalAlerts = insights.filter((i) => i.impact > 70).length;
  const demandPressure = products.length > 0
    ? (products.reduce((s, p) => s + (p.inventory > 0 ? Math.min(p.demand / p.inventory, 1) : 1), 0) / products.length) * 100 : 0;

  return {
    totalSKUs,
    totalInventory,
    avgLeadTime: parseFloat(avgLeadTime.toFixed(1)),
    avgConfidence: parseFloat(avgConfidence.toFixed(1)),
    criticalAlerts,
    demandPressure: parseFloat(Math.min(demandPressure, 100).toFixed(1)),
  };
}

function generateSparkData(value: number, points = 8): number[] {
  const base = value || 10;
  return Array.from({ length: points }, (_, i) => {
    const noise = (Math.sin(i * 1.7 + base * 0.01) * 0.18 + Math.cos(i * 0.9) * 0.08) * base;
    return Math.max(0, base + noise * (i / points));
  });
}

function buildMetricCards(kpis: DashboardKPIs): MetricCardConfig[] {
  return [
    {
      id: "total-skus",
      title: "Total SKUs",
      rawValue: kpis.totalSKUs,
      displayValue: kpis.totalSKUs.toLocaleString(),
      unit: "products",
      description: "Active products tracked",
      accent: "cyan",
      icon: "Package",
      trend: "up",
      sparkData: generateSparkData(kpis.totalSKUs),
    },
    {
      id: "inventory",
      title: "Total Inventory",
      rawValue: kpis.totalInventory,
      displayValue: kpis.totalInventory >= 1000 ? `${(kpis.totalInventory / 1000).toFixed(1)}k` : kpis.totalInventory.toLocaleString(),
      unit: "units",
      description: "Units across all SKUs",
      accent: "emerald",
      icon: "Boxes",
      trend: "up",
      sparkData: generateSparkData(kpis.totalInventory),
    },
    {
      id: "lead-time",
      title: "Avg Lead Time",
      rawValue: kpis.avgLeadTime,
      displayValue: kpis.avgLeadTime.toFixed(1),
      unit: "days",
      description: "Average supplier lead time",
      accent: "amber",
      icon: "Clock",
      trend: kpis.avgLeadTime > 14 ? "down" : "neutral",
      sparkData: generateSparkData(kpis.avgLeadTime),
    },
    {
      id: "ai-confidence",
      title: "AI Confidence",
      rawValue: kpis.avgConfidence,
      displayValue: kpis.avgConfidence.toFixed(1),
      unit: "%",
      description: "Average model certainty",
      accent: "violet",
      icon: "BrainCircuit",
      trend: kpis.avgConfidence > 75 ? "up" : "neutral",
      sparkData: generateSparkData(kpis.avgConfidence),
    },
    {
      id: "critical-alerts",
      title: "Critical Alerts",
      rawValue: kpis.criticalAlerts,
      displayValue: kpis.criticalAlerts.toLocaleString(),
      unit: "active",
      description: "Insights requiring action",
      accent: "rose",
      icon: "ShieldAlert",
      trend: kpis.criticalAlerts > 0 ? "down" : "up",
      sparkData: generateSparkData(kpis.criticalAlerts),
    },
    {
      id: "demand-pressure",
      title: "Demand Pressure",
      rawValue: kpis.demandPressure,
      displayValue: kpis.demandPressure.toFixed(1),
      unit: "%",
      description: "Demand vs inventory ratio",
      accent: "amber",
      icon: "TrendingUp",
      trend: kpis.demandPressure > 80 ? "down" : "up",
      sparkData: generateSparkData(kpis.demandPressure),
    },
  ];
}

export function useDashboardData() {
  const queryClient = useQueryClient();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 30_000,
  });

  const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: fetchInsights,
    staleTime: 30_000,
  });

  // Set lastUpdated whenever data loads
  if ((productsQuery.dataUpdatedAt || insightsQuery.dataUpdatedAt) && !lastUpdated) {
    setLastUpdated(new Date());
  }

  const products = productsQuery.data ?? [];
  const insights = insightsQuery.data ?? [];
  const isLoading = productsQuery.isLoading || insightsQuery.isLoading;
  const isError = productsQuery.isError || insightsQuery.isError;
  const errorMessage =
    (productsQuery.error as Error)?.message ??
    (insightsQuery.error as Error)?.message ?? null;

  const kpis = computeKPIs(products, insights);
  const metricCards = buildMetricCards(kpis);

  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["insights"] }),
    ]);
    setLastUpdated(new Date());
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  return {
    products,
    insights,
    kpis,
    metricCards,
    isLoading,
    isError,
    errorMessage,
    isRefreshing,
    lastUpdated,
    refetch,
  };
}