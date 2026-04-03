/**
 * Synthetic enrichment layer for supply chain data.
 * Generates realistic suppliers, lead times, reorder points,
 * and demand history for ingested retail products.
 */

const SUPPLIER_POOL = [
  { name: "GlobalSource Ltd",        region: "East Asia",        reliability: 0.92 },
  { name: "PrimeParts Inc",          region: "North America",    reliability: 0.96 },
  { name: "EuroLogistics GmbH",      region: "Western Europe",   reliability: 0.94 },
  { name: "QuickShip Distributors",  region: "North America",    reliability: 0.88 },
  { name: "ShenZhen Direct",         region: "East Asia",        reliability: 0.85 },
  { name: "MediterraneanTrade Co",   region: "Southern Europe",  reliability: 0.90 },
  { name: "IndoSupply Partners",     region: "South Asia",       reliability: 0.83 },
  { name: "NordicFreight AB",        region: "Northern Europe",  reliability: 0.95 },
  { name: "LatAm Wholesale",         region: "South America",    reliability: 0.80 },
  { name: "PacificRim Exports",      region: "Southeast Asia",   reliability: 0.87 },
];

const LEAD_TIME_RANGES: Record<string, [number, number]> = {
  "East Asia":        [14, 35],
  "North America":    [3, 12],
  "Western Europe":   [5, 15],
  "Southern Europe":  [7, 18],
  "South Asia":       [18, 40],
  "Northern Europe":  [4, 14],
  "South America":    [20, 45],
  "Southeast Asia":   [15, 30],
};

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export interface SupplierData {
  name: string;
  region: string;
  reliability: number;
}

export interface EnrichedProduct {
  supplier: SupplierData;
  leadTime: number;
  reorderPoint: number;
}

export interface DemandPoint {
  date: Date;
  demandQty: number;
}

/**
 * Assign a supplier, lead time, and reorder point to a product.
 */
export function enrichProduct(
  productIndex: number,
  currentDemand: number,
  runtimeSeed?: number,
): EnrichedProduct {
  const rand = seededRandom(productIndex * 7919 + (runtimeSeed ?? 0));

  // Pick supplier — rotate assignment when runtimeSeed is present
  const supplierOffset = runtimeSeed ? Math.abs(runtimeSeed % SUPPLIER_POOL.length) : 0;
  const supplier = SUPPLIER_POOL[(productIndex + supplierOffset) % SUPPLIER_POOL.length];

  // Lead time from supplier's region range
  const [minLT, maxLT] = LEAD_TIME_RANGES[supplier.region] ?? [5, 20];
  const leadTime = Math.round(minLT + rand() * (maxLT - minLT));

  // Reorder point = daily demand * lead time * safety factor
  const dailyDemand = Math.max(currentDemand / 30, 1);
  const safetyFactor = 1.3 + rand() * 0.4; // 1.3x to 1.7x
  const reorderPoint = Math.round(dailyDemand * leadTime * safetyFactor);

  return { supplier, leadTime, reorderPoint };
}

/**
 * Generate 90 days of synthetic demand history for a product.
 */
export function generateDemandHistory(
  baseDemand: number,
  productIndex: number,
  days: number = 90,
  runtimeSeed?: number,
): DemandPoint[] {
  const rand = seededRandom(productIndex * 3571 + (runtimeSeed ?? 0));
  const points: DemandPoint[] = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    // Simulate seasonal pattern + noise
    const seasonalFactor = 1 + 0.2 * Math.sin((d / 30) * Math.PI * 2);
    const weekdayBoost = date.getDay() >= 1 && date.getDay() <= 5 ? 1.1 : 0.8;
    const noise = 0.7 + rand() * 0.6; // 0.7x to 1.3x
    const dailyDemand = Math.max(1, Math.round((baseDemand / 30) * seasonalFactor * weekdayBoost * noise));

    points.push({ date, demandQty: dailyDemand });
  }

  return points;
}

/**
 * Generate inventory snapshots (weekly) for last 12 weeks.
 */
export function generateInventoryHistory(
  currentStock: number,
  weeklyDemandAvg: number,
  productIndex: number,
  runtimeSeed?: number,
): { stockLevel: number; warehouseId: string; updatedAt: Date }[] {
  const rand = seededRandom(productIndex * 2237 + (runtimeSeed ?? 0));
  const snapshots: { stockLevel: number; warehouseId: string; updatedAt: Date }[] = [];
  const warehouses = ["WH-001", "WH-002", "WH-003"];
  const now = new Date();

  let stock = currentStock + weeklyDemandAvg * 12; // estimate starting stock

  for (let w = 11; w >= 0; w--) {
    const date = new Date(now);
    date.setDate(date.getDate() - w * 7);

    const consumed = Math.round(weeklyDemandAvg * (0.8 + rand() * 0.4));
    const replenished = w % 3 === 0 ? Math.round(weeklyDemandAvg * 3 * (0.8 + rand() * 0.4)) : 0;
    stock = Math.max(0, stock - consumed + replenished);

    snapshots.push({
      stockLevel: stock,
      warehouseId: warehouses[productIndex % warehouses.length],
      updatedAt: date,
    });
  }

  return snapshots;
}
