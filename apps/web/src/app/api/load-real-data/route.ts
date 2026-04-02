import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import {
  enrichProduct,
  generateDemandHistory,
  generateInventoryHistory,
} from "@/lib/data/enrichment";

const prisma = new PrismaClient();

interface CsvRow {
  name: string;
  category: string;
  price: number;
  stock: number;
  monthly_demand: number;
}

function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split("\n");
  const header = lines[0].split(",");
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
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

export async function POST() {
  const startTime = Date.now();
  console.log("[LoadRealData] Starting ingestion...");

  try {
    // 1. Read CSV
    const csvPath = join(process.cwd(), "data", "retail-dataset.csv");
    let csvContent: string;
    try {
      csvContent = readFileSync(csvPath, "utf-8");
    } catch {
      return NextResponse.json(
        { success: false, error: "Dataset file not found at data/retail-dataset.csv" },
        { status: 404 }
      );
    }

    const rows = parseCsv(csvContent);
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "CSV file is empty or malformed" },
        { status: 400 }
      );
    }

    console.log(`[LoadRealData] Parsed ${rows.length} products from CSV`);

    // 2. Clear existing data (in correct FK order)
    await prisma.$transaction([
      prisma.demand.deleteMany(),
      prisma.inventoryRecord.deleteMany(),
      prisma.insight.deleteMany(),
      prisma.product.deleteMany(),
      prisma.supplier.deleteMany(),
    ]);
    console.log("[LoadRealData] Cleared existing data");

    // 3. Create suppliers (deduplicated)
    const supplierMap = new Map<string, string>(); // name -> id
    const supplierSet = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const enriched = enrichProduct(i, rows[i].monthly_demand);
      supplierSet.add(JSON.stringify(enriched.supplier));
    }

    for (const raw of supplierSet) {
      const s = JSON.parse(raw);
      const created = await prisma.supplier.create({
        data: { name: s.name, region: s.region, reliability: s.reliability },
      });
      supplierMap.set(s.name, created.id);
    }
    console.log(`[LoadRealData] Created ${supplierMap.size} suppliers`);

    // 4. Insert products with enrichment (batched)
    const BATCH_SIZE = 10;
    const productIds: string[] = [];

    for (let batch = 0; batch < rows.length; batch += BATCH_SIZE) {
      const slice = rows.slice(batch, batch + BATCH_SIZE);

      const created = await Promise.all(
        slice.map((row, localIdx) => {
          const globalIdx = batch + localIdx;
          const enriched = enrichProduct(globalIdx, row.monthly_demand);
          const supplierId = supplierMap.get(enriched.supplier.name);

          return prisma.product.create({
            data: {
              name: row.name,
              category: row.category,
              price: row.price,
              inventory: row.stock,
              demand: row.monthly_demand,
              leadTime: enriched.leadTime,
              reorderPoint: enriched.reorderPoint,
              supplierId: supplierId ?? null,
            },
          });
        })
      );

      productIds.push(...created.map((p) => p.id));
    }
    console.log(`[LoadRealData] Inserted ${productIds.length} products`);

    // 5. Generate ALL demand history in one bulk insert
    const allDemandData: { productId: string; date: Date; demandQty: number }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const history = generateDemandHistory(rows[i].monthly_demand, i);
      for (const pt of history) {
        allDemandData.push({ productId: productIds[i], date: pt.date, demandQty: pt.demandQty });
      }
    }
    // Insert in large chunks to minimize round trips
    const DEMAND_CHUNK = 500;
    for (let b = 0; b < allDemandData.length; b += DEMAND_CHUNK) {
      await prisma.demand.createMany({ data: allDemandData.slice(b, b + DEMAND_CHUNK) });
    }
    console.log(`[LoadRealData] Generated ${allDemandData.length} demand records`);

    // 6. Generate ALL inventory snapshots in one bulk insert
    const allInvData: { productId: string; stockLevel: number; warehouseId: string; updatedAt: Date }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const weeklyDemand = Math.round(rows[i].monthly_demand / 4);
      const snapshots = generateInventoryHistory(rows[i].stock, weeklyDemand, i);
      for (const s of snapshots) {
        allInvData.push({ productId: productIds[i], stockLevel: s.stockLevel, warehouseId: s.warehouseId, updatedAt: s.updatedAt });
      }
    }
    await prisma.inventoryRecord.createMany({ data: allInvData });
    console.log(`[LoadRealData] Generated ${allInvData.length} inventory records`);

    // 7. Generate insights from the real data
    const products = await prisma.product.findMany();
    const insightData: { type: string; message: string; impact: number; confidence: number }[] = [];

    for (const p of products) {
      if (p.inventory < p.demand) {
        insightData.push({
          type: "stockout",
          message: `${p.name} is at risk — inventory (${p.inventory}) below demand (${p.demand})`,
          impact: Math.min(((p.demand - p.inventory) / p.demand) * 100, 100),
          confidence: 0.9,
        });
      }
      if (p.inventory > p.demand * 3) {
        const excess = p.inventory - p.demand * 3;
        insightData.push({
          type: "overstock",
          message: `${p.name} is overstocked by ${excess} units`,
          impact: Math.min((excess / p.inventory) * 80, 90),
          confidence: 0.78,
        });
      }
      if (p.leadTime > 20) {
        insightData.push({
          type: "lead_time",
          message: `${p.name} has a long lead time of ${p.leadTime} days — consider backup supplier`,
          impact: Math.min(p.leadTime * 3, 85),
          confidence: 0.85,
        });
      }
      if (p.inventory > 0 && p.inventory < p.reorderPoint) {
        insightData.push({
          type: "reorder",
          message: `${p.name} stock (${p.inventory}) is below reorder point (${p.reorderPoint}) — trigger PO`,
          impact: 72,
          confidence: 0.92,
        });
      }
    }

    if (insightData.length > 0) {
      await prisma.insight.createMany({ data: insightData });
    }
    console.log(`[LoadRealData] Generated ${insightData.length} insights`);

    const elapsed = Date.now() - startTime;
    console.log(`[LoadRealData] Completed in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      summary: {
        products: productIds.length,
        suppliers: supplierMap.size,
        demandRecords: allDemandData.length,
        inventoryRecords: allInvData.length,
        insights: insightData.length,
        elapsedMs: elapsed,
      },
    });
  } catch (error) {
    console.error("[LoadRealData] Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}
