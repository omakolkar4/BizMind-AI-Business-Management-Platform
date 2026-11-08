import prisma from "../lib/db/prisma";
import { evaluateBusinessFeasibility } from "../lib/ai/feasibilityEngine";
import { runAIOrchestrator } from "../lib/ai/orchestrator";
import { generateBusinessPlan } from "../lib/ai/planGenerator";
import { generatePersonalizedRoadmap } from "../lib/ai/roadmapGenerator";

async function runTests() {
  console.log("=================================================");
  console.log("BIZMIND ONBOARDING STEP 1 & NAME HANDLING TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // Clean up any test users
  await prisma.user.deleteMany({
    where: {
      email: { in: ["test_with_name@bizmind.io", "test_no_name@bizmind.io", "test_dup_check@bizmind.io"] },
    },
  });

  // TEST 1: Path A - User with a Business Name
  console.log("\n--- TEST 1: Path A (User with Business Name) ---");
  const userA = await prisma.user.create({
    data: {
      name: "Founder With Name",
      email: "test_with_name@bizmind.io",
      role: "OWNER",
    },
  });

  // Simulate Step 1: User chose "Yes, I have a business name" and entered "Apex Velocity Logistics"
  // Simulate POST /api/business
  const bizA = await prisma.business.create({
    data: {
      userId: userA.id,
      name: "Apex Velocity Logistics",
      idea: "B2B electric cargo delivery network for pharmaceutical distributors",
      type: "Services",
      location: "Pune, India",
      budget: 850000,
      stage: "Idea",
      goals: JSON.stringify(["Revenue growth", "Customer acquisition"]),
      resources: "2 electric mini-vans and logistics operations software experience",
    },
  });

  assert(bizA.id !== undefined, "Business created for User A");
  assert(bizA.name === "Apex Velocity Logistics", "Business name correctly matches user input");

  const feasibilityA = await evaluateBusinessFeasibility({
    businessName: bizA.name,
    idea: bizA.idea,
    businessType: bizA.type,
    location: bizA.location,
    budget: bizA.budget,
    stage: bizA.stage,
    goals: bizA.goals,
    resources: bizA.resources,
  });

  assert(["VIABLE", "MODERATE_RISK", "CAPITAL_CONSTRAINED", "NEEDS_VALIDATION"].includes(feasibilityA.overallStatus), "Feasibility generated for business with name");

  const planA = await generateBusinessPlan({
    businessName: bizA.name,
    idea: bizA.idea,
    businessType: bizA.type,
    location: bizA.location,
    budget: bizA.budget,
    stage: bizA.stage,
    goals: bizA.goals,
  });

  assert(planA.executiveSummary.includes("Apex Velocity Logistics"), "Business plan mentions user's chosen business name");

  // TEST 2: Path B - User WITHOUT a Business Name (Beginner Workflow)
  console.log("\n--- TEST 2: Path B (User WITHOUT a Business Name) ---");
  const userB = await prisma.user.create({
    data: {
      name: "Beginner Founder",
      email: "test_no_name@bizmind.io",
      role: "OWNER",
    },
  });

  // Simulate Step 1: User chose "No, I only have a business idea"
  // Name is empty string ""
  const bizB = await prisma.business.create({
    data: {
      userId: userB.id,
      name: "", // Empty draft name
      idea: "I want to bake gluten-free sourdough bread and healthy cookies from home",
      type: "Food & Beverage",
      location: "Bengaluru, India",
      budget: 200000,
      stage: "Idea",
      goals: JSON.stringify(["Customer acquisition", "Profitability"]),
      resources: "Baking oven and sourdough starter cultures",
    },
  });

  assert(bizB.id !== undefined, "Business successfully created without a name");
  assert(bizB.name === "", "Business name is empty string (no fabricated brand name)");

  // Test Feasibility assessment with empty business name
  const feasibilityB = await evaluateBusinessFeasibility({
    businessName: bizB.name,
    idea: bizB.idea,
    businessType: bizB.type,
    location: bizB.location,
    budget: bizB.budget,
    stage: bizB.stage,
    goals: bizB.goals,
    resources: bizB.resources,
  });

  assert(["VIABLE", "MODERATE_RISK", "CAPITAL_CONSTRAINED", "NEEDS_VALIDATION"].includes(feasibilityB.overallStatus), "Feasibility evaluation succeeds without a business name");
  assert(feasibilityB.summary.length > 10, "Feasibility summary generated cleanly");

  // Test Multi-Agent Orchestrator with empty business name
  const orchestratorB = await runAIOrchestrator({
    businessName: bizB.name,
    idea: bizB.idea,
    businessType: bizB.type,
    location: bizB.location,
    budget: bizB.budget,
    stage: bizB.stage,
    goals: bizB.goals,
    resources: bizB.resources,
  });

  assert(orchestratorB.overallScore > 0, "AI Orchestrator computes overall score without business name");
  assert(!orchestratorB.summary.startsWith("undefined"), "Orchestrator summary handles empty name gracefully");

  // Test Business Plan generation with empty business name
  const planB = await generateBusinessPlan({
    businessName: bizB.name,
    idea: bizB.idea,
    businessType: bizB.type,
    location: bizB.location,
    budget: bizB.budget,
    stage: bizB.stage,
    goals: bizB.goals,
  });

  assert(!planB.executiveSummary.includes("undefined"), "Business plan has no undefined tokens");
  assert(planB.executiveSummary.includes("enterprise") || planB.executiveSummary.includes("venture"), "Business plan uses clean generic fallback without fabricated brand name");

  // Test Roadmap generation with empty business name
  const roadmapB = await generatePersonalizedRoadmap({
    businessName: bizB.name,
    businessType: bizB.type,
    location: bizB.location,
    budget: bizB.budget,
    stage: bizB.stage,
    idea: bizB.idea,
    goals: bizB.goals,
  });

  assert(roadmapB.length >= 4, "Roadmap phases generated successfully for business without name");

  // TEST 3: Path C - Duplicate Profile Prevention and Draft Reuse
  console.log("\n--- TEST 3: Path C (Duplicate Profile Prevention & Draft Reuse) ---");
  const userC = await prisma.user.create({
    data: {
      name: "Draft Tester",
      email: "test_dup_check@bizmind.io",
      role: "OWNER",
    },
  });

  // User starts onboarding, draft created
  const initialDraft = await prisma.business.create({
    data: {
      userId: userC.id,
      name: "",
      idea: "Initial rough concept about pet supplies",
      type: "Retail",
      location: "Delhi",
      budget: 100000,
      stage: "Idea",
    },
  });

  // Count businesses for userC
  const countBefore = await prisma.business.count({ where: { userId: userC.id } });
  assert(countBefore === 1, "Initial draft business created");

  // Now simulate user re-submitting onboarding or tweaking inputs (logic from POST /api/business)
  const userBusinesses = await prisma.business.findMany({
    where: { userId: userC.id },
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

  const reusableDraft = userBusinesses.find(
    (b) => !b.planApproved && !b.isDemo && b._count.employees === 0 && b._count.transactions === 0
  );

  assert(reusableDraft !== undefined, "Found existing unfinalized draft to reuse");
  assert(reusableDraft?.id === initialDraft.id, "Correctly identifies user's draft business");

  // Update existing draft with refined details instead of inserting a new row
  const updatedDraft = await prisma.business.update({
    where: { id: reusableDraft!.id },
    data: {
      name: "PawPal Treats", // User decided to add a name now
      idea: "Organic healthy dog and cat treats delivered monthly",
      budget: 150000,
    },
  });

  const countAfter = await prisma.business.count({ where: { userId: userC.id } });
  assert(countAfter === 1, "No duplicate business profile was created");
  assert(updatedDraft.name === "PawPal Treats", "Draft name successfully updated");
  assert(updatedDraft.id === initialDraft.id, "Preserved original business ID");

  // TEST 4: Established business protection
  console.log("\n--- TEST 4: Established Business Protection ---");
  // Mark business as approved (established)
  await prisma.business.update({
    where: { id: updatedDraft.id },
    data: { planApproved: true },
  });

  const establishedBusinesses = await prisma.business.findMany({
    where: { userId: userC.id },
    include: {
      _count: { select: { employees: true, transactions: true, tasks: true } },
    },
  });

  const foundUnapprovedDraft = establishedBusinesses.find(
    (b) => !b.planApproved && !b.isDemo && b._count.employees === 0 && b._count.transactions === 0
  );

  assert(foundUnapprovedDraft === undefined, "Established (planApproved) business is NOT identified as a reusable draft");

  // Clean up test data
  await prisma.user.deleteMany({
    where: {
      email: { in: ["test_with_name@bizmind.io", "test_no_name@bizmind.io", "test_dup_check@bizmind.io"] },
    },
  });

  console.log("\n=================================================");
  console.log(`ALL TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
