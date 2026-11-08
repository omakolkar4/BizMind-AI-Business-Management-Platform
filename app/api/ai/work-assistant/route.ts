import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { askWorkAssistant } from "@/lib/ai/workAssistant";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { question, conversationHistory } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const response = await askWorkAssistant({
      userId: user.id,
      question: question.trim(),
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("POST /api/ai/work-assistant error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process work assistant request." },
      { status: 500 }
    );
  }
}
