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
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const where: any = { businessId };
    if (department && department !== "All") where.department = department;
    if (status && status !== "All") where.status = status;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        tasks: {
          select: { id: true, title: true, priority: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
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
    const { name, email, phone, role, department, salary, status, performanceRating, notes } = body;

    if (!name || !email || !role || !department) {
      return NextResponse.json(
        { error: "Name, email, role, and department are required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        businessId,
        name,
        email,
        phone: phone || null,
        role,
        department,
        salary: salary ? parseFloat(salary) : 0,
        status: status || "Active",
        performanceRating: performanceRating ? parseFloat(performanceRating) : 4.5,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
