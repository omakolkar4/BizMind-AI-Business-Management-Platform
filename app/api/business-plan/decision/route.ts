import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Only authenticated business owners can accept or revise business plans." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business found." }, { status: 404 });
    }

    const plan = await prisma.businessPlan.findUnique({
      where: { businessId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "No generated business plan found for this venture. Please generate a plan first." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const action = body.action; // "ACCEPT" | "REVISE" | "SUBMIT_FOR_REVIEW"
    const feedback = body.feedback || "";

    const serverTimestamp = new Date();
    const ownerName = user.name || user.email || "Business Owner";

    if (action === "ACCEPT") {
      // 1. Mark the plan as accepted
      const updatedPlan = await prisma.businessPlan.update({
        where: { businessId },
        data: {
          status: "ACCEPTED",
          decision: "ACCEPT",
          decisionTimestamp: serverTimestamp,
          acceptedAt: serverTimestamp,
          acceptedBy: ownerName,
          revisionNotes: null,
          isDraft: false,
        },
      });

      // 2. Create versioned immutable snapshot
      const snapshot = await prisma.businessPlanVersion.create({
        data: {
          planId: plan.id,
          businessId,
          version: updatedPlan.version,
          status: "ACCEPTED",
          decision: "ACCEPT",
          decisionTimestamp: serverTimestamp,
          acceptedBy: ownerName,
          revisionNotes: null,
          executiveSummary: updatedPlan.executiveSummary,
          businessOverview: updatedPlan.businessOverview,
          problem: updatedPlan.problem,
          solution: updatedPlan.solution,
          targetMarket: updatedPlan.targetMarket,
          customerPersona: updatedPlan.customerPersona,
          marketAnalysis: updatedPlan.marketAnalysis,
          competitorAnalysis: updatedPlan.competitorAnalysis,
          valueProposition: updatedPlan.valueProposition,
          businessModel: updatedPlan.businessModel,
          marketingStrategy: updatedPlan.marketingStrategy,
          operationsStrategy: updatedPlan.operationsStrategy,
          technologyStrategy: updatedPlan.technologyStrategy,
          financialOverview: updatedPlan.financialOverview,
          riskAnalysis: updatedPlan.riskAnalysis,
          growthStrategy: updatedPlan.growthStrategy,
          implementationRoadmap: updatedPlan.implementationRoadmap,
        },
      });

      // 3. Mark Business as plan approved and ready for execution
      await prisma.business.update({
        where: { id: businessId },
        data: {
          planApproved: true,
          planStatus: "ACCEPTED",
        },
      });

      // 4. Notification
      await prisma.notification.create({
        data: {
          businessId,
          title: `Business Plan v${updatedPlan.version} Accepted`,
          message: `Founder ${ownerName} officially accepted Business Plan v${updatedPlan.version}. Execution roadmap is now active.`,
          type: "milestone",
          isRead: false,
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        action: "ACCEPT",
        plan: updatedPlan,
        snapshot,
        message: `Business plan officially accepted by ${ownerName} at ${serverTimestamp.toISOString()}.`,
      });
    } else if (action === "REVISE") {
      // 1. Mark the plan as revision required
      const updatedPlan = await prisma.businessPlan.update({
        where: { businessId },
        data: {
          status: "REVISION_REQUIRED",
          decision: "REVISE",
          decisionTimestamp: serverTimestamp,
          revisionNotes: feedback || "Founder requested strategic revisions.",
        },
      });

      // 2. Record revision snapshot in history
      const snapshot = await prisma.businessPlanVersion.create({
        data: {
          planId: plan.id,
          businessId,
          version: updatedPlan.version,
          status: "REVISION_REQUIRED",
          decision: "REVISE",
          decisionTimestamp: serverTimestamp,
          acceptedBy: ownerName,
          revisionNotes: feedback || "Founder requested strategic revisions.",
          executiveSummary: updatedPlan.executiveSummary,
          businessOverview: updatedPlan.businessOverview,
          problem: updatedPlan.problem,
          solution: updatedPlan.solution,
          targetMarket: updatedPlan.targetMarket,
          customerPersona: updatedPlan.customerPersona,
          marketAnalysis: updatedPlan.marketAnalysis,
          competitorAnalysis: updatedPlan.competitorAnalysis,
          valueProposition: updatedPlan.valueProposition,
          businessModel: updatedPlan.businessModel,
          marketingStrategy: updatedPlan.marketingStrategy,
          operationsStrategy: updatedPlan.operationsStrategy,
          technologyStrategy: updatedPlan.technologyStrategy,
          financialOverview: updatedPlan.financialOverview,
          riskAnalysis: updatedPlan.riskAnalysis,
          growthStrategy: updatedPlan.growthStrategy,
          implementationRoadmap: updatedPlan.implementationRoadmap,
        },
      });

      // 3. Update Business plan status
      await prisma.business.update({
        where: { id: businessId },
        data: {
          planApproved: false,
          planStatus: "REVISION_REQUIRED",
        },
      });

      // 4. Notification
      await prisma.notification.create({
        data: {
          businessId,
          title: `Business Plan v${updatedPlan.version} Revision Requested`,
          message: `Plan revision requested. Feedback: ${feedback ? feedback.substring(0, 100) : "General revisions needed"}`,
          type: "alert",
          isRead: false,
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        action: "REVISE",
        plan: updatedPlan,
        snapshot,
        message: "Plan revision state recorded. You can now revise inputs or edit sections.",
      });
    } else if (action === "SUBMIT_FOR_REVIEW") {
      // Move from REVISION_REQUIRED to UNDER_REVIEW
      const nextVersion = plan.status === "REVISION_REQUIRED" ? plan.version + 1 : plan.version;

      const updatedPlan = await prisma.businessPlan.update({
        where: { businessId },
        data: {
          status: "UNDER_REVIEW",
          version: nextVersion,
          decision: null,
          decisionTimestamp: null,
          reviewRequestedAt: serverTimestamp,
        },
      });

      await prisma.business.update({
        where: { id: businessId },
        data: {
          planApproved: false,
          planStatus: "UNDER_REVIEW",
        },
      });

      return NextResponse.json({
        success: true,
        action: "SUBMIT_FOR_REVIEW",
        plan: updatedPlan,
        message: `Plan v${updatedPlan.version} submitted for acceptance review.`,
      });
    } else {
      return NextResponse.json(
        { error: `Unknown action: "${action}". Valid actions are ACCEPT, REVISE, SUBMIT_FOR_REVIEW.` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/business-plan/decision error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process plan decision." },
      { status: 500 }
    );
  }
}
