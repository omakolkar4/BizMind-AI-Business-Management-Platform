import { BusinessContextInput } from "./types";
import { getOpenAIClient, isDemoMode, AI_MODEL } from "./client";

export interface BusinessPlanData {
  executiveSummary: string;
  businessOverview: string;
  problem: string;
  solution: string;
  targetMarket: string;
  customerPersona: string;
  marketAnalysis: string;
  competitorAnalysis: string;
  valueProposition: string;
  businessModel: string;
  marketingStrategy: string;
  operationsStrategy: string;
  technologyStrategy: string;
  financialOverview: string;
  riskAnalysis: string;
  growthStrategy: string;
  implementationRoadmap: string;
}

export async function generateBusinessPlan(context: BusinessContextInput): Promise<BusinessPlanData> {
  const openai = getOpenAIClient();

  if (!isDemoMode() && openai) {
    try {
      const prompt = `You are a world-class startup venture strategist and business planning director.
Generate a comprehensive, 17-section professional business plan for:
Company: ${context.businessName}
Type: ${context.businessType}
Location: ${context.location}
Idea: ${context.idea}
Budget: ₹${context.budget}
Stage: ${context.stage}
Goals: ${Array.isArray(context.goals) ? context.goals.join(", ") : context.goals}

Return JSON with exactly these 17 keys containing detailed, highly realistic business paragraphs:
{
  "executiveSummary": "...",
  "businessOverview": "...",
  "problem": "...",
  "solution": "...",
  "targetMarket": "...",
  "customerPersona": "...",
  "marketAnalysis": "...",
  "competitorAnalysis": "...",
  "valueProposition": "...",
  "businessModel": "...",
  "marketingStrategy": "...",
  "operationsStrategy": "...",
  "technologyStrategy": "...",
  "financialOverview": "...",
  "riskAnalysis": "...",
  "growthStrategy": "...",
  "implementationRoadmap": "..."
}`;

      const res = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: "system", content: "You are an elite business planning AI. Return valid JSON only." }, { role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const parsed = JSON.parse(res.choices[0].message.content || "{}");
      return parsed as BusinessPlanData;
    } catch (err) {
      console.warn("OpenAI Business Plan generation failed, using structured generation:", err);
    }
  }

  // Realistic Context-Aware Deterministic Generator
  const name = context.businessName;
  const loc = context.location;
  const type = context.businessType;
  const budgetStr = `₹${(context.budget || 1500000).toLocaleString("en-IN")}`;

  return {
    executiveSummary: `${name} is an innovative enterprise in ${loc}, purpose-built to revolutionize the ${type} landscape. By combining modern operational excellence with customer-centric service delivery, ${name} captures underserved market share, offering superior reliability, transparency, and scalable unit economics. Initial seed capital of ${budgetStr} fuels early market penetration, positioning the firm for sustainable cash flow and rapid expansion.`,
    businessOverview: `Founded as a modern growth venture headquartered in ${loc}, ${name} focuses on the ${type} sector. The enterprise delivers premium-grade, dependable solutions tailored to meet the evolving demands of urban and commercial clients through a streamlined, technology-enabled operating structure.`,
    problem: `In today's fast-moving market in ${loc}, target customers face significant friction due to inconsistent quality, fragmented service providers, lack of transparent pricing, and outdated operational practices across the ${type} category. This forces buyers to compromise between price and dependability.`,
    solution: `${name} eliminates these pain points through a unified, high-integrity service framework. By leveraging standardized workflows, rigorous quality control, and responsive customer channels, the business delivers a predictable, delightful customer experience that builds long-term brand equity and customer retention.`,
    targetMarket: `The primary addressable market encompasses discerning consumers, salaried corporate professionals, and enterprise partners located throughout ${loc} and surrounding economic corridors who prioritize speed, consistent quality, and verified service credentials.`,
    customerPersona: `Target Profile: Urban decision-makers aged 24-48 with medium-to-high disposable income. They value time efficiency, require transparent communication, and prefer digitally accessible brands with clear values and social proof.`,
    marketAnalysis: `The ${type} sector across India's Tier-1 and Tier-2 hubs is expanding at over 22% CAGR, driven by rising urbanization, increased digital payments, and higher expectations for professionalized services. Market research indicates clear appetite for a reliable mid-market brand that solves chronic inconsistency.`,
    competitorAnalysis: `Existing competitors are bifurcated into two extremes: low-cost unorganized local providers with high error rates and poor hygiene/customer care, and premium legacy incumbents whose pricing is prohibitive for daily engagement. ${name} commands the lucrative middle: superior quality at an accessible, predictable price point.`,
    valueProposition: `${name} guarantees uncompromising quality, timely delivery, and transparent pricing supported by real-time customer support and automated fulfillment tracking.`,
    businessModel: `Hybrid monetization model including recurring subscription tiers, direct on-demand service billing, and high-margin corporate partnership contracts, generating predictable annual recurring revenue (ARR) with healthy 45-55% gross margins.`,
    marketingStrategy: `Multi-channel acquisition strategy combining localized digital hyper-targeting (Meta & Google), strategic B2B corporate referral incentives, local micro-influencer authentic reviews, and high-conversion onboarding promotions with strong viral referral mechanics.`,
    operationsStrategy: `Centralized operations hub in ${loc} paired with streamlined fulfillment routes. Daily checklists, automated inventory reordering, and standardized employee training manuals guarantee uniform operational execution across all customer touchpoints.`,
    technologyStrategy: `Modern cloud-native tech stack built on Next.js, automated WhatsApp/SMS status notifications, digital POS and analytics telemetry, and AI-driven demand prediction models to optimize resource utilization.`,
    financialOverview: `With a seed allocation of ${budgetStr}, ${name} targets monthly breakeven within 7 months of full launch. Projections model 24% net operating profit margin at scale, with conservative 18-month gross revenue exceeding ₹1.8 Crore.`,
    riskAnalysis: `Key risks include supply price volatility, talent acquisition and retention, and competitive imitation. These are actively mitigated through multi-vendor sourcing contracts, performance-linked compensation packages, and continuous customer experience enhancements.`,
    growthStrategy: `Phase 1: Secure market leadership across prime commercial clusters in ${loc}. Phase 2: Launch secondary micro-fulfillment nodes. Phase 3: Expand into adjacent high-growth metropolitan territories using standardized franchise and company-owned playbook models.`,
    implementationRoadmap: `Months 1-2: Infrastructure setup, compliance certification, and core team onboarding. Months 3-4: Private beta release with 200 pilot customers. Months 5-7: Public launch and B2B corporate contract acquisition. Months 8-12: Expansion to 2,000 active clients and positive free cash flow.`,
  };
}
