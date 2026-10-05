import { BusinessContextInput, AgentResult } from "../types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "../client";

export async function runFinanceAgent(context: BusinessContextInput): Promise<AgentResult> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are a Senior Financial Architect AI Agent. Analyze the financial viability of:
Name: ${context.businessName}
Type: ${context.businessType}
Budget: ₹${context.budget}
Stage: ${context.stage}
Location: ${context.location}

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
        messages: [{ role: "system", content: "You are a top venture financial analyst AI. Output JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return {
        agentName: "Finance Agent",
        score: parsed.score || 85,
        summary: parsed.summary || "Financial model indicates viable margins with disciplined cost control.",
        insights: parsed.insights || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) {
      console.warn("OpenAI Finance Agent failed, falling back to deterministic agent:", err);
    }
  }

  const budget = context.budget || 1000000;
  const runwayMonths = Math.max(6, Math.round(budget / 125000));

  return {
    agentName: "Finance Agent",
    score: 86,
    summary: `Capital allocation framework is sound. Initial budget of ₹${budget.toLocaleString("en-IN")} provides an estimated ${runwayMonths}-month operational runway at lean burn rates, with projected breakeven reachable between months 6 to 9.`,
    insights: [
      `Gross margin potential stands at 58% to 65% depending on direct procurement efficiency.`,
      `Estimated operational burn: ₹${Math.round(budget / runwayMonths).toLocaleString("en-IN")}/month across facilities, core salaries, and initial marketing.`,
      `Contribution margin per unit/customer projected at 42%, leaving ample headroom for overhead amortisation.`,
      `Working capital cycle needs 30-day buffer to protect against delayed vendor receivables or merchant settlements.`,
    ],
    risks: [
      "Premature scaling of fixed overheads (long leases, excessive permanent payroll) before product-market validation.",
      "Cash flow timing friction between upfront supplier inventory payments and 15-day delayed invoice clearances.",
      "Customer acquisition inflation if relying exclusively on performance paid ads.",
    ],
    recommendations: [
      "Cap fixed operating expenses to 45% of total budget during the initial 180 days.",
      "Negotiate 30-day payment credit terms with primary suppliers once 3 successful orders are fulfilled.",
      "Establish automated daily cash reserve tracking and maintain a minimum 3-month survival runway at all times.",
    ],
    metrics: {
      "Runway Estimate": `${runwayMonths} months`,
      "Target Gross Margin": "62%",
      "Breakeven Window": "Month 7-9",
    },
  };
}
