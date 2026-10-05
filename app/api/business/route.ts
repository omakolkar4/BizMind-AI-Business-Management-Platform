import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { context: true },
    });

    return NextResponse.json({ business });
  } catch (error: any) {
    console.error("GET /api/business error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, idea, type, location, budget, stage, goals, resources } = body;

    if (!name || !idea) {
      return NextResponse.json({ error: "Business name and idea are required" }, { status: 400 });
    }

    const business = await prisma.business.create({
      data: {
        userId: user.id,
        name,
        idea,
        type: type || "Other",
        location: location || "Global",
        budget: budget ? parseFloat(budget) : 1000000,
        stage: stage || "Idea",
        goals: typeof goals === "string" ? goals : JSON.stringify(goals || []),
        resources: resources || "",
      },
    });

    // Create default context
    await prisma.businessContext.create({
      data: {
        businessId: business.id,
        targetCustomer: "Target urban and digital-first demographic",
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error("POST /api/business error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.idea && { idea: body.idea }),
        ...(body.type && { type: body.type }),
        ...(body.location && { location: body.location }),
        ...(body.budget !== undefined && { budget: parseFloat(body.budget) }),
        ...(body.stage && { stage: body.stage }),
        ...(body.goals && { goals: typeof body.goals === "string" ? body.goals : JSON.stringify(body.goals) }),
        ...(body.resources !== undefined && { resources: body.resources }),
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error("PATCH /api/business error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
