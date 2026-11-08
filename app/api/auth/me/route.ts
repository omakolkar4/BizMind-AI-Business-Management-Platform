import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_USER_EMAIL } from "@/lib/db/seedDemo";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: user.email,
        image: user.image,
        businessId: user.businessId,
        businessName: user.businessName,
        role: user.role || "OWNER",
        employeeId: user.employeeId,
        status: user.status || "Active",
        isDemo: user.email === DEMO_USER_EMAIL,
      },
    });
  } catch (error: any) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
