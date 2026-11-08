import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Only authorized business owners can update venture profiles." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      assessmentRecordId,
      businessName,
      businessIdea,
      businessCategory,
      location,
      budget,
      stage,
      targetCustomer,
      pricingModel,
      uniqueAdvantage,
      resources,
      assessment,
    } = body;

    // 1. Update the Business profile with confirmed inputs
    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: businessName ? businessName.trim() : undefined,
        idea: businessIdea ? businessIdea.trim() : undefined,
        type: businessCategory ? businessCategory.trim() : undefined,
        location: location ? location.trim() : undefined,
        budget: budget ? parseFloat(String(budget)) : undefined,
        stage: stage || "Validation",
        targetCustomer: targetCustomer || undefined,
        resources: resources || undefined,
      },
    });

    // 2. Update or Upsert BusinessContext
    await prisma.businessContext.upsert({
      where: { businessId },
      create: {
        businessId,
        targetCustomer: targetCustomer || "Discerning consumers and commercial clients",
        pricingModel: pricingModel || "Direct unit sales and recurring subscriptions",
        uniqueAdvantage: uniqueAdvantage || "High reliability, verified quality standards, and transparent pricing",
      },
      update: {
        targetCustomer: targetCustomer || undefined,
        pricingModel: pricingModel || undefined,
        uniqueAdvantage: uniqueAdvantage || undefined,
      },
    });

    // 3. Update or Upsert Feasibility Assessment with calculated numbers from analyzer
    if (assessment && assessment.financialEstimates) {
      const fin = assessment.financialEstimates;
      const verdict = assessment.budgetComparison?.feasibilityVerdict || "NEEDS_VALIDATION";

      await prisma.feasibilityAssessment.upsert({
        where: { businessId },
        create: {
          businessId,
          overallStatus: verdict === "FEASIBLE" ? "VIABLE" : verdict === "CAPITAL_CONSTRAINED" ? "CAPITAL_CONSTRAINED" : "MODERATE_RISK",
          summary: assessment.summary || "Preliminary venture feasibility derived from AI Idea & Budget Analyzer.",
          customerDemandAnalysis: assessment.targetCustomer?.problemSolved || "Demand driven by convenience and quality gaps.",
          targetCustomerFit: assessment.targetCustomer?.group || "Urban consumers and commercial clients.",
          marketAndCompetition: `Operating in ${updatedBusiness.location} within ${updatedBusiness.type}. Moderate competitive density with open space for reliable service.`,
          capitalViability: assessment.budgetComparison?.explanation || "Capital viability evaluated against estimated startup benchmarks.",
          minStartupCost: fin.oneTimeStartupRange?.low || 150000,
          maxStartupCost: fin.oneTimeStartupRange?.high || 650000,
          expectedMonthlyOpex: fin.recurringMonthlyOpexRange?.typical || 75000,
          breakEvenMonths: 6,
          operationalComplexity: "Moderate",
          founderReadiness: "Equipped with preliminary operational checklist and initial resource plan.",
          legalRegulatoryRisks: (assessment.risksAndUncertainties?.regulatoryHurdles || []).join(", ") || "Standard municipal compliance",
          strengths: JSON.stringify(assessment.proposedBusinessModel?.monetizationTypes || []),
          weaknesses: JSON.stringify(assessment.financialEstimates?.keyBudgetDrivers || []),
          criticalRisks: JSON.stringify(assessment.risksAndUncertainties?.criticalRisks || []),
          majorAssumptions: JSON.stringify(assessment.revenueAndAssumptions?.keyUnitAssumptions || []),
          unansweredQuestions: JSON.stringify(assessment.unansweredQuestions || []),
          validationExperiments: JSON.stringify([
            {
              title: assessment.leanAlternative?.title || "Customer Pre-order Test",
              objective: assessment.leanAlternative?.validationMilestoneBeforeFullSpend || "Validate 20 paying customers",
              budgetLimit: assessment.leanAlternative?.estimatedLeanStartupCost || 30000,
              metricsToTrack: "Paying customer pre-orders and feedback",
              reviewTimeline: "3 Weeks",
            },
          ]),
          nextStepRecommendation: JSON.stringify({
            title: "Validate Demand via Lean Option",
            description: assessment.leanAlternative?.description || "Run pilot before full capital deployment.",
            guidance: {
              what: assessment.leanAlternative?.title || "Pilot Experiment",
              why: "Validates willingness to pay before committing capital to long-term leases.",
              how: "Engage target customers directly via WhatsApp/Instagram pre-orders.",
              resourcesNeeded: ["Mobile device", "Sample prototypes", "Customer feedback form"],
              estimatedCost: assessment.leanAlternative?.estimatedLeanStartupCost || 25000,
              timeline: "21 Days",
              measurableResult: "20 confirmed transactions with positive feedback",
              risksAndMitigation: "Low engagement (Fix: offer free tasting/trial sessions)",
              nextStepAfter: "Formalize business plan and initiate roadmap execution",
            },
          }),
        },
        update: {
          overallStatus: verdict === "FEASIBLE" ? "VIABLE" : verdict === "CAPITAL_CONSTRAINED" ? "CAPITAL_CONSTRAINED" : "MODERATE_RISK",
          summary: assessment.summary || undefined,
          capitalViability: assessment.budgetComparison?.explanation || undefined,
          minStartupCost: fin.oneTimeStartupRange?.low || undefined,
          maxStartupCost: fin.oneTimeStartupRange?.high || undefined,
          expectedMonthlyOpex: fin.recurringMonthlyOpexRange?.typical || undefined,
        },
      });
    }

    // 4. Update IdeaAssessment record status if provided
    if (assessmentRecordId) {
      await prisma.ideaAssessment.update({
        where: { id: assessmentRecordId },
        data: {
          status: "APPLIED",
          appliedAt: new Date(),
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: "Confirmed analyzer findings have been applied to your venture profile, context, and feasibility models.",
    });
  } catch (error: any) {
    console.error("POST /api/analyzer/apply error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to apply analyzer results." },
      { status: 500 }
    );
  }
}
