import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Only owners can resolve employee requests." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, resolution } = body;

    const existingReq = await prisma.employeeRequest.findFirst({
      where: { id, businessId },
    });

    if (!existingReq) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const updated = await prisma.employeeRequest.update({
      where: { id },
      data: {
        status: status || "RESOLVED",
        resolution: resolution || null,
        resolvedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // If it was linked to a task, create a comment on the task as well
    if (existingReq.taskId) {
      await prisma.taskComment.create({
        data: {
          taskId: existingReq.taskId,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          content: `Manager ${status?.toLowerCase() || "resolved"} request: ${resolution || "No comments."}`,
          type: "FEEDBACK",
        },
      });

      // If resolving a blocker, unblock task
      if (existingReq.type === "BLOCKER" && (status === "RESOLVED" || status === "APPROVED")) {
        await prisma.task.update({
          where: { id: existingReq.taskId },
          data: {
            status: "In Progress",
            blockerReason: null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error("PATCH /api/requests/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
