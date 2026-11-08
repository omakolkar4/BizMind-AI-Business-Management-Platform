import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { generateIdeaAssessment, IdeaInputParams } from "@/lib/ai/ideaAnalyzer";

export async function POST(req: Request) {
  try {
    const body: IdeaInputParams = await req.json();

    if (!body.rawIdea || !body.rawIdea.trim()) {
      return NextResponse.json(
        { error: "Please provide a description of your business idea." },
        { status: 400 }
      );
    }

    const assessment = await generateIdeaAssessment(body);

    // If authenticated user with active business, persist assessment run
    let assessmentRecordId: string | null = null;
    const user = await getCurrentUser().catch(() => null);
    if (user) {
      const businessId = await getActiveBusinessId().catch(() => null);
      if (businessId) {
        const saved = await prisma.ideaAssessment.create({
          data: {
            businessId,
            rawIdea: body.rawIdea.trim(),
            businessCategory: assessment.businessCategory,
            operatingModel: body.operatingModel || null,
            targetLocation: body.targetLocation || null,
            staffingPlan: body.staffingPlan || null,
            statedBudget: body.isBudgetUnknown ? null : (body.statedBudget ? Number(body.statedBudget) : null),
            isBudgetUnknown: Boolean(body.isBudgetUnknown),
            existingResources: body.existingResources || null,
            timeframeGoal: body.timeframeGoal || null,
            assessmentJson: JSON.stringify(assessment),
            status: "PROVISIONAL",
          },
        });
        assessmentRecordId = saved.id;
      }
    }

    return NextResponse.json({
      success: true,
      assessment,
      assessmentRecordId,
    });
  } catch (error: any) {
    console.error("POST /api/analyzer/assess error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze business idea." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ assessment: null });
    }

    const latest = await prisma.ideaAssessment.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    if (!latest) {
      return NextResponse.json({ assessment: null });
    }

    let parsedAssessment = null;
    try {
      parsedAssessment = JSON.parse(latest.assessmentJson);
    } catch {
      parsedAssessment = null;
    }

    return NextResponse.json({
      assessment: parsedAssessment,
      assessmentRecord: {
        id: latest.id,
        rawIdea: latest.rawIdea,
        status: latest.status,
        appliedAt: latest.appliedAt,
        createdAt: latest.createdAt,
      },
    });
  } catch (error: any) {
    console.error("GET /api/analyzer/assess error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
