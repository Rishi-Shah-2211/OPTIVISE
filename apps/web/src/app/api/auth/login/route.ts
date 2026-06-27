import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, createSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are needed." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
      return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, shopName: user.shopName });
  } catch (e) {
    console.error("[login]", e);
    return NextResponse.json({ error: "Could not log in. Try again." }, { status: 500 });
  }
}
