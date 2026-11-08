import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      // Return list of recent conversations / unread count
      const recentMessages = await prisma.message.findMany({
        where: {
          businessId,
          OR: [{ senderId: user.id }, { receiverId: user.id }],
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          sender: { select: { id: true, name: true, role: true } },
          receiver: { select: { id: true, name: true, role: true } },
        },
      });

      return NextResponse.json({ messages: recentMessages });
    }

    // Verify target user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        OR: [
          { businesses: { some: { id: businessId } } },
          { employee: { businessId } },
        ],
      },
      select: {
        id: true,
        name: true,
        role: true,
        employee: { select: { id: true, role: true, department: true } },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Colleague not found in this company." }, { status: 404 });
    }

    // Fetch conversation thread between user and targetUser
    const thread = await prisma.message.findMany({
      where: {
        businessId,
        OR: [
          { senderId: user.id, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 50,
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        businessId,
        senderId: targetUserId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        role: targetUser.employee?.role || targetUser.role,
        department: targetUser.employee?.department || "Executive",
      },
      messages: thread,
    });
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    const trimmed = (content || "").trim();
    if (!receiverId || !trimmed) {
      return NextResponse.json(
        { error: "Recipient and message content are required." },
        { status: 400 }
      );
    }

    // Verify recipient belongs to the same business
    const recipient = await prisma.user.findFirst({
      where: {
        id: receiverId,
        OR: [
          { businesses: { some: { id: businessId } } },
          { employee: { businessId } },
        ],
      },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found in this company." },
        { status: 404 }
      );
    }

    const newMessage = await prisma.message.create({
      data: {
        businessId,
        senderId: user.id,
        receiverId,
        content: trimmed,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
