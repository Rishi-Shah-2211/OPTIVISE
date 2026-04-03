import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation/simulate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { demand, inventory, leadTime } = body;

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

    // 🔹 Run simulation
    const result = runSimulation({
      demand,
      inventory,
      leadTime,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}