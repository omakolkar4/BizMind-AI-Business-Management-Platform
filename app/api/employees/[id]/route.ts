import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getActiveBusinessId, getCurrentUser } from "@/lib/auth";

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
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only business owners can edit employees." }, { status: 403 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();

    const existingEmp = await prisma.employee.findFirst({
      where: { id, businessId },
    });

    if (!existingEmp) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const updated = await prisma.employee.update({
      where: { id },
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

    // If status changed to Inactive and employee has a linked User account
    if (body.status && existingEmp.userId) {
      // Inactive status prevents login in lib/auth and login route
    }

    return NextResponse.json({ success: true, employee: updated });
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
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: Only business owners can remove employees." }, { status: 403 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;

    const emp = await prisma.employee.findFirst({
      where: { id, businessId },
    });

    if (!emp) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    // Unassign tasks without deleting task history
    await prisma.task.updateMany({
      where: { assignedEmployeeId: id },
      data: { assignedEmployeeId: null },
    });

    // Remove user account if linked
    if (emp.userId) {
      await prisma.user.delete({
        where: { id: emp.userId },
      }).catch(() => {});
    }

    // Delete employee record
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Employee removed and tasks safely preserved." });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
