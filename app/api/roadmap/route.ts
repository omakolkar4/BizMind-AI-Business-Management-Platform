import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";
import { evaluateBusinessRoadmap } from "@/lib/roadmap/engine";
import { generatePersonalizedRoadmap } from "@/lib/ai/roadmapGenerator";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot access the strategic business roadmap." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let phasesCount = await prisma.roadmapPhase.count({ where: { businessId } });

    // Automatically generate personalized phases if this business has no phases yet
    if (phasesCount === 0) {
      const generated = await generatePersonalizedRoadmap({
        businessName: business.name,
        idea: business.idea,
        businessType: business.type,
        location: business.location,
        budget: business.budget,
        stage: business.stage,
        goals: business.goals,
        resources: business.resources,
      });

      for (const p of generated) {
        await prisma.roadmapPhase.create({
          data: {
            businessId,
            phaseNumber: p.phaseNumber,
            title: p.title,
            description: p.description,
            objective: p.objective,
            rationale: p.rationale,
            expectedOutcome: p.expectedOutcome,
            duration: p.duration,
            dependencies: JSON.stringify(p.dependencies || []),
            priority: p.priority,
            riskLevel: p.riskLevel,
            requiredResources: JSON.stringify(p.requiredResources || []),
            deliverables: JSON.stringify(p.deliverables || []),
            completionCriteria: p.completionCriteria,
            requirements: JSON.stringify(p.requirements || []),
            estimatedCost: p.estimatedCost,
            tasks: JSON.stringify(p.tasks || []),
            startDate: p.startDate,
            dueDate: p.dueDate,
            status: "Not Started",
            order: p.phaseNumber,
          },
        });
      }
    }

    // Evaluate live progress against verified application records
    const summary = await evaluateBusinessRoadmap(businessId);

    return NextResponse.json({
      phases: summary.phases,
      summary,
    });
  } catch (error: any) {
    console.error("GET /api/roadmap error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error" },
      { status: 500 }
    );
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
        { error: "Forbidden: Employees cannot modify the strategic business roadmap." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    // Regeneration workflow
    if (body.regenerate) {
      const generated = await generatePersonalizedRoadmap({
        businessName: business.name,
        idea: business.idea,
        businessType: business.type,
        location: business.location,
        budget: business.budget,
        stage: business.stage,
        goals: business.goals,
        resources: business.resources,
      });

      // Clear old phases for this business
      await prisma.roadmapPhase.deleteMany({ where: { businessId } });

      for (const p of generated) {
        await prisma.roadmapPhase.create({
          data: {
            businessId,
            phaseNumber: p.phaseNumber,
            title: p.title,
            description: p.description,
            objective: p.objective,
            rationale: p.rationale,
            expectedOutcome: p.expectedOutcome,
            duration: p.duration,
            dependencies: JSON.stringify(p.dependencies || []),
            priority: p.priority,
            riskLevel: p.riskLevel,
            requiredResources: JSON.stringify(p.requiredResources || []),
            deliverables: JSON.stringify(p.deliverables || []),
            completionCriteria: p.completionCriteria,
            requirements: JSON.stringify(p.requirements || []),
            estimatedCost: p.estimatedCost,
            tasks: JSON.stringify(p.tasks || []),
            startDate: p.startDate,
            dueDate: p.dueDate,
            status: "Not Started",
            order: p.phaseNumber,
          },
        });
      }

      const summary = await evaluateBusinessRoadmap(businessId);
      return NextResponse.json({ success: true, phases: summary.phases, summary });
    }

    // Add manual custom phase
    const count = await prisma.roadmapPhase.count({ where: { businessId } });
    const { title, description, estimatedCost, startDate, dueDate, priority, riskLevel } = body;

    const phase = await prisma.roadmapPhase.create({
      data: {
        businessId,
        title: title || `Phase ${count + 1}`,
        description: description || "Custom operational milestone",
        objective: body.objective || description,
        rationale: body.rationale || "Operational execution requirement",
        expectedOutcome: body.expectedOutcome || "Completed phase deliverables",
        phaseNumber: count + 1,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : 0,
        startDate: startDate || null,
        dueDate: dueDate || null,
        priority: priority || "Medium",
        riskLevel: riskLevel || "Low",
        status: "Not Started",
        tasks: JSON.stringify(body.tasks || []),
        requirements: JSON.stringify(body.requirements || []),
        order: count + 1,
      },
    });

    const summary = await evaluateBusinessRoadmap(businessId);
    return NextResponse.json({ success: true, phase, summary });
  } catch (error: any) {
    console.error("POST /api/roadmap error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error" },
      { status: 500 }
    );
  }
}
