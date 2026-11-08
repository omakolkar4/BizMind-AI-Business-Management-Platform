import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteToken } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    let employeeRecord: any = null;
    let role = "OWNER";

    if (inviteToken) {
      employeeRecord = await prisma.employee.findUnique({
        where: { inviteToken },
        include: { business: true },
      });

      if (!employeeRecord) {
        return NextResponse.json(
          { error: "Invalid or expired invitation token." },
          { status: 400 }
        );
      }
      role = "EMPLOYEE";
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    if (employeeRecord) {
      await prisma.employee.update({
        where: { id: employeeRecord.id },
        data: {
          userId: user.id,
          inviteStatus: "ACTIVE",
          inviteToken: null, // Consume the token
        },
      });
    }

    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role,
      employeeId: employeeRecord?.id || null,
      businessId: employeeRecord?.businessId || undefined,
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("bizmind_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        employeeId: employeeRecord?.id || null,
        businessId: employeeRecord?.businessId || null,
      },
      redirectTo: role === "EMPLOYEE" ? "/tasks" : "/onboarding",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
