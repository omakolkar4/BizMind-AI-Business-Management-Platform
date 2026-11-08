import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { generateBusinessPlan } from "@/lib/ai/planGenerator";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot view confidential business plans." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const plan = await prisma.businessPlan.findUnique({
      where: { businessId },
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        type: true,
        location: true,
        budget: true,
        stage: true,
        idea: true,
        planApproved: true,
        planStatus: true,
      },
    });

    const feasibility = await prisma.feasibilityAssessment.findUnique({
      where: { businessId },
      select: {
        overallStatus: true,
        summary: true,
        minStartupCost: true,
        maxStartupCost: true,
        expectedMonthlyOpex: true,
        breakEvenMonths: true,
        capitalViability: true,
      },
    });

    const roadmapPhasesCount = await prisma.roadmapPhase.count({
      where: { businessId },
    });

    return NextResponse.json({
      plan,
      business,
      feasibility,
      roadmapPhasesCount,
      userRole: user.role,
      userName: user.name || user.email,
    });
  } catch (error: any) {
    console.error("GET /api/business-plan error:", error);
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
        { error: "Forbidden: Employees cannot generate or modify business plans." },
        { status: 403 }
      );
    }

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

    // If existing plan was already accepted, take a snapshot before regeneration
    const existingPlan = await prisma.businessPlan.findUnique({ where: { businessId } });
    if (existingPlan && existingPlan.status === "ACCEPTED") {
      await prisma.businessPlanVersion.create({
        data: {
          planId: existingPlan.id,
          businessId,
          version: existingPlan.version,
          status: "SNAPSHOT",
          decision: existingPlan.decision,
          decisionTimestamp: existingPlan.decisionTimestamp || new Date(),
          acceptedBy: existingPlan.acceptedBy,
          revisionNotes: "Archived prior to plan regeneration.",
          executiveSummary: existingPlan.executiveSummary,
          businessOverview: existingPlan.businessOverview,
          problem: existingPlan.problem,
          solution: existingPlan.solution,
          targetMarket: existingPlan.targetMarket,
          customerPersona: existingPlan.customerPersona,
          marketAnalysis: existingPlan.marketAnalysis,
          competitorAnalysis: existingPlan.competitorAnalysis,
          valueProposition: existingPlan.valueProposition,
          businessModel: existingPlan.businessModel,
          marketingStrategy: existingPlan.marketingStrategy,
          operationsStrategy: existingPlan.operationsStrategy,
          technologyStrategy: existingPlan.technologyStrategy,
          financialOverview: existingPlan.financialOverview,
          riskAnalysis: existingPlan.riskAnalysis,
          growthStrategy: existingPlan.growthStrategy,
          implementationRoadmap: existingPlan.implementationRoadmap,
        },
      }).catch(() => null);
    }

    // Determine version number
    const newVersion = existingPlan ? existingPlan.version + 1 : 1;

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
        status: "GENERATED",
        version: newVersion,
        isDraft: false,
        decision: null,
        decisionTimestamp: null,
        acceptedAt: null,
        acceptedBy: null,
        revisionNotes: null,
      },
      update: {
        ...planData,
        status: "GENERATED",
        version: newVersion,
        isDraft: false,
        decision: null,
        decisionTimestamp: null,
        acceptedAt: null,
        acceptedBy: null,
        revisionNotes: null,
      },
    });

    // Update business plan status
    await prisma.business.update({
      where: { id: businessId },
      data: {
        planApproved: false,
        planStatus: "GENERATED",
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot modify business plans." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const currentPlan = await prisma.businessPlan.findUnique({
      where: { businessId },
    });

    if (!currentPlan) {
      return NextResponse.json({ error: "Business plan not found" }, { status: 404 });
    }

    const body = await req.json();

    // If an accepted plan is edited materially, increment version and require review again
    const wasAccepted = currentPlan.status === "ACCEPTED";
    const nextStatus = wasAccepted ? "UNDER_REVIEW" : (body.status || currentPlan.status);
    const nextVersion = wasAccepted ? currentPlan.version + 1 : currentPlan.version;

    // Snapshot previously accepted version if modifying
    if (wasAccepted) {
      await prisma.businessPlanVersion.create({
        data: {
          planId: currentPlan.id,
          businessId,
          version: currentPlan.version,
          status: "ACCEPTED",
          decision: "ACCEPT",
          decisionTimestamp: currentPlan.decisionTimestamp || new Date(),
          acceptedBy: currentPlan.acceptedBy,
          revisionNotes: "Archived prior to manual owner edits.",
          executiveSummary: currentPlan.executiveSummary,
          businessOverview: currentPlan.businessOverview,
          problem: currentPlan.problem,
          solution: currentPlan.solution,
          targetMarket: currentPlan.targetMarket,
          customerPersona: currentPlan.customerPersona,
          marketAnalysis: currentPlan.marketAnalysis,
          competitorAnalysis: currentPlan.competitorAnalysis,
          valueProposition: currentPlan.valueProposition,
          businessModel: currentPlan.businessModel,
          marketingStrategy: currentPlan.marketingStrategy,
          operationsStrategy: currentPlan.operationsStrategy,
          technologyStrategy: currentPlan.technologyStrategy,
          financialOverview: currentPlan.financialOverview,
          riskAnalysis: currentPlan.riskAnalysis,
          growthStrategy: currentPlan.growthStrategy,
          implementationRoadmap: currentPlan.implementationRoadmap,
        },
      }).catch(() => null);
    }

    const updated = await prisma.businessPlan.update({
      where: { businessId },
      data: {
        ...body,
        status: nextStatus,
        version: nextVersion,
        decision: wasAccepted ? null : currentPlan.decision,
        decisionTimestamp: wasAccepted ? null : currentPlan.decisionTimestamp,
      },
    });

    if (wasAccepted) {
      await prisma.business.update({
        where: { id: businessId },
        data: {
          planApproved: false,
          planStatus: "UNDER_REVIEW",
        },
      });
    }

    return NextResponse.json({
      success: true,
      plan: updated,
      requiresReviewAgain: wasAccepted,
      message: wasAccepted
        ? `Manual edits applied. Plan v${nextVersion} is now Under Review for acceptance.`
        : "Plan changes saved successfully.",
    });
  } catch (error: any) {
    console.error("PATCH /api/business-plan error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
