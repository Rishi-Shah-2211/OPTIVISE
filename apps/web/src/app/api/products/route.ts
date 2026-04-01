import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        id: "asc", // 🔥 ensures Product 1 → 100 order
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Products API error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}