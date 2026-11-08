import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees are restricted from financial diagnosis." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const [transactions, investments, business] = await Promise.all([
      prisma.transaction.findMany({ where: { businessId }, orderBy: { date: "asc" } }),
      prisma.investment.findMany({ where: { businessId } }),
      prisma.business.findUnique({ where: { id: businessId } }),
    ]);

    let totalRevenue = 0;
    let totalExpenses = 0;
    const expenseCatMap: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === "INCOME") {
        totalRevenue += t.amount;
      } else {
        totalExpenses += t.amount;
        expenseCatMap[t.category] = (expenseCatMap[t.category] || 0) + t.amount;
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalInvestments = investments.reduce((acc, i) => acc + i.amount, 0);

    // Cash runway calculation
    const totalCashAvailable = totalInvestments + netProfit;
    const isLosing = netProfit < 0;
    const netMonthlyBurn = isLosing ? Math.abs(netProfit) / 3 : 0; // estimate over 3 months
    const cashRunwayMonths = netMonthlyBurn > 0 ? Math.max(1, Math.round(totalCashAvailable / netMonthlyBurn)) : 12;

    // Categorical breakdown sorted
    const topExpenseCategories = Object.entries(expenseCatMap)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build Prioritized Corrective-Action Plan (Section 6)
    const correctiveActionPlan: any[] = [];

    if (isLosing || totalExpenses > totalRevenue) {
      const topExpense = topExpenseCategories[0];
      correctiveActionPlan.push({
        id: "cap-overhead",
        problem: "Operating expenses currently outpace realized top-line revenue.",
        evidence: `Verified expenses of ₹${totalExpenses.toLocaleString("en-IN")} against revenue of ₹${totalRevenue.toLocaleString("en-IN")}, generating a net loss of ₹${Math.abs(netProfit).toLocaleString("en-IN")}.`,
        proposedAction: `Implement immediate cost freeze on discretionary line items, especially in ${topExpense?.category || "general overhead"}.`,
        estimatedSavings: `₹${Math.round(totalExpenses * 0.15).toLocaleString("en-IN")} / month (15% reduction)`,
        potentialBenefits: "Extends cash runway by approximately 3-4 months without impairing primary fulfillment.",
        tradeOffs: "May require deferring non-critical equipment purchases or paid marketing experiments.",
        implementationSteps: [
          "Audit all recurring SaaS software subscriptions and cancel unused user seats",
          `Contact top 2 vendors in ${topExpense?.category || "Operations"} to request 15% volume discount or net-45 payment terms`,
          "Consolidate shipping, packaging, and logistics procurement into bulk purchase cycles",
        ],
        measurementPeriod: "30 days",
        successMetric: "Reduce monthly cash burn by at least 15% as measured in the ledger",
      });

      correctiveActionPlan.push({
        id: "cap-pricing",
        problem: "Unit gross margin is insufficient to absorb fixed operational overhead.",
        evidence: `Operating margin stands at ${profitMargin.toFixed(1)}%. Fixed overhead exceeds the contribution margin generated per transaction.`,
        proposedAction: "Optimize pricing architecture by introducing high-margin premium bundles and establishing a minimum order threshold.",
        estimatedSavings: "₹20,000 - ₹45,000 monthly top-line expansion",
        potentialBenefits: "Instantly improves net margin without requiring additional capital investment.",
        tradeOffs: "Requires clear communication of increased value proposition to prevent customer friction.",
        implementationSteps: [
          "Identify top 20% highest-demand offerings and test a 10% price adjustment",
          "Introduce annual or quarterly pre-payment plans with a 10% discount to secure upfront cash reserves",
          "Establish minimum order value (MOV) to eliminate unprofitable low-value orders",
        ],
        measurementPeriod: "45 days",
        successMetric: "Lift net profit margin to > 15%",
      });
    } else {
      // Growth & Margin Optimization Plan
      correctiveActionPlan.push({
        id: "cap-growth",
        problem: "Single-transaction customer reliance creates revenue volatility.",
        evidence: `Current net profit of ₹${netProfit.toLocaleString("en-IN")} is stable, but reliance on sporadic one-time orders introduces seasonal risk.`,
        proposedAction: "Convert one-time buyers into recurring subscription retainers with guaranteed fulfillment.",
        estimatedSavings: "Est. 20-30% expansion in monthly recurring revenue (MRR)",
        potentialBenefits: "Provides predictable monthly cash inflows and dampens demand cyclicality.",
        tradeOffs: "Requires establishing dedicated SLA guarantees for retainer clients.",
        implementationSteps: [
          "Survey top 10 historical customers on recurring fulfillment needs",
          "Design a 3-tier monthly retainer package with priority delivery",
          "Set up automated recurring invoicing in the Finances module",
        ],
        measurementPeriod: "60 days",
        successMetric: "At least 25% of monthly revenue derived from recurring retainers",
      });
    }

    // Mathematical Scenario Simulator (Section 6)
    const scenarioComparison = {
      current: {
        label: "Current Baseline",
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        profitMargin: `${profitMargin.toFixed(1)}%`,
        runwayMonths: isLosing ? cashRunwayMonths : "Sustainable (> 12m)",
      },
      scenarioReduceExpenses: {
        label: "Scenario A: 15% Overhead Reduction",
        revenue: totalRevenue,
        expenses: Math.round(totalExpenses * 0.85),
        netProfit: totalRevenue - Math.round(totalExpenses * 0.85),
        profitMargin: totalRevenue > 0 ? `${(((totalRevenue - totalExpenses * 0.85) / totalRevenue) * 100).toFixed(1)}%` : "0%",
        projectedSavings: Math.round(totalExpenses * 0.15),
        note: "Mathematical simulation. Requires founder-approved budget cuts.",
      },
      scenarioPriceIncrease: {
        label: "Scenario B: 10% Price Optimization",
        revenue: Math.round(totalRevenue * 1.1),
        expenses: totalExpenses,
        netProfit: Math.round(totalRevenue * 1.1) - totalExpenses,
        profitMargin: totalRevenue > 0 ? `${(((totalRevenue * 1.1 - totalExpenses) / (totalRevenue * 1.1)) * 100).toFixed(1)}%` : "0%",
        projectedRevenueGain: Math.round(totalRevenue * 0.1),
        note: "Assumes consistent customer order volume.",
      },
      scenarioCombined: {
        label: "Scenario C: Combined Optimization (+10% Price, -15% Overhead)",
        revenue: Math.round(totalRevenue * 1.1),
        expenses: Math.round(totalExpenses * 0.85),
        netProfit: Math.round(totalRevenue * 1.1) - Math.round(totalExpenses * 0.85),
        profitMargin: totalRevenue > 0 ? `${(((totalRevenue * 1.1 - totalExpenses * 0.85) / (totalRevenue * 1.1)) * 100).toFixed(1)}%` : "0%",
        note: "Maximum impact turnaround scenario.",
      },
    };

    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalInvestments,
        isLosing,
        netMonthlyBurn,
        cashRunwayMonths,
      },
      topExpenseCategories,
      correctiveActionPlan,
      scenarioComparison,
    });
  } catch (error: any) {
    console.error("GET /api/finances/diagnosis error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
