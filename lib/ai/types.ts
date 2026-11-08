export interface BusinessContextInput {
  businessName: string;
  idea: string;
  businessType: string;
  location: string;
  budget: number;
  goals: string[] | string;
  resources?: string;
  stage: string;
  targetCustomer?: string;
  pricingModel?: string;
  uniqueAdvantage?: string;
}

export interface AgentResult {
  agentName: string;
  score: number; // 0 - 100
  summary: string;
  insights: string[];
  risks: string[];
  recommendations: string[];
  metrics?: Record<string, string | number>;
}

export interface OrchestratorResult {
  overallScore: number;
  summary: string;
  marketOpportunity: string;
  feasibility: string;
  targetAudience: string;
  marketTrends: string;
  competitorNotes: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  riskAssessment: string;
  revenueOpportunities: string;
  costConsiderations: string;
  recommendedActions: string[];
  agentLogs: {
    agent: string;
    score: number;
    status: "completed" | "in_progress" | "pending";
    message: string;
  }[];
}

export interface AdvisorContextData {
  businessName: string;
  businessType: string;
  location: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
  investments: number;
  employeeCount: number;
  tasksCount: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    blocked: number;
  };
  healthScore: number;
  recentTransactions?: {
    type: string;
    category: string;
    amount: number;
    description: string;
  }[];
  businessPlanSnippet?: string;
}

export interface ActionableStartupGuidance {
  what: string;
  why: string;
  how: string;
  resourcesNeeded: string[];
  estimatedCost: number | string;
  timeline: string;
  measurableResult: string;
  risksAndMitigation: string;
  nextStepAfter: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface FeasibilityAssessmentResult {
  overallStatus: "VIABLE" | "MODERATE_RISK" | "HIGH_RISK" | "NEEDS_VALIDATION" | "CAPITAL_CONSTRAINED";
  summary: string;
  customerDemandAnalysis: string;
  targetCustomerFit: string;
  marketAndCompetition: string;
  capitalViability: string;
  minStartupCost: number;
  maxStartupCost: number;
  expectedMonthlyOpex: number;
  breakEvenMonths: number;
  operationalComplexity: "Low" | "Moderate" | "High" | "Very High";
  founderReadiness: string;
  legalRegulatoryRisks: string;
  strengths: string[];
  weaknesses: string[];
  criticalRisks: string[];
  majorAssumptions: string[];
  unansweredQuestions: string[];
  validationExperiments: Array<{
    title: string;
    objective: string;
    budgetLimit: number;
    metricsToTrack: string;
    reviewTimeline: string;
  }>;
  nextStepRecommendation: {
    title: string;
    description: string;
    guidance: ActionableStartupGuidance;
  };
}

export interface AdvisorResponse {
  answer: string;
  contextUsed: string[];
  priorityActions: string[];
  sentiment: "positive" | "warning" | "neutral" | "urgent";
  actionableGuidance?: ActionableStartupGuidance[];
  actionPrompt?: {
    actionType: "CREATE_TASK" | "UPDATE_ROADMAP" | "REVIEW_BUDGET";
    title: string;
    description: string;
    category?: string;
    priority?: string;
    suggestedBudget?: number;
    successMetric?: string;
  };
}

