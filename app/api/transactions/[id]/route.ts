import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Employees cannot delete financial transactions." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    await prisma.transaction.deleteMany({
      where: {
        id,
        businessId, // Scoped strictly to verified business
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
