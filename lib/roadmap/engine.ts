import prisma from "@/lib/db/prisma";

export interface PhaseRequirement {
  id: string;
  title: string;
  description?: string;
  type:
    | "HIRE_EMPLOYEE"
    | "CREATE_TASK"
    | "COMPLETE_TASK"
    | "RECORD_EXPENSE"
    | "RECORD_INCOME"
    | "RECORD_INVESTMENT"
    | "RECORD_TRANSACTION"
    | "COMPLETE_PLAN_SECTION";
  targetValue: number;
  currentValue?: number;
  unit?: string;
  targetEntity?: string; // department, category, or plan section key
  completionRule?: "COUNT_AT_LEAST" | "AMOUNT_AT_LEAST";
  linkedModule: "employees" | "tasks" | "finances" | "business-plan" | "investments";
  actionUrl: string;
  actionLabel: string;
  weight: number;
  isCompleted?: boolean;
  progressPercent?: number;
}

export interface EvaluatedPhase {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  objective?: string | null;
  rationale?: string | null;
  expectedOutcome?: string | null;
  duration?: string | null;
  dependencies: string[];
  priority: string;
  riskLevel: string;
  requiredResources: string[];
  deliverables: string[];
  completionCriteria?: string | null;
  requirements: PhaseRequirement[];
  status: "Not Started" | "In Progress" | "Completed" | "Blocked";
  estimatedCost: number;
  spentCost: number;
  startDate?: string | null;
  dueDate?: string | null;
  isOverdue: boolean;
  completionPercentage: number;
  tasks: Array<{ id: string; title: string; completed: boolean }>;
}

export interface RoadmapSummary {
  phases: EvaluatedPhase[];
  overallProgress: number;
  completedPhasesCount: number;
  totalPhasesCount: number;
  completedRequirementsCount: number;
  totalRequirementsCount: number;
  pendingRequirementsCount: number;
  overduePhasesCount: number;
  totalPlannedBudget: number;
  totalSpentBudget: number;
  budgetVariance: number;
  planStatus?: string;
  isPlanAccepted: boolean;
  planVersion?: number;
  executionReadiness: "APPROVED_FOR_EXECUTION" | "PLAN_REVIEW_PENDING" | "REVISION_REQUIRED";
  nextRecommendedAction: {
    phaseNumber: number;
    phaseTitle: string;
    requirementTitle: string;
    actionUrl: string;
    actionLabel: string;
  } | null;
}

export async function evaluateBusinessRoadmap(businessId: string): Promise<RoadmapSummary> {
  // 1. Fetch live authorized business records
  const [phases, employees, tasks, transactions, investments, plan] = await Promise.all([
    prisma.roadmapPhase.findMany({
      where: { businessId },
      orderBy: { phaseNumber: "asc" },
    }),
    prisma.employee.findMany({ where: { businessId } }),
    prisma.task.findMany({ where: { businessId } }),
    prisma.transaction.findMany({ where: { businessId } }),
    prisma.investment.findMany({ where: { businessId } }),
    prisma.businessPlan.findUnique({ where: { businessId } }),
  ]);

  const activeEmployees = employees.filter((e) => e.status?.toLowerCase() === "active");
  const completedTasks = tasks.filter((t) => t.status?.toLowerCase() === "completed");
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE");
  const incomeTransactions = transactions.filter((t) => t.type === "INCOME");

  const totalExpenseAmount = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalIncomeAmount = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalInvestmentAmount = investments.reduce((acc, i) => acc + i.amount, 0);

  // Check how many business plan sections are written (> 40 chars)
  let planSectionsCompletedCount = 0;
  if (plan) {
    const keys: (keyof typeof plan)[] = [
      "executiveSummary",
      "businessOverview",
      "problem",
      "solution",
      "targetMarket",
      "customerPersona",
      "marketAnalysis",
      "competitorAnalysis",
      "valueProposition",
      "businessModel",
      "marketingStrategy",
      "operationsStrategy",
      "technologyStrategy",
      "financialOverview",
      "riskAnalysis",
      "growthStrategy",
      "implementationRoadmap",
    ];
    for (const key of keys) {
      const val = plan[key];
      if (typeof val === "string" && val.trim().length > 40) {
        planSectionsCompletedCount++;
      }
    }
  }

  const now = new Date();
  let totalRequirementsCount = 0;
  let completedRequirementsCount = 0;
  let totalPlannedBudget = 0;

  const evaluatedPhases: EvaluatedPhase[] = phases.map((phase) => {
    let reqs: PhaseRequirement[] = [];
    try {
      reqs = JSON.parse(phase.requirements || "[]");
    } catch {
      reqs = [];
    }

    let subtasks: Array<{ id: string; title: string; completed: boolean }> = [];
    try {
      subtasks = JSON.parse(phase.tasks || "[]");
    } catch {
      subtasks = [];
    }

    let deps: string[] = [];
    try {
      deps = JSON.parse(phase.dependencies || "[]");
    } catch {
      deps = [];
    }

    let resources: string[] = [];
    try {
      resources = JSON.parse(phase.requiredResources || "[]");
    } catch {
      resources = [];
    }

    let deliverablesList: string[] = [];
    try {
      deliverablesList = JSON.parse(phase.deliverables || "[]");
    } catch {
      deliverablesList = [];
    }

    totalPlannedBudget += phase.estimatedCost || 0;

    // Evaluate each requirement against actual live data
    let totalWeight = 0;
    let weightedScore = 0;

    const evaluatedReqs = reqs.map((req) => {
      totalRequirementsCount++;
      const weight = req.weight || 1;
      totalWeight += weight;

      let currentVal = 0;

      switch (req.type) {
        case "HIRE_EMPLOYEE": {
          if (req.targetEntity) {
            const ent = req.targetEntity.toLowerCase();
            currentVal = activeEmployees.filter(
              (e) =>
                e.department.toLowerCase().includes(ent) ||
                e.role.toLowerCase().includes(ent)
            ).length;
          } else {
            currentVal = activeEmployees.length;
          }
          break;
        }

        case "CREATE_TASK": {
          if (req.targetEntity) {
            const ent = req.targetEntity.toLowerCase();
            currentVal = tasks.filter((t) =>
              t.category.toLowerCase().includes(ent)
            ).length;
          } else {
            currentVal = tasks.length;
          }
          break;
        }

        case "COMPLETE_TASK": {
          if (req.targetEntity) {
            const ent = req.targetEntity.toLowerCase();
            currentVal = completedTasks.filter((t) =>
              t.category.toLowerCase().includes(ent)
            ).length;
          } else {
            currentVal = completedTasks.length;
          }
          break;
        }

        case "RECORD_EXPENSE": {
          // If targetValue is small (e.g. <= 10), treat as transaction count; else as amount
          if (req.targetValue <= 10) {
            currentVal = expenseTransactions.length;
          } else {
            currentVal = totalExpenseAmount;
          }
          break;
        }

        case "RECORD_INCOME": {
          if (req.targetValue <= 10) {
            currentVal = incomeTransactions.length;
          } else {
            currentVal = totalIncomeAmount;
          }
          break;
        }

        case "RECORD_TRANSACTION": {
          currentVal = transactions.length;
          break;
        }

        case "RECORD_INVESTMENT": {
          if (req.targetValue <= 10) {
            currentVal = investments.length;
          } else {
            currentVal = totalInvestmentAmount;
          }
          break;
        }

        case "COMPLETE_PLAN_SECTION": {
          if (req.targetEntity && plan) {
            const key = req.targetEntity as keyof typeof plan;
            const val = plan[key];
            currentVal = typeof val === "string" && val.trim().length > 40 ? 1 : 0;
          } else {
            currentVal = planSectionsCompletedCount;
          }
          break;
        }

        default: {
          currentVal = 0;
        }
      }

      const target = Math.max(1, req.targetValue);
      const isCompleted = currentVal >= target;
      if (isCompleted) {
        completedRequirementsCount++;
      }

      const progressPercent = Math.min(100, Math.round((currentVal / target) * 100));
      weightedScore += (progressPercent / 100) * weight;

      return {
        ...req,
        currentValue: currentVal,
        isCompleted,
        progressPercent,
      };
    });

    // If there were no structured requirements, evaluate based on milestone subtasks or fallback
    let phaseCompletionPercent = 0;
    if (totalWeight > 0) {
      phaseCompletionPercent = Math.round((weightedScore / totalWeight) * 100);
    } else if (subtasks.length > 0) {
      const done = subtasks.filter((t) => t.completed).length;
      phaseCompletionPercent = Math.round((done / subtasks.length) * 100);
    }

    // Determine status
    let status: "Not Started" | "In Progress" | "Completed" | "Blocked" = "Not Started";
    if (phaseCompletionPercent === 100) {
      status = "Completed";
    } else if (phaseCompletionPercent > 0) {
      status = "In Progress";
    }

    const isOverdue = Boolean(
      phase.dueDate &&
        new Date(phase.dueDate) < now &&
        phaseCompletionPercent < 100
    );

    return {
      id: phase.id,
      phaseNumber: phase.phaseNumber,
      title: phase.title,
      description: phase.description,
      objective: phase.objective,
      rationale: phase.rationale,
      expectedOutcome: phase.expectedOutcome,
      duration: phase.duration,
      dependencies: deps,
      priority: phase.priority,
      riskLevel: phase.riskLevel,
      requiredResources: resources,
      deliverables: deliverablesList,
      completionCriteria: phase.completionCriteria,
      requirements: evaluatedReqs,
      status,
      estimatedCost: phase.estimatedCost,
      spentCost: Math.min(phase.estimatedCost, totalExpenseAmount),
      startDate: phase.startDate,
      dueDate: phase.dueDate,
      isOverdue,
      completionPercentage: phaseCompletionPercent,
      tasks: subtasks,
    };
  });

  const totalPhasesCount = evaluatedPhases.length;
  const completedPhasesCount = evaluatedPhases.filter((p) => p.completionPercentage === 100).length;
  const overduePhasesCount = evaluatedPhases.filter((p) => p.isOverdue).length;

  const overallProgress =
    totalPhasesCount > 0
      ? Math.round(
          evaluatedPhases.reduce((acc, p) => acc + p.completionPercentage, 0) /
            totalPhasesCount
        )
      : 0;

  // Evaluate Plan Acceptance Status
  const isPlanAccepted = plan?.status === "ACCEPTED";
  const planStatus = plan?.status || "GENERATED";
  const planVersion = plan?.version || 1;
  const executionReadiness: RoadmapSummary["executionReadiness"] = isPlanAccepted
    ? "APPROVED_FOR_EXECUTION"
    : planStatus === "REVISION_REQUIRED"
    ? "REVISION_REQUIRED"
    : "PLAN_REVIEW_PENDING";

  let nextAction: RoadmapSummary["nextRecommendedAction"] = null;

  // Find first active/incomplete phase and first incomplete requirement
  for (const p of evaluatedPhases) {
    if (p.completionPercentage < 100) {
      const incReq = p.requirements.find((r) => !r.isCompleted);
      nextAction = {
        phaseNumber: p.phaseNumber,
        phaseTitle: p.title,
        requirementTitle: incReq ? incReq.title : p.title,
        actionUrl: incReq ? incReq.actionUrl : `/roadmap#phase-${p.phaseNumber}`,
        actionLabel: incReq ? incReq.actionLabel : "Execute Phase",
      };
      break;
    }
  }

  // If plan is not accepted yet, prioritize plan acceptance review as next recommended action
  if (!isPlanAccepted) {
    nextAction = {
      phaseNumber: 1,
      phaseTitle: "Plan Acceptance & Executive Approval",
      requirementTitle: planStatus === "REVISION_REQUIRED"
        ? "Revise business plan inputs and submit for acceptance review"
        : "Review strategic business plan and confirm acceptance (Yes/No decision)",
      actionUrl: "/business-plan",
      actionLabel: "Review & Decide Plan",
    };
  }

  return {
    phases: evaluatedPhases,
    overallProgress,
    completedPhasesCount,
    totalPhasesCount,
    completedRequirementsCount,
    totalRequirementsCount,
    pendingRequirementsCount: Math.max(0, totalRequirementsCount - completedRequirementsCount),
    overduePhasesCount,
    totalPlannedBudget,
    totalSpentBudget: totalExpenseAmount,
    budgetVariance: totalPlannedBudget - totalExpenseAmount,
    planStatus,
    isPlanAccepted,
    planVersion,
    executionReadiness,
    nextRecommendedAction: nextAction,
  };
}
