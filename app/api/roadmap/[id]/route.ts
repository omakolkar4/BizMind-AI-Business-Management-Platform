import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.rationale !== undefined) updateData.rationale = body.rationale;
    if (body.expectedOutcome !== undefined) updateData.expectedOutcome = body.expectedOutcome;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.riskLevel !== undefined) updateData.riskLevel = body.riskLevel;
    if (body.completionCriteria !== undefined) updateData.completionCriteria = body.completionCriteria;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.estimatedCost !== undefined) updateData.estimatedCost = parseFloat(body.estimatedCost);
    if (body.startDate !== undefined) updateData.startDate = body.startDate;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.tasks !== undefined) {
      updateData.tasks = typeof body.tasks === "string" ? body.tasks : JSON.stringify(body.tasks);
    }
    if (body.requirements !== undefined) {
      updateData.requirements = typeof body.requirements === "string" ? body.requirements : JSON.stringify(body.requirements);
    }
    if (body.dependencies !== undefined) {
      updateData.dependencies = typeof body.dependencies === "string" ? body.dependencies : JSON.stringify(body.dependencies);
    }
    if (body.deliverables !== undefined) {
      updateData.deliverables = typeof body.deliverables === "string" ? body.deliverables : JSON.stringify(body.deliverables);
    }
    if (body.requiredResources !== undefined) {
      updateData.requiredResources = typeof body.requiredResources === "string" ? body.requiredResources : JSON.stringify(body.requiredResources);
    }

    await prisma.roadmapPhase.updateMany({
      where: { id, businessId },
      data: updateData,
    });

    const updated = await prisma.roadmapPhase.findFirst({
      where: { id, businessId },
    });

    return NextResponse.json({ success: true, phase: updated });
  } catch (error: any) {
    console.error("PATCH /api/roadmap/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;

    await prisma.roadmapPhase.deleteMany({
      where: { id, businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/roadmap/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
