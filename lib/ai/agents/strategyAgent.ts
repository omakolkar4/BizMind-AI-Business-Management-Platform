import { BusinessContextInput, AgentResult } from "../types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "../client";

export async function runStrategyAgent(context: BusinessContextInput): Promise<AgentResult> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are a Chief Strategy Officer AI Agent. Formulate business strategy for:
Name: ${context.businessName}
Type: ${context.businessType}
Idea: ${context.idea}
Stage: ${context.stage}
Goals: ${Array.isArray(context.goals) ? context.goals.join(", ") : context.goals}

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
        messages: [{ role: "system", content: "You are a top management consultant AI. Output JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return {
        agentName: "Strategy Agent",
        score: parsed.score || 88,
        summary: parsed.summary || "Strategic positioning provides clear differentiation and defensibility.",
        insights: parsed.insights || [],
        risks: parsed.risks || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (err) {
      console.warn("OpenAI Strategy Agent failed, falling back to deterministic agent:", err);
    }
  }

  return {
    agentName: "Strategy Agent",
    score: 87,
    summary: `${context.businessName} has a clear strategic wedge: dominating a hyper-focused niche in ${context.location} before expanding into adjacent customer tiers. Emphasizing transparency, reliability, and superior customer experience creates an organic competitive moat.`,
    insights: [
      "Wedge strategy: Win 500 intensely loyal power-users in a specific geographic cluster to generate referral velocity.",
      "Value proposition focuses on outcomes rather than features (wellness & peace-of-mind rather than just another transaction).",
      "Network effects can be unlocked through community challenges, B2B workplace partnerships, and shared subscriptions.",
      "Brand equity will serve as the primary defensive barrier against copycat market entrants.",
    ],
    risks: [
      "Distraction from chasing too many disparate customer archetypes simultaneously.",
      "Diluting brand promise by discounting aggressively to chase vanity volume.",
      "Slow decision-making cadence during early validation phase.",
    ],
    recommendations: [
      "Establish a 'North Star Metric' focused on 30-day retention and Net Promoter Score (target NPS > 65).",
      "Package offerings into distinct tiers (Essential, Pro/Wellness, Enterprise B2B) to maximize revenue per user.",
      "Institute weekly customer feedback interviews to iterate offerings with high agility.",
    ],
    metrics: {
      "Strategic Clarity": "89%",
      "Differentiation Index": "High",
      "Defensibility Score": "84%",
    },
  };
}
