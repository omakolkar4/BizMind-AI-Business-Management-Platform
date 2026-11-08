import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot view confidential plan history." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business found." }, { status: 404 });
    }

    const versions = await prisma.businessPlanVersion.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      versions,
    });
  } catch (error: any) {
    console.error("GET /api/business-plan/history error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load plan history." },
      { status: 500 }
    );
  }
}
