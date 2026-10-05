import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const investments = await prisma.investment.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ investments });
  } catch (error: any) {
    console.error("GET /api/investments error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();
    const { investor, amount, date, equityPercentage, type, notes } = body;

    if (!investor || !amount) {
      return NextResponse.json(
        { error: "Investor and amount are required" },
        { status: 400 }
      );
    }

    const investment = await prisma.investment.create({
      data: {
        businessId,
        investor,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        equityPercentage: equityPercentage ? parseFloat(equityPercentage) : 0,
        type: type || "Angel",
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, investment });
  } catch (error: any) {
    console.error("POST /api/investments error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
