import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { runScenario } from "@/lib/simulation/engine";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, name, demand, inventory, leadTime } = body;

    // 🔹 Validation
    if (
      typeof demand !== "number" ||
      typeof inventory !== "number" ||
      typeof leadTime !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid input types" },
        { status: 400 }
      );
    }

    // 🔹 Resolve product name (prefer the one sent by the client; fall back to DB)
    let productName = typeof name === "string" && name.trim() ? name : "";
    if (!productName && typeof productId === "string") {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      });
      productName = product?.name ?? "";
    }
    if (!productName) productName = "this product";

    // 🔹 Run the scenario through the shared engine (same logic as the client)
    const result = runScenario({ name: productName, demand, inventory, leadTime });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
