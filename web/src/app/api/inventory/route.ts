import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const warehouseId = searchParams.get("warehouseId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const skip = (page - 1) * limit;

    const where: Record<string, string> = {};
    if (productId) where.productId = productId;
    if (warehouseId) where.warehouseId = warehouseId;

    const [data, total] = await Promise.all([
      prisma.inventoryRecord.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
        include: { product: { select: { name: true, category: true } } },
      }),
      prisma.inventoryRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Inventory API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch inventory data" },
      { status: 500 }
    );
  }
}
