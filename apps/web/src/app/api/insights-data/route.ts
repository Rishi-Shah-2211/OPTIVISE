import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany();

    const insights = [];

    for (const product of products) {
      // 🚨 Stockout risk
      if (product.inventory < product.demand) {
        insights.push({
          type: "stockout",
          message: `${product.name} is likely to stock out`,
          impact: (product.demand - product.inventory) * 10,
          confidence: 0.9,
        });
      }

      // 📦 Overstock
      if (product.inventory > product.demand * 2) {
        insights.push({
          type: "overstock",
          message: `${product.name} is overstocked`,
          impact: (product.inventory - product.demand) * 5,
          confidence: 0.75,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}