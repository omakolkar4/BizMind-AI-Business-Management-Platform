import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot access private financial records." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    // Verify company ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "INCOME" or "EXPENSE"

    const where: any = { businessId };
    if (type) {
      where.type = type.toUpperCase();
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot record financial transactions." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { type, category, amount, description, date } = body;

    if (!type || !category || !amount || !description) {
      return NextResponse.json(
        { error: "Type, category, amount, and description are required" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        businessId,
        type: type.toUpperCase(),
        category,
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
