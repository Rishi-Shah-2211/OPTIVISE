/**
 * Standalone CLI script for ingesting retail CSV data.
 * Usage: npx tsx scripts/ingestRetailData.ts [path-to-csv]
 *
 * If no path is provided, defaults to data/retail-dataset.csv
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";

const prisma = new PrismaClient();

// Supplier pool (same as enrichment.ts)
const SUPPLIER_POOL = [
  { name: "GlobalSource Ltd",       region: "East Asia",       reliability: 0.92 },
  { name: "PrimeParts Inc",         region: "North America",   reliability: 0.96 },
  { name: "EuroLogistics GmbH",     region: "Western Europe",  reliability: 0.94 },
  { name: "QuickShip Distributors", region: "North America",   reliability: 0.88 },
  { name: "ShenZhen Direct",        region: "East Asia",       reliability: 0.85 },
  { name: "MediterraneanTrade Co",  region: "Southern Europe",  reliability: 0.90 },
  { name: "IndoSupply Partners",    region: "South Asia",      reliability: 0.83 },
  { name: "NordicFreight AB",       region: "Northern Europe", reliability: 0.95 },
  { name: "LatAm Wholesale",        region: "South America",   reliability: 0.80 },
  { name: "PacificRim Exports",     region: "Southeast Asia",  reliability: 0.87 },
];

const LEAD_TIME_RANGES: Record<string, [number, number]> = {
  "East Asia": [14, 35], "North America": [3, 12], "Western Europe": [5, 15],
  "Southern Europe": [7, 18], "South Asia": [18, 40], "Northern Europe": [4, 14],
  "South America": [20, 45], "Southeast Asia": [15, 30],
};

function seeded(seed: number) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

interface CsvRow {
  name: string; category: string; price: number; stock: number; monthly_demand: number;
}

async function parseCSVStream(filePath: string): Promise<CsvRow[]> {
  const rows: CsvRow[] = [];
  const stream = createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    const cols = line.split(",");
    if (cols.length < 5) continue;
    rows.push({
      name: cols[0].trim(),
      category: cols[1].trim(),
      price: parseFloat(cols[2]) || 0,
      stock: parseInt(cols[3]) || 0,
      monthly_demand: parseInt(cols[4]) || 0,
    });
  }
  return rows;
}

async function main() {
  const csvPath = process.argv[2] || join(process.cwd(), "data", "retail-dataset.csv");
  console.log(`[Ingest] Reading CSV from: ${csvPath}`);

  const rows = await parseCSVStream(csvPath);
  console.log(`[Ingest] Parsed ${rows.length} products`);

  if (rows.length === 0) {
    console.error("[Ingest] No data found. Exiting.");
    process.exit(1);
  }

  // Clear
  console.log("[Ingest] Clearing existing data...");
  await prisma.$transaction([
    prisma.demand.deleteMany(),
    prisma.inventoryRecord.deleteMany(),
    prisma.insight.deleteMany(),
    prisma.product.deleteMany(),
    prisma.supplier.deleteMany(),
  ]);

  // Suppliers
  const supplierMap = new Map<string, string>();
  for (const s of SUPPLIER_POOL) {
    const created = await prisma.supplier.create({ data: s });
    supplierMap.set(s.name, created.id);
  }
  console.log(`[Ingest] Created ${supplierMap.size} suppliers`);

  // Products
  const productIds: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const supplier = SUPPLIER_POOL[i % SUPPLIER_POOL.length];
    const rand = seeded(i * 7919);
    const [minLT, maxLT] = LEAD_TIME_RANGES[supplier.region] ?? [5, 20];
    const leadTime = Math.round(minLT + rand() * (maxLT - minLT));
    const dailyDemand = Math.max(row.monthly_demand / 30, 1);
    const reorderPoint = Math.round(dailyDemand * leadTime * (1.3 + rand() * 0.4));

    const p = await prisma.product.create({
      data: {
        name: row.name, category: row.category, price: row.price,
        inventory: row.stock, demand: row.monthly_demand,
        leadTime, reorderPoint,
        supplierId: supplierMap.get(supplier.name) ?? null,
      },
    });
    productIds.push(p.id);

    if ((i + 1) % 10 === 0) console.log(`[Ingest] Inserted ${i + 1}/${rows.length} products`);
  }

  // Demand history (90 days per product)
  console.log("[Ingest] Generating demand history...");
  let demandCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const rand = seeded(i * 3571);
    const baseDemand = rows[i].monthly_demand;
    const records: { productId: string; date: Date; demandQty: number }[] = [];
    const now = new Date();

    for (let d = 89; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(0, 0, 0, 0);
      const seasonal = 1 + 0.2 * Math.sin((d / 30) * Math.PI * 2);
      const weekday = date.getDay() >= 1 && date.getDay() <= 5 ? 1.1 : 0.8;
      const noise = 0.7 + rand() * 0.6;
      const qty = Math.max(1, Math.round((baseDemand / 30) * seasonal * weekday * noise));
      records.push({ productId: productIds[i], date, demandQty: qty });
    }

    await prisma.demand.createMany({ data: records });
    demandCount += records.length;
  }
  console.log(`[Ingest] Created ${demandCount} demand records`);

  // Insights
  const products = await prisma.product.findMany();
  const insightData: { type: string; message: string; impact: number; confidence: number }[] = [];
  for (const p of products) {
    if (p.inventory < p.demand) {
      insightData.push({ type: "stockout", message: `${p.name} at risk — inv ${p.inventory} < demand ${p.demand}`, impact: Math.min(((p.demand - p.inventory) / p.demand) * 100, 100), confidence: 0.9 });
    }
    if (p.inventory > p.demand * 3) {
      insightData.push({ type: "overstock", message: `${p.name} overstocked by ${p.inventory - p.demand * 3} units`, impact: Math.min(((p.inventory - p.demand * 3) / p.inventory) * 80, 90), confidence: 0.78 });
    }
    if (p.leadTime > 20) {
      insightData.push({ type: "lead_time", message: `${p.name} has ${p.leadTime}d lead time`, impact: Math.min(p.leadTime * 3, 85), confidence: 0.85 });
    }
  }
  if (insightData.length > 0) await prisma.insight.createMany({ data: insightData });
  console.log(`[Ingest] Created ${insightData.length} insights`);

  console.log("[Ingest] Done!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[Ingest] Fatal:", err);
  process.exit(1);
});
