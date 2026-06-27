import { NextResponse } from "next/server";
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
