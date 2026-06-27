import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserId } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ success: true, data: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
    const category = searchParams.get("category");
    const skip = (page - 1) * limit;

    const where = category ? { userId, category } : { userId };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { id: "asc" },
        skip,
        take: limit,
        include: {
          supplier: { select: { name: true, region: true, reliability: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// ── Add a new item ──
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });

    const b = await req.json();
    if (!b?.name?.trim()) return NextResponse.json({ error: "Item name is needed" }, { status: 400 });

    const demand = Math.max(0, Math.round(Number(b.demand) || 0));
    const inventory = Math.max(0, Math.round(Number(b.inventory) || 0));
    const leadTime = Math.max(1, Math.round(Number(b.leadTime) || 3));
    const product = await prisma.product.create({
      data: {
        name: String(b.name).trim(),
        category: b.category?.trim() || "General",
        price: Math.max(0, Number(b.price) || 0),
        inventory,
        demand,
        leadTime,
        reorderPoint: Math.round((demand / 30) * leadTime * 1.5),
        supplierId: b.supplierId || null,
        userId,
      },
    });
    return NextResponse.json({ success: true, data: product });
  } catch (e) {
    console.error("Create product error:", e);
    return NextResponse.json({ error: "Could not add item" }, { status: 500 });
  }
}

// ── Edit an existing item ──
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });

    const b = await req.json();
    if (!b?.id) return NextResponse.json({ error: "Item id is needed" }, { status: 400 });

    // Make sure the item belongs to this shop
    const existing = await prisma.product.findFirst({ where: { id: b.id, userId } });
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const demand = b.demand != null ? Math.max(0, Math.round(Number(b.demand))) : existing.demand;
    const leadTime = b.leadTime != null ? Math.max(1, Math.round(Number(b.leadTime))) : existing.leadTime;
    const product = await prisma.product.update({
      where: { id: b.id },
      data: {
        name: b.name?.trim() || existing.name,
        category: b.category?.trim() || existing.category,
        price: b.price != null ? Math.max(0, Number(b.price)) : existing.price,
        inventory: b.inventory != null ? Math.max(0, Math.round(Number(b.inventory))) : existing.inventory,
        demand,
        leadTime,
        reorderPoint: Math.round((demand / 30) * leadTime * 1.5),
        supplierId: b.supplierId !== undefined ? (b.supplierId || null) : existing.supplierId,
      },
    });
    return NextResponse.json({ success: true, data: product });
  } catch (e) {
    console.error("Update product error:", e);
    return NextResponse.json({ error: "Could not update item" }, { status: 500 });
  }
}

// ── Delete an item ──
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Please log in" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Item id is needed" }, { status: 400 });

    const result = await prisma.product.deleteMany({ where: { id, userId } });
    if (result.count === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete product error:", e);
    return NextResponse.json({ error: "Could not delete item" }, { status: 500 });
  }
}
