import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: true, data: [], totalCost: 0 });

    const products = await prisma.product.findMany({
      where: { userId },
      include: { supplier: { select: { name: true } } },
    });
    const rates = await prisma.supplierRate.findMany({ where: { userId } });

    const rateMap = new Map<string, { supplierName: string; rate: number }[]>();
    for (const r of rates) {
      const arr = rateMap.get(r.itemName) ?? [];
      arr.push({ supplierName: r.supplierName, rate: r.rate });
      rateMap.set(r.itemName, arr);
    }

    const list: unknown[] = [];
    let totalCost = 0;

    for (const p of products) {
      const daysOfStock = p.demand > 0 ? p.inventory / (p.demand / 30) : 999;
      const needs =
        (p.reorderPoint > 0 && p.inventory < p.reorderPoint) ||
        (p.demand > 0 && daysOfStock < p.leadTime);
      if (!needs) continue;

      const suggestQty = Math.max(Math.round(p.demand), p.reorderPoint * 2 - p.inventory, 1);
      const itemRates = [...(rateMap.get(p.name) ?? [])].sort((a, b) => a.rate - b.rate);
      const options = itemRates.length > 0 ? itemRates : [{ supplierName: p.supplier?.name ?? "—", rate: p.price || 0 }];
      const cheapest = options[0];
      const estCost = Math.round(suggestQty * cheapest.rate);
      totalCost += estCost;

      list.push({
        id: p.id,
        name: p.name,
        category: p.category,
        inventory: p.inventory,
        demand: p.demand,
        leadTime: p.leadTime,
        daysOfStock: Math.round(Math.min(daysOfStock, 999)),
        suggestQty,
        cheapest,
        options,
        estCost,
        urgent: daysOfStock < p.leadTime,
      });
    }

    (list as { daysOfStock: number }[]).sort((a, b) => a.daysOfStock - b.daysOfStock);
    return NextResponse.json({ success: true, data: list, totalCost: Math.round(totalCost) });
  } catch (e) {
    console.error("Reorder error:", e);
    return NextResponse.json({ success: false, error: "Could not build order list" }, { status: 500 });
  }
}
