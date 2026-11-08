import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ensureDemoData } from "@/lib/db/seedDemo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let businessId = user.businessId;

    if (!businessId) {
      const userBiz = await prisma.business.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      businessId = userBiz?.id;
    }

    if (!businessId) {
      return NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        business: null,
        metrics: {
          revenue: 0,
          expenses: 0,
          netProfit: 0,
          profitMargin: 0,
          investments: 0,
          employeeCount: 0,
          activeEmployees: 0,
          tasksCount: { total: 0, completed: 0, inProgress: 0, todo: 0, blocked: 0 },
        },
        health: {
          score: 100,
          breakdown: { financial: 100, market: 100, operational: 100, team: 100, growth: 100 },
          explanation: "Welcome to BizMind! Create your venture profile to unlock multi-agent diagnostics.",
          recommendedAction: "Complete your initial business profile and strategic onboarding.",
        },
        charts: {
          revenueExpense: [],
          expenseCategories: [],
        },
        recommendations: [],
        notifications: [],
        recentTransactions: [],
      });
    }

    const isEmployee = user.role === "EMPLOYEE";

    const business = await prisma.business.findFirst({
      where: isEmployee
        ? { id: businessId }
        : { id: businessId, userId: user.id },
      include: {
        analysis: true,
        businessPlan: true,
        recommendations: { where: { dismissed: false }, take: 5, orderBy: { createdAt: "desc" } },
        notifications: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found or access denied" }, { status: 404 });
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

    // Format Monthly Chart Array based on recorded transactions
    const chartMonths = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    const revenueExpenseChartData = chartMonths.map((m) => {
      const rev = monthlyMap[m]?.revenue || 0;
      const exp = monthlyMap[m]?.expenses || 0;
      return {
        month: m,
        revenue: rev,
        expenses: exp,
        profit: rev - exp,
      };
    });

    // Format Expense Categories for Pie Chart
    const piePalette = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6"];
    const expensePieData = Object.entries(expenseCategoryMap).map(([name, value], i) => ({
      name,
      value,
      color: piePalette[i % piePalette.length],
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        employeeId: user.employeeId,
      },
      business: {
        id: business.id,
        name: business.name,
        type: business.type,
        location: business.location,
        stage: business.stage,
        currency: business.currency,
        budget: isEmployee ? 0 : business.budget,
      },
      metrics: {
        revenue: isEmployee ? 0 : totalRevenue,
        expenses: isEmployee ? 0 : totalExpenses,
        netProfit: isEmployee ? 0 : netProfit,
        profitMargin: isEmployee ? 0 : profitMargin,
        investments: isEmployee ? 0 : totalInvestments,
        employeeCount: employees.length,
        activeEmployees,
        tasksCount,
        myTasksCount: isEmployee && user.employeeId
          ? {
              total: tasks.filter((t) => t.assignedEmployeeId === user.employeeId).length,
              todo: tasks.filter((t) => t.assignedEmployeeId === user.employeeId && t.status === "To Do").length,
              inProgress: tasks.filter((t) => t.assignedEmployeeId === user.employeeId && t.status === "In Progress").length,
              inReview: tasks.filter((t) => t.assignedEmployeeId === user.employeeId && t.status === "In Review").length,
              completed: tasks.filter((t) => t.assignedEmployeeId === user.employeeId && t.status === "Completed").length,
              blocked: tasks.filter((t) => t.assignedEmployeeId === user.employeeId && t.status === "Blocked").length,
            }
          : null,
      },
      health: {
        score: overallHealthScore,
        breakdown: {
          financial: isEmployee ? 100 : financialScore,
          market: marketScore,
          operational: operationalScore,
          team: teamScore,
          growth: growthScore,
        },
        explanation:
          profitMargin > 30
            ? "Operational flow is steady. Maintain disciplined execution across milestone deliverables."
            : "Focus on clearing blocked operational tasks to restore team velocity.",
        recommendedAction:
          tasksCount.blocked > 0
            ? `Resolve ${tasksCount.blocked} blocked task in your operational pipeline.`
            : "Advance high-priority deliverables scheduled for this week.",
      },
      charts: {
        revenueExpense: isEmployee ? [] : revenueExpenseChartData,
        expenseCategories: isEmployee ? [] : expensePieData,
      },
      recommendations: isEmployee ? [] : business.recommendations,
      notifications: business.notifications,
      recentTransactions: isEmployee ? [] : transactions.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
