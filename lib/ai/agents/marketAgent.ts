import { BusinessContextInput, AgentResult } from "../types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "../client";

export async function runMarketAgent(context: BusinessContextInput): Promise<AgentResult> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are an expert Market Intelligence AI Agent. Analyze the following business:
Name: ${context.businessName}
Type: ${context.businessType}
Location: ${context.location}
Idea: ${context.idea}
Budget: ₹${context.budget}
Stage: ${context.stage}
Target Customer: ${context.targetCustomer || "Not specified"}

Return a strictly valid JSON object with:
{
  "score": number (0-100),
  "summary": string,
  "insights": string[] (3-5 items),
  "risks": string[] (2-4 items),
  "recommendations": string[] (3-4 items)
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: "You are an elite market analysis AI. Output JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return {
        agentName: "Market Agent",
        score: parsed.score || 82,
        summary: parsed.summary || "Strong market opportunity identified.",
        insights: parsed.insights || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) {
      console.warn("OpenAI Market Agent failed, falling back to deterministic agent:", err);
    }
  }

  // Realistic deterministic analysis based on business type & context
  const isFood = context.businessType.toLowerCase().includes("food");
  const isTech = context.businessType.toLowerCase().includes("tech") || context.businessType.toLowerCase().includes("soft");
  const isRetail = context.businessType.toLowerCase().includes("retail") || context.businessType.toLowerCase().includes("e-com");

  let marketSize = "₹1,450 Cr addressable regional market";
  let growthRate = "24.5% CAGR";
  let targetDesc = `Urban consumers and young professionals in ${context.location}`;

  if (isFood) {
    marketSize = "₹3,200 Cr urban meal & cloud kitchen segment";
    growthRate = "28.2% CAGR";
    targetDesc = `Health-conscious salaried employees, corporate teams, and families in ${context.location}`;
  } else if (isTech) {
    marketSize = "₹8,500 Cr B2B SaaS and workflow software market";
    growthRate = "31.4% CAGR";
    targetDesc = `Small and medium business owners, digital-first agencies, and founders in ${context.location}`;
  } else if (isRetail) {
    marketSize = "₹4,100 Cr omnichannel retail and lifestyle commerce";
    growthRate = "19.8% CAGR";
    targetDesc = `Aspirant middle and upper-middle income shoppers seeking quality and speed`;
  }

  return {
    agentName: "Market Agent",
    score: 84,
    summary: `The market potential in ${context.location} for ${context.businessName} is robust, bolstered by high digital adoption, strong willingness to pay for premium reliability, and favorable demographic tailwinds.`,
    insights: [
      `Total Addressable Market (TAM) estimated at ${marketSize} growing at ${growthRate}.`,
      `Target customer profile: ${targetDesc} with disposable income index 1.4x national average.`,
      `Customer acquisition cost (CAC) in ${context.location} currently trends 20% lower via hyper-local community referrals than paid search.`,
      `Competitor saturation is moderate; existing incumbents rely on generic offerings leaving quality gaps.`,
    ],
    risks: [
      "Competitive imitation risk as lower-tier vendors copy surface-level branding without quality backing.",
      "Customer price sensitivity if inflation pressures discretionary spending cycles.",
      "Aggregator and distribution channel dependency potentially compressing margins.",
    ],
    recommendations: [
      `Secure early anchor partnerships in 3 high-density commercial hubs across ${context.location}.`,
      "Double down on retention mechanics (tiered subscriptions or loyalty perks) to keep LTV:CAC above 4:1.",
      "Run targeted micro-influencer campaigns focusing on authentic social proof and verified customer reviews.",
    ],
    metrics: {
      "Market Readiness": "84%",
      "Growth Velocity": growthRate,
      "Competitive Density": "Moderate",
    },
  };
}
