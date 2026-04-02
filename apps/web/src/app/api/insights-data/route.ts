import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // First check if we have persisted insights
    const persistedInsights = await prisma.insight.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    if (persistedInsights.length > 0) {
      return NextResponse.json({ success: true, data: persistedInsights });
    }

    // Fallback: generate on-the-fly from product data
    const products = await prisma.product.findMany({
      include: { supplier: { select: { name: true, reliability: true } } },
    });
    const insights: { type: string; message: string; impact: number; confidence: number }[] = [];

    for (const product of products) {
      if (product.inventory < product.demand) {
        const deficit = product.demand - product.inventory;
        insights.push({
          type: "stockout",
          message: `${product.name} is likely to stock out — deficit of ${deficit} units`,
          impact: Math.min(deficit * 10, 100),
          confidence: 0.9,
        });
      }

      if (product.inventory > product.demand * 2) {
        const excess = product.inventory - product.demand * 2;
        insights.push({
          type: "overstock",
          message: `${product.name} is overstocked by ${excess} units`,
          impact: Math.min(excess * 5, 90),
          confidence: 0.75,
        });
      }

      if (product.leadTime > 20) {
        insights.push({
          type: "lead_time",
          message: `${product.name} has a long lead time of ${product.leadTime} days`,
          impact: Math.min(product.leadTime * 3, 85),
          confidence: 0.85,
        });
      }

      if (product.reorderPoint > 0 && product.inventory < product.reorderPoint) {
        insights.push({
          type: "reorder",
          message: `${product.name} stock (${product.inventory}) is below reorder point (${product.reorderPoint})`,
          impact: 72,
          confidence: 0.92,
        });
      }

      if (product.supplier && product.supplier.reliability < 0.85) {
        insights.push({
          type: "supplier_risk",
          message: `${product.name} depends on low-reliability supplier ${product.supplier.name} (${(product.supplier.reliability * 100).toFixed(0)}%)`,
          impact: Math.round((1 - product.supplier.reliability) * 100),
          confidence: 0.88,
        });
      }
    }

    return NextResponse.json({ success: true, data: insights });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
