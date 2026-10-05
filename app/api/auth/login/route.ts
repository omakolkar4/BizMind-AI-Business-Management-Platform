import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth";
import { ensureDemoData, DEMO_USER_EMAIL, DEMO_USER_PASSWORD } from "@/lib/db/seedDemo";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // If logging in as demo user, ensure demo data exists
    if (email === DEMO_USER_EMAIL) {
      await ensureDemoData();
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { businesses: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businesses[0]?.id,
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
        email: user.email,
        businessId: user.businesses[0]?.id,
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
