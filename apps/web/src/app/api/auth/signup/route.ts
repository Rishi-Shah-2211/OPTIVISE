import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashPassword, createSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, shopName, ownerName } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are needed." }, { status: 400 });
    }
    if (String(password).length < 4) {
      return NextResponse.json({ error: "Password should be at least 4 letters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "This email already has an account. Please log in." }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        email: String(email).toLowerCase(),
        passwordHash: await hashPassword(String(password)),
        shopName: shopName?.trim() || "My Shop",
        ownerName: ownerName?.trim() || "Shop Owner",
      },
    });

    await createSession(user.id);
    return NextResponse.json({ ok: true, shopName: user.shopName });
  } catch (e) {
    console.error("[signup]", e);
    return NextResponse.json({ error: "Could not create the account. Try again." }, { status: 500 });
  }
}
