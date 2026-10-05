import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const where: any = { businessId };
    if (status && status !== "All") where.status = status;
    if (priority && priority !== "All") where.priority = priority;
    if (category && category !== "All") where.category = category;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true, department: true },
        },
      },
      orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, assignedEmployeeId, priority, status, category, dueDate } = body;

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
      },
      include: {
        assignedEmployee: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
