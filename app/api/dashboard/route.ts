import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/db/seedDemo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    let businessId = user?.businessId;

    if (!businessId) {
      await ensureDemoData();
      const firstBiz = await prisma.business.findFirst({
        orderBy: { createdAt: "desc" },
      });
      businessId = firstBiz?.id;
    }

    if (!businessId) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        analysis: true,
        businessPlan: true,
        recommendations: { where: { dismissed: false }, take: 5, orderBy: { createdAt: "desc" } },
        notifications: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Query Transactions
    const transactions = await prisma.transaction.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    const expenseCategoryMap: Record<string, number> = {};
    const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};

    transactions.forEach((tx) => {
      const monthYear = tx.date.toLocaleString("en-US", { month: "short" });
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = { revenue: 0, expenses: 0 };
      }

      if (tx.type === "INCOME") {
        totalRevenue += tx.amount;
        monthlyMap[monthYear].revenue += tx.amount;
      } else {
        totalExpenses += tx.amount;
        monthlyMap[monthYear].expenses += tx.amount;
        expenseCategoryMap[tx.category] = (expenseCategoryMap[tx.category] || 0) + tx.amount;
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Investments
    const investments = await prisma.investment.findMany({
      where: { businessId },
    });
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.amount, 0);

    // Employees
    const employees = await prisma.employee.findMany({
      where: { businessId },
    });
    const activeEmployees = employees.filter((e) => e.status === "Active").length;

    // Tasks
    const tasks = await prisma.task.findMany({
      where: { businessId },
    });

    const tasksCount = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "To Do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      blocked: tasks.filter((t) => t.status === "Blocked").length,
    };

    // Calculate Dynamic Business Health Score based on actual performance
    // Profit margin score: >30% = 90+, 15-30% = 75-90, 0-15% = 60-75, <0 = <50
    let financialScore = 80;
    if (profitMargin >= 40) financialScore = 92;
    else if (profitMargin >= 25) financialScore = 84;
    else if (profitMargin >= 10) financialScore = 72;
    else if (profitMargin >= 0) financialScore = 60;
    else financialScore = 45;

    // Team task completion score
    const taskRate = tasks.length > 0 ? (tasksCount.completed / tasks.length) * 100 : 75;
    const operationalScore = Math.min(95, Math.max(60, Math.round(75 + taskRate * 0.2 - tasksCount.blocked * 3)));
    const teamScore = Math.min(96, Math.max(65, 80 + (activeEmployees > 2 ? 5 : 0)));
    const marketScore = business.analysis?.overallScore || 78;
    const growthScore = Math.min(95, Math.max(60, Math.round((financialScore + marketScore) / 2 + 5)));

    const overallHealthScore = Math.round(
      (financialScore * 0.35 + operationalScore * 0.25 + marketScore * 0.2 + teamScore * 0.1 + growthScore * 0.1)
    );

    // Format Monthly Chart Array
    const chartMonths = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    const revenueExpenseChartData = chartMonths.map((m) => ({
      month: m,
      revenue: monthlyMap[m]?.revenue || (m === "Sep" ? totalRevenue : Math.round(totalRevenue * 0.7)),
      expenses: monthlyMap[m]?.expenses || (m === "Sep" ? totalExpenses : Math.round(totalExpenses * 0.75)),
      profit: (monthlyMap[m]?.revenue || totalRevenue) - (monthlyMap[m]?.expenses || totalExpenses),
    }));

    // Format Expense Categories for Pie Chart
    const piePalette = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
    const expensePieData = Object.entries(expenseCategoryMap).map(([name, value], i) => ({
      name,
      value,
      color: piePalette[i % piePalette.length],
    }));

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        location: business.location,
        stage: business.stage,
        currency: business.currency,
        budget: business.budget,
      },
      metrics: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        netProfit,
        profitMargin,
        investments: totalInvestments,
        employeeCount: employees.length,
        activeEmployees,
        tasksCount,
      },
      health: {
        score: overallHealthScore,
        breakdown: {
          financial: financialScore,
          market: marketScore,
          operational: operationalScore,
          team: teamScore,
          growth: growthScore,
        },
        explanation:
          profitMargin > 30
            ? "Your business health is strong. Profit margins are solid, but keeping operational overhead lean will preserve cash velocity."
            : "Profit margin is stabilizing. Focus on boosting high-margin recurring client retainers.",
        recommendedAction:
          tasksCount.blocked > 0
            ? `Resolve ${tasksCount.blocked} blocked task in your operational pipeline.`
            : "Review supplier bulk purchasing agreements to gain 6-8% margin expansion.",
      },
      charts: {
        revenueExpense: revenueExpenseChartData,
        expenseCategories: expensePieData,
      },
      recommendations: business.recommendations,
      notifications: business.notifications,
      recentTransactions: transactions.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
