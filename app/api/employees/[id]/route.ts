import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;

    const employee = await prisma.employee.findFirst({
      where: { id, businessId },
      include: {
        tasks: {
          orderBy: { dueDate: "asc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

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

    const updated = await prisma.employee.updateMany({
      where: { id, businessId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.role && { role: body.role }),
        ...(body.department && { department: body.department }),
        ...(body.salary !== undefined && { salary: parseFloat(body.salary) }),
        ...(body.status && { status: body.status }),
        ...(body.performanceRating !== undefined && { performanceRating: parseFloat(body.performanceRating) }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error: any) {
    console.error("PATCH /api/employees/[id] error:", error);
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

    await prisma.employee.deleteMany({
      where: { id, businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
