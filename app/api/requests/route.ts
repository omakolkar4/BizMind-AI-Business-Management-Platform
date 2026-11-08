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

    const isOwner = user.role === "OWNER";
    const where: any = { businessId };

    if (!isOwner && user.employeeId) {
      where.employeeId = user.employeeId;
    }

    const requests = await prisma.employeeRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, role: true, department: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests, isOwner });
  } catch (error: any) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
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
    const { taskId, type, title, details } = body;

    if (!title || !details || !type) {
      return NextResponse.json(
        { error: "Title, details, and type are required" },
        { status: 400 }
      );
    }

    let employeeId = user.employeeId;
    if (!employeeId) {
      // If owner is filing or solo, find or create default employee link
      const defaultEmp = await prisma.employee.findFirst({ where: { businessId } });
      employeeId = defaultEmp?.id || null;
    }

    if (!employeeId) {
      return NextResponse.json({ error: "No associated team member profile found" }, { status: 400 });
    }

    const request = await prisma.employeeRequest.create({
      data: {
        businessId,
        employeeId,
        taskId: taskId || null,
        type,
        title,
        details,
        status: "PENDING",
      },
      include: {
        employee: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
