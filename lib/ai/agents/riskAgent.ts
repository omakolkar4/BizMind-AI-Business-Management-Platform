import { BusinessContextInput, AgentResult } from "../types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "../client";

export async function runRiskAgent(context: BusinessContextInput): Promise<AgentResult> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are a Risk Assessment & Mitigation AI Agent. Evaluate risks for:
Name: ${context.businessName}
Type: ${context.businessType}
Location: ${context.location}
Budget: ₹${context.budget}
Stage: ${context.stage}

Return JSON with:
{
  "score": number (0-100, where 100 means lowest risk/best managed),
  "summary": string,
  "insights": string[] (3-5 items),
  "risks": string[] (3-5 items),
  "recommendations": string[] (3-5 items)
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: "You are a seasoned enterprise risk auditor AI. Output JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return {
        agentName: "Risk Agent",
        score: parsed.score || 79,
        summary: parsed.summary || "Identified operational and regulatory risk parameters with actionable mitigation paths.",
        insights: parsed.insights || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) {
      console.warn("OpenAI Risk Agent failed, falling back to deterministic agent:", err);
    }
  }

  return {
    agentName: "Risk Agent",
    score: 80,
    summary: `Overall risk profile is moderate and entirely manageable. Primary vectors stem from supply continuity, regulatory and statutory certifications, and dependency on key operational personnel.`,
    insights: [
      "Regulatory risk: Mandatory licenses (FSSAI, Shop & Establishment, GST, environmental) require strict audit schedules.",
      "Vendor concentration risk: Relying on a single primary supplier exposes the business to price gouging or delivery halts.",
      "Customer churn risk: Failure to consistently meet promised SLA quality leads to fast attrition in month 2.",
      "Cash buffer: Maintaining fewer than 90 days of reserve capital creates extreme vulnerability to seasonal shocks.",
    ],
    risks: [
      "Supply chain disruptions causing unexpected service delays or cost surges.",
      "Staff turnover in critical kitchen/operational roles leading to quality inconsistency.",
      "Aggregator policy changes or unexpected platform commission hikes.",
      "Reputational risk from any isolated quality defect amplified on social channels.",
    ],
    recommendations: [
      "Establish primary and secondary supplier agreements with contracted price ceilings.",
      "Draft standard operating procedures (SOPs) and checklist training to eliminate single-person dependency.",
      "Procure basic comprehensive business liability insurance and maintain digital audit logs.",
      "Implement an immediate automated alert protocol for any customer satisfaction rating under 3 stars.",
    ],
    metrics: {
      "Risk Mitigation Index": "80%",
      "Regulatory Exposure": "Low-Medium",
      "Supply Resilience": "Acceptable",
    },
  };
}
