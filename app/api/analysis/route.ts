import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { runAIOrchestrator } from "@/lib/ai/orchestrator";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot access strategic business analysis." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        analysis: true,
        context: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      business,
      analysis: business.analysis,
      context: business.context,
    });
  } catch (error: any) {
    console.error("GET /api/analysis error:", error);
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
        { error: "Forbidden: Employees cannot run AI feasibility analysis." },
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

    const businessContext = {
      businessName: body.name || business.name,
      idea: body.idea || business.idea,
      businessType: body.type || business.type,
      location: body.location || business.location,
      budget: body.budget ? parseFloat(body.budget) : business.budget,
      stage: body.stage || business.stage,
      goals: body.goals || business.goals,
      resources: body.resources || business.resources,
      targetCustomer: body.targetCustomer || business.context?.targetCustomer || undefined,
    };

    // Run Multi-Agent Orchestrator
    const result = await runAIOrchestrator(businessContext);

    // Save or update analysis in DB
    const saved = await prisma.businessAnalysis.upsert({
      where: { businessId },
      create: {
        businessId,
        overallScore: result.overallScore,
        summary: result.summary,
        marketOpportunity: result.marketOpportunity,
        feasibility: result.feasibility,
        targetAudience: result.targetAudience,
        marketTrends: result.marketTrends,
        competitorNotes: result.competitorNotes,
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        opportunities: JSON.stringify(result.opportunities),
        threats: JSON.stringify(result.threats),
        riskAssessment: result.riskAssessment,
        revenueOpportunities: result.revenueOpportunities,
        costConsiderations: result.costConsiderations,
        recommendedActions: JSON.stringify(result.recommendedActions),
        agentLogs: JSON.stringify(result.agentLogs),
      },
      update: {
        overallScore: result.overallScore,
        summary: result.summary,
        marketOpportunity: result.marketOpportunity,
        feasibility: result.feasibility,
        targetAudience: result.targetAudience,
        marketTrends: result.marketTrends,
        competitorNotes: result.competitorNotes,
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        opportunities: JSON.stringify(result.opportunities),
        threats: JSON.stringify(result.threats),
        riskAssessment: result.riskAssessment,
        revenueOpportunities: result.revenueOpportunities,
        costConsiderations: result.costConsiderations,
        recommendedActions: JSON.stringify(result.recommendedActions),
        agentLogs: JSON.stringify(result.agentLogs),
      },
    });

    return NextResponse.json({
      success: true,
      analysis: saved,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/analysis error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
