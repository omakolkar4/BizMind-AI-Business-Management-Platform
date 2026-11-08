import { AdvisorContextData, AdvisorResponse } from "./types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";
import { formatCurrency } from "../utils";

export interface ExtendedAdvisorResponse extends AdvisorResponse {
  recommendation?: string;
  evidence?: string;
  explanation?: string;
  estimatesAndAssumptions?: string;
  risksAndUncertainty?: string;
  relevantLinks?: Array<{ label: string; href: string }>;
}

export async function askBusinessAdvisor(
  question: string,
  context: AdvisorContextData,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<ExtendedAdvisorResponse> {
  const openai = getOpenAIClient();

  const hasFinancialData = context.revenue > 0 || context.expenses > 0;
  const hasEmployees = context.employeeCount > 0;
  const hasTasks = context.tasksCount.total > 0;

  if (!isDemoMode() && openai) {
    try {
      const systemPrompt = `You are BizMind AI — an elite AI Startup Mentor, CFO, and Growth Strategist for the venture "${context.businessName}" (${context.businessType} in ${context.location}).

Current Business Live Data & Operational Telemetry:
- Verified Revenue: ₹${context.revenue.toLocaleString("en-IN")}
- Verified Expenses: ₹${context.expenses.toLocaleString("en-IN")}
- Net Profit / Loss: ₹${context.netProfit.toLocaleString("en-IN")} (Net Margin: ${context.profitMargin.toFixed(1)}%)
- Total Investment: ₹${context.investments.toLocaleString("en-IN")}
- Active Team Members: ${context.employeeCount}
- Tasks: Total ${context.tasksCount.total} (${context.tasksCount.completed} completed, ${context.tasksCount.inProgress} in progress, ${context.tasksCount.todo} to-do, ${context.tasksCount.blocked} blocked)
- Has Live Financial Records: ${hasFinancialData ? "Yes" : "No (Empty ledger)"}

Answer the user's question as a rigorous business mentor.
Follow this 7-part response discipline:
1. Recommendation: Clear, direct 1-2 sentence recommendation.
2. Evidence: Cite the specific numbers and live data supporting this.
3. Explanation: Detailed strategic rationale.
4. Priority Actions: 2-3 concrete, actionable steps.
5. Estimates & Assumptions: Cost, duration, and explicitly labeled assumptions (never invent unverified facts).
6. Risks & Uncertainty: What could go wrong and what risks must be guarded against.
7. Action Prompt: If an actionable task should be created, propose a concrete task.

Return a valid JSON object strictly matching this schema:
{
  "recommendation": "Short direct recommendation.",
  "evidence": "Observed evidence from records.",
  "explanation": "Strategic explanation and context.",
  "priorityActions": ["Action 1", "Action 2", "Action 3"],
  "estimatesAndAssumptions": "Cost range, timeline, and labeled assumptions.",
  "risksAndUncertainty": "Key execution risks to watch.",
  "sentiment": "positive" | "warning" | "neutral" | "urgent",
  "contextUsed": ["Revenue", "Expenses", "Workforce", etc.],
  "actionPrompt": {
    "actionType": "CREATE_TASK",
    "title": "Concise task title",
    "description": "Task description and deliverables",
    "category": "Operations" | "Marketing" | "Finance" | "General",
    "priority": "High" | "Medium",
    "suggestedBudget": 15000,
    "successMetric": "Target metric to measure"
  }
}`;

      const messages: any[] = [{ role: "system", content: systemPrompt }];
      for (const msg of conversationHistory.slice(-4)) {
        messages.push({ role: msg.role, content: msg.content });
      }
      messages.push({ role: "user", content: question });

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages,
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      const answer = `${parsed.recommendation || ""}\n\n${parsed.explanation || ""}`;

      return {
        answer: answer.trim() || parsed.recommendation || "Here is your business recommendation.",
        recommendation: parsed.recommendation,
        evidence: parsed.evidence,
        explanation: parsed.explanation,
        priorityActions: parsed.priorityActions || [
          "Review upcoming operational expenditures",
          "Follow up on pending team tasks",
        ],
        estimatesAndAssumptions: parsed.estimatesAndAssumptions,
        risksAndUncertainty: parsed.risksAndUncertainty,
        sentiment: parsed.sentiment || "neutral",
        contextUsed: parsed.contextUsed || ["Financials", "Operations"],
        actionPrompt: parsed.actionPrompt,
        relevantLinks: [
          { label: "Finances & P&L", href: "/finances" },
          { label: "Task Manager", href: "/tasks" },
          { label: "Roadmap", href: "/roadmap" },
        ],
      };
    } catch (err) {
      console.warn("OpenAI Advisor call failed, using intelligent context fallback:", err);
    }
  }

  // Realistic Context-Aware Deterministic Mentor Engine
  const q = question.toLowerCase();
  const rev = formatCurrency(context.revenue);
  const exp = formatCurrency(context.expenses);
  const profit = formatCurrency(context.netProfit);
  const margin = context.profitMargin.toFixed(1);

  // 1. Feasibility / Budget Adequacy
  if (q.includes("practical") || q.includes("budget") || q.includes("viable") || q.includes("feasible") || q.includes("enough money")) {
    const isBudgetConstrained = context.investments > 0 && context.investments < 200000;
    return {
      answer: `Based on your capital baseline for ${context.businessName}, you should validate customer willingness-to-pay with low-cost experiments before committing major capital.`,
      recommendation: `Validate demand through non-capital-intensive customer trials before committing capital to inventory or fixed lease commitments.`,
      evidence: `Starting capital/investments recorded: ${formatCurrency(context.investments)}. Current operational ledger: ${rev} revenue vs ${exp} expenses.`,
      explanation: `Premature scaling before proving unit economics is the primary cause of early-stage failure. Keep your fixed burn low until customer acquisition channels demonstrate repeatable payback.`,
      priorityActions: [
        "Conduct 10 direct target customer problem discovery interviews",
        "Set up a minimal landing page or pre-order form to test price tolerance",
        "Preserve capital until the customer acquisition cost (CAC) is proven",
      ],
      estimatesAndAssumptions: `Estimated experiment cost: ₹5,000 - ₹15,000 over 14 days. Assumes target customers can be reached via direct digital or local community channels.`,
      risksAndUncertainty: `Customers expressing interest verbally does not guarantee willingness to pay. Track actual deposits or pre-orders rather than casual praise.`,
      sentiment: isBudgetConstrained ? "warning" : "positive",
      contextUsed: ["Capital Allocation", "Revenue", "Operational Burn"],
      actionPrompt: {
        actionType: "CREATE_TASK",
        title: "Execute Low-Cost Customer Demand Validation Trial",
        description: "Engage 10 prospective buyers, validate core value proposition, and record pricing objections.",
        category: "Marketing",
        priority: "High",
        suggestedBudget: 10000,
        successMetric: "At least 3 commitments or pre-orders secured",
      },
      relevantLinks: [
        { label: "Feasibility Assessment", href: "/analysis" },
        { label: "Strategic Roadmap", href: "/roadmap" },
      ],
    };
  }

  // 2. Spending / Expenses / Loss Investigation
  if (q.includes("expense") || q.includes("cost") || q.includes("spending") || q.includes("losing money") || q.includes("burn")) {
    if (!hasFinancialData) {
      return {
        answer: `Your financial ledger currently has no recorded expense transactions. Log initial supplier and overhead costs to activate loss detection.`,
        recommendation: `Log your initial setup and operational transactions in the Finances module to activate live burn rate and runway tracking.`,
        evidence: `Verified transactions count: 0 recorded. Ledger balance: ₹0.`,
        explanation: `Without documented transactions, financial guidance relies on industry averages rather than your actual burn.`,
        priorityActions: [
          "Record initial business setup expenses in Finances & P&L",
          "Distinguish fixed overhead (rent, software) from variable production costs",
          "Establish an emergency reserve covering 3 months of basic expenses",
        ],
        estimatesAndAssumptions: `Timeline: Log transactions within 24 hours. Assumptions: Bank receipts and invoices are available.`,
        risksAndUncertainty: `Unrecorded petty cash outlays can obscure actual monthly burn.`,
        sentiment: "neutral",
        contextUsed: ["Finances (Pending Records)"],
        actionPrompt: {
          actionType: "CREATE_TASK",
          title: "Log Baseline Operational Inflows & Outflows",
          description: "Enter all startup setup costs and initial invoices into the Finances ledger.",
          category: "Finance",
          priority: "High",
          suggestedBudget: 0,
          successMetric: "Complete ledger entries matching bank balance",
        },
        relevantLinks: [
          { label: "Finances & P&L", href: "/finances" },
        ],
      };
    }

    const isLosing = context.netProfit < 0;
    return {
      answer: `Your recorded total expenses stand at ${exp} against revenue of ${rev}, yielding a net result of ${profit} (${margin}% margin). ${
        isLosing ? "Immediate expense containment is required to protect cash runway." : "Costs are currently contained within revenue generation."
      }`,
      recommendation: isLosing
        ? `Implement immediate expense triage: freeze non-essential software seats and renegotiate vendor payment terms to protect cash runway.`
        : `Audit recurring monthly subscription and vendor line items to maintain strong operating margins.`,
      evidence: `Expenses: ${exp}. Revenue: ${rev}. Net result: ${profit}. Net margin: ${margin}%.`,
      explanation: isLosing
        ? `When expenses outpace revenue, runway deteriorates rapidly. Focus on eliminating discretionary overhead and accelerating receivables.`
        : `Disciplined cost controls during growth protect profitability and compound operational reserves.`,
      priorityActions: [
        "Audit top 3 expense categories in the Finances ledger",
        "Negotiate 30-day extended payment terms with key suppliers",
        "Cancel duplicate or underutilized software subscriptions",
      ],
      estimatesAndAssumptions: `Target savings: 10-15% reduction in recurring monthly OpEx within 30 days.`,
      risksAndUncertainty: `Cutting essential marketing or customer-facing operations prematurely could impair revenue recovery.`,
      sentiment: isLosing ? "urgent" : "positive",
      contextUsed: ["Expenses", "Revenue", "Profit Margin", "Transactions"],
      actionPrompt: {
        actionType: "CREATE_TASK",
        title: "Conduct Operating Expense Audit & Vendor Renegotiation",
        description: "Review all recurring vendor line items and identify opportunities to save 10-15% on monthly overhead.",
        category: "Finance",
        priority: "High",
        suggestedBudget: 0,
        successMetric: "Identified monthly cost savings > ₹10,000",
      },
      relevantLinks: [
        { label: "Finances & P&L", href: "/finances" },
      ],
    };
  }

  // 3. Hiring & Team Decisions
  if (q.includes("hire") || q.includes("employee") || q.includes("team") || q.includes("staff")) {
    if (!hasEmployees) {
      return {
        answer: `You currently have 0 employees registered in the system. Adding your first team member or co-founder will allow you to assign tasks and track operational deliverables.`,
        recommendation: `Define your most critical operational bottleneck before making your first full-time hire. Consider contractors for initial demand spikes.`,
        evidence: `Registered workforce: 0 active employees. Current task pipeline: ${context.tasksCount.total} tasks.`,
        explanation: `Early hires should directly solve revenue-generating or customer-delivery bottlenecks. Avoid adding recurring payroll before product-market fit.`,
        priorityActions: [
          "Send secure team invite to key co-founder or operational contractor",
          "Document standard operating procedures for customer onboarding",
          "Verify at least 3 months of payroll coverage before making full-time commitments",
        ],
        estimatesAndAssumptions: `Assumes contractor or fractional support costs ₹20,000 - ₹40,000/mo depending on role.`,
        risksAndUncertainty: `Hiring too early increases monthly fixed cash burn before sales predictability is established.`,
        sentiment: "neutral",
        contextUsed: ["Workforce (0 Active)", "Capacity Planning"],
        actionPrompt: {
          actionType: "CREATE_TASK",
          title: "Define Role Deliverables for First Operational Hire",
          description: "Draft 30-60-90 day deliverables and compensation structure for the first team addition.",
          category: "Operations",
          priority: "Medium",
          suggestedBudget: 0,
          successMetric: "Approved role profile with clear acceptance criteria",
        },
        relevantLinks: [
          { label: "Employees & Team", href: "/employees" },
          { label: "Task Manager", href: "/tasks" },
        ],
      };
    }

    const hasBlocked = context.tasksCount.blocked > 0;
    return {
      answer: `You currently have ${context.employeeCount} active team member(s), with ${context.tasksCount.inProgress} tasks in progress and ${context.tasksCount.blocked} blocked item(s).`,
      recommendation: hasBlocked
        ? `Hold off on new hiring until the ${context.tasksCount.blocked} blocked tasks are unblocked and existing team workload is balanced.`
        : `Existing team velocity is steady. Evaluate whether part-time specialists can absorb peak workload before committing to full-time payroll.`,
      evidence: `Active staff: ${context.employeeCount}. Total tasks: ${context.tasksCount.total} (${context.tasksCount.completed} completed, ${context.tasksCount.blocked} blocked).`,
      explanation: `Adding headcount into a blocked workflow often increases management overhead rather than velocity. Resolve blockers first.`,
      priorityActions: [
        "Unblock stalled deliverables with responsible team members",
        "Review weekly task completion rates per employee",
        "Verify revenue pipeline can sustain additional fixed payroll obligations",
      ],
      estimatesAndAssumptions: `Timeline: 7 days to clear blocked tasks before initiating any recruitment process.`,
      risksAndUncertainty: `Recruiting distractions may divert leadership focus from sales and roadmap completion.`,
      sentiment: hasBlocked ? "warning" : "positive",
      contextUsed: ["Employees", "Task Pipeline", "Runway"],
      actionPrompt: {
        actionType: "CREATE_TASK",
        title: "Workload Rebalancing & Blocker Resolution Review",
        description: "Meet with team leads to resolve outstanding blockers and confirm task capacity.",
        category: "Operations",
        priority: "High",
        suggestedBudget: 0,
        successMetric: "Zero blocked tasks remaining",
      },
      relevantLinks: [
        { label: "Employees & Team", href: "/employees" },
        { label: "Task Manager", href: "/tasks" },
      ],
    };
  }

  // 4. Tasks, Focus & Operations
  if (q.includes("task") || q.includes("block") || q.includes("next") || q.includes("focus") || q.includes("week") || q.includes("do")) {
    const hasBlocked = context.tasksCount.blocked > 0;
    return {
      answer: `For ${context.businessName}, you have ${context.tasksCount.total} total tasks in your pipeline (${context.tasksCount.completed} completed, ${context.tasksCount.inProgress} in progress, and ${context.tasksCount.blocked} blocked).`,
      recommendation: hasBlocked
        ? `Immediate priority: Resolve the ${context.tasksCount.blocked} blocked task(s) to restore operational momentum.`
        : `Your execution flow is clean. Focus on completing in-progress deliverables required by your current roadmap phase.`,
      evidence: `Tasks Telemetry: Total: ${context.tasksCount.total}, Completed: ${context.tasksCount.completed}, In Progress: ${context.tasksCount.inProgress}, Blocked: ${context.tasksCount.blocked}.`,
      explanation: `Phase completion in BizMind is deterministic — roadmap progress advances when acceptance criteria and linked tasks are completed.`,
      priorityActions: [
        hasBlocked ? "Review blocker reasons reported by team members in Task Manager" : "Advance high-priority roadmap tasks scheduled for this week",
        "Verify completion deliverables before manager sign-off",
        "Log customer feedback directly to validate feature quality",
      ],
      estimatesAndAssumptions: `Timeline: Resolve within 48 hours to maintain scheduled milestone delivery.`,
      risksAndUncertainty: `Leaving blockers unresolved compounds delivery delays and lowers team morale.`,
      sentiment: hasBlocked ? "urgent" : "positive",
      contextUsed: ["Task Pipeline", "Operational Flow", "Roadmap Requirements"],
      actionPrompt: {
        actionType: "CREATE_TASK",
        title: "Weekly Milestone & Roadmap Task Review",
        description: "Review current week deliverables, unblock team dependencies, and verify phase acceptance criteria.",
        category: "Operations",
        priority: "High",
        suggestedBudget: 0,
        successMetric: "All weekly deliverables advanced or marked In Review",
      },
      relevantLinks: [
        { label: "Task Manager", href: "/tasks" },
        { label: "Strategic Roadmap", href: "/roadmap" },
      ],
    };
  }

  // 5. Margin / Profitability
  if (q.includes("profit") || q.includes("margin") || q.includes("income") || q.includes("revenue") || q.includes("sales")) {
    return {
      answer: `Current net profit margin is ${margin}%, generating ${profit} on ${rev} in verified sales revenue.`,
      recommendation: `Drive margin expansion by bundling high-value offerings and renegotiating direct supplier costs.`,
      evidence: `Net margin: ${margin}%. Verified revenue: ${rev}. Total expenses: ${exp}.`,
      explanation: `Improving gross margins by even 5% provides disproportionate cash cushion without requiring increased marketing ad spend.`,
      priorityActions: [
        "Audit cost of goods sold (COGS) on primary revenue drivers",
        "Introduce premium service tier or annual pre-payment discount",
        "Eliminate low-margin custom requests that consume outsized staff time",
      ],
      estimatesAndAssumptions: `Target: 3-5% margin improvement over 60 days. Assumes customer retention remains steady.`,
      risksAndUncertainty: `Sudden price increases without added perceived value can trigger customer churn.`,
      sentiment: "positive",
      contextUsed: ["Revenue", "Net Profit", "Margin", "Transactions"],
      actionPrompt: {
        actionType: "CREATE_TASK",
        title: "Analyze Product Pricing & Direct Unit Costs",
        description: "Audit unit margins for each offering and model a 5-10% price optimization.",
        category: "Finance",
        priority: "Medium",
        suggestedBudget: 0,
        successMetric: "Updated pricing strategy yielding > 25% target margin",
      },
      relevantLinks: [
        { label: "Finances & P&L", href: "/finances" },
        { label: "Executive Reports", href: "/reports" },
      ],
    };
  }

  // Default Overview
  return {
    answer: `Executive Business Telemetry for ${context.businessName}: Net profit stands at ${profit} on ${rev} in revenue (${margin}% margin). Active workforce: ${context.employeeCount} team member(s), with ${context.tasksCount.completed} completed tasks and ${context.tasksCount.inProgress} in progress.`,
    recommendation: `Focus on advancing active roadmap milestones while maintaining disciplined expense controls.`,
    evidence: `Revenue: ${rev}. Expenses: ${exp}. Staff: ${context.employeeCount}. Completed tasks: ${context.tasksCount.completed}. Health: ${context.healthScore}/100.`,
    explanation: `Sustainable growth requires aligning weekly task completion with verified financial runway and roadmap criteria.`,
    priorityActions: [
      "Advance active phase requirements in Strategic Roadmap",
      "Ensure all team tasks have assigned deadlines and metrics",
      "Review weekly ledger entries to catch margin compression early",
    ],
    estimatesAndAssumptions: `Timeline: Weekly review cadence. Assumptions: Existing team capacity remains stable.`,
    risksAndUncertainty: `Unplanned overhead increases or delayed milestone delivery could delay market launch.`,
    sentiment: "positive",
    contextUsed: ["Revenue", "Expenses", "Workforce", "Tasks", "Roadmap"],
    actionPrompt: {
      actionType: "CREATE_TASK",
      title: "Weekly Strategic Review & Alignment Check",
      description: "Review financial performance, task completion velocity, and phase milestone status.",
      category: "Operations",
      priority: "Medium",
      suggestedBudget: 0,
      successMetric: "Weekly status updated across all operational modules",
    },
    relevantLinks: [
      { label: "Roadmap", href: "/roadmap" },
      { label: "Finances", href: "/finances" },
      { label: "Task Manager", href: "/tasks" },
    ],
  };
}
