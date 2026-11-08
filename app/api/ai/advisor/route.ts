import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { askBusinessAdvisor } from "@/lib/ai/advisor";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: AI Advisor is an owner-only strategic advisory tool." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { question, history } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        analysis: true,
        businessPlan: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Pull real-time financials
    const transactions = await prisma.transaction.findMany({
      where: { businessId },
      orderBy: { date: "desc" },
    });

    let revenue = 0;
    let expenses = 0;
    transactions.forEach((tx) => {
      if (tx.type === "INCOME") revenue += tx.amount;
      else expenses += tx.amount;
    });

    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // Pull investments
    const investments = await prisma.investment.findMany({ where: { businessId } });
    const totalInvestments = investments.reduce((acc, inv) => acc + inv.amount, 0);

    // Pull employees
    const employeeCount = await prisma.employee.count({ where: { businessId } });

    // Pull tasks
    const tasks = await prisma.task.findMany({ where: { businessId } });
    const tasksCount = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "To Do").length,
      inProgress: tasks.filter((t) => t.status === "In Progress").length,
      completed: tasks.filter((t) => t.status === "Completed").length,
      blocked: tasks.filter((t) => t.status === "Blocked").length,
    };

    const advisorContext = {
      businessName: business.name,
      businessType: business.type,
      location: business.location,
      revenue,
      expenses,
      netProfit,
      profitMargin,
      investments: totalInvestments,
      employeeCount,
      tasksCount,
      healthScore: business.analysis?.overallScore || 82,
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        type: t.type,
        category: t.category,
        amount: t.amount,
        description: t.description,
      })),
      businessPlanSnippet: business.businessPlan?.executiveSummary,
    };

    const response = await askBusinessAdvisor(question, advisorContext, history || []);

    return NextResponse.json({
      success: true,
      ...response,
      contextData: {
        revenue,
        expenses,
        netProfit,
        profitMargin,
        employeeCount,
        tasksCount,
      },
    });
  } catch (error: any) {
    console.error("POST /api/ai/advisor error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
