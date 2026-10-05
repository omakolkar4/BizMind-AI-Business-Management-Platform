import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";
import { generateBusinessPlan } from "@/lib/ai/planGenerator";

export async function GET() {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const plan = await prisma.businessPlan.findUnique({
      where: { businessId },
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true, type: true, location: true, budget: true, stage: true },
    });

    return NextResponse.json({ plan, business });
  } catch (error: any) {
    console.error("GET /api/business-plan error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { context: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    // If body contains plan fields, save them directly; otherwise generate with AI
    let planData = body.plan;
    if (!planData || body.regenerate) {
      planData = await generateBusinessPlan({
        businessName: business.name,
        idea: business.idea,
        businessType: business.type,
        location: business.location,
        budget: business.budget,
        stage: business.stage,
        goals: business.goals,
        resources: business.resources,
      });
    }

    const savedPlan = await prisma.businessPlan.upsert({
      where: { businessId },
      create: {
        businessId,
        ...planData,
      },
      update: {
        ...planData,
      },
    });

    return NextResponse.json({ success: true, plan: savedPlan });
  } catch (error: any) {
    console.error("POST /api/business-plan error:", error);
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

    const updated = await prisma.businessPlan.update({
      where: { businessId },
      data: body,
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error: any) {
    console.error("PATCH /api/business-plan error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
