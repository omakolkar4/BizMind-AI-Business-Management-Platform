import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        analysis: true,
        businessPlan: true,
        employees: true,
        tasks: true,
        transactions: true,
        investments: true,
        reports: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let revenue = 0;
    let expenses = 0;
    business.transactions.forEach((tx) => {
      if (tx.type === "INCOME") revenue += tx.amount;
      else expenses += tx.amount;
    });

    const netProfit = revenue - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return NextResponse.json({
      businessSummary: {
        id: business.id,
        name: business.name,
        type: business.type,
        location: business.location,
        stage: business.stage,
        revenue,
        expenses,
        netProfit,
        profitMargin,
        employeeCount: business.employees.length,
        taskCount: business.tasks.length,
        completedTasks: business.tasks.filter((t) => t.status === "Completed").length,
        healthScore: business.analysis?.overallScore || 82,
      },
      reports: business.reports,
    });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { type } = await req.json();

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        analysis: true,
        businessPlan: true,
        employees: true,
        tasks: true,
        transactions: true,
        investments: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let revenue = 0;
    let expenses = 0;
    business.transactions.forEach((tx) => {
      if (tx.type === "INCOME") revenue += tx.amount;
      else expenses += tx.amount;
    });

    const reportTitle = `${type} Executive Report — ${business.name}`;
    const reportSummary = `Certified audit report for ${business.name} generated via BizMind Multi-Agent Intelligence. Covers period performance, key unit economics, and risk flags.`;

    const reportData = {
      generatedAt: new Date().toISOString(),
      type,
      businessName: business.name,
      metrics: {
        revenue,
        expenses,
        netProfit: revenue - expenses,
        profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0,
        employees: business.employees.length,
        tasksCompleted: business.tasks.filter((t) => t.status === "Completed").length,
        healthScore: business.analysis?.overallScore || 82,
      },
    };

    const newReport = await prisma.report.create({
      data: {
        businessId,
        title: reportTitle,
        type: type || "Performance",
        summary: reportSummary,
        data: JSON.stringify(reportData),
      },
    });

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
