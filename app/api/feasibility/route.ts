import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { evaluateBusinessFeasibility } from "@/lib/ai/feasibilityEngine";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot access business feasibility analysis." },
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
        feasibility: true,
        context: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // If no feasibility record exists yet, generate it automatically
    if (!business.feasibility) {
      const evaluation = await evaluateBusinessFeasibility({
        businessName: business.name,
        idea: business.idea,
        businessType: business.type,
        location: business.location,
        budget: business.budget,
        stage: business.stage,
        goals: business.goals,
        resources: business.resources,
        targetCustomer: business.context?.targetCustomer || undefined,
      });

      const saved = await prisma.feasibilityAssessment.create({
        data: {
          businessId,
          overallStatus: evaluation.overallStatus,
          summary: evaluation.summary,
          customerDemandAnalysis: evaluation.customerDemandAnalysis,
          targetCustomerFit: evaluation.targetCustomerFit,
          marketAndCompetition: evaluation.marketAndCompetition,
          capitalViability: evaluation.capitalViability,
          minStartupCost: evaluation.minStartupCost,
          maxStartupCost: evaluation.maxStartupCost,
          expectedMonthlyOpex: evaluation.expectedMonthlyOpex,
          breakEvenMonths: evaluation.breakEvenMonths,
          operationalComplexity: evaluation.operationalComplexity,
          founderReadiness: evaluation.founderReadiness,
          legalRegulatoryRisks: evaluation.legalRegulatoryRisks,
          strengths: JSON.stringify(evaluation.strengths),
          weaknesses: JSON.stringify(evaluation.weaknesses),
          criticalRisks: JSON.stringify(evaluation.criticalRisks),
          majorAssumptions: JSON.stringify(evaluation.majorAssumptions),
          unansweredQuestions: JSON.stringify(evaluation.unansweredQuestions),
          validationExperiments: JSON.stringify(evaluation.validationExperiments),
          nextStepRecommendation: JSON.stringify(evaluation.nextStepRecommendation),
        },
      });

      return NextResponse.json({
        feasibility: {
          ...saved,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          criticalRisks: evaluation.criticalRisks,
          majorAssumptions: evaluation.majorAssumptions,
          unansweredQuestions: evaluation.unansweredQuestions,
          validationExperiments: evaluation.validationExperiments,
          nextStepRecommendation: evaluation.nextStepRecommendation,
        },
        business,
      });
    }

    const f = business.feasibility;
    return NextResponse.json({
      feasibility: {
        ...f,
        strengths: JSON.parse(f.strengths || "[]"),
        weaknesses: JSON.parse(f.weaknesses || "[]"),
        criticalRisks: JSON.parse(f.criticalRisks || "[]"),
        majorAssumptions: JSON.parse(f.majorAssumptions || "[]"),
        unansweredQuestions: JSON.parse(f.unansweredQuestions || "[]"),
        validationExperiments: JSON.parse(f.validationExperiments || "[]"),
        nextStepRecommendation: JSON.parse(f.nextStepRecommendation || "{}"),
      },
      business,
    });
  } catch (error: any) {
    console.error("GET /api/feasibility error:", error);
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
        { error: "Forbidden: Employees cannot evaluate business feasibility." },
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

    const evaluation = await evaluateBusinessFeasibility({
      businessName: body.name || business.name,
      idea: body.idea || business.idea,
      businessType: body.type || business.type,
      location: body.location || business.location,
      budget: body.budget ? parseFloat(body.budget) : business.budget,
      stage: body.stage || business.stage,
      goals: body.goals || business.goals,
      resources: body.resources || business.resources,
      targetCustomer: body.targetCustomer || business.context?.targetCustomer || undefined,
    });

    const saved = await prisma.feasibilityAssessment.upsert({
      where: { businessId },
      create: {
        businessId,
        overallStatus: evaluation.overallStatus,
        summary: evaluation.summary,
        customerDemandAnalysis: evaluation.customerDemandAnalysis,
        targetCustomerFit: evaluation.targetCustomerFit,
        marketAndCompetition: evaluation.marketAndCompetition,
        capitalViability: evaluation.capitalViability,
        minStartupCost: evaluation.minStartupCost,
        maxStartupCost: evaluation.maxStartupCost,
        expectedMonthlyOpex: evaluation.expectedMonthlyOpex,
        breakEvenMonths: evaluation.breakEvenMonths,
        operationalComplexity: evaluation.operationalComplexity,
        founderReadiness: evaluation.founderReadiness,
        legalRegulatoryRisks: evaluation.legalRegulatoryRisks,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        criticalRisks: JSON.stringify(evaluation.criticalRisks),
        majorAssumptions: JSON.stringify(evaluation.majorAssumptions),
        unansweredQuestions: JSON.stringify(evaluation.unansweredQuestions),
        validationExperiments: JSON.stringify(evaluation.validationExperiments),
        nextStepRecommendation: JSON.stringify(evaluation.nextStepRecommendation),
      },
      update: {
        overallStatus: evaluation.overallStatus,
        summary: evaluation.summary,
        customerDemandAnalysis: evaluation.customerDemandAnalysis,
        targetCustomerFit: evaluation.targetCustomerFit,
        marketAndCompetition: evaluation.marketAndCompetition,
        capitalViability: evaluation.capitalViability,
        minStartupCost: evaluation.minStartupCost,
        maxStartupCost: evaluation.maxStartupCost,
        expectedMonthlyOpex: evaluation.expectedMonthlyOpex,
        breakEvenMonths: evaluation.breakEvenMonths,
        operationalComplexity: evaluation.operationalComplexity,
        founderReadiness: evaluation.founderReadiness,
        legalRegulatoryRisks: evaluation.legalRegulatoryRisks,
        strengths: JSON.stringify(evaluation.strengths),
        weaknesses: JSON.stringify(evaluation.weaknesses),
        criticalRisks: JSON.stringify(evaluation.criticalRisks),
        majorAssumptions: JSON.stringify(evaluation.majorAssumptions),
        unansweredQuestions: JSON.stringify(evaluation.unansweredQuestions),
        validationExperiments: JSON.stringify(evaluation.validationExperiments),
        nextStepRecommendation: JSON.stringify(evaluation.nextStepRecommendation),
      },
    });

    return NextResponse.json({
      success: true,
      feasibility: {
        ...saved,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        criticalRisks: evaluation.criticalRisks,
        majorAssumptions: evaluation.majorAssumptions,
        unansweredQuestions: evaluation.unansweredQuestions,
        validationExperiments: evaluation.validationExperiments,
        nextStepRecommendation: evaluation.nextStepRecommendation,
      },
    });
  } catch (error: any) {
    console.error("POST /api/feasibility error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
