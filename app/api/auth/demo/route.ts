import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { ensureDemoData, DEMO_USER_EMAIL } from "@/lib/db/seedDemo";

export async function POST() {
  try {
    await ensureDemoData();

    const user = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      include: { businesses: { take: 1, orderBy: { createdAt: "desc" } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Could not initialize demo user" }, { status: 500 });
    }

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
      maxAge: 60 * 60 * 24 * 14,
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
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
