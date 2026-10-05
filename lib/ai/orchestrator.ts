import { BusinessContextInput, OrchestratorResult } from "./types";
import { runMarketAgent } from "./agents/marketAgent";
import { runFinanceAgent } from "./agents/financeAgent";
import { runStrategyAgent } from "./agents/strategyAgent";
import { runRiskAgent } from "./agents/riskAgent";
import { runOperationsAgent } from "./agents/operationsAgent";

export async function runAIOrchestrator(
  context: BusinessContextInput,
  onProgress?: (agentName: string, status: "in_progress" | "completed", score?: number) => void
): Promise<OrchestratorResult> {
  // Execute agents
  onProgress?.("Market Agent", "in_progress");
  const marketResult = await runMarketAgent(context);
  onProgress?.("Market Agent", "completed", marketResult.score);

  onProgress?.("Finance Agent", "in_progress");
  const financeResult = await runFinanceAgent(context);
  onProgress?.("Finance Agent", "completed", financeResult.score);

  onProgress?.("Strategy Agent", "in_progress");
  const strategyResult = await runStrategyAgent(context);
  onProgress?.("Strategy Agent", "completed", strategyResult.score);

  onProgress?.("Risk Agent", "in_progress");
  const riskResult = await runRiskAgent(context);
  onProgress?.("Risk Agent", "completed", riskResult.score);

  onProgress?.("Operations Agent", "in_progress");
  const operationsResult = await runOperationsAgent(context);
  onProgress?.("Operations Agent", "completed", operationsResult.score);

  const scores = [
    marketResult.score,
    financeResult.score,
    strategyResult.score,
    riskResult.score,
    operationsResult.score,
  ];
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  const strengths = [
    ...marketResult.insights.slice(0, 2),
    ...strategyResult.insights.slice(0, 2),
    ...operationsResult.insights.slice(0, 1),
  ];

  const weaknesses = [
    ...riskResult.risks.slice(0, 2),
    ...operationsResult.risks.slice(0, 1),
  ];

  const opportunities = [
    ...marketResult.recommendations.slice(0, 2),
    ...strategyResult.recommendations.slice(0, 1),
    "B2B corporate subscription and contract expansion",
  ];

  const threats = [
    ...riskResult.risks.slice(1, 3),
    "Macroeconomic raw material price fluctuations",
  ];

  const recommendedActions = [
    ...strategyResult.recommendations.slice(0, 2),
    ...financeResult.recommendations.slice(0, 1),
    ...operationsResult.recommendations.slice(0, 1),
  ];

  return {
    overallScore,
    summary: `${context.businessName} showcases strong commercial viability with an overall AI Business Health Score of ${overallScore}/100. The concept aligns directly with high-growth customer trends in ${context.location}. With disciplined capital expenditure and execution of unit-level profitability, the business is well-positioned for sustainable scale.`,
    marketOpportunity: marketResult.summary,
    feasibility: `Highly feasible. Capital requirement of ₹${(context.budget || 1000000).toLocaleString("en-IN")} provides adequate operational buffer. Strategic and operational assessments indicate low to moderate barriers for initial customer onboarding.`,
    targetAudience: context.targetCustomer || `Urban consumers, professionals, and forward-thinking businesses in ${context.location}.`,
    marketTrends: marketResult.insights.join(" "),
    competitorNotes: "Competitors are fragmented with inconsistent quality standards. BizMind's intelligence models highlight an open strategic lane in customer trust and operational predictability.",
    strengths,
    weaknesses,
    opportunities,
    threats,
    riskAssessment: riskResult.summary,
    revenueOpportunities: `Direct sales subscriptions, enterprise B2B partner contracts, and high-margin ancillary product lines.`,
    costConsiderations: financeResult.insights.slice(0, 2).join(" "),
    recommendedActions,
    agentLogs: [
      { agent: "Market Agent", score: marketResult.score, status: "completed", message: marketResult.summary },
      { agent: "Finance Agent", score: financeResult.score, status: "completed", message: financeResult.summary },
      { agent: "Strategy Agent", score: strategyResult.score, status: "completed", message: strategyResult.summary },
      { agent: "Risk Agent", score: riskResult.score, status: "completed", message: riskResult.summary },
      { agent: "Operations Agent", score: operationsResult.score, status: "completed", message: operationsResult.summary },
    ],
  };
}
