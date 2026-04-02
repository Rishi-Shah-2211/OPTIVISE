import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500);
    const skip = (page - 1) * limit;

    const where = productId ? { productId } : {};

    const [data, total] = await Promise.all([
      prisma.demand.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
        include: { product: { select: { name: true, category: true } } },
      }),
      prisma.demand.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Demand API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch demand data" },
      { status: 500 }
    );
  }
}
