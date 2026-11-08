import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId, hashPassword } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can reset employee passwords." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { id } = await params;
    const body = await req.json();
    const newPassword = (body.newPassword || "").trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password is required and must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { id, businessId },
      include: { user: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found." }, { status: 404 });
    }

    const hashedPassword = await hashPassword(newPassword);

    if (employee.userId) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { password: hashedPassword },
      });
    } else {
      // If employee didn't have a linked user account yet, create one
      const cleanUsername = employee.username || employee.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const finalEmail = employee.email || `${cleanUsername}@${businessId.slice(0, 8)}.bizmind.local`;

      const newUser = await prisma.user.create({
        data: {
          name: employee.name,
          username: cleanUsername,
          email: finalEmail,
          password: hashedPassword,
          role: "EMPLOYEE",
        },
      });

      await prisma.employee.update({
        where: { id },
        data: { userId: newUser.id, username: cleanUsername },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Password reset successfully for ${employee.name}.`,
    });
  } catch (error: any) {
    console.error("POST /api/employees/[id]/reset-password error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
