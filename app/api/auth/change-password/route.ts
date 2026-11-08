import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, verifyPassword, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match." },
        { status: 400 }
      );
    }

    // Retrieve full user record to verify current password
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || !dbUser.password) {
      return NextResponse.json(
        { error: "User account password record not found." },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect current password. Please try again." },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/auth/change-password error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update password." },
      { status: 500 }
    );
  }
}
