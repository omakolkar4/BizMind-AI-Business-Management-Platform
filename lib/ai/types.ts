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

export interface AdvisorResponse {
  answer: string;
  contextUsed: string[];
  priorityActions: string[];
  sentiment: "positive" | "warning" | "neutral" | "urgent";
}
