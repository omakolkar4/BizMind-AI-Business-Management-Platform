import { BusinessContextInput, AgentResult } from "../types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "../client";

export async function runOperationsAgent(context: BusinessContextInput): Promise<AgentResult> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are a VP of Operations & Supply Chain AI Agent. Analyze operations for:
Name: ${context.businessName}
Type: ${context.businessType}
Location: ${context.location}
Resources: ${context.resources || "Standard lean team"}
Stage: ${context.stage}

Return JSON with:
{
  "score": number (0-100),
  "summary": string,
  "insights": string[] (3-5 items),
  "risks": string[] (2-4 items),
  "recommendations": string[] (3-4 items)
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: "You are an elite COO and operations architect AI. Output JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return {
        agentName: "Operations Agent",
        score: parsed.score || 83,
        summary: parsed.summary || "Operational architecture provides high throughput capacity.",
        insights: parsed.insights || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) {
      console.warn("OpenAI Operations Agent failed, falling back to deterministic agent:", err);
    }
  }

  return {
    agentName: "Operations Agent",
    score: 85,
    summary: `Operational readiness is primed for scalable throughput. Workflow bottleneck analysis indicates existing infrastructure can scale to 3x current volume before requiring additional facility floor space.`,
    insights: [
      "Process optimization: Daily prep checklists and digital inventory tags reduce dead-time by 35%.",
      "Fulfillment efficiency: Batching order dispatch into synchronized 20-minute delivery waves cuts courier waiting friction.",
      "Waste minimization: Real-time demand forecasting keeps daily perishable waste below 3.5%.",
      "Capacity headroom: Core facility currently operates at 48% peak capacity, allowing immediate B2B volume absorption.",
    ],
    risks: [
      "Peak-hour dispatch congestion if order intake spikes exceed batch packing capacity.",
      "Equipment breakdown during high-volume production windows without an on-site technician.",
      "Inventory tracking discrepancies between physical counts and point-of-sale numbers.",
    ],
    recommendations: [
      "Deploy a dual-screen kitchen/operations display system to synchronize preparation with courier arrival.",
      "Conduct weekly physical inventory audits to eliminate reconciliation drift.",
      "Draft standard equipment maintenance protocols with certified local service vendors.",
      "Cross-train operations staff across both assembly and packaging stations.",
    ],
    metrics: {
      "Operational Capacity": "85%",
      "Throughput Index": "High",
      "Process Standardization": "82%",
    },
  };
}
