import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { context: user.role !== "EMPLOYEE" },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json({
        business: {
          id: business.id,
          name: business.name,
          type: business.type,
          location: business.location,
          stage: business.stage,
        },
      });
    }

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
    const {
      name,
      idea,
      type,
      location,
      budget,
      stage,
      goals,
      resources,
      targetCustomer,
      constraints,
      targetTimeline,
      productsServices,
    } = body;

    const businessName = typeof name === "string" ? name.trim() : "";

    if (!idea || !idea.trim()) {
      return NextResponse.json({ error: "Business idea is required" }, { status: 400 });
    }

    // Check if the user already has a business to avoid duplicates or overwriting established businesses
    let existingBusiness = null;
    if (body.businessId) {
      existingBusiness = await prisma.business.findFirst({
        where: { id: body.businessId, userId: user.id },
      });
    }

    if (!existingBusiness) {
      // Find all existing businesses for this user
      const userBusinesses = await prisma.business.findMany({
        where: { userId: user.id },
        include: {
          _count: {
            select: {
              employees: true,
              transactions: true,
              tasks: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Find an unfinalized draft business (not approved, not demo, no employees, no transactions)
      // to safely reuse rather than creating duplicate draft profiles during onboarding.
      // An established business (planApproved === true, or has transactions/employees, or isDemo)
      // must NEVER be overwritten.
      const draftBusiness = userBusinesses.find(
        (b) => !b.planApproved && !b.isDemo && b._count.employees === 0 && b._count.transactions === 0
      );

      if (draftBusiness) {
        existingBusiness = draftBusiness;
      }
    }

    let business;
    if (existingBusiness) {
      business = await prisma.business.update({
        where: { id: existingBusiness.id },
        data: {
          name: businessName,
          idea: idea.trim(),
          type: type || existingBusiness.type || "Other",
          location: location || existingBusiness.location || "Global",
          budget: budget !== undefined && budget !== "" ? parseFloat(budget) : existingBusiness.budget,
          stage: stage || existingBusiness.stage || "Idea",
          goals: typeof goals === "string" ? goals : JSON.stringify(goals || []),
          resources: resources !== undefined ? resources : existingBusiness.resources,
          targetCustomer: targetCustomer || existingBusiness.targetCustomer || null,
          constraints: constraints !== undefined ? constraints : existingBusiness.constraints,
          targetTimeline: targetTimeline !== undefined ? targetTimeline : existingBusiness.targetTimeline,
          productsServices: productsServices !== undefined ? productsServices : existingBusiness.productsServices,
        },
      });

      // Update or create context
      await prisma.businessContext.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          targetCustomer: targetCustomer || `Target demographic in ${location || "local market"}`,
        },
        update: {
          targetCustomer: targetCustomer || `Target demographic in ${location || "local market"}`,
        },
      });
    } else {
      business = await prisma.business.create({
        data: {
          userId: user.id,
          name: businessName,
          idea: idea.trim(),
          type: type || "Other",
          location: location || "Global",
          budget: budget !== undefined && budget !== "" ? parseFloat(budget) : 0,
          stage: stage || "Idea",
          goals: typeof goals === "string" ? goals : JSON.stringify(goals || []),
          resources: resources || "",
          targetCustomer: targetCustomer || null,
          constraints: constraints || null,
          targetTimeline: targetTimeline || null,
          productsServices: productsServices || null,
        },
      });

      // Create default context
      await prisma.businessContext.create({
        data: {
          businessId: business.id,
          targetCustomer: targetCustomer || `Target demographic in ${location || "local market"}`,
        },
      });
    }

    // Link Idea Assessment if provided from onboarding AI planner
    if (body.assessmentRecordId) {
      await prisma.ideaAssessment.update({
        where: { id: body.assessmentRecordId },
        data: {
          businessId: business.id,
          status: "APPLIED",
          appliedAt: new Date(),
        },
      }).catch(() => null);
    } else if (body.assessment) {
      // Create applied IdeaAssessment record
      await prisma.ideaAssessment.create({
        data: {
          businessId: business.id,
          rawIdea: idea.trim(),
          businessCategory: body.assessment.businessCategory || type || "General Small Enterprise",
          operatingModel: body.operatingModel || null,
          targetLocation: location || null,
          staffingPlan: body.staffingPlan || null,
          statedBudget: budget ? parseFloat(String(budget)) : null,
          isBudgetUnknown: Boolean(body.isBudgetUnknown),
          existingResources: resources || null,
          assessmentJson: JSON.stringify(body.assessment),
          status: "APPLIED",
          appliedAt: new Date(),
        },
      }).catch(() => null);
    }

    // If assessment findings were provided from onboarding AI planner, initialize Feasibility
    if (body.assessment && body.assessment.financialEstimates) {
      const a = body.assessment;
      const fin = a.financialEstimates;
      const verdict = a.budgetComparison?.feasibilityVerdict || "NEEDS_VALIDATION";

      await prisma.feasibilityAssessment.upsert({
        where: { businessId: business.id },
        create: {
          businessId: business.id,
          overallStatus: verdict === "FEASIBLE" ? "VIABLE" : verdict === "CAPITAL_CONSTRAINED" ? "CAPITAL_CONSTRAINED" : "MODERATE_RISK",
          summary: a.summary || "Preliminary venture feasibility derived from BizMind AI Onboarding Planner.",
          customerDemandAnalysis: a.targetCustomer?.problemSolved || "Demand driven by targeted customer convenience.",
          targetCustomerFit: a.targetCustomer?.group || "Target consumer segment in designated market.",
          marketAndCompetition: `Operating in ${location || "designated market"} within ${type || "industry"}.`,
          capitalViability: a.budgetComparison?.explanation || "Capital viability assessed against initial operational requirements.",
          minStartupCost: fin.oneTimeStartupRange?.low || 150000,
          maxStartupCost: fin.oneTimeStartupRange?.high || 650000,
          expectedMonthlyOpex: fin.recurringMonthlyOpexRange?.typical || 75000,
          breakEvenMonths: 6,
          operationalComplexity: "Moderate",
          founderReadiness: "Equipped with preliminary operational checklist from AI Onboarding Planner.",
          legalRegulatoryRisks: (a.risksAndUncertainties?.regulatoryHurdles || []).join(", ") || "Standard municipal compliance",
          strengths: JSON.stringify(a.proposedBusinessModel?.monetizationTypes || []),
          weaknesses: JSON.stringify(a.financialEstimates?.keyBudgetDrivers || []),
          criticalRisks: JSON.stringify(a.risksAndUncertainties?.criticalRisks || []),
          majorAssumptions: JSON.stringify(a.revenueAndAssumptions?.keyUnitAssumptions || []),
          unansweredQuestions: JSON.stringify(a.unansweredQuestions || []),
          validationExperiments: JSON.stringify([
            {
              title: a.leanAlternative?.title || "Customer Pre-order Test",
              objective: a.leanAlternative?.validationMilestoneBeforeFullSpend || "Validate 20 paying customers",
              budgetLimit: a.leanAlternative?.estimatedLeanStartupCost || 30000,
              metricsToTrack: "Paying customer pre-orders and feedback",
              reviewTimeline: "3 Weeks",
            },
          ]),
          nextStepRecommendation: JSON.stringify({
            title: "Validate Demand via Lean Option",
            description: a.leanAlternative?.description || "Run pilot before full capital deployment.",
            guidance: {
              what: a.leanAlternative?.title || "Pilot Experiment",
              why: "Validates willingness to pay before committing capital to long-term leases.",
              how: "Engage target customers directly via WhatsApp/Instagram pre-orders.",
              resourcesNeeded: ["Mobile device", "Sample prototypes", "Customer feedback form"],
              estimatedCost: a.leanAlternative?.estimatedLeanStartupCost || 25000,
              timeline: "21 Days",
              measurableResult: "20 confirmed transactions with positive feedback",
              risksAndMitigation: "Low engagement (Fix: offer free tasting/trial sessions)",
              nextStepAfter: "Formalize business plan and initiate roadmap execution",
            },
          }),
        },
        update: {
          overallStatus: verdict === "FEASIBLE" ? "VIABLE" : verdict === "CAPITAL_CONSTRAINED" ? "CAPITAL_CONSTRAINED" : "MODERATE_RISK",
          summary: a.summary || "Preliminary venture feasibility derived from BizMind AI Onboarding Planner.",
          customerDemandAnalysis: a.targetCustomer?.problemSolved || "Demand driven by targeted customer convenience.",
          targetCustomerFit: a.targetCustomer?.group || "Target consumer segment in designated market.",
          marketAndCompetition: `Operating in ${location || "designated market"} within ${type || "industry"}.`,
          capitalViability: a.budgetComparison?.explanation || "Capital viability assessed against initial operational requirements.",
          minStartupCost: fin.oneTimeStartupRange?.low || 150000,
          maxStartupCost: fin.oneTimeStartupRange?.high || 650000,
          expectedMonthlyOpex: fin.recurringMonthlyOpexRange?.typical || 75000,
        },
      }).catch(() => null);
    }

    // Refresh session cookie with businessId
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      businessId: business.id,
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");
    const cookieStore = await cookies();
    cookieStore.set("bizmind_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    console.error("POST /api/business error:", error);
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
        { error: "Forbidden: Employees cannot alter business settings." },
        { status: 403 }
      );
    }

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
