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
        { error: "Forbidden: Employees cannot access executive reports." },
        { status: 403 }
      );
    }

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
        roadmapPhases: true,
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

    let totalInvestments = 0;
    business.investments.forEach((inv) => {
      totalInvestments += inv.amount;
    });

    return NextResponse.json({
      businessSummary: {
        id: business.id,
        name: business.name,
        type: business.type,
        location: business.location,
        stage: business.stage,
        budget: business.budget,
        revenue,
        expenses,
        netProfit,
        profitMargin,
        totalInvestments,
        employeeCount: business.employees.length,
        taskCount: business.tasks.length,
        completedTasks: business.tasks.filter((t) => t.status === "Completed").length,
        healthScore: business.analysis?.overallScore ?? null,
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
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot generate executive reports." },
        { status: 403 }
      );
    }

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
        roadmapPhases: true,
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
    let totalInvestments = 0;
    business.investments.forEach((inv) => {
      totalInvestments += inv.amount;
    });

    const completedTasks = business.tasks.filter((t) => t.status === "Completed").length;
    const inProgressTasks = business.tasks.filter((t) => t.status === "In Progress").length;
    const blockedTasks = business.tasks.filter((t) => t.status === "Blocked").length;
    const activeEmployees = business.employees.filter((e) => e.status === "Active").length;
    const totalPayroll = business.employees.reduce((acc, e) => acc + (e.salary || 0), 0);

    const reportTitle = `${type} Management Report — ${business.name}`;
    
    // Build context-specific content based on report type and verified database records
    let summaryText = "";
    let sections: { title: string; content: string }[] = [];

    switch (type) {
      case "Financial Report":
        summaryText = `Financial review for ${business.name} based on verified transactional ledger entries. Total recognized revenue stands at ₹${revenue.toLocaleString("en-IN")}, operating expenses at ₹${expenses.toLocaleString("en-IN")}, and net profit at ₹${netProfit.toLocaleString("en-IN")}. Outside investment capital of ₹${totalInvestments.toLocaleString("en-IN")} is held separately in the capital ledger.`;
        sections = [
          {
            title: "I. Income Statement Summary",
            content: `Operating Revenue: ₹${revenue.toLocaleString("en-IN")}\nOperating Expenses: ₹${expenses.toLocaleString("en-IN")}\nNet Operating Profit: ₹${netProfit.toLocaleString("en-IN")}\nOperating Profit Margin: ${profitMargin.toFixed(1)}%\nNote: These calculations reflect internal transactional entries and do not represent a third-party statutory audit.`,
          },
          {
            title: "II. Capital & Investment Position",
            content: `Starting Budget Allocated: ₹${business.budget.toLocaleString("en-IN")}\nLogged Investment Capital: ₹${totalInvestments.toLocaleString("en-IN")}\nActive Investor Tranches: ${business.investments.length} logged records.\nInflows from financing are tracked separately from operational turnover.`,
          },
          {
            title: "III. Financial Observations",
            content: revenue === 0 && expenses === 0 
              ? "No operational transactions have been recorded yet. Begin posting income and expense items to build an ongoing cash flow trajectory."
              : `Operating cash flow reflects ${business.transactions.length} posted transaction(s). Maintain disciplined expense tracking to ensure runway longevity.`,
          },
        ];
        break;

      case "Employee Report":
        summaryText = `Workforce overview for ${business.name}. Active headcount is currently ${activeEmployees} team member(s) with an aggregate monthly payroll commitment of ₹${totalPayroll.toLocaleString("en-IN")}.`;
        sections = [
          {
            title: "I. Headcount & Compensation Distribution",
            content: `Total Employees: ${business.employees.length}\nActive Employees: ${activeEmployees}\nMonthly Payroll Commitment: ₹${totalPayroll.toLocaleString("en-IN")}\nAnnualized Payroll Run-rate: ₹${(totalPayroll * 12).toLocaleString("en-IN")}`,
          },
          {
            title: "II. Departmental Allocation",
            content: business.employees.length > 0 
              ? business.employees.map((e) => `• ${e.name}: ${e.role} (${e.department || "General"}) — ₹${e.salary.toLocaleString("en-IN")}/mo`).join("\n")
              : "No employee records have been added yet. Add team members to track operational staffing and department payroll.",
          },
          {
            title: "III. Workforce Capacity & Execution",
            content: `The workforce currently oversees ${business.tasks.length} total operational tasks (${completedTasks} completed, ${inProgressTasks} active).`,
          },
        ];
        break;

      case "Task Performance":
        summaryText = `Operational milestone review for ${business.name}. The team has created ${business.tasks.length} tasks across pipelines, with ${completedTasks} marked as completed and ${blockedTasks} marked as blocked.`;
        sections = [
          {
            title: "I. Pipeline Velocity & Status Breakdown",
            content: `Total Tasks Created: ${business.tasks.length}\nCompleted: ${completedTasks}\nIn Progress: ${inProgressTasks}\nBlocked: ${blockedTasks}\nTo Do / Pending: ${business.tasks.filter((t) => t.status === "To Do").length}`,
          },
          {
            title: "II. Bottlenecks & Action Items",
            content: blockedTasks > 0
              ? `${blockedTasks} task(s) currently flagged as blocked. Review resource allocation and assignees to clear operational friction.`
              : "Zero tasks currently flagged as blocked. Execution velocity is unobstructed across departments.",
          },
          {
            title: "III. Recommendations",
            content: "Link ongoing tasks to roadmap phase requirements to drive automatic milestone completion tracking.",
          },
        ];
        break;

      case "Business Plan":
        summaryText = `Executive summary of the business blueprint for ${business.name}. Details strategic objectives, target market profile, and execution framework.`;
        sections = [
          {
            title: "I. Venture Profile & Market Framing",
            content: `Business Name: ${business.name}\nIndustry / Model: ${business.type}\nLocation: ${business.location}\nStage: ${business.stage}\nStarting Budget: ₹${business.budget.toLocaleString("en-IN")}\nTarget Customer Segment: ${business.targetCustomer || "Defined in Business Blueprint"}`,
          },
          {
            title: "II. Core Value Proposition",
            content: business.idea || "Venture idea and strategic vision documented in BizMind business profile.",
          },
          {
            title: "III. Planning Status",
            content: business.businessPlan 
              ? "Comprehensive 17-section business blueprint is drafted and saved in your BizMind workspace."
              : "Business plan generation is ready to be initiated from the Business Plan workspace.",
          },
        ];
        break;

      case "AI Business Analysis":
        summaryText = `Multi-agent strategic diagnostic report for ${business.name}. Synthesizes market positioning, financial readiness, operational posture, and risk factors.`;
        sections = [
          {
            title: "I. Strategic Diagnostics",
            content: business.analysis?.overallScore != null
              ? `Overall Business Health Index: ${business.analysis.overallScore}/100\nMarket Feasibility: ${business.analysis.feasibility || "Evaluated"}\nMarket Opportunity: ${business.analysis.marketOpportunity || "Documented"}`
              : "Strategic AI diagnostic evaluation is ready to run in the AI Analysis module.",
          },
          {
            title: "II. Identified Strengths & Opportunities",
            content: business.analysis?.strengths 
              ? String(business.analysis.strengths).slice(0, 500)
              : "Run AI Analysis to benchmark competitive advantages and market expansion vectors.",
          },
          {
            title: "III. Risk Assessment & Mitigations",
            content: business.analysis?.riskAssessment
              ? String(business.analysis.riskAssessment).slice(0, 500)
              : "Track key dependencies and compliance milestones through the Dynamic Roadmap.",
          },
        ];
        break;

      default: // Business Performance
        summaryText = `Executive performance snapshot for ${business.name}. Combines financial results, active headcount (${activeEmployees}), task completion (${completedTasks}/${business.tasks.length}), and strategic milestones.`;
        sections = [
          {
            title: "I. Core Performance Summary",
            content: `Venture: ${business.name} (${business.type})\nCurrent Stage: ${business.stage} | Location: ${business.location}\nStarting Budget: ₹${business.budget.toLocaleString("en-IN")}\nTotal Revenue Recorded: ₹${revenue.toLocaleString("en-IN")}\nTotal Expenses: ₹${expenses.toLocaleString("en-IN")}\nNet Operating Profit: ₹${netProfit.toLocaleString("en-IN")}`,
          },
          {
            title: "II. Operational Throughput",
            content: `Active Staff: ${activeEmployees} employees\nTotal Operational Tasks: ${business.tasks.length} (${completedTasks} completed)\nRoadmap Progress: ${business.roadmapPhases.length} phase(s) mapped.`,
          },
          {
            title: "III. Governance Note",
            content: "This report reflects internal metrics and user-entered operational data. Figures are not audited by an external accounting firm.",
          },
        ];
        break;
    }

    const reportData = {
      generatedAt: new Date().toISOString(),
      type,
      businessName: business.name,
      sections,
      metrics: {
        revenue,
        expenses,
        netProfit,
        profitMargin,
        totalInvestments,
        employees: business.employees.length,
        activeEmployees,
        tasksCount: business.tasks.length,
        tasksCompleted: completedTasks,
        healthScore: business.analysis?.overallScore ?? null,
      },
    };

    const newReport = await prisma.report.create({
      data: {
        businessId,
        title: reportTitle,
        type: type || "Business Performance",
        summary: summaryText,
        data: JSON.stringify(reportData),
      },
    });

    return NextResponse.json({ success: true, report: newReport });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

