import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;

    const where: any = { id, businessId };
    if (user.role === "EMPLOYEE") {
      where.assignedEmployeeId = user.employeeId;
    }

    const task = await prisma.task.findFirst({
      where,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true, department: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found or access denied." }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingTask = await prisma.task.findFirst({
      where: { id, businessId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isOwner = user.role === "OWNER";
    const isAssignedEmployee = user.employeeId && existingTask.assignedEmployeeId === user.employeeId;

    if (!isOwner && !isAssignedEmployee) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to modify this task." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    const commentsToCreate: any[] = [];

    // Title, description, priority, category, budget, metrics: only Owner can change
    if (isOwner) {
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.priority !== undefined) updateData.priority = body.priority;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.assignedEmployeeId !== undefined) updateData.assignedEmployeeId = body.assignedEmployeeId || null;
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.order !== undefined) updateData.order = body.order;
      if (body.estimatedBudget !== undefined) updateData.estimatedBudget = body.estimatedBudget ? parseFloat(body.estimatedBudget) : null;
      if (body.successMetric !== undefined) updateData.successMetric = body.successMetric || null;
    }

    // Status transitions
    if (body.status !== undefined && body.status !== existingTask.status) {
      const prev = existingTask.status;
      const target = body.status;

      // If employee marks completed directly, route to "In Review" unless owner approvals are active
      if (!isOwner && target === "Completed") {
        updateData.status = "In Review";
        updateData.submittedAt = new Date();
        if (body.completionNotes) updateData.completionNotes = body.completionNotes;

        commentsToCreate.push({
          taskId: id,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          previousStatus: prev,
          newStatus: "In Review",
          content: body.completionNotes
            ? `Submitted for manager review: ${body.completionNotes}`
            : "Submitted deliverable for manager review.",
          type: "SUBMISSION",
        });
      } else {
        updateData.status = target;

        if (prev === "To Do" && target === "In Progress") {
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: "Started work on this deliverable.",
            type: "WORK_STARTED",
          });
        } else if (target === "In Review") {
          updateData.submittedAt = new Date();
          if (body.completionNotes) updateData.completionNotes = body.completionNotes;
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: body.completionNotes || "Submitted deliverable for manager review.",
            type: "SUBMISSION",
          });
        } else if (prev === "In Review" && target === "In Progress") {
          if (body.managerFeedback) updateData.managerFeedback = body.managerFeedback;
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: body.managerFeedback
              ? `Revisions requested: ${body.managerFeedback}`
              : "Revisions requested. Please review deliverable requirements.",
            type: "REVISION_REQUESTED",
          });
        } else if (target === "Blocked") {
          updateData.blockedAt = new Date();
          if (body.blockerReason) updateData.blockerReason = body.blockerReason;

          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: `Reported Blocker: ${body.blockerReason || "Work is currently blocked."}`,
            type: "BLOCKER",
          });

          // Log in EmployeeRequest table for executive attention
          if (user.employeeId) {
            await prisma.employeeRequest.create({
              data: {
                businessId,
                employeeId: user.employeeId,
                taskId: id,
                type: "BLOCKER",
                title: `Blocker on "${existingTask.title}"`,
                details: body.blockerReason || "Work blocked by dependencies.",
                status: "PENDING",
              },
            });
          }
        } else if (prev === "Blocked" && target === "In Progress") {
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: "Blocker resolved. Resumed work on deliverable.",
            type: "UNBLOCKED",
          });
        } else if (target === "Completed") {
          if (body.managerFeedback) updateData.managerFeedback = body.managerFeedback;
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: body.managerFeedback
              ? `Approved & Completed. Manager feedback: "${body.managerFeedback}"`
              : "Approved and marked completed.",
            type: "APPROVAL",
          });
        } else {
          commentsToCreate.push({
            taskId: id,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            previousStatus: prev,
            newStatus: target,
            content: `Status updated from ${prev} to ${target}`,
            type: "STATUS_CHANGE",
          });
        }
      }
    }

    // Manager Feedback on Review
    if (isOwner && body.managerFeedback !== undefined) {
      updateData.managerFeedback = body.managerFeedback;
    }

    // Deadline extension request
    if (body.requestExtension) {
      updateData.requestedDueDate = body.requestedDueDate ? new Date(body.requestedDueDate) : null;
      updateData.extensionReason = body.extensionReason || "Requested extension";
      updateData.extensionStatus = "PENDING";

      commentsToCreate.push({
        taskId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content: `Requested deadline extension to ${body.requestedDueDate}. Reason: ${body.extensionReason}`,
        type: "EXTENSION_REQUEST",
      });

      if (user.employeeId) {
        await prisma.employeeRequest.create({
          data: {
            businessId,
            employeeId: user.employeeId,
            taskId: id,
            type: "DEADLINE_EXTENSION",
            title: `Extension request on "${existingTask.title}"`,
            details: `Requested due date: ${body.requestedDueDate}. Reason: ${body.extensionReason}`,
            status: "PENDING",
          },
        });
      }
    }

    // Manager decision on extension
    if (isOwner && body.extensionDecision) {
      updateData.extensionStatus = body.extensionDecision; // "APPROVED" or "REJECTED"
      if (body.extensionDecision === "APPROVED" && existingTask.requestedDueDate) {
        updateData.dueDate = existingTask.requestedDueDate;
      }
      commentsToCreate.push({
        taskId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content: `Manager ${body.extensionDecision.toLowerCase()} deadline extension request.`,
        type: "FEEDBACK",
      });
    }

    // Add ad-hoc user comment
    if (body.comment && body.comment.trim()) {
      commentsToCreate.push({
        taskId: id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content: body.comment.trim(),
        type: "COMMENT",
      });
    }

    await prisma.task.update({
      where: { id },
      data: updateData,
    });

    // Create all comments
    for (const c of commentsToCreate) {
      await prisma.taskComment.create({ data: c });
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true, department: true },
        },
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
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
        { error: "Forbidden: Only owners can delete tasks." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.task.deleteMany({
      where: { id, businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
