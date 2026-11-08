import { BusinessContextInput, FeasibilityAssessmentResult } from "./types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";

export async function evaluateBusinessFeasibility(
  context: BusinessContextInput
): Promise<FeasibilityAssessmentResult> {
  const openai = getOpenAIClient();

  const name = context.businessName || "Proposed Venture";
  const type = context.businessType || "Services";
  const loc = context.location || "Local Market";
  const budget = Number(context.budget) || 0;
  const idea = context.idea || "";
  const stage = context.stage || "Idea";

  // 1. Try Live OpenAI LLM if configured and not demo
  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are BizMind's Principal Startup Mentor and Venture Feasibility Auditor.
Evaluate the feasibility of this business concept critically and realistically:
Business Name: ${name}
Industry: ${type}
Location: ${loc}
Concept / Problem: ${idea}
Founder's Available Starting Budget: ₹${budget.toLocaleString("en-IN")}
Current Maturity Stage: ${stage}
Target Customer: ${context.targetCustomer || "Not specified"}
Founder Resources & Skills: ${context.resources || "Not specified"}

CRITICAL EVALUATION RULES:
1. Do NOT automatically encourage every idea. If budget is too low for the business model, flag "CAPITAL_CONSTRAINED".
2. Do NOT present an AI score as a scientifically validated probability of success.
3. If an idea lacks demand validation or customer willingness to pay, flag "NEEDS_VALIDATION" and prescribe low-cost experiments.
4. Distinguish between confirmed facts and major assumptions.

Return a JSON object strictly matching this schema:
{
  "overallStatus": "VIABLE" | "MODERATE_RISK" | "HIGH_RISK" | "NEEDS_VALIDATION" | "CAPITAL_CONSTRAINED",
  "summary": "Concise 2-3 sentence executive summary of practical feasibility.",
  "customerDemandAnalysis": "Assessment of customer problem urgency and willingness to pay.",
  "targetCustomerFit": "Clarity and accessibility of target demographic.",
  "marketAndCompetition": "Competitive landscape and realistic entry barriers.",
  "capitalViability": "Comparison of founder's budget vs. true launch cost requirements.",
  "minStartupCost": 500000,
  "maxStartupCost": 1200000,
  "expectedMonthlyOpex": 80000,
  "breakEvenMonths": 8,
  "operationalComplexity": "Low" | "Moderate" | "High" | "Very High",
  "founderReadiness": "Analysis of existing resources and skill gaps.",
  "legalRegulatoryRisks": "Specific licensing, compliance, or local regulatory hurdles in this location.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "criticalRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "majorAssumptions": ["Assumption 1", "Assumption 2"],
  "unansweredQuestions": ["Unanswered question 1", "Unanswered question 2"],
  "validationExperiments": [
    {
      "title": "Experiment title",
      "objective": "What is being tested",
      "budgetLimit": 5000,
      "metricsToTrack": "e.g. 20 customer interviews, pre-orders",
      "reviewTimeline": "2 Weeks"
    }
  ],
  "nextStepRecommendation": {
    "title": "Immediate next priority",
    "description": "What to do right now",
    "guidance": {
      "what": "Exact action",
      "why": "Business justification",
      "how": "Step-by-step instructions",
      "resourcesNeeded": ["Resource 1", "Resource 2"],
      "estimatedCost": 5000,
      "timeline": "14 Days",
      "measurableResult": "Success metric",
      "risksAndMitigation": "What could go wrong and how to fix it",
      "nextStepAfter": "Subsequent milestone"
    }
  }
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "You are an expert venture feasibility auditor. Return strict JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      if (parsed.overallStatus && parsed.summary) {
        return parsed as FeasibilityAssessmentResult;
      }
    } catch (err) {
      console.warn("OpenAI feasibility evaluation failed, using intelligent domain auditor:", err);
    }
  }

  // 2. Intelligent, Deterministic Domain Feasibility Assessment Engine
  const typeLower = type.toLowerCase();
  const isFood = typeLower.includes("food") || typeLower.includes("beverage") || typeLower.includes("restaurant") || typeLower.includes("kitchen");
  const isTech = typeLower.includes("tech") || typeLower.includes("software") || typeLower.includes("app") || typeLower.includes("saas");
  const isRetail = typeLower.includes("retail") || typeLower.includes("e-commerce") || typeLower.includes("store");
  const isManufacturing = typeLower.includes("manufacturing") || typeLower.includes("hardware") || typeLower.includes("production");
  const isHealthcare = typeLower.includes("health") || typeLower.includes("medical") || typeLower.includes("clinic");

  // Determine realistic industry cost baselines (INR)
  let minCost = 250000;
  let maxCost = 800000;
  let opexEst = 50000;
  let breakEvenEst = 6;
  let complexity: "Low" | "Moderate" | "High" | "Very High" = "Moderate";
  let regRisks = "Standard business registration, GST compliance, and local municipal trade license.";

  if (isManufacturing) {
    minCost = 1500000;
    maxCost = 4500000;
    opexEst = 220000;
    breakEvenEst = 14;
    complexity = "Very High";
    regRisks = "Factory licensing, pollution board clearance, industrial electrical connections, and worker safety insurance.";
  } else if (isFood) {
    minCost = 500000;
    maxCost = 1800000;
    opexEst = 95000;
    breakEvenEst = 8;
    complexity = "High";
    regRisks = "FSSAI food safety hygiene license, local fire safety NOC, commercial kitchen lease terms, and municipal health permits.";
  } else if (isHealthcare) {
    minCost = 800000;
    maxCost = 2500000;
    opexEst = 140000;
    breakEvenEst = 10;
    complexity = "High";
    regRisks = "Clinical establishment act compliance, bio-waste disposal certification, and medical practitioner verification.";
  } else if (isRetail) {
    minCost = 350000;
    maxCost = 1200000;
    opexEst = 70000;
    breakEvenEst = 7;
    complexity = "Moderate";
    regRisks = "Shops & Establishment registration, consumer protection compliance, and inventory logistics agreements.";
  } else if (isTech) {
    minCost = 100000;
    maxCost = 600000;
    opexEst = 35000;
    breakEvenEst = 5;
    complexity = "Moderate";
    regRisks = "Data privacy terms (DPDP act), intellectual property assignments, and payment gateway KYC.";
  }

  // Capital Check vs Budget
  let status: FeasibilityAssessmentResult["overallStatus"] = "VIABLE";
  let capitalViability = `Your starting capital of ₹${budget.toLocaleString("en-IN")} is within the realistic setup range of ₹${minCost.toLocaleString("en-IN")} – ₹${maxCost.toLocaleString("en-IN")}.`;

  if (budget < minCost * 0.5) {
    status = "CAPITAL_CONSTRAINED";
    capitalViability = `Your current starting budget of ₹${budget.toLocaleString("en-IN")} is significantly below the typical minimum requirement of ₹${minCost.toLocaleString("en-IN")} for a standard ${type} business. Attempting a full-scale launch with this capital creates an immediate liquidity crisis before breakeven.`;
  } else if (budget < minCost) {
    status = "MODERATE_RISK";
    capitalViability = `Your budget of ₹${budget.toLocaleString("en-IN")} provides a lean runway. It covers bare minimum infrastructure but leaves virtually zero contingency buffer for unexpected delays or supplier price spikes.`;
  } else if (stage === "Idea") {
    status = "NEEDS_VALIDATION";
    capitalViability = `While your budget of ₹${budget.toLocaleString("en-IN")} is sufficient, the venture is at raw Idea stage. Committing substantial capital before customer willingness-to-pay is validated poses unnecessary financial exposure.`;
  }

  const strengths = [
    `Concept targets an identifiable target segment in ${loc}.`,
    `Unit-level margin expansion is achievable once steady volume is established.`,
    context.resources ? `Founder brings identified operational assets: ${context.resources}` : "Founder has agility to test lean prototypes without corporate overhead.",
  ];

  const weaknesses = [
    status === "CAPITAL_CONSTRAINED"
      ? `Starting capital of ₹${budget.toLocaleString("en-IN")} is insufficient for standard commercial ${type} infrastructure.`
      : "Customer acquisition flywheel is unproven; initial customer acquisition cost (CAC) may be high.",
    `Absence of long-term negotiated supplier contracts during early iterations.`,
    "Brand trust must be built from scratch against incumbent options.",
  ];

  const criticalRisks = [
    status === "CAPITAL_CONSTRAINED"
      ? "Insolvency risk: Running out of cash before fulfilling initial customer orders or establishing recurring revenue."
      : "Customer indifference: Target customers may perceive the problem but resist paying premium pricing.",
    `Operational bottlenecks: Fulfillment and delivery friction in ${loc}.`,
    "Regulatory or licensing delays postponing commercial launch date.",
  ];

  const majorAssumptions = [
    `Target customers in ${loc} will actively choose ${name} over established traditional alternatives.`,
    `Gross margin will hold above 40% after factoring in packaging, spoilage/returns, and shipping.`,
    "First customer orders can be acquired organically or via low-cost local outreach.",
  ];

  const unansweredQuestions = [
    `Have at least 15 prospective customers committed or pre-ordered the product/service?`,
    `What is the exact wholesale unit cost from verified local suppliers in ${loc}?`,
    `What is the minimum volume required to cover fixed monthly overhead of ₹${opexEst.toLocaleString("en-IN")}?`,
  ];

  const validationExperiments = [
    {
      title: "Problem & Willingness-to-Pay Interviews",
      objective: "Conduct 15 structured customer discovery interviews to confirm acute pain points and validate price acceptance.",
      budgetLimit: Math.min(budget, 5000),
      metricsToTrack: "15 customer interviews completed; at least 10 confirming willingness to pay target price.",
      reviewTimeline: "10 Days",
    },
    {
      title: "Lean Prototype or Landing Page Pre-Order Test",
      objective: "Create a simple digital flyer, WhatsApp catalog, or sample batch to gauge authentic purchase intent before full inventory commitments.",
      budgetLimit: Math.min(budget, 15000),
      metricsToTrack: "Conversion rate of interested leads into explicit pre-orders or waitlist signups (Target: >12%).",
      reviewTimeline: "14 Days",
    },
  ];

  let nextStepTitle = "Execute Customer Willingness-to-Pay Validation";
  let nextStepDesc = "Do not purchase heavy equipment or sign leases yet. Conduct 15 focused customer interviews to confirm pricing power.";

  if (status === "CAPITAL_CONSTRAINED") {
    nextStepTitle = "Adopt a Lean Pilot Model or Secure Stage-1 Micro-Funding";
    nextStepDesc = `Your starting budget of ₹${budget.toLocaleString("en-IN")} cannot support full ${type} infrastructure. Pivot to a home-operated, cloud-delivered, or pre-order model to build proof-of-concept.`;
  }

  const guidance: FeasibilityAssessmentResult["nextStepRecommendation"]["guidance"] = {
    what: nextStepTitle,
    why: "Preserving starting capital and testing real customer demand is the single most decisive factor between venture success and premature bankruptcy.",
    how: `1. Draft a 5-question interview guide focused on current frustrations with existing alternatives.\n2. Engage directly with 20 prospects in ${loc} (via local communities, professional networks, or targeted outreach).\n3. Record exact price resistance points and calculate minimum batch economics.`,
    resourcesNeeded: ["Interview script", "Sample digital catalog or mock-up", "Founder time (2 hours/day)"],
    estimatedCost: Math.min(budget, 5000),
    timeline: "14 Days",
    measurableResult: "15 completed interviews; minimum 60% expressing verifiable intent to purchase.",
    risksAndMitigation: "Risk: Friends/family providing polite but dishonest encouragement. Mitigation: Insist on asking when they last spent money solving this problem.",
    nextStepAfter: "Draft customized 17-section business plan and configure initial phase milestones in Roadmap.",
    actionUrl: "/tasks",
    actionLabel: "Create Validation Tasks",
  };

  return {
    overallStatus: status,
    summary:
      status === "CAPITAL_CONSTRAINED"
        ? `${name} has potential market interest, but starting with ₹${budget.toLocaleString("en-IN")} presents severe capital constraints for a ${type} model. A lean pilot or pre-order experiment is strongly recommended before committing to physical assets.`
        : `${name} demonstrates workable commercial feasibility in ${loc}. However, validating willingness-to-pay and locking supplier terms are vital prerequisites before scaling fixed operational expenses.`,
    customerDemandAnalysis: `Demand for ${type} in ${loc} is active, but customers evaluate alternatives rigorously. Direct evidence of acute customer dissatisfaction with incumbent solutions is required.`,
    targetCustomerFit: context.targetCustomer || `Urban consumers and businesses in ${loc} seeking reliability and consistent quality.`,
    marketAndCompetition: `Competitive density is moderate. Success depends on clear differentiation in service reliability, speed, and unit transparency rather than competing on ruinous price discounts.`,
    capitalViability,
    minStartupCost: minCost,
    maxStartupCost: maxCost,
    expectedMonthlyOpex: opexEst,
    breakEvenMonths: breakEvenEst,
    operationalComplexity: complexity,
    founderReadiness: context.resources
      ? `Founder has identified: "${context.resources}". Next step is complementing these with disciplined sales execution.`
      : "Founder operates lean; prioritizing focused task delegation and execution cadence will prevent burnout.",
    legalRegulatoryRisks: regRisks,
    strengths,
    weaknesses,
    criticalRisks,
    majorAssumptions,
    unansweredQuestions,
    validationExperiments,
    nextStepRecommendation: {
      title: nextStepTitle,
      description: nextStepDesc,
      guidance,
    },
  };
}
