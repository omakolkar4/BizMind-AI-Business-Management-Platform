import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth";
import { ensureDemoData, DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/db/seedDemo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const loginIdentifier = (body.username || body.email || body.identifier || "").trim();
    const password = body.password;
    const rememberMe = body.rememberMe;

    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required" },
        { status: 400 }
      );
    }

    // If logging in as demo user, ensure demo data exists
    if (loginIdentifier === DEMO_USER_EMAIL) {
      await ensureDemoData();
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier },
          { username: loginIdentifier.toLowerCase() },
        ],
      },
      include: {
        businesses: { take: 1, orderBy: { createdAt: "desc" } },
        employee: { include: { business: true } },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 401 }
      );
    }

    // Check if employee account is deactivated
    if (user.role === "EMPLOYEE" && user.employee?.status === "Inactive") {
      return NextResponse.json(
        { error: "This employee account has been deactivated. Please contact your company administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username, email, or password" },
        { status: 401 }
      );
    }

    const actualRole = (user.role as "OWNER" | "EMPLOYEE") || "OWNER";

    // Enforce role matching when a specific login mode was selected
    if (body.mode) {
      const requestedMode = String(body.mode).trim().toUpperCase();
      if (requestedMode === "OWNER" && actualRole !== "OWNER") {
        return NextResponse.json(
          {
            error: "This account is registered as an Employee. Please switch to Employee Login.",
            suggestedMode: "EMPLOYEE",
          },
          { status: 403 }
        );
      }
      if (requestedMode === "EMPLOYEE" && actualRole !== "EMPLOYEE") {
        return NextResponse.json(
          {
            error: "This account is registered as a Business Owner. Please switch to Owner Login.",
            suggestedMode: "OWNER",
          },
          { status: 403 }
        );
      }
    }

    const role = actualRole;
    let businessId = user.businesses[0]?.id;
    if (role === "EMPLOYEE" && user.employee) {
      businessId = user.employee.businessId;
    }

    // Set session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      username: user.username || user.employee?.username || null,
      name: user.name,
      role,
      employeeId: user.employee?.id || null,
      businessId,
    };
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set("bizmind_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days or 7 days
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username || user.employee?.username || null,
        email: user.email,
        role,
        employeeId: user.employee?.id || null,
        businessId,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
