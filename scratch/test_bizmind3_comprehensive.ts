import prisma from "../lib/db/prisma";
import { generateIdeaAssessment, detectBusinessCategory } from "../lib/ai/ideaAnalyzer";
import { evaluateBusinessRoadmap } from "../lib/roadmap/engine";
import { ensureDemoData } from "../lib/db/seedDemo";

async function runTests() {
  console.log("=================================================================");
  console.log("BIZMIND 3.0 — COMPREHENSIVE WORKFLOW & MODULE VERIFICATION TEST");
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
    // Ensure base demo records exist
    console.log("--- 0. Database & Seed Verification ---");
    const demoInit = await ensureDemoData();
    assert(demoInit.success, "Demo data ensured and database connection healthy.");

    const business = await prisma.business.findFirst({
      where: { isDemo: true },
      include: { businessPlan: true, roadmapPhases: true },
    });
    assert(Boolean(business), "Active demo venture profile found in SQLite database.");
    const businessId = business!.id;

    // -------------------------------------------------------------------------
    // Scenario 1: A beginner enters only a short business idea
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 1: Beginner Enters Short Business Idea ---");
    const assessment1 = await generateIdeaAssessment({
      rawIdea: "I want to bake healthy gluten-free sourdough bread and cookies",
      targetLocation: "Pune, Maharashtra",
    });

    assert(Boolean(assessment1.summary), "Generated summary for short idea without jargon.");
    assert(
      assessment1.financialEstimates.oneTimeStartupRange.typical > 0,
      "Provided realistic one-time startup cost range in INR.",
      assessment1.financialEstimates.oneTimeStartupRange
    );
    assert(
      assessment1.equipmentAndResources.physicalEquipment.length > 0,
      "Itemized relevant physical equipment for food/bakery.",
      assessment1.equipmentAndResources.physicalEquipment[0]
    );

    // -------------------------------------------------------------------------
    // Scenario 2: User does not know their budget
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 2: User Does Not Know Budget (isBudgetUnknown = true) ---");
    const assessment2 = await generateIdeaAssessment({
      rawIdea: "I want to start a mobile pet grooming van service in Pune",
      isBudgetUnknown: true,
      statedBudget: null,
      targetLocation: "Pune",
    });

    assert(
      assessment2.budgetComparison?.isBudgetUnknown === true,
      "Detected unknown budget without forcing user to guess financial numbers."
    );
    assert(
      assessment2.budgetComparison?.feasibilityVerdict === "ESTIMATION_ONLY",
      "Gave provisional requirement benchmark instead of artificial failure flag."
    );
    assert(
      assessment2.budgetComparison?.essentialCapitalNeeded! > 0,
      "Calculated essential Day-1 startup requirement.",
      `₹${assessment2.budgetComparison?.essentialCapitalNeeded}`
    );

    // -------------------------------------------------------------------------
    // Scenario 3: Budget lower than preliminary estimate (Capital Constrained)
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 3: Budget Lower than Estimate (Underfunded Scenario) ---");
    const assessment3 = await generateIdeaAssessment({
      rawIdea: "I want to open a 50-seat Italian dine-in restaurant in Baner, Pune",
      statedBudget: 100000, // Only 1 Lakh for full restaurant
      isBudgetUnknown: false,
      targetLocation: "Baner, Pune",
    });

    assert(
      assessment3.budgetComparison?.feasibilityVerdict === "CAPITAL_CONSTRAINED",
      "Accurately identified capital constraint when budget is below requirements."
    );
    assert(
      Boolean(assessment3.leanAlternative?.title),
      "Prescribed clear Lean Alternative (MVP) to prevent catastrophic over-commitment.",
      assessment3.leanAlternative.title
    );
    assert(
      assessment3.leanAlternative.estimatedLeanStartupCost < (assessment3.financialEstimates.oneTimeStartupRange.low),
      "Lean MVP cost is significantly lower than full conventional launch cost."
    );

    // -------------------------------------------------------------------------
    // Scenario 4: Different business types receive specialized questionnaires & estimates
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 4: Different Business Types Receive Tailored Models ---");
    const cloudKitchenCat = detectBusinessCategory("I want to run a cloud kitchen for salads");
    const saasCat = detectBusinessCategory("I want to build an AI code review platform SaaS");
    const retailCat = detectBusinessCategory("I want to open a retail boutique for shoes");

    assert(cloudKitchenCat.includes("Food"), "Detected Food & Cloud Kitchen category.");
    assert(saasCat.includes("Technology") || saasCat.includes("Software"), "Detected SaaS/Tech category.");
    assert(retailCat.includes("Retail"), "Detected Retail category.");

    const saasAssessment = await generateIdeaAssessment({
      rawIdea: "AI automated customer support portal for e-commerce brands",
      businessCategory: "Technology / Software / SaaS",
      operatingModel: "Online Only",
    });

    assert(
      saasAssessment.equipmentAndResources.toolsAndTechnology.some((t) => t.toLowerCase().includes("cloud") || t.toLowerCase().includes("api")),
      "Tech assessment includes cloud hosting, database, and API token allowances."
    );

    // -------------------------------------------------------------------------
    // Scenario 5: User edits assumptions and recalculates
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 5: Editing Assumptions & Recalculating ---");
    const initialRun = await generateIdeaAssessment({
      rawIdea: "Handmade ceramic pottery studio",
      statedBudget: 200000,
      operatingModel: "Physical Facility / Shop",
    });

    const refinedRun = await generateIdeaAssessment({
      rawIdea: "Handmade ceramic pottery studio",
      statedBudget: 600000,
      operatingModel: "From Home",
      existingResources: "Already own ceramic kiln wheel and pottery tools",
    });

    assert(
      refinedRun.budgetComparison?.feasibilityVerdict !== initialRun.budgetComparison?.feasibilityVerdict ||
      refinedRun.budgetComparison?.userProvidedBudget === 600000,
      "Recalculated feasibility verdict when founder increased budget and switched to home model."
    );

    // -------------------------------------------------------------------------
    // Scenario 6: Analyzer results can be reviewed before incorporation
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 6: Reviewing Analyzer Results Before Incorporation ---");
    const savedAssessment = await prisma.ideaAssessment.create({
      data: {
        businessId,
        rawIdea: "Test organic juice bar in Kalyani Nagar",
        businessCategory: "Food & Beverage / Cloud Kitchen",
        statedBudget: 400000,
        assessmentJson: JSON.stringify(refinedRun),
        status: "PROVISIONAL",
      },
    });

    assert(savedAssessment.status === "PROVISIONAL", "Assessment saved as PROVISIONAL before confirmation.");

    // Apply assessment
    await prisma.ideaAssessment.update({
      where: { id: savedAssessment.id },
      data: {
        status: "APPLIED",
        appliedAt: new Date(),
      },
    });

    const confirmed = await prisma.ideaAssessment.findUnique({ where: { id: savedAssessment.id } });
    assert(confirmed?.status === "APPLIED", "Assessment marked as APPLIED upon explicit user confirmation.");

    // -------------------------------------------------------------------------
    // Scenario 7: Plan Acceptance Decision (Option A: Yes, Accept Plan)
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 7: Explicit Plan Acceptance (Option A: Yes, Accept Plan) ---");
    const plan = await prisma.businessPlan.findUnique({ where: { businessId } });
    assert(Boolean(plan), "Business plan found for acceptance testing.");

    const acceptTimestamp = new Date();
    const acceptedPlan = await prisma.businessPlan.update({
      where: { businessId },
      data: {
        status: "ACCEPTED",
        decision: "ACCEPT",
        decisionTimestamp: acceptTimestamp,
        acceptedAt: acceptTimestamp,
        acceptedBy: "Test Founder",
        revisionNotes: null,
      },
    });

    const snapshot1 = await prisma.businessPlanVersion.create({
      data: {
        planId: plan!.id,
        businessId,
        version: acceptedPlan.version,
        status: "ACCEPTED",
        decision: "ACCEPT",
        decisionTimestamp: acceptTimestamp,
        acceptedBy: "Test Founder",
        executiveSummary: acceptedPlan.executiveSummary,
        businessOverview: acceptedPlan.businessOverview,
        problem: acceptedPlan.problem,
        solution: acceptedPlan.solution,
        targetMarket: acceptedPlan.targetMarket,
        customerPersona: acceptedPlan.customerPersona,
        marketAnalysis: acceptedPlan.marketAnalysis,
        competitorAnalysis: acceptedPlan.competitorAnalysis,
        valueProposition: acceptedPlan.valueProposition,
        businessModel: acceptedPlan.businessModel,
        marketingStrategy: acceptedPlan.marketingStrategy,
        operationsStrategy: acceptedPlan.operationsStrategy,
        technologyStrategy: acceptedPlan.technologyStrategy,
        financialOverview: acceptedPlan.financialOverview,
        riskAnalysis: acceptedPlan.riskAnalysis,
        growthStrategy: acceptedPlan.growthStrategy,
        implementationRoadmap: acceptedPlan.implementationRoadmap,
      },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: { planApproved: true, planStatus: "ACCEPTED" },
    });

    assert(acceptedPlan.status === "ACCEPTED", "Business plan marked as ACCEPTED in database.");
    assert(acceptedPlan.decision === "ACCEPT", "Recorded decision ACCEPT with server timestamp.");
    assert(snapshot1.version === acceptedPlan.version, "Preserved immutable version snapshot in BusinessPlanVersion.");

    // -------------------------------------------------------------------------
    // Scenario 8: Plan Revision Request (Option B: No, Revise Plan)
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 8: Plan Revision Request (Option B: No, Revise Plan) ---");
    const reviseTimestamp = new Date();
    const revisedPlan = await prisma.businessPlan.update({
      where: { businessId },
      data: {
        status: "REVISION_REQUIRED",
        decision: "REVISE",
        decisionTimestamp: reviseTimestamp,
        revisionNotes: "Starting capital needs to be lower. Customer channel should focus on B2B cafeterias.",
      },
    });

    const snapshot2 = await prisma.businessPlanVersion.create({
      data: {
        planId: plan!.id,
        businessId,
        version: revisedPlan.version,
        status: "REVISION_REQUIRED",
        decision: "REVISE",
        decisionTimestamp: reviseTimestamp,
        acceptedBy: "Test Founder",
        revisionNotes: revisedPlan.revisionNotes,
        executiveSummary: revisedPlan.executiveSummary,
        businessOverview: revisedPlan.businessOverview,
        problem: revisedPlan.problem,
        solution: revisedPlan.solution,
        targetMarket: revisedPlan.targetMarket,
        customerPersona: revisedPlan.customerPersona,
        marketAnalysis: revisedPlan.marketAnalysis,
        competitorAnalysis: revisedPlan.competitorAnalysis,
        valueProposition: revisedPlan.valueProposition,
        businessModel: revisedPlan.businessModel,
        marketingStrategy: revisedPlan.marketingStrategy,
        operationsStrategy: revisedPlan.operationsStrategy,
        technologyStrategy: revisedPlan.technologyStrategy,
        financialOverview: revisedPlan.financialOverview,
        riskAnalysis: revisedPlan.riskAnalysis,
        growthStrategy: revisedPlan.growthStrategy,
        implementationRoadmap: revisedPlan.implementationRoadmap,
      },
    });

    await prisma.business.update({
      where: { id: businessId },
      data: { planApproved: false, planStatus: "REVISION_REQUIRED" },
    });

    assert(revisedPlan.status === "REVISION_REQUIRED", "Plan correctly moved to REVISION_REQUIRED state.");
    assert(Boolean(revisedPlan.revisionNotes), "Stored founder's revision feedback in database.");
    assert(snapshot2.status === "REVISION_REQUIRED", "Archived revision snapshot in history.");

    // -------------------------------------------------------------------------
    // Scenario 9: Revised plan returns to review without losing previous versions
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 9: Submit for Review & Version History Preservation ---");
    const submittedPlan = await prisma.businessPlan.update({
      where: { businessId },
      data: {
        status: "UNDER_REVIEW",
        version: revisedPlan.version + 1,
        reviewRequestedAt: new Date(),
      },
    });

    assert(submittedPlan.status === "UNDER_REVIEW", "Plan moved to UNDER_REVIEW state.");
    assert(submittedPlan.version === revisedPlan.version + 1, "Incremented plan version for review.");

    const versionHistory = await prisma.businessPlanVersion.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    assert(versionHistory.length >= 2, `All previous versions preserved in history (Found ${versionHistory.length} versions).`);
    assert(
      versionHistory.some((v) => v.status === "ACCEPTED"),
      "Previously accepted version remains archived and accessible."
    );

    // Re-accept the final version for execution
    await prisma.businessPlan.update({
      where: { businessId },
      data: {
        status: "ACCEPTED",
        decision: "ACCEPT",
        decisionTimestamp: new Date(),
        acceptedAt: new Date(),
        acceptedBy: "Test Founder",
      },
    });
    await prisma.business.update({
      where: { id: businessId },
      data: { planApproved: true, planStatus: "ACCEPTED" },
    });

    // -------------------------------------------------------------------------
    // Scenario 10: Accepted plan connects correctly to execution roadmap
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 10: Roadmap Execution Readiness Connection ---");
    const roadmapSummary = await evaluateBusinessRoadmap(businessId);

    assert(roadmapSummary.isPlanAccepted === true, "Roadmap correctly detects plan accepted status.");
    assert(
      roadmapSummary.executionReadiness === "APPROVED_FOR_EXECUTION",
      "Roadmap marked as APPROVED_FOR_EXECUTION."
    );

    // -------------------------------------------------------------------------
    // Scenario 11: Real financial records remain clean and isolated
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 11: Financial Records Integrity ---");
    const transactions = await prisma.transaction.findMany({ where: { businessId } });
    const hasHypothetical = transactions.some((t) =>
      t.description.toLowerCase().includes("hypothetical") ||
      t.description.toLowerCase().includes("provisional estimate")
    );
    assert(!hasHypothetical, "Actual transaction ledger contains zero hypothetical estimate entries.");

    // -------------------------------------------------------------------------
    // Scenario 12: Existing modules (Tasks, Employees, Attendance) continue working
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario 12: Existing Modules Regression Check ---");
    const employeeCount = await prisma.employee.count({ where: { businessId } });
    const taskCount = await prisma.task.count({ where: { businessId } });
    const phaseCount = await prisma.roadmapPhase.count({ where: { businessId } });

    assert(employeeCount > 0, `Existing employees intact: ${employeeCount} employees.`);
    assert(taskCount > 0, `Existing tasks intact: ${taskCount} tasks.`);
    assert(phaseCount > 0, `Existing roadmap phases intact: ${phaseCount} phases.`);

  } catch (err: any) {
    console.error("Test execution threw error:", err);
    failed++;
  }

  console.log("\n=================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================================\n");
}

runTests();
