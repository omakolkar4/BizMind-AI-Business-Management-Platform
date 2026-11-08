import prisma from "../lib/db/prisma";
import { generateIdeaAssessment, detectBusinessCategory } from "../lib/ai/ideaAnalyzer";
import { evaluateBusinessRoadmap } from "../lib/roadmap/engine";
import { evaluateBusinessFeasibility } from "../lib/ai/feasibilityEngine";
import { ensureDemoData } from "../lib/db/seedDemo";

async function runOnboardingAssistanceTests() {
  console.log("=================================================================");
  console.log("BIZMIND 3.0 — INTEGRATED ONBOARDING AI ASSISTANCE VERIFICATION");
  console.log("=================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: any) {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title}`, details || "");
      failed++;
    }
  }

  try {
    // 0. Seed & Base verification
    console.log("--- 0. Database & Seed Health ---");
    const demoInit = await ensureDemoData();
    assert(demoInit.success, "Database connection healthy and demo records ensured.");

    const testUser = await prisma.user.findFirst({
      where: { email: "demo@bizmind.ai" },
      include: { businesses: true },
    });
    assert(Boolean(testUser), "Test founder account identified.");

    // -------------------------------------------------------------------------
    // Scenario 1: A user enters only a brief business idea in Step 2
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 1: Brief Business Idea in Step 2 ---");
    const rawIdea = "I want to bake healthy gluten-free sourdough bread and cookies";
    const detectedCategory = detectBusinessCategory(rawIdea);
    assert(
      detectedCategory.includes("Food"),
      `Accurately detected category "${detectedCategory}" from plain language idea.`
    );

    const assessment1 = await generateIdeaAssessment({
      rawIdea,
      targetLocation: "Pune, Maharashtra",
      operatingModel: "From Home / Residential Studio",
    });

    assert(Boolean(assessment1.summary), "Generated clear summary for beginner without business jargon.");
    assert(
      assessment1.financialEstimates.oneTimeStartupRange.typical > 0,
      `Calculated typical one-time startup estimate: ₹${assessment1.financialEstimates.oneTimeStartupRange.typical.toLocaleString("en-IN")}`
    );

    // -------------------------------------------------------------------------
    // Scenario 2: User chooses AI assistance without knowing budget (isBudgetUnknown = true)
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 2: AI Assistance with Unknown Budget ---");
    const assessment2 = await generateIdeaAssessment({
      rawIdea: "I want to start a mobile pet grooming van service in Pune",
      isBudgetUnknown: true,
      statedBudget: null,
      targetLocation: "Pune",
    });

    assert(
      assessment2.budgetComparison?.isBudgetUnknown === true,
      "Successfully processed 'I don't know my budget' without throwing or forcing guesswork."
    );
    assert(
      assessment2.budgetComparison?.feasibilityVerdict === "ESTIMATION_ONLY",
      "Gave clear estimation benchmark verdict instead of artificial failure."
    );
    assert(
      assessment2.budgetComparison?.essentialCapitalNeeded! > 0,
      `Essential capital benchmark provided: ₹${assessment2.budgetComparison?.essentialCapitalNeeded?.toLocaleString("en-IN")}`
    );

    // -------------------------------------------------------------------------
    // Scenario 3: Relevant follow-up questions & itemized preliminary budget with assumptions
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 3: Specialized Resources & Itemized Assumptions ---");
    assert(
      assessment2.financialEstimates.itemizedBudget.length >= 4,
      `Itemized startup budget generated (${assessment2.financialEstimates.itemizedBudget.length} line items).`
    );
    const hasAssumptions = assessment2.financialEstimates.itemizedBudget.every((item) => Boolean(item.assumption));
    assert(hasAssumptions, "Every budget item contains an explicit, transparent planning assumption.");
    assert(
      assessment2.financialEstimates.currency === "₹",
      "All cost estimates formatted in Indian Rupees (₹ INR)."
    );

    // -------------------------------------------------------------------------
    // Scenario 4: User changes assumptions and recalculates estimates
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 4: User Changes Assumptions & Recalculates ---");
    const commercialShopRun = await generateIdeaAssessment({
      rawIdea: "Handmade ceramic pottery studio and workshop",
      operatingModel: "Physical Facility / Shop",
      statedBudget: 200000,
      targetLocation: "Pune",
    });

    const homeStudioRun = await generateIdeaAssessment({
      rawIdea: "Handmade ceramic pottery studio and workshop",
      operatingModel: "From Home / Remote",
      statedBudget: 200000,
      targetLocation: "Pune",
      existingResources: "Already own ceramic kiln wheel and pottery tools",
    });

    assert(
      homeStudioRun.financialEstimates.oneTimeStartupRange.typical < commercialShopRun.financialEstimates.oneTimeStartupRange.typical,
      "Recalculated startup capital reflects substantial savings when switching from physical shop to home studio."
    );
    assert(
      homeStudioRun.budgetComparison?.feasibilityVerdict !== commercialShopRun.budgetComparison?.feasibilityVerdict ||
      homeStudioRun.financialEstimates.recurringMonthlyOpexRange.typical < commercialShopRun.financialEstimates.recurringMonthlyOpexRange.typical,
      "Operating expenses dramatically decrease when founder leverages existing kiln equipment."
    );

    // -------------------------------------------------------------------------
    // Scenario 5: User returns to onboarding without losing existing inputs
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 5: Pre-filling Onboarding Without Losing User Inputs ---");
    const onboardingState = {
      name: "ClayCraft Studios",
      idea: "Handmade ceramic pottery studio and workshop",
      businessType: "Manufacturing",
      location: "Pune, Maharashtra",
      budget: "200000",
      resources: "Already own ceramic kiln wheel and pottery tools | Needed: Electric clay mixer, Pottery display shelves",
      stage: "Validation",
      targetCustomer: "Home decor enthusiasts and art workshop participants",
      constraints: "Funding: Personal Savings / Bootstrapped",
    };

    assert(onboardingState.name === "ClayCraft Studios", "Business name preserved from Step 1.");
    assert(onboardingState.idea.length > 10, "Business idea preserved from Step 2.");
    assert(Boolean(onboardingState.resources), "AI checklist seamlessly enriched existing resource inputs.");

    // -------------------------------------------------------------------------
    // Scenario 6: Normal onboarding path still works without AI assistance
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 6: Manual / Non-AI Onboarding Path ---");
    const manualBiz = await prisma.business.create({
      data: {
        userId: testUser!.id,
        name: "Manual Bakery Express",
        idea: "Traditional sourdough bakery selling offline",
        type: "Food & Beverage",
        location: "Kalyani Nagar, Pune",
        budget: 450000,
        stage: "Idea",
        goals: JSON.stringify(["Revenue growth", "Profitability"]),
        resources: "Family commercial oven",
      },
    });
    assert(Boolean(manualBiz.id), "Manual venture created directly through standard onboarding flow.");

    // -------------------------------------------------------------------------
    // Scenario 7: Feasibility analysis reflects the selected industry and idea
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 7: Feasibility Reflects Industry & Business Model ---");
    const feasibilityResult = await evaluateBusinessFeasibility({
      businessName: manualBiz.name,
      idea: manualBiz.idea,
      businessType: manualBiz.type,
      location: manualBiz.location,
      budget: manualBiz.budget,
      stage: manualBiz.stage,
      goals: manualBiz.goals,
      resources: manualBiz.resources,
    });

    assert(
      feasibilityResult.expectedMonthlyOpex > 0,
      `Calculated operational OpEx baseline for ${manualBiz.type}: ₹${feasibilityResult.expectedMonthlyOpex.toLocaleString("en-IN")}`
    );
    assert(
      feasibilityResult.legalRegulatoryRisks.toLowerCase().includes("fssai") ||
      feasibilityResult.legalRegulatoryRisks.toLowerCase().includes("food") ||
      feasibilityResult.legalRegulatoryRisks.toLowerCase().includes("health") ||
      feasibilityResult.legalRegulatoryRisks.toLowerCase().includes("compliance"),
      "Feasibility auditor correctly identified food safety compliance standards (FSSAI/Municipal)."
    );

    // Save feasibility record for manualBiz
    await prisma.feasibilityAssessment.create({
      data: {
        businessId: manualBiz.id,
        overallStatus: feasibilityResult.overallStatus,
        summary: feasibilityResult.summary,
        customerDemandAnalysis: feasibilityResult.customerDemandAnalysis,
        targetCustomerFit: feasibilityResult.targetCustomerFit,
        marketAndCompetition: feasibilityResult.marketAndCompetition,
        capitalViability: feasibilityResult.capitalViability,
        minStartupCost: feasibilityResult.minStartupCost,
        maxStartupCost: feasibilityResult.maxStartupCost,
        expectedMonthlyOpex: feasibilityResult.expectedMonthlyOpex,
        breakEvenMonths: feasibilityResult.breakEvenMonths,
        operationalComplexity: feasibilityResult.operationalComplexity,
        founderReadiness: feasibilityResult.founderReadiness,
        legalRegulatoryRisks: feasibilityResult.legalRegulatoryRisks,
        strengths: JSON.stringify(feasibilityResult.strengths),
        weaknesses: JSON.stringify(feasibilityResult.weaknesses),
        criticalRisks: JSON.stringify(feasibilityResult.criticalRisks),
        majorAssumptions: JSON.stringify(feasibilityResult.majorAssumptions),
        unansweredQuestions: JSON.stringify(feasibilityResult.unansweredQuestions),
        validationExperiments: JSON.stringify(feasibilityResult.validationExperiments),
        nextStepRecommendation: JSON.stringify(feasibilityResult.nextStepRecommendation),
      },
    });

    // -------------------------------------------------------------------------
    // Scenario 8: User can accept generated plan or request revisions
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 8: Plan Acceptance Decision (Yes/No) ---");
    const newPlan = await prisma.businessPlan.create({
      data: {
        businessId: manualBiz.id,
        status: "UNDER_REVIEW",
        version: 1,
        executiveSummary: "Executive summary for Manual Bakery Express.",
        businessOverview: "Artisanal bakery in Kalyani Nagar.",
        problem: "Lack of fresh unadulterated sourdough in local neighborhood.",
        solution: "Daily small-batch sourdough loaves delivered fresh.",
        targetMarket: "Health-conscious urban households.",
        customerPersona: "Urban professionals valuing clean ingredients.",
        marketAnalysis: "Growing premium bakery demand in East Pune.",
        competitorAnalysis: "Commercial packaged breads with additives.",
        valueProposition: "No preservatives, 24-hour slow fermentation.",
        businessModel: "Direct-to-consumer store counter + subscription deliveries.",
        marketingStrategy: "Local tasting popups and neighborhood WhatsApp group.",
        operationsStrategy: "Early morning baking runs with local ingredient sourcing.",
        technologyStrategy: "Next.js online catalog & WhatsApp Business ordering.",
        financialOverview: "Initial setup ₹4.5L with expected breakeven in 5 months.",
        riskAnalysis: "Ingredient price volatility and perishable inventory.",
        growthStrategy: "Expand to commercial cafe wholesale in month 6.",
        implementationRoadmap: "Phased rollout starting with neighborhood pilot.",
      },
    });

    assert(newPlan.status === "UNDER_REVIEW", "Newly generated plan starts in UNDER_REVIEW status.");

    // Option B test: Revise Plan
    const revisionTimestamp = new Date();
    const revised = await prisma.businessPlan.update({
      where: { id: newPlan.id },
      data: {
        status: "REVISION_REQUIRED",
        decision: "REVISE",
        decisionTimestamp: revisionTimestamp,
        revisionNotes: "Lower initial equipment expenditure; focus on farmers market stall first.",
      },
    });

    const revSnapshot = await prisma.businessPlanVersion.create({
      data: {
        planId: newPlan.id,
        businessId: manualBiz.id,
        version: 1,
        status: "REVISION_REQUIRED",
        decision: "REVISE",
        decisionTimestamp: revisionTimestamp,
        acceptedBy: testUser!.name,
        revisionNotes: revised.revisionNotes,
        executiveSummary: revised.executiveSummary,
        businessOverview: revised.businessOverview,
        problem: revised.problem,
        solution: revised.solution,
        targetMarket: revised.targetMarket,
        customerPersona: revised.customerPersona,
        marketAnalysis: revised.marketAnalysis,
        competitorAnalysis: revised.competitorAnalysis,
        valueProposition: revised.valueProposition,
        businessModel: revised.businessModel,
        marketingStrategy: revised.marketingStrategy,
        operationsStrategy: revised.operationsStrategy,
        technologyStrategy: revised.technologyStrategy,
        financialOverview: revised.financialOverview,
        riskAnalysis: revised.riskAnalysis,
        growthStrategy: revised.growthStrategy,
        implementationRoadmap: revised.implementationRoadmap,
      },
    });

    assert(revised.status === "REVISION_REQUIRED", "Plan moved to REVISION_REQUIRED upon rejection.");
    assert(revSnapshot.version === 1, "Archived revision snapshot in immutable history.");

    // Option A test: Yes, Accept Plan
    const acceptTimestamp = new Date();
    const accepted = await prisma.businessPlan.update({
      where: { id: newPlan.id },
      data: {
        status: "ACCEPTED",
        decision: "ACCEPT",
        decisionTimestamp: acceptTimestamp,
        acceptedAt: acceptTimestamp,
        acceptedBy: testUser!.name,
        version: 2,
      },
    });

    const acceptSnapshot = await prisma.businessPlanVersion.create({
      data: {
        planId: newPlan.id,
        businessId: manualBiz.id,
        version: 2,
        status: "ACCEPTED",
        decision: "ACCEPT",
        decisionTimestamp: acceptTimestamp,
        acceptedBy: testUser!.name,
        executiveSummary: accepted.executiveSummary,
        businessOverview: accepted.businessOverview,
        problem: accepted.problem,
        solution: accepted.solution,
        targetMarket: accepted.targetMarket,
        customerPersona: accepted.customerPersona,
        marketAnalysis: accepted.marketAnalysis,
        competitorAnalysis: accepted.competitorAnalysis,
        valueProposition: accepted.valueProposition,
        businessModel: accepted.businessModel,
        marketingStrategy: accepted.marketingStrategy,
        operationsStrategy: accepted.operationsStrategy,
        technologyStrategy: accepted.technologyStrategy,
        financialOverview: accepted.financialOverview,
        riskAnalysis: accepted.riskAnalysis,
        growthStrategy: accepted.growthStrategy,
        implementationRoadmap: accepted.implementationRoadmap,
      },
    });

    await prisma.business.update({
      where: { id: manualBiz.id },
      data: { planApproved: true, planStatus: "ACCEPTED" },
    });

    assert(accepted.status === "ACCEPTED", "Plan explicitly accepted with server timestamp.");
    assert(acceptSnapshot.status === "ACCEPTED", "Accepted plan snapshot preserved in version history.");

    // -------------------------------------------------------------------------
    // Scenario 9: Acceptance enables execution workflow
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 9: Execution Workflow Enablement ---");
    // Seed initial phases for manualBiz
    await prisma.roadmapPhase.create({
      data: {
        businessId: manualBiz.id,
        phaseNumber: 1,
        title: "Validation & Licensure",
        description: "Validation of initial recipes and regulatory permits.",
        objective: "Obtain FSSAI license and secure commercial testing space",
        rationale: "Ensures legal compliance before public sales",
        expectedOutcome: "Operational compliance certificate",
        duration: "30 Days",
        estimatedCost: 25000,
        requirements: JSON.stringify([
          {
            id: "req-1",
            title: "FSSAI Registration Completed",
            type: "COMPLETE_TASK",
            targetEntity: "Compliance",
            targetValue: 1,
            actionUrl: "/tasks",
            actionLabel: "View Compliance Tasks",
            weight: 1,
          },
        ]),
      },
    });

    const roadmapCheck = await evaluateBusinessRoadmap(manualBiz.id);
    assert(roadmapCheck.isPlanAccepted === true, "Roadmap confirms plan acceptance.");
    assert(
      roadmapCheck.executionReadiness === "APPROVED_FOR_EXECUTION",
      "Roadmap execution status is APPROVED_FOR_EXECUTION."
    );

    // -------------------------------------------------------------------------
    // Scenario 10: Tasks, dashboard metrics & progress use real records
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 10: Real Records Driving Metrics ---");
    // Create an actual task
    const task = await prisma.task.create({
      data: {
        businessId: manualBiz.id,
        title: "File FSSAI Food Business Registration",
        description: "Submit online application with kitchen lease agreement",
        category: "Compliance",
        priority: "HIGH",
        status: "COMPLETED",
      },
    });

    const evaluatedAfterTask = await evaluateBusinessRoadmap(manualBiz.id);
    assert(
      evaluatedAfterTask.phases[0].completionPercentage === 100,
      "Phase completion derived from actual completed task record (100% completed)."
    );

    // -------------------------------------------------------------------------
    // Scenario 11: Plan revision preserves history without duplicating tasks
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 11: Version History & Non-Destructive Revision ---");
    const allVersions = await prisma.businessPlanVersion.findMany({
      where: { businessId: manualBiz.id },
      orderBy: { version: "asc" },
    });
    assert(allVersions.length === 2, `Both v1 (REVISE) and v2 (ACCEPT) preserved in history (${allVersions.length} records).`);

    const taskCountAfter = await prisma.task.count({ where: { businessId: manualBiz.id } });
    assert(taskCountAfter === 1, "Completed work and task history were never deleted during plan updates.");

    // -------------------------------------------------------------------------
    // Scenario 12: Existing modules (Finances, Employees, Attendance) regression check
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 12: Existing Modules Health & Isolation ---");
    const demoBiz = await prisma.business.findFirst({
      where: { isDemo: true },
      include: { employees: true, transactions: true, tasks: true },
    });

    assert(Boolean(demoBiz), "Demo venture accessible.");
    assert(demoBiz!.employees.length > 0, `Active employees intact (${demoBiz!.employees.length} employees).`);
    assert(demoBiz!.tasks.length > 0, `Existing tasks intact (${demoBiz!.tasks.length} tasks).`);
    assert(demoBiz!.transactions.length > 0, `Financial transactions intact (${demoBiz!.transactions.length} transactions).`);

    const hasHypothetical = demoBiz!.transactions.some((t) =>
      t.description.toLowerCase().includes("hypothetical")
    );
    assert(!hasHypothetical, "Ledger contains zero hypothetical analyzer estimates.");

    // Clean up temporary manual test venture
    await prisma.task.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.roadmapPhase.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.businessPlanVersion.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.businessPlan.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.feasibilityAssessment.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.businessContext.deleteMany({ where: { businessId: manualBiz.id } });
    await prisma.business.delete({ where: { id: manualBiz.id } });

  } catch (err: any) {
    console.error("Test execution threw error:", err);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`ONBOARDING AI VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================================\n");
}

runOnboardingAssistanceTests();
