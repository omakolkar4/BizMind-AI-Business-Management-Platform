import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");
    const myOnly = searchParams.get("myOnly") === "true";

    const where: any = { businessId };
    if (status && status !== "All") where.status = status;
    if (priority && priority !== "All") where.priority = priority;
    if (category && category !== "All") where.category = category;

    // Strict server-side filtering: Employees see ONLY tasks assigned to their authenticated employeeId
    if (user.role === "EMPLOYEE") {
      if (!user.employeeId) {
        return NextResponse.json({
          tasks: [],
          currentUserRole: user.role,
          currentEmployeeId: null,
          isOwner: false,
        });
      }
      where.assignedEmployeeId = user.employeeId;
    } else if (myOnly && user.employeeId) {
      where.assignedEmployeeId = user.employeeId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true, department: true },
        },
        comments: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({
      tasks,
      currentUserRole: user.role,
      currentEmployeeId: user.employeeId,
      isOwner: user.role === "OWNER",
    });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
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
        { error: "Forbidden: Only business owners can create tasks directly." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();
    const {
      title,
      description,
      assignedEmployeeId,
      priority,
      status,
      category,
      dueDate,
      estimatedBudget,
      successMetric,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        businessId,
        title,
        description: description || null,
        assignedEmployeeId: assignedEmployeeId || null,
        priority: priority || "Medium",
        status: status || "To Do",
        category: category || "General",
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        successMetric: successMetric || null,
      },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true, department: true },
        },
        comments: true,
      },
    });

    // Create initial creation comment
    await prisma.taskComment.create({
      data: {
        taskId: task.id,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        content: `Task created by ${user.name}.`,
        type: "COMMENT",
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
