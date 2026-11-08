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
        { error: "Forbidden: AI recommendations are restricted to company owners." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const existing = await prisma.aIRecommendation.findMany({
      where: { businessId, dismissed: false },
      orderBy: { createdAt: "desc" },
    });

    if (existing.length > 0) {
      return NextResponse.json({ recommendations: existing });
    }

    // Generate evidence-based recommendations based on actual business records
    const [transactions, tasks, employeeCount, business] = await Promise.all([
      prisma.transaction.findMany({ where: { businessId } }),
      prisma.task.findMany({ where: { businessId } }),
      prisma.employee.count({ where: { businessId } }),
      prisma.business.findUnique({ where: { id: businessId } }),
    ]);

    let revenue = 0;
    let expenses = 0;
    const catMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === "INCOME") revenue += tx.amount;
      else {
        expenses += tx.amount;
        catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      }
    });

    const netProfit = revenue - expenses;
    const blockedTasks = tasks.filter((t) => t.status === "Blocked").length;
    const newRecs: any[] = [];

    // Financial check
    if (expenses > revenue && expenses > 0) {
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
      newRecs.push({
        businessId,
        type: "Loss Prevention",
        priority: "High",
        title: "Operating Expenses Exceed Verified Revenue",
        explanation: `Total expenses (₹${expenses.toLocaleString("en-IN")}) exceed revenue (₹${revenue.toLocaleString("en-IN")}) by ₹${Math.abs(netProfit).toLocaleString("en-IN")}. ${
          topCat ? `Largest cost driver is ${topCat[0]} at ₹${topCat[1].toLocaleString("en-IN")}.` : ""
        }`,
        recommendedAction: "Audit top expense categories and freeze non-essential software or discretionary vendor commitments.",
        estimatedSavings: "₹15,000 - ₹35,000/month",
        successMetric: "Reach operating cash-flow break-even within 60 days",
        status: "PENDING",
      });
    } else if (revenue > 0) {
      newRecs.push({
        businessId,
        type: "Growth Opportunity",
        priority: "Medium",
        title: "Capitalize on Repeat Customer Revenue",
        explanation: `Net profit is currently positive at ₹${netProfit.toLocaleString("en-IN")}. Introduce retainers or bundled service tiers to lock in predictable monthly recurring revenue (MRR).`,
        recommendedAction: "Package high-demand offerings into recurring subscription or quarterly retainer agreements.",
        estimatedSavings: "Est. 15-20% revenue expansion",
        successMetric: "Convert 3 existing one-time buyers into recurring retainers",
        status: "PENDING",
      });
    }

    // Operational check
    if (blockedTasks > 0) {
      newRecs.push({
        businessId,
        type: "Operational Bottleneck",
        priority: "High",
        title: `${blockedTasks} Task(s) Blocked in Execution Pipeline`,
        explanation: `Delivery velocity is impaired by ${blockedTasks} blocked task(s). Blocker dependencies must be cleared to allow milestone completion.`,
        recommendedAction: "Inspect reported blocker details in Task Manager and reassign dependencies or approve resource requests.",
        estimatedSavings: "Prevent 1-2 weeks of milestone delivery slippage",
        successMetric: "Zero blocked tasks in active pipeline",
        status: "PENDING",
      });
    }

    // Workforce check
    if (employeeCount === 0) {
      newRecs.push({
        businessId,
        type: "Workforce Strategy",
        priority: "Medium",
        title: "Establish Core Team Structure & Task Delegation",
        explanation: "Operating solo concentrates execution risk on the founder. Bring on fractional specialists or invite co-founders to distribute delivery load.",
        recommendedAction: "Invite key team member or operational lead using a secure invitation link.",
        estimatedSavings: "Free up 15+ hours/week of founder bandwidth for customer acquisition",
        successMetric: "First operational hire onboarded and assigned launch tasks",
        status: "PENDING",
      });
    }

    // Persist generated recommendations
    const created = await Promise.all(
      newRecs.map((r) => prisma.aIRecommendation.create({ data: r }))
    );

    return NextResponse.json({ recommendations: created });
  } catch (error: any) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();
    const { id, status, actionTaken, outcomeNotes, dismissed } = body;

    if (!id) {
      return NextResponse.json({ error: "Recommendation ID required" }, { status: 400 });
    }

    const rec = await prisma.aIRecommendation.findFirst({
      where: { id, businessId },
    });

    if (!rec) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (actionTaken !== undefined) updateData.actionTaken = actionTaken;
    if (outcomeNotes !== undefined) updateData.outcomeNotes = outcomeNotes;
    if (dismissed !== undefined) updateData.dismissed = dismissed;

    const updated = await prisma.aIRecommendation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, recommendation: updated });
  } catch (error: any) {
    console.error("PATCH /api/recommendations error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
