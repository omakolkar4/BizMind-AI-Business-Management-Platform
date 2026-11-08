import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";

export interface BudgetItem {
  category: "Premises & Setup" | "Equipment & Tools" | "Technology & Licenses" | "Initial Inventory & Supplies" | "Staffing & Labor" | "Marketing & Launch" | "Contingency & Working Capital";
  item: string;
  lowEstimate: number;
  typicalEstimate: number;
  highEstimate: number;
  isEssential: boolean; // true = essential for day 1, false = can be deferred
  assumption: string;
  period: "one-time" | "monthly";
}

export interface IdeaAssessmentData {
  businessCategory: string;
  summary: string;
  targetCustomer: {
    group: string;
    problemSolved: string;
    painPointUrgency: "High" | "Medium" | "Moderate";
  };
  proposedBusinessModel: {
    description: string;
    monetizationTypes: string[];
    pricingStrategy: string;
  };
  operationalRequirements: {
    operatingModality: string;
    premisesNeeded: string;
    keyProcesses: string[];
  };
  equipmentAndResources: {
    physicalEquipment: string[];
    toolsAndTechnology: string[];
    premisesOrSpace: string;
    licensesAndCompliance: string[];
  };
  staffingAndTalent: {
    initialTeamStructure: string;
    canStartSolo: boolean;
    recommendedFirstHires: string[];
    estimatedMonthlyPayrollRange: { low: number; high: number };
  };
  financialEstimates: {
    currency: "₹";
    oneTimeStartupRange: {
      low: number;
      typical: number;
      high: number;
    };
    recurringMonthlyOpexRange: {
      low: number;
      typical: number;
      high: number;
    };
    suggestedWorkingCapitalMonths: number;
    suggestedWorkingCapitalBuffer: number;
    totalRecommendedCapital: {
      low: number;
      typical: number;
      high: number;
    };
    keyBudgetDrivers: string[];
    itemizedBudget: BudgetItem[];
  };
  budgetComparison?: {
    userProvidedBudget: number | null;
    isBudgetUnknown: boolean;
    feasibilityVerdict: "FEASIBLE" | "TIGHT_RESOURCES" | "CAPITAL_CONSTRAINED" | "ESTIMATION_ONLY";
    verdictTitle: string;
    explanation: string;
    essentialCapitalNeeded: number;
    deferrableExpensesAmount: number;
    riskIfUnderfunded: string;
  };
  revenueAndAssumptions: {
    primaryRevenueSources: string[];
    keyUnitAssumptions: string[];
    projectedBreakevenHorizon: string;
  };
  risksAndUncertainties: {
    criticalRisks: string[];
    unvalidatedAssumptions: string[];
    regulatoryHurdles: string[];
  };
  leanAlternative: {
    title: string;
    description: string;
    estimatedLeanStartupCost: number;
    keyCompromisesOrFocus: string;
    validationMilestoneBeforeFullSpend: string;
  };
  unansweredQuestions: string[];
  recommendedNextSteps: string[];
  disclaimer: string;
}

export interface IdeaInputParams {
  rawIdea: string;
  businessCategory?: string;
  operatingModel?: string; // "Home", "Online", "Shop", "Office", "Shared/Cloud", "Undecided"
  targetLocation?: string;
  staffingPlan?: string; // "Solo", "With Co-founder", "Small Team (1-3)", "Hiring Staff"
  statedBudget?: number | null;
  isBudgetUnknown?: boolean;
  existingResources?: string;
  timeframeGoal?: string;
}

// -------------------------------------------------------------
// Category Detection Helper
// -------------------------------------------------------------
export function detectBusinessCategory(idea: string, userCategory?: string): string {
  if (userCategory && userCategory !== "Other" && userCategory !== "Undecided") {
    return userCategory;
  }
  const text = idea.toLowerCase();
  if (
    text.includes("kitchen") ||
    text.includes("food") ||
    text.includes("meal") ||
    text.includes("bakery") ||
    text.includes("bake") ||
    text.includes("bread") ||
    text.includes("cookie") ||
    text.includes("cookies") ||
    text.includes("cafe") ||
    text.includes("restaurant") ||
    text.includes("tiffin") ||
    text.includes("catering") ||
    text.includes("snack") ||
    text.includes("beverage") ||
    text.includes("coffee") ||
    text.includes("tea")
  ) {
    return "Food & Beverage / Cloud Kitchen";
  }
  if (
    text.includes("shop") ||
    text.includes("store") ||
    text.includes("clothing") ||
    text.includes("boutique") ||
    text.includes("retail") ||
    text.includes("e-commerce") ||
    text.includes("ecommerce") ||
    text.includes("sell") ||
    text.includes("merchandise")
  ) {
    return "Retail & E-commerce";
  }
  if (
    /\b(ai|ml|saas|app|apps|api|apis|tech|bot|bots)\b/i.test(text) ||
    text.includes("software") ||
    text.includes("platform") ||
    text.includes("portal") ||
    text.includes("website") ||
    text.includes("code") ||
    text.includes("developer")
  ) {
    return "Technology / Software / SaaS";
  }
  if (
    text.includes("consult") ||
    text.includes("agency") ||
    text.includes("service") ||
    text.includes("tutor") ||
    text.includes("teach") ||
    text.includes("design") ||
    text.includes("marketing") ||
    text.includes("clean") ||
    text.includes("repair")
  ) {
    return "Professional & Client Services";
  }
  if (
    text.includes("manufactur") ||
    text.includes("factory") ||
    text.includes("craft") ||
    text.includes("produce") ||
    text.includes("handicraft") ||
    text.includes("pottery") ||
    text.includes("ceramic")
  ) {
    return "Manufacturing & Craft Production";
  }
  if (
    /\b(health|healthcare|clinic|hospital|doctor|physio|fitness|gym|yoga|wellness|therapy)\b/i.test(text)
  ) {
    return "Healthcare & Wellness";
  }
  return "General Small Enterprise";
}

// -------------------------------------------------------------
// Preliminary Assessment Generator
// -------------------------------------------------------------
export async function generateIdeaAssessment(input: IdeaInputParams): Promise<IdeaAssessmentData> {
  const category = detectBusinessCategory(input.rawIdea, input.businessCategory);
  const location = input.targetLocation?.trim() || "Pune, Maharashtra";
  const statedBudget = input.isBudgetUnknown ? null : (input.statedBudget || null);
  const operatingModel = input.operatingModel || "Online / Shared Facility";
  const staffing = input.staffingPlan || "Solo founder with part-time support";

  const openai = getOpenAIClient();

  // 1. Live LLM Generation if configured and not demo
  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are BizMind's AI Business Idea & Budget Analyzer for entrepreneurs and beginners.
Analyze this raw business idea with extreme financial realism and beginner-friendly language:
Raw Idea: "${input.rawIdea}"
Detected Category: ${category}
Operating Model: ${operatingModel}
Location: ${location}
Staffing Intent: ${staffing}
Founder's Stated Budget: ${input.isBudgetUnknown ? "Unknown / Not provided" : `₹${statedBudget?.toLocaleString("en-IN")}`}
Existing Resources: ${input.existingResources || "Starting from scratch"}
First 3-6 Month Goal: ${input.timeframeGoal || "Validate customer demand and break even"}

CRITICAL RULES:
1. All currency figures must be realistic in Indian Rupees (₹ INR) for the specified location.
2. Distinguish clearly between ONE-TIME startup costs and RECURRING monthly operating expenses.
3. Provide low, typical, and high cost scenarios.
4. If budget is provided, compare it directly to the estimated required capital and explain if it is feasible, tight, or constrained.
5. Provide a clear low-cost "Lean Alternative" (MVP) that allows testing before full capital commitment.
6. Clearly state that estimates are planning guides, not guaranteed market quotes.
7. Return valid JSON matching the specified schema.`;

      const completion = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "You are an elite startup financial planning expert and business analyst. Return strict valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(completion.choices[0].message.content || "{}");
      if (parsed.summary && parsed.financialEstimates?.oneTimeStartupRange) {
        return parsed as IdeaAssessmentData;
      }
    } catch (e) {
      console.warn("OpenAI Idea Analyzer fallback to deterministic domain engine:", e);
    }
  }

  // 2. Intelligent, Deterministic Domain Engine (zero external API required, realistic numbers)
  return buildDeterministicIdeaAssessment(input, category, location, statedBudget, operatingModel, staffing);
}

function buildDeterministicIdeaAssessment(
  input: IdeaInputParams,
  category: string,
  location: string,
  statedBudget: number | null,
  operatingModel: string,
  staffing: string
): IdeaAssessmentData {
  const isCloudKitchen = category.includes("Food");
  const isTech = category.includes("Technology") || category.includes("Software");
  const isRetail = category.includes("Retail");
  const isServices = category.includes("Services");

  // Base financial estimates per category
  let oneTimeLow = 150000;
  let oneTimeTypical = 350000;
  let oneTimeHigh = 650000;

  let monthlyOpexLow = 30000;
  let monthlyOpexTypical = 75000;
  let monthlyOpexHigh = 140000;

  let itemizedBudget: BudgetItem[] = [];
  let physicalEquipment: string[] = [];
  let toolsAndTech: string[] = [];
  let licenses: string[] = [];
  let initialTeamStructure = "Solo founder with part-time outsourced help";
  let recommendedFirstHires: string[] = [];
  let keyBudgetDrivers: string[] = [];
  let leanStartupCost = 50000;
  let leanTitle = "Home or Shared Pilot MVP";
  let leanDesc = "Validate demand with pre-orders and direct WhatsApp/Instagram community sales before formal setup.";

  if (isCloudKitchen) {
    oneTimeLow = 250000;
    oneTimeTypical = 500000;
    oneTimeHigh = 950000;

    monthlyOpexLow = 55000;
    monthlyOpexTypical = 110000;
    monthlyOpexHigh = 190000;

    physicalEquipment = [
      "Commercial dual-deck gas oven or high-output burners",
      "Commercial vertical refrigerator / cold-storage unit",
      "Stainless steel prep counters and hygiene sinks",
      "Induction cooktops, heavy-duty cookware and prep utensils",
      "Eco-friendly meal tray heat-sealing machine",
    ];
    toolsAndTech = [
      "Cloud POS & order aggregator software (Petpooja / UrbanPiper)",
      "Digital weigh scales and thermal receipt printer",
      "Next.js web ordering & meal subscription portal",
      "WhatsApp Business API for order dispatch updates",
    ];
    licenses = [
      "FSSAI State Food License (Mandatory before food sales)",
      "Local Municipal Shop & Establishment Act (Gumasta in Maharashtra)",
      "GST Registration (Voluntary under ₹20L, recommended for B2B input tax credit)",
      "Fire Department NOC and commercial kitchen ventilation clearance",
    ];
    initialTeamStructure = "1 Head Cook, 1 Prep Assistant, and 1 Founder managing orders, hygiene, and logistics";
    recommendedFirstHires = ["Experienced commercial line cook", "Kitchen utility / dishwasher assistant"];
    keyBudgetDrivers = [
      "Commercial kitchen rental deposit (3 to 6 months advance)",
      "Refrigeration & commercial induction equipment",
      "Initial 45-day inventory of certified biodegradable meal packaging",
    ];
    leanStartupCost = 65000;
    leanTitle = "Home-Kitchen Pre-Order Beta";
    leanDesc = "Cook small batches (15-25 meals daily) from home or a rented shared commercial kitchen during off-peak hours. Sell directly to friends and local office colleagues via WhatsApp before signing a commercial lease.";

    itemizedBudget = [
      {
        category: "Premises & Setup",
        item: "Kitchen Security Deposit (Shared / Micro facility)",
        lowEstimate: 50000,
        typicalEstimate: 120000,
        highEstimate: 220000,
        isEssential: true,
        assumption: "Based on 3 months deposit for 200-350 sq.ft commercial space in Pune suburban clusters.",
        period: "one-time",
      },
      {
        category: "Equipment & Tools",
        item: "Commercial Cooktops, Refrigeration & Cookware",
        lowEstimate: 90000,
        typicalEstimate: 180000,
        highEstimate: 320000,
        isEssential: true,
        assumption: "Procuring commercial-grade pre-owned or mid-tier appliances with warranty.",
        period: "one-time",
      },
      {
        category: "Technology & Licenses",
        item: "FSSAI License, Gumasta & Cloud POS Setup",
        lowEstimate: 15000,
        typicalEstimate: 28000,
        highEstimate: 45000,
        isEssential: true,
        assumption: "Statutory government filing fees plus consultant charges for expedited food certification.",
        period: "one-time",
      },
      {
        category: "Initial Inventory & Supplies",
        item: "Bulk Biodegradable Packaging & Raw Ingredients (First 15 days)",
        lowEstimate: 35000,
        typicalEstimate: 65000,
        highEstimate: 110000,
        isEssential: true,
        assumption: "Minimum order quantity for custom printed meal trays and wholesale dry spices/grains.",
        period: "one-time",
      },
      {
        category: "Marketing & Launch",
        item: "Food Tasting Sampling, Signage & Local Digital Ads",
        lowEstimate: 15000,
        typicalEstimate: 35000,
        highEstimate: 70000,
        isEssential: false,
        assumption: "Can be trimmed if founder focuses on direct in-person corporate outreach.",
        period: "one-time",
      },
      {
        category: "Premises & Setup",
        item: "Monthly Commercial Kitchen Rent & Utilities (Electricity/Gas)",
        lowEstimate: 22000,
        typicalEstimate: 40000,
        highEstimate: 65000,
        isEssential: true,
        assumption: "Estimated 200 sq.ft kitchen with 3-phase commercial power connection.",
        period: "monthly",
      },
      {
        category: "Staffing & Labor",
        item: "Monthly Kitchen Staff Wages (Head Cook + Kitchen Helper)",
        lowEstimate: 22000,
        typicalEstimate: 38000,
        highEstimate: 55000,
        isEssential: true,
        assumption: "Competitive market salary for 2 full-time kitchen personnel in Pune.",
        period: "monthly",
      },
      {
        category: "Technology & Licenses",
        item: "POS Subscription, Internet & WhatsApp Business API",
        lowEstimate: 3500,
        typicalEstimate: 7000,
        highEstimate: 12000,
        isEssential: false,
        assumption: "Cloud software licenses and broadband connection.",
        period: "monthly",
      },
    ];
  } else if (isTech) {
    oneTimeLow = 60000;
    oneTimeTypical = 180000;
    oneTimeHigh = 380000;

    monthlyOpexLow = 15000;
    monthlyOpexTypical = 45000;
    monthlyOpexHigh = 95000;

    physicalEquipment = [
      "High-performance development workstation or laptop (16GB+ RAM)",
      "Ergonomic workspace setup with dual monitor display",
      "High-speed fiber internet router with power backup",
    ];
    toolsAndTech = [
      "Cloud hosting & database (Vercel, Supabase, AWS or Neon)",
      "Authentication and payments (Stripe / Razorpay)",
      "Code repository, CI/CD and monitoring (GitHub, Sentry)",
      "AI API tokens (OpenAI / Anthropic budget allocation)",
    ];
    licenses = [
      "Company Incorporation (Private Limited or LLP for IP protection)",
      "GST Registration for software exports or domestic SaaS billing",
      "Software trademark and domain registration",
    ];
    initialTeamStructure = "Solo technical founder or product duo (Product + Engineering)";
    recommendedFirstHires = ["Part-time UI/UX designer", "Freelance QA / frontend developer"];
    keyBudgetDrivers = [
      "Legal entity incorporation and IP ownership agreements",
      "Cloud computing & AI LLM API inference costs",
      "Customer acquisition experiments (B2B LinkedIn outreach & niche ads)",
    ];
    leanStartupCost = 25000;
    leanTitle = "No-Code / Open-Source Prototype MVP";
    leanDesc = "Build a functional prototype using open-source frameworks (Next.js/SQLite) and free-tier cloud credits. Validate with 20 beta test users before investing in formal incorporation or paid ads.";

    itemizedBudget = [
      {
        category: "Technology & Licenses",
        item: "Pvt Ltd / LLP Incorporation & Legal IP Documentation",
        lowEstimate: 12000,
        typicalEstimate: 25000,
        highEstimate: 45000,
        isEssential: false,
        assumption: "Can start as sole proprietorship and upgrade to Pvt Ltd once revenue starts.",
        period: "one-time",
      },
      {
        category: "Equipment & Tools",
        item: "Development Hardware & Test Devices",
        lowEstimate: 25000,
        typicalEstimate: 70000,
        highEstimate: 150000,
        isEssential: false,
        assumption: "Assumes founder already has existing laptop; applies only if new machine required.",
        period: "one-time",
      },
      {
        category: "Marketing & Launch",
        item: "Landing Page, Brand Assets & Initial Customer Outreach",
        lowEstimate: 10000,
        typicalEstimate: 30000,
        highEstimate: 65000,
        isEssential: true,
        assumption: "Domain name, design templates, and pilot user incentive vouchers.",
        period: "one-time",
      },
      {
        category: "Technology & Licenses",
        item: "Cloud Hosting, Database & AI API Inference Tokens",
        lowEstimate: 4000,
        typicalEstimate: 15000,
        highEstimate: 35000,
        isEssential: true,
        assumption: "Monthly usage for up to 500 active beta users.",
        period: "monthly",
      },
      {
        category: "Marketing & Launch",
        item: "Customer Discovery Ads & B2B Lead Generation",
        lowEstimate: 5000,
        typicalEstimate: 18000,
        highEstimate: 40000,
        isEssential: false,
        assumption: "Can be replaced with zero-cost organic community marketing.",
        period: "monthly",
      },
    ];
  } else if (isRetail) {
    oneTimeLow = 200000;
    oneTimeTypical = 450000;
    oneTimeHigh = 850000;

    monthlyOpexLow = 40000;
    monthlyOpexTypical = 85000;
    monthlyOpexHigh = 160000;

    physicalEquipment = [
      "Retail display racks, hangers, and customer trial area",
      "Barcode scanner, billing terminal, and cash drawer",
      "Packaging station and branded shopping bags",
    ];
    toolsAndTech = [
      "Shop inventory management system (ERP / Shopify / POS)",
      "Card swipe machine and UPI QR standee",
      "E-commerce storefront for omnichannel orders",
    ];
    licenses = [
      "Municipal Shop & Establishment Act (Gumasta)",
      "GST Registration (Mandatory for inter-state e-commerce)",
      "Trade license and commercial sign board permission",
    ];
    initialTeamStructure = "Founder acting as store manager with 1 sales assistant";
    recommendedFirstHires = ["Customer sales assistant", "Inventory and packing helper"];
    keyBudgetDrivers = [
      "Initial wholesale stock procurement and inventory holding",
      "Commercial shop security deposit (prime high-footfall location)",
      "Interior store fitout and lighting display",
    ];
    leanStartupCost = 45000;
    leanTitle = "Pop-up Flea Market / E-Commerce First";
    leanDesc = "Test initial inventory at weekend lifestyle flea markets or an Instagram shop. Validate which designs or products sell before signing a 3-year commercial retail lease.";

    itemizedBudget = [
      {
        category: "Premises & Setup",
        item: "Shop Security Deposit (Retail Commercial Space)",
        lowEstimate: 60000,
        typicalEstimate: 150000,
        highEstimate: 300000,
        isEssential: true,
        assumption: "Assumes local high street shop in Pune tier-2 market.",
        period: "one-time",
      },
      {
        category: "Initial Inventory & Supplies",
        item: "Opening Product Inventory Stock",
        lowEstimate: 80000,
        typicalEstimate: 180000,
        highEstimate: 350000,
        isEssential: true,
        assumption: "Direct manufacturer / wholesale distributor minimum batch order.",
        period: "one-time",
      },
      {
        category: "Equipment & Tools",
        item: "Store Fixtures, Display Shelves & POS Register",
        lowEstimate: 35000,
        typicalEstimate: 75000,
        highEstimate: 140000,
        isEssential: true,
        assumption: "Basic modern modular shelving and digital billing hardware.",
        period: "one-time",
      },
      {
        category: "Premises & Setup",
        item: "Monthly Retail Rent & Power",
        lowEstimate: 20000,
        typicalEstimate: 45000,
        highEstimate: 80000,
        isEssential: true,
        assumption: "Estimated rent for 150-250 sq.ft boutique space.",
        period: "monthly",
      },
    ];
  } else {
    // Services / General
    oneTimeLow = 80000;
    oneTimeTypical = 200000;
    oneTimeHigh = 420000;

    monthlyOpexLow = 20000;
    monthlyOpexTypical = 50000;
    monthlyOpexHigh = 105000;

    physicalEquipment = [
      "Client presentation equipment and modern workstation",
      "Essential field tools or service kit depending on sector",
      "Professional meeting space access (co-working day pass)",
    ];
    toolsAndTech = [
      "Client CRM, invoicing & contract management software",
      "Professional website and portfolio showcase",
      "Project management and client communication portal",
    ];
    licenses = [
      "MSME Udyam Registration (Free government MSME certificate)",
      "Shop Act / Trade license",
      "Professional Tax (PT) registration and GST",
    ];
    initialTeamStructure = "Founder as primary service provider, scaling with specialized contractors";
    recommendedFirstHires = ["Project-based associate / technician", "Client onboarding coordinator"];
    keyBudgetDrivers = [
      "Initial client acquisition campaigns and professional branding",
      "Specialized service tools or industry credentials",
      "3-month cash buffer for invoicing receivable cycles",
    ];
    leanStartupCost = 20000;
    leanTitle = "Freelance / Boutique Service Beta";
    leanDesc = "Offer services directly to 3 pilot clients at an introductory rate in exchange for video testimonials and referrals. No office lease needed.";

    itemizedBudget = [
      {
        category: "Equipment & Tools",
        item: "Service Delivery Tools & Professional Computing Hardware",
        lowEstimate: 30000,
        typicalEstimate: 75000,
        highEstimate: 140000,
        isEssential: true,
        assumption: "Assumes hardware required for professional service execution.",
        period: "one-time",
      },
      {
        category: "Marketing & Launch",
        item: "Branding, Case Studies Website & Client Lead Generation",
        lowEstimate: 15000,
        typicalEstimate: 40000,
        highEstimate: 80000,
        isEssential: true,
        assumption: "Professional digital portfolio and targeted B2B outreach.",
        period: "one-time",
      },
      {
        category: "Premises & Setup",
        item: "Co-working Space Desk / Client Meeting Passes",
        lowEstimate: 5000,
        typicalEstimate: 14000,
        highEstimate: 25000,
        isEssential: false,
        assumption: "Can work 100% remote from home initially.",
        period: "monthly",
      },
      {
        category: "Technology & Licenses",
        item: "Software Subscriptions (CRM, Accounting, Domain)",
        lowEstimate: 3000,
        typicalEstimate: 8000,
        highEstimate: 18000,
        isEssential: true,
        assumption: "Monthly operational cloud software toolchain.",
        period: "monthly",
      },
    ];
  }

  // Operating Model Adjustment (Home / Remote vs Commercial Facility)
  const isHomeOrOnline =
    operatingModel.includes("Home") ||
    operatingModel.includes("Online Only") ||
    operatingModel.includes("Remote");
  const isPhysicalFacility =
    operatingModel.includes("Physical") ||
    operatingModel.includes("Shop") ||
    operatingModel.includes("Commercial");

  if (isHomeOrOnline) {
    oneTimeLow = Math.round(oneTimeLow * 0.55);
    oneTimeTypical = Math.round(oneTimeTypical * 0.6);
    oneTimeHigh = Math.round(oneTimeHigh * 0.65);

    monthlyOpexLow = Math.round(monthlyOpexLow * 0.6);
    monthlyOpexTypical = Math.round(monthlyOpexTypical * 0.65);
    monthlyOpexHigh = Math.round(monthlyOpexHigh * 0.7);
  } else if (isPhysicalFacility) {
    oneTimeTypical = Math.round(oneTimeTypical * 1.15);
    oneTimeHigh = Math.round(oneTimeHigh * 1.25);
  }

  // Existing Resources Adjustment (Already owning equipment, tools, kiln, laptop, etc.)
  if (input.existingResources && input.existingResources.trim().length > 3) {
    const res = input.existingResources.toLowerCase();
    if (
      res.includes("own") ||
      res.includes("have") ||
      res.includes("equipment") ||
      res.includes("tools") ||
      res.includes("laptop") ||
      res.includes("oven") ||
      res.includes("kiln") ||
      res.includes("machine")
    ) {
      oneTimeLow = Math.round(oneTimeLow * 0.75);
      oneTimeTypical = Math.round(oneTimeTypical * 0.75);
      oneTimeHigh = Math.round(oneTimeHigh * 0.8);
      monthlyOpexTypical = Math.round(monthlyOpexTypical * 0.85);
    }
  }

  // Working Capital Buffer (3 months typical OpEx)
  const workingCapitalBuffer = Math.round(monthlyOpexTypical * 3);

  const totalCapitalLow = oneTimeLow + monthlyOpexLow * 2;
  const totalCapitalTypical = oneTimeTypical + workingCapitalBuffer;
  const totalCapitalHigh = oneTimeHigh + monthlyOpexHigh * 4;

  // Feasibility comparison with stated budget
  let budgetComparison: IdeaAssessmentData["budgetComparison"] = undefined;
  if (input.isBudgetUnknown || statedBudget === null) {
    budgetComparison = {
      userProvidedBudget: null,
      isBudgetUnknown: true,
      feasibilityVerdict: "ESTIMATION_ONLY",
      verdictTitle: "Budget Not Specified — Provisional Requirement Benchmark",
      explanation: `To launch this ${category} venture securely without operational anxiety, we recommend a minimum starting capital buffer of approximately ₹${totalCapitalLow.toLocaleString("en-IN")}. If starting from scratch, consider the Lean Option (estimated at ₹${leanStartupCost.toLocaleString("en-IN")}) to test customer willingness to pay first.`,
      essentialCapitalNeeded: oneTimeLow,
      deferrableExpensesAmount: Math.round(oneTimeTypical - oneTimeLow),
      riskIfUnderfunded: "High risk of premature cash exhaustion if orders ramp up slower than the 60-day break-even timeline.",
    };
  } else {
    const essentialOneTime = itemizedBudget.filter((b) => b.isEssential && b.period === "one-time").reduce((sum, b) => sum + b.lowEstimate, 0);
    const deferrableOneTime = itemizedBudget.filter((b) => !b.isEssential && b.period === "one-time").reduce((sum, b) => sum + b.typicalEstimate, 0);

    if (statedBudget >= totalCapitalTypical) {
      budgetComparison = {
        userProvidedBudget: statedBudget,
        isBudgetUnknown: false,
        feasibilityVerdict: "FEASIBLE",
        verdictTitle: "Strong Capital Alignment — Feasible Launch Horizon",
        explanation: `Your available budget of ₹${statedBudget.toLocaleString("en-IN")} comfortably covers the typical initial setup (₹${oneTimeTypical.toLocaleString("en-IN")}) PLUS a safe 3-month operational buffer (₹${workingCapitalBuffer.toLocaleString("en-IN")}). You have adequate room to invest in initial customer acquisition.`,
        essentialCapitalNeeded: essentialOneTime,
        deferrableExpensesAmount: deferrableOneTime,
        riskIfUnderfunded: "Low capital risk. Focus operational vigilance on unit economics and customer retention rather than cash survival.",
      };
    } else if (statedBudget >= totalCapitalLow) {
      budgetComparison = {
        userProvidedBudget: statedBudget,
        isBudgetUnknown: false,
        feasibilityVerdict: "TIGHT_RESOURCES",
        verdictTitle: "Moderate / Tight Capital Alignment — Disciplined Launch Required",
        explanation: `Your budget of ₹${statedBudget.toLocaleString("en-IN")} covers the essential setup requirements (₹${essentialOneTime.toLocaleString("en-IN")}), but leaves only a narrow buffer (under 2 months) for unexpected delays. Defer non-essential branding and expensive fixtures until initial revenue flows.`,
        essentialCapitalNeeded: essentialOneTime,
        deferrableExpensesAmount: deferrableOneTime,
        riskIfUnderfunded: "If customer breakeven takes longer than 60 days, you may face working capital strain before achieving profitability.",
      };
    } else {
      budgetComparison = {
        userProvidedBudget: statedBudget,
        isBudgetUnknown: false,
        feasibilityVerdict: "CAPITAL_CONSTRAINED",
        verdictTitle: "Capital Constrained for Full Launch — Lean MVP Strongly Advised",
        explanation: `A conventional full launch for a ${category} venture typically requires at least ₹${totalCapitalLow.toLocaleString("en-IN")}. Your current budget of ₹${statedBudget.toLocaleString("en-IN")} is below this threshold. Instead of taking on heavy debts or signing rigid leases, we strongly advise starting with the Lean MVP (est. ₹${leanStartupCost.toLocaleString("en-IN")}).`,
        essentialCapitalNeeded: essentialOneTime,
        deferrableExpensesAmount: deferrableOneTime,
        riskIfUnderfunded: "Severe risk of running out of money before securing steady paying customers. Fixed lease and deposit commitments could cause acute financial distress.",
      };
    }
  }

  return {
    businessCategory: category,
    summary: `A targeted ${category} concept designed to operate in ${location}. Built to address acute customer demand with modern operational predictability and a streamlined ${operatingModel.toLowerCase()} delivery framework.`,
    targetCustomer: {
      group: `Urban consumers, working professionals, and commercial clients in ${location} seeking dependable quality and transparent pricing.`,
      problemSolved: `Eliminates the acute frustration of inconsistent service standards, unpredictable delivery times, and opaque pricing in current local market alternatives.`,
      painPointUrgency: "High",
    },
    proposedBusinessModel: {
      description: `Direct customer engagement combined with recurring relationship tiers to maximize customer lifetime value (LTV) and gross margin predictability.`,
      monetizationTypes: ["Direct on-demand transaction billing", "Weekly / monthly recurring subscription plans", "High-margin ancillary product add-ons"],
      pricingStrategy: `Value-aligned mid-market pricing: competitive with organized alternatives while maintaining 45-55% healthy gross margins.`,
    },
    operationalRequirements: {
      operatingModality: operatingModel,
      premisesNeeded: isCloudKitchen
        ? "200 to 350 sq.ft commercial kitchen space with ventilation, 3-phase electricity, and municipal water supply."
        : isRetail
        ? "150 to 300 sq.ft high-visibility retail boutique space with storefront display."
        : isTech
        ? "Remote home office or flexible co-working desk with reliable gigabit broadband connection."
        : "Flexible 100-200 sq.ft private office or mobile client-servicing toolkit.",
      keyProcesses: [
        "Inbound lead capture and order processing protocol",
        "Daily quality check, fulfillment batching and hygienic dispatch",
        "Automated customer notification and review feedback loop",
        "Weekly supplier inventory audit and invoice reconciliation",
      ],
    },
    equipmentAndResources: {
      physicalEquipment,
      toolsAndTechnology: toolsAndTech,
      premisesOrSpace: isCloudKitchen
        ? "Dedicated hygienic food preparation zone with grease trap and exhaust"
        : "Dedicated organized workspace meeting local municipal zoning laws",
      licensesAndCompliance: licenses,
    },
    staffingAndTalent: {
      initialTeamStructure,
      canStartSolo: !isCloudKitchen,
      recommendedFirstHires,
      estimatedMonthlyPayrollRange: {
        low: monthlyOpexLow * 0.4,
        high: monthlyOpexTypical * 0.45,
      },
    },
    financialEstimates: {
      currency: "₹",
      oneTimeStartupRange: {
        low: oneTimeLow,
        typical: oneTimeTypical,
        high: oneTimeHigh,
      },
      recurringMonthlyOpexRange: {
        low: monthlyOpexLow,
        typical: monthlyOpexTypical,
        high: monthlyOpexHigh,
      },
      suggestedWorkingCapitalMonths: 3,
      suggestedWorkingCapitalBuffer: workingCapitalBuffer,
      totalRecommendedCapital: {
        low: totalCapitalLow,
        typical: totalCapitalTypical,
        high: totalCapitalHigh,
      },
      keyBudgetDrivers,
      itemizedBudget,
    },
    budgetComparison,
    revenueAndAssumptions: {
      primaryRevenueSources: [
        "Primary service or product sales (60-70% of gross revenue)",
        "Recurring customer subscription commitments (20-30% of gross revenue)",
        "Premium corporate or bespoke event bookings (10-15% of gross revenue)",
      ],
      keyUnitAssumptions: [
        "Average order value (AOV) modeled at ₹180 - ₹350 per customer interaction",
        "Initial customer repeat rate modeled at 28-35% within 30 days of first purchase",
        "Customer acquisition cost (CAC) kept below ₹120 via word-of-mouth and localized digital outreach",
      ],
      projectedBreakevenHorizon: "5 to 8 months from public launch under disciplined cost control",
    },
    risksAndUncertainties: {
      criticalRisks: [
        "Customer adoption velocity slower than anticipated during the first 60 days",
        "Supplier raw material price fluctuation impacting initial gross margin buffers",
        "Local regulatory or licensing delays prior to public marketing launch",
      ],
      unvalidatedAssumptions: [
        "Exact customer willingness to pay current price point without heavy discount incentives",
        "Dependability of initial key supplier dispatch timelines during peak periods",
        "Daily active order volume required to maintain full kitchen or staff utilization",
      ],
      regulatoryHurdles: licenses.slice(0, 2),
    },
    leanAlternative: {
      title: leanTitle,
      description: leanDesc,
      estimatedLeanStartupCost: leanStartupCost,
      keyCompromisesOrFocus: "Focus strictly on product quality and direct customer feedback; zero spend on fancy storefronts, expensive decor, or speculative inventory.",
      validationMilestoneBeforeFullSpend: "Achieve 25 paying repeat customers who would recommend your offering before committing to fixed long-term leases.",
    },
    unansweredQuestions: [
      "What is the exact price tier your first 20 target customers are willing to pay without discounts?",
      "Can you secure written supplier terms with 15-day payment cycles rather than 100% advance payments?",
      "What specific distribution channel will deliver your first 50 transactions at near-zero marketing cost?",
    ],
    recommendedNextSteps: [
      "1. Conduct 15 structured discovery interviews with real target customers in your chosen location.",
      "2. Refine your startup budget assumptions and verify local licensing costs with municipal authorities.",
      "3. Execute the Lean MVP experiment to validate paying demand before signing binding premises leases.",
      "4. Synthesize these validated inputs into BizMind's institutional 17-section Business Plan and Execution Roadmap.",
    ],
    disclaimer: "These financial figures, cost breakdowns, and timelines are preliminary algorithmic estimates designed for venture exploration and scenario planning. They do not constitute certified market quotations, banking guarantees, or financial advisory. Actual costs depend on your local supplier negotiations, legal agreements, and real-time market conditions.",
  };
}
