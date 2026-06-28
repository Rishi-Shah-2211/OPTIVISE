import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ success: true, data: [] });

    const suppliers = await prisma.supplier.findMany({
      where: { userId },
      include: {
        _count: { select: { products: true } },
        products: { select: { name: true, demand: true, leadTime: true } },
      },
    });

    const rates = await prisma.supplierRate.findMany({ where: { userId } });
    const rateBySupplier = new Map<string, number[]>();
    for (const r of rates) {
      if (!r.supplierId) continue;
      const arr = rateBySupplier.get(r.supplierId) ?? [];
      arr.push(r.rate);
      rateBySupplier.set(r.supplierId, arr);
    }

    const data = suppliers.map((s) => {
      const leadTimes = s.products.map((p) => p.leadTime);
      const avgLead = leadTimes.length ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;
      const topItems = [...s.products].sort((a, b) => b.demand - a.demand).slice(0, 3).map((p) => p.name);
      const quotes = rateBySupplier.get(s.id) ?? [];
      return {
        id: s.id,
        name: s.name,
        region: s.region,
        reliability: Math.round(s.reliability * 100),
        itemCount: s._count.products,
        avgLeadTime: avgLead,
        quoteCount: quotes.length,
        topItems,
      };
    }).sort((a, b) => b.reliability - a.reliability);

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("Suppliers error:", e);
    return NextResponse.json({ success: false, error: "Could not load suppliers" }, { status: 500 });
  }
}

// reliability comes in as a percent (0-100) from the UI
function relFromPercent(v: unknown): number {
  const n = Number(v);
  if (!isFinite(n)) return 0.9;
  return Math.max(0, Math.min(1, n > 1 ? n / 100 : n));
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const b = await req.json();
    if (!b?.name?.trim()) return NextResponse.json({ error: "Supplier name is needed" }, { status: 400 });
    const supplier = await prisma.supplier.create({
      data: {
        name: String(b.name).trim(),
        region: b.region?.trim() || "Local Mandi",
        reliability: relFromPercent(b.reliability),
        userId,
      },
    });
    return NextResponse.json({ success: true, data: supplier });
  } catch (e) {
    console.error("Create supplier error:", e);
    return NextResponse.json({ error: "Could not add supplier" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const b = await req.json();
    if (!b?.id) return NextResponse.json({ error: "Supplier id is needed" }, { status: 400 });
    const existing = await prisma.supplier.findFirst({ where: { id: b.id, userId } });
    if (!existing) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    const supplier = await prisma.supplier.update({
      where: { id: b.id },
      data: {
        name: b.name?.trim() || existing.name,
        region: b.region?.trim() || existing.region,
        reliability: b.reliability != null ? relFromPercent(b.reliability) : existing.reliability,
      },
    });
    return NextResponse.json({ success: true, data: supplier });
  } catch (e) {
    console.error("Update supplier error:", e);
    return NextResponse.json({ error: "Could not update supplier" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Supplier id is needed" }, { status: 400 });
    const result = await prisma.supplier.deleteMany({ where: { id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete supplier error:", e);
    return NextResponse.json({ error: "Could not delete supplier" }, { status: 500 });
  }
}
