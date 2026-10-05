import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const phases = await prisma.roadmapPhase.findMany({
      where: { businessId },
      orderBy: { phaseNumber: "asc" },
    });

    return NextResponse.json({ phases });
  } catch (error: any) {
    console.error("GET /api/roadmap error:", error);
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
    const { title, description, phaseNumber, estimatedCost, startDate, dueDate, status, tasks } = body;

    const count = await prisma.roadmapPhase.count({ where: { businessId } });

    const phase = await prisma.roadmapPhase.create({
      data: {
        businessId,
        title: title || `Phase ${count + 1}`,
        description: description || "Strategic development milestone",
        phaseNumber: phaseNumber || count + 1,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
        startDate: startDate || null,
        dueDate: dueDate || null,
        status: status || "Not Started",
        tasks: typeof tasks === "string" ? tasks : JSON.stringify(tasks || []),
        order: count + 1,
      },
    });

    return NextResponse.json({ success: true, phase });
  } catch (error: any) {
    console.error("POST /api/roadmap error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
