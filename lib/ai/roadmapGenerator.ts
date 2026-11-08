import { BusinessContextInput } from "./types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";
import { PhaseRequirement } from "../roadmap/engine";

export interface GeneratedRoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  objective: string;
  rationale: string;
  expectedOutcome: string;
  duration: string;
  dependencies: string[];
  priority: "Critical" | "High" | "Medium" | "Low";
  riskLevel: "High" | "Medium" | "Low";
  requiredResources: string[];
  deliverables: string[];
  completionCriteria: string;
  requirements: PhaseRequirement[];
  estimatedCost: number;
  startDate?: string;
  dueDate?: string;
  tasks: Array<{ id: string; title: string; completed: boolean }>;
}

export async function generatePersonalizedRoadmap(
  context: BusinessContextInput
): Promise<GeneratedRoadmapPhase[]> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are BizMind's Principal Growth & Operations Architect.
Generate a structured, personalized business execution roadmap (4 to 6 strategic phases) for:
Business Name: ${context.businessName}
Industry: ${context.businessType}
Location: ${context.location}
Concept: ${context.idea}
Available Budget: ₹${context.budget}
Current Stage: ${context.stage}
Key Goals: ${Array.isArray(context.goals) ? context.goals.join(", ") : context.goals}
Resources: ${context.resources}

Each phase must have concrete requirements connected to real platform modules (employees, tasks, finances, business-plan).
Return JSON strictly with a "phases" array matching this structure:
{
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase title",
      "description": "Short summary",
      "objective": "Clear strategic objective",
      "rationale": "Why this phase is necessary for this specific business",
      "expectedOutcome": "Measurable outcome",
      "duration": "3-4 Weeks",
      "dependencies": [],
      "priority": "Critical" | "High" | "Medium" | "Low",
      "riskLevel": "High" | "Medium" | "Low",
      "requiredResources": ["resource 1", "resource 2"],
      "deliverables": ["deliverable 1", "deliverable 2"],
      "completionCriteria": "What defines completion",
      "estimatedCost": 50000,
      "requirements": [
        {
          "id": "req-1-1",
          "title": "Action item",
          "description": "Details",
          "type": "HIRE_EMPLOYEE" | "CREATE_TASK" | "COMPLETE_TASK" | "RECORD_EXPENSE" | "RECORD_INCOME" | "RECORD_TRANSACTION" | "COMPLETE_PLAN_SECTION",
          "targetValue": 2,
          "unit": "employees" | "tasks" | "₹" | "sections",
          "linkedModule": "employees" | "tasks" | "finances" | "business-plan",
          "actionUrl": "/employees" | "/tasks" | "/finances" | "/business-plan",
          "actionLabel": "Action button text",
          "weight": 1
        }
      ],
      "tasks": [
        { "id": "t1-1", "title": "Milestone subtask 1", "completed": false }
      ]
    }
  ]
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "You are an elite operational roadmap AI. Return valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      if (Array.isArray(parsed.phases) && parsed.phases.length > 0) {
        return parsed.phases as GeneratedRoadmapPhase[];
      }
    } catch (err) {
      console.warn("OpenAI Roadmap generation failed, falling back to intelligent generator:", err);
    }
  }

  // Intelligent Context-Aware Tailored Generator
  const name = context.businessName || "My Venture";
  const type = context.businessType || "General Business";
  const loc = context.location || "Local Market";
  const budget = Number(context.budget) || 1000000;
  const isTech = type.toLowerCase().includes("tech") || type.toLowerCase().includes("software");
  const isFoodOrRetail =
    type.toLowerCase().includes("food") ||
    type.toLowerCase().includes("retail") ||
    type.toLowerCase().includes("e-commerce");

  const today = new Date();
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const p1Cost = Math.round(budget * 0.15);
  const p2Cost = Math.round(budget * 0.25);
  const p3Cost = Math.round(budget * 0.3);
  const p4Cost = Math.round(budget * 0.2);
  const p5Cost = Math.round(budget * 0.1);

  if (isFoodOrRetail) {
    return [
      {
        phaseNumber: 1,
        title: "Foundation, Supplier Onboarding & Budgeting",
        description: `Establish core legal, supply-chain, and financial groundwork for ${name} in ${loc}.`,
        objective: "Lock down supplier terms, allocate startup budget, and formulate the master operating blueprint.",
        rationale: `In the ${type} sector, early supply disruptions and unmonitored prep costs can quickly drain capital. Securing wholesale pricing upfront establishes high gross margins.`,
        expectedOutcome: "Finalized unit costs, confirmed vendors, locked launch budget, and active operational dashboard.",
        duration: "3 Weeks",
        dependencies: [],
        priority: "Critical",
        riskLevel: "Medium",
        requiredResources: ["Supply procurement contracts", "Financial ledger", "Core founder time"],
        deliverables: ["Supplier terms matrix", "Startup expenditure ledger", "Core business plan draft"],
        completionCriteria: "Initial budget recorded in finances, core plan sections saved, and 3 supplier tasks created.",
        estimatedCost: p1Cost,
        startDate: addDays(0),
        dueDate: addDays(21),
        requirements: [
          {
            id: "req-p1-1",
            title: "Record Startup Budget & Initial Expenses",
            description: "Log your first equipment, licensing or supplier expense transaction in the Finances module.",
            type: "RECORD_TRANSACTION",
            targetValue: 1,
            unit: "transactions",
            linkedModule: "finances",
            actionUrl: "/finances",
            actionLabel: "Record Expense",
            weight: 2,
          },
          {
            id: "req-p1-2",
            title: "Draft Strategic Business Plan",
            description: "Draft and review the Problem, Solution, and Operations sections of your Business Plan.",
            type: "COMPLETE_PLAN_SECTION",
            targetValue: 1,
            unit: "blueprint",
            linkedModule: "business-plan",
            actionUrl: "/business-plan",
            actionLabel: "Open Business Plan",
            weight: 1,
          },
          {
            id: "req-p1-3",
            title: "Create Initial Supplier & Setup Tasks",
            description: "Define at least 3 operational tasks in the Task Manager for location/vendor readiness.",
            type: "CREATE_TASK",
            targetValue: 3,
            unit: "tasks",
            linkedModule: "tasks",
            actionUrl: "/tasks",
            actionLabel: "Add Tasks",
            weight: 1,
          },
        ],
        tasks: [
          { id: "t1-1", title: "Finalize wholesale supply agreements & delivery terms", completed: false },
          { id: "t1-2", title: "Apply for local municipal commercial permits and food safety licenses", completed: false },
          { id: "t1-3", title: "Set up inventory tracking and initial recipe/SKU cost calculator", completed: false },
        ],
      },
      {
        phaseNumber: 2,
        title: "Facility Setup, Equipment & Core Staffing",
        description: `Commission the kitchen or retail space and hire the frontline operations crew.`,
        objective: "Get the physical location inspection-ready and hire key team members to oversee daily prep.",
        rationale: "Consistent product quality requires trained staff with defined operational responsibilities prior to receiving the first paying order.",
        expectedOutcome: "Operating workspace, trained personnel, and completed hygiene/safety workflows.",
        duration: "4 Weeks",
        dependencies: ["Foundation, Supplier Onboarding & Budgeting"],
        priority: "High",
        riskLevel: "Medium",
        requiredResources: ["Commercial appliances", "Storefront/Kitchen facility", "Safety checklist"],
        deliverables: ["Kitchen inspection clearance", "Employee contracts", "Equipment manual SOP"],
        completionCriteria: "At least 1 core employee added, 4 facility tasks created, and 2 completed.",
        estimatedCost: p2Cost,
        startDate: addDays(22),
        dueDate: addDays(50),
        requirements: [
          {
            id: "req-p2-1",
            title: "Hire Core Operations Member / Head Cook",
            description: "Add your first lead employee to the Employees module with defined role and salary.",
            type: "HIRE_EMPLOYEE",
            targetValue: 1,
            unit: "employees",
            linkedModule: "employees",
            actionUrl: "/employees",
            actionLabel: "Add Employee",
            weight: 2,
          },
          {
            id: "req-p2-2",
            title: "Create & Assign 4 Operational Setup Tasks",
            description: "Organize setup responsibilities across your team inside Task Manager.",
            type: "CREATE_TASK",
            targetValue: 4,
            unit: "tasks",
            linkedModule: "tasks",
            actionUrl: "/tasks",
            actionLabel: "Assign Tasks",
            weight: 1,
          },
          {
            id: "req-p2-3",
            title: "Complete at least 2 Setup Tasks",
            description: "Verify and mark facility inspection and equipment onboarding as Completed in Tasks.",
            type: "COMPLETE_TASK",
            targetValue: 2,
            unit: "tasks",
            linkedModule: "tasks",
            actionUrl: "/tasks",
            actionLabel: "View Pipeline",
            weight: 2,
          },
        ],
        tasks: [
          { id: "t2-1", title: "Install commercial refrigerators, cookware, and prep counters", completed: false },
          { id: "t2-2", title: "Conduct trial batch production and measure ingredient waste", completed: false },
          { id: "t2-3", title: "Draft hygiene protocols and daily opening/closing checklists", completed: false },
        ],
      },
      {
        phaseNumber: 3,
        title: "Soft Launch & Customer Validation",
        description: `Run a controlled pilot launch with select corporate teams and neighborhood patrons in ${loc}.`,
        objective: "Validate order turnaround time, customer taste ratings, and packaging durability with real customers.",
        rationale: "Testing with a smaller audience catches operational bottlenecks before scaling public marketing.",
        expectedOutcome: "Initial revenue transactions, verified customer review scores, and dialed-in dispatch times.",
        duration: "3 Weeks",
        dependencies: ["Facility Setup, Equipment & Core Staffing"],
        priority: "High",
        riskLevel: "Low",
        requiredResources: ["Trial inventory batches", "Feedback survey cards", "Delivery packaging"],
        deliverables: ["50 Pilot order delivery reports", "Customer satisfaction summary", "Packaging stress test"],
        completionCriteria: "At least 1 income transaction recorded in Finances, and 3 tasks completed.",
        estimatedCost: p3Cost,
        startDate: addDays(51),
        dueDate: addDays(72),
        requirements: [
          {
            id: "req-p3-1",
            title: "Record First Customer Sales Inflow",
            description: "Log your first sales revenue transaction into the Finances ledger to verify monetization.",
            type: "RECORD_INCOME",
            targetValue: 1,
            unit: "sales transaction",
            linkedModule: "finances",
            actionUrl: "/finances",
            actionLabel: "Add Income",
            weight: 2,
          },
          {
            id: "req-p3-2",
            title: "Complete 3 Pilot Operational Tasks",
            description: "Mark sample dispatch, feedback logging, and turnaround timing tasks completed.",
            type: "COMPLETE_TASK",
            targetValue: 3,
            unit: "tasks",
            linkedModule: "tasks",
            actionUrl: "/tasks",
            actionLabel: "Complete Tasks",
            weight: 2,
          },
        ],
        tasks: [
          { id: "t3-1", title: "Deliver first 25 corporate trial orders to tech park clients", completed: false },
          { id: "t3-2", title: "Collect structured feedback on portion size, pricing, and freshness", completed: false },
          { id: "t3-3", title: "Calibrate packaging to eliminate leakage during transit", completed: false },
        ],
      },
      {
        phaseNumber: 4,
        title: "Full Commercial Launch & Marketing Blitz",
        description: `Activate direct-to-consumer digital channels and corporate catering subscriptions.`,
        objective: "Achieve cash flow break-even by scaling order volume and locking in recurring corporate accounts.",
        rationale: "With operations proven, deploying aggressive local acquisition builds defensible customer habits.",
        expectedOutcome: "Daily recurring orders, positive gross contribution, and expansion of delivery radius.",
        duration: "6 Weeks",
        dependencies: ["Soft Launch & Customer Validation"],
        priority: "Critical",
        riskLevel: "Medium",
        requiredResources: ["Digital marketing spend", "Branded delivery fleet", "Loyalty referral cards"],
        deliverables: ["Weekly P&L statement", "B2B corporate subscription pipeline", "Customer retention report"],
        completionCriteria: "Add second team member, record at least 3 transactions, and complete marketing tasks.",
        estimatedCost: p4Cost,
        startDate: addDays(73),
        dueDate: addDays(115),
        requirements: [
          {
            id: "req-p4-1",
            title: "Expand Team to 2+ Active Staff",
            description: "Bring on delivery coordinator or counter staff to handle rising order velocity.",
            type: "HIRE_EMPLOYEE",
            targetValue: 2,
            unit: "employees",
            linkedModule: "employees",
            actionUrl: "/employees",
            actionLabel: "Hire Staff",
            weight: 2,
          },
          {
            id: "req-p4-2",
            title: "Record Recurring Sales Transactions",
            description: "Maintain accurate P&L by recording transactions consistently in Finances.",
            type: "RECORD_TRANSACTION",
            targetValue: 3,
            unit: "transactions",
            linkedModule: "finances",
            actionUrl: "/finances",
            actionLabel: "Manage Ledger",
            weight: 2,
          },
          {
            id: "req-p4-3",
            title: "Complete Go-To-Market Tasks",
            description: "Execute Google Business profile, social campaign, and corporate outreach tasks.",
            type: "COMPLETE_TASK",
            targetValue: 4,
            unit: "tasks",
            linkedModule: "tasks",
            actionUrl: "/tasks",
            actionLabel: "View Tasks",
            weight: 1,
          },
        ],
        tasks: [
          { id: "t4-1", title: "Launch targeted Instagram and local Google Ads within 5km radius", completed: false },
          { id: "t4-2", title: "Sign 3 corporate office pantry subscription contracts", completed: false },
          { id: "t4-3", title: "Review monthly unit economics and trim lowest-margin menu items", completed: false },
        ],
      },
      {
        phaseNumber: 5,
        title: "Multi-Hub Scale & Margin Expansion",
        description: `Optimize procurement bulk margins and evaluate secondary cloud kitchen or franchise expansion.`,
        objective: "Boost net profit margins above 25% by renegotiating bulk contracts and expanding service footprint.",
        rationale: "Long-term sustainability requires locking in purchasing discounts and standardizing hub playbooks.",
        expectedOutcome: "Self-sustaining operating cash flow, institutional executive audit, and expansion roadmap.",
        duration: "8 Weeks",
        dependencies: ["Full Commercial Launch & Marketing Blitz"],
        priority: "Medium",
        riskLevel: "Low",
        requiredResources: ["Growth capital", "Franchise SOP handbook", "Executive reporting telemetry"],
        deliverables: ["Quarterly Executive Audit Report", "Expansion feasibility deck", "Automated inventory sync"],
        completionCriteria: "3+ team members, at least 5 transactions recorded, and comprehensive audit report compiled.",
        estimatedCost: p5Cost,
        startDate: addDays(116),
        dueDate: addDays(172),
        requirements: [
          {
            id: "req-p5-1",
            title: "Scale Team to 3+ Active Employees",
            description: "Support multi-shift operations and corporate delivery logistics.",
            type: "HIRE_EMPLOYEE",
            targetValue: 3,
            unit: "employees",
            linkedModule: "employees",
            actionUrl: "/employees",
            actionLabel: "Workforce",
            weight: 2,
          },
          {
            id: "req-p5-2",
            title: "Record At Least 5 Verified Transactions",
            description: "Demonstrate continuous cash velocity in the financial ledger.",
            type: "RECORD_TRANSACTION",
            targetValue: 5,
            unit: "transactions",
            linkedModule: "finances",
            actionUrl: "/finances",
            actionLabel: "Ledger",
            weight: 2,
          },
        ],
        tasks: [
          { id: "t5-1", title: "Renegotiate wholesale vendor pricing for 10% volume discount", completed: false },
          { id: "t5-2", title: "Conduct feasibility study for secondary delivery pod location", completed: false },
          { id: "t5-3", title: "Generate Quarterly Executive Financial Report in Reports module", completed: false },
        ],
      },
    ];
  }

  // Tech / Software / Service / Generic Default Roadmap
  return [
    {
      phaseNumber: 1,
      title: "Problem Validation, Tech Architecture & Blueprinting",
      description: `Validate customer willingness to pay and design the core technical and operational architecture for ${name}.`,
      objective: "Conduct target customer discovery, outline MVP user stories, and establish the strategic business plan.",
      rationale: `Building features before validating user pain points is the primary cause of tech venture failure. Documenting architecture upfront controls engineering burn.`,
      expectedOutcome: "Validated value proposition, wireframe specs, formal business plan, and defined operational tasks.",
      duration: "4 Weeks",
      dependencies: [],
      priority: "Critical",
      riskLevel: "Medium",
      requiredResources: ["Customer interview scripts", "Prototyping software", "Business planning blueprint"],
      deliverables: ["Customer problem interview summary", "MVP Architecture document", "Saved Business Plan blueprint"],
      completionCriteria: "Save core business plan, record startup investment/budget, and create 3 validation tasks.",
      estimatedCost: p1Cost,
      startDate: addDays(0),
      dueDate: addDays(28),
      requirements: [
        {
          id: "req-p1-1",
          title: "Draft Complete Business Plan",
          description: "Open the Business Plan module and generate your personalized 17-section venture blueprint.",
          type: "COMPLETE_PLAN_SECTION",
          targetValue: 1,
          unit: "plan",
          linkedModule: "business-plan",
          actionUrl: "/business-plan",
          actionLabel: "Generate Plan",
          weight: 2,
        },
        {
          id: "req-p1-2",
          title: "Record Initial Capital or Budget Inflow",
          description: "Log your founder capital or starting reserve transaction into the Finances ledger.",
          type: "RECORD_TRANSACTION",
          targetValue: 1,
          unit: "transaction",
          linkedModule: "finances",
          actionUrl: "/finances",
          actionLabel: "Record Budget",
          weight: 2,
        },
        {
          id: "req-p1-3",
          title: "Create 3 Customer Validation Tasks",
          description: "Populate Task Manager with user interviews, competitive audits, and prototype reviews.",
          type: "CREATE_TASK",
          targetValue: 3,
          unit: "tasks",
          linkedModule: "tasks",
          actionUrl: "/tasks",
          actionLabel: "Create Tasks",
          weight: 1,
        },
      ],
      tasks: [
        { id: "t1-1", title: "Interview 15 ideal customers in target demographic", completed: false },
        { id: "t1-2", title: "Create clickable Figma prototype of core user onboarding flow", completed: false },
        { id: "t1-3", title: "Define technical stack, cloud infrastructure, and database schemas", completed: false },
      ],
    },
    {
      phaseNumber: 2,
      title: "Core Product Engineering & Team Assembly",
      description: `Build the working Minimum Viable Product (MVP) and hire the technical or domain lead.`,
      objective: "Complete initial functional prototype with secure auth, core logic, and database persistence.",
      rationale: "Accelerating to a testable prototype allows early user testing with real production telemetry.",
      expectedOutcome: "Deployed test staging environment, assigned engineering backlog, and active lead hire.",
      duration: "6 Weeks",
      dependencies: ["Problem Validation, Tech Architecture & Blueprinting"],
      priority: "Critical",
      riskLevel: "High",
      requiredResources: ["Dev staging environment", "Code repository", "Lead developer / PM"],
      deliverables: ["Deployed staging MVP", "API documentation", "Assigned sprint tasks"],
      completionCriteria: "Hire 1 core team member, create 4 development tasks, and complete at least 2.",
      estimatedCost: p2Cost,
      startDate: addDays(29),
      dueDate: addDays(71),
      requirements: [
        {
          id: "req-p2-1",
          title: "Hire Lead Developer or Operations Specialist",
          description: "Add your key collaborator to the Employees module with defined compensation.",
          type: "HIRE_EMPLOYEE",
          targetValue: 1,
          unit: "employees",
          linkedModule: "employees",
          actionUrl: "/employees",
          actionLabel: "Add Employee",
          weight: 2,
        },
        {
          id: "req-p2-2",
          title: "Create 4 Sprint Development Tasks",
          description: "Break the MVP down into trackable engineering and design milestones.",
          type: "CREATE_TASK",
          targetValue: 4,
          unit: "tasks",
          linkedModule: "tasks",
          actionUrl: "/tasks",
          actionLabel: "Create Tasks",
          weight: 1,
        },
        {
          id: "req-p2-3",
          title: "Complete 2 Core Engineering Tasks",
          description: "Advance milestone status by completing authentication and database features in Tasks.",
          type: "COMPLETE_TASK",
          targetValue: 2,
          unit: "tasks",
          linkedModule: "tasks",
          actionUrl: "/tasks",
          actionLabel: "Complete Tasks",
          weight: 2,
        },
      ],
      tasks: [
        { id: "t2-1", title: "Build core user authentication, session security, and role guards", completed: false },
        { id: "t2-2", title: "Implement primary product feature and user workflow dashboard", completed: false },
        { id: "t2-3", title: "Configure production automated database backups and monitoring", completed: false },
      ],
    },
    {
      phaseNumber: 3,
      title: "Private Beta Testing & First Monetization",
      description: `Onboard initial pilot cohort to collect user retention metrics and secure first paying customers.`,
      objective: "Confirm product-market fit signal through active weekly user retention and first paid transactions.",
      rationale: "Real customer willingness to swipe a card or pay an invoice validates real commercial value.",
      expectedOutcome: "Initial revenue transaction recorded, bug backlog resolved, and verified NPS feedback.",
      duration: "4 Weeks",
      dependencies: ["Core Product Engineering & Team Assembly"],
      priority: "High",
      riskLevel: "Medium",
      requiredResources: ["Beta onboarding forms", "Analytics event tracking", "Payment gateway"],
      deliverables: ["Beta user feedback report", "Payment gateway integration", "Crash telemetry review"],
      completionCriteria: "Record at least 1 revenue transaction and complete 3 operational beta tasks.",
      estimatedCost: p3Cost,
      startDate: addDays(72),
      dueDate: addDays(100),
      requirements: [
        {
          id: "req-p3-1",
          title: "Record First Paid Customer Revenue",
          description: "Log your first customer payment, invoice or subscription in the Finances ledger.",
          type: "RECORD_INCOME",
          targetValue: 1,
          unit: "revenue transaction",
          linkedModule: "finances",
          actionUrl: "/finances",
          actionLabel: "Record Income",
          weight: 3,
        },
        {
          id: "req-p3-2",
          title: "Complete 3 Beta Feedback & Bugfix Tasks",
          description: "Resolve beta tester friction points and polish the user journey.",
          type: "COMPLETE_TASK",
          targetValue: 3,
          unit: "tasks",
          linkedModule: "tasks",
          actionUrl: "/tasks",
          actionLabel: "Tasks Pipeline",
          weight: 2,
        },
      ],
      tasks: [
        { id: "t3-1", title: "Onboard 20 private beta testers and observe onboarding drop-off", completed: false },
        { id: "t3-2", title: "Integrate payment processing and automated receipt generation", completed: false },
        { id: "t3-3", title: "Conduct user feedback exit interviews with top 5 active users", completed: false },
      ],
    },
    {
      phaseNumber: 4,
      title: "Public Launch & Customer Acquisition Engine",
      description: `Execute comprehensive go-to-market rollout across content, paid acquisition, and B2B partnerships.`,
      objective: "Acquire first 100 paying customers and stabilize customer acquisition cost (CAC) to LTV ratio.",
      rationale: "Scaling customer acquisition requires diversified distribution channels and a responsive support team.",
      expectedOutcome: "Consistent monthly recurring revenue, active growth channels, and dedicated support staff.",
      duration: "8 Weeks",
      dependencies: ["Private Beta Testing & First Monetization"],
      priority: "Critical",
      riskLevel: "Medium",
      requiredResources: ["Ad spend budget", "Marketing collateral", "Customer success rep"],
      deliverables: ["Product Hunt / PR launch campaign", "Paid acquisition performance dashboard", "Sales deck"],
      completionCriteria: "Hire second employee, record 3+ transactions, and complete GTM tasks.",
      estimatedCost: p4Cost,
      startDate: addDays(101),
      dueDate: addDays(157),
      requirements: [
        {
          id: "req-p4-1",
          title: "Hire Customer Success or Marketing Specialist",
          description: "Scale team headcount to 2+ active members to handle inbound prospects and customer queries.",
          type: "HIRE_EMPLOYEE",
          targetValue: 2,
          unit: "employees",
          linkedModule: "employees",
          actionUrl: "/employees",
          actionLabel: "Add Team Member",
          weight: 2,
        },
        {
          id: "req-p4-2",
          title: "Maintain Live Transaction Ledger",
          description: "Record at least 3 customer subscription, sale, or operating expense transactions.",
          type: "RECORD_TRANSACTION",
          targetValue: 3,
          unit: "transactions",
          linkedModule: "finances",
          actionUrl: "/finances",
          actionLabel: "View Ledger",
          weight: 2,
        },
        {
          id: "req-p4-3",
          title: "Complete 4 Launch Milestones",
          description: "Execute marketing outreach, social announcements, and community webinars in Tasks.",
          type: "COMPLETE_TASK",
          targetValue: 4,
          unit: "tasks",
          linkedModule: "tasks",
          actionUrl: "/tasks",
          actionLabel: "Manage Tasks",
          weight: 1,
        },
      ],
      tasks: [
        { id: "t4-1", title: "Launch publicly on Product Hunt, LinkedIn, and relevant niche communities", completed: false },
        { id: "t4-2", title: "Publish 4 authoritative search-optimized problem-solving case studies", completed: false },
        { id: "t4-3", title: "Track unit economics: verify Customer Acquisition Cost (CAC) < LTV / 3", completed: false },
      ],
    },
    {
      phaseNumber: 5,
      title: "Scale, Unit Economics & Institutional Governance",
      description: `Formalize institutional governance, compile performance audits, and optimize net profit margins.`,
      objective: "Reach sustainable profitability, automate operational reporting, and prepare investor data room.",
      rationale: "Scaling requires robust financial discipline, compliance audits, and repeatable management rhythms.",
      expectedOutcome: "Profitable operating margins, audited executive report archive, and multi-quarter roadmap.",
      duration: "8 Weeks",
      dependencies: ["Public Launch & Customer Acquisition Engine"],
      priority: "Medium",
      riskLevel: "Low",
      requiredResources: ["Executive reporting telemetry", "Legal compliance review", "Growth capital"],
      deliverables: ["Institutional Executive Report", "Quarterly board deck", "Automated KPI telemetry"],
      completionCriteria: "Maintain 3+ employees, record 5+ transactions, and compile executive report.",
      estimatedCost: p5Cost,
      startDate: addDays(158),
      dueDate: addDays(214),
      requirements: [
        {
          id: "req-p5-1",
          title: "Maintain 3+ Active Organization Team Members",
          description: "Grow core cross-functional team in engineering, marketing, and operations.",
          type: "HIRE_EMPLOYEE",
          targetValue: 3,
          unit: "employees",
          linkedModule: "employees",
          actionUrl: "/employees",
          actionLabel: "Manage Team",
          weight: 2,
        },
        {
          id: "req-p5-2",
          title: "Record At Least 5 Verified Financial Transactions",
          description: "Demonstrate healthy cash velocity and financial transparency.",
          type: "RECORD_TRANSACTION",
          targetValue: 5,
          unit: "transactions",
          linkedModule: "finances",
          actionUrl: "/finances",
          actionLabel: "Finances",
          weight: 2,
        },
      ],
      tasks: [
        { id: "t5-1", title: "Conduct quarterly pricing review and introduce annual prepaid subscription tier", completed: false },
        { id: "t5-2", title: "Generate formal Executive Performance Audit in Reports module", completed: false },
        { id: "t5-3", title: "Establish key executive quarterly OKRs and performance incentive plans", completed: false },
      ],
    },
  ];
}
