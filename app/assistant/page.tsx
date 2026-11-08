"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  CheckSquare,
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Bot,
  User,
  Info,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedFollowUps?: string[];
  refusedConfidentialQuery?: boolean;
}

const STARTER_PROMPTS = [
  "What are my assigned tasks?",
  "How do I submit my work for review?",
  "How do I report a blocker?",
  "What is our approved attendance policy?",
  "Explain my task requirements",
];

export default function WorkAssistantPage() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I am your **BizMind Work Assistant**.\n\n" +
        "I am here to help you navigate your assigned deliverables, understand office attendance policies, submit work for review, or report execution blockers.\n\n" +
        "How can I assist you with your work today?",
      suggestedFollowUps: STARTER_PROMPTS,
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend?: string) => {
    const text = (questionToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: "user-" + Date.now(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ai/work-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: text,
          conversationHistory: history,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to reach Work Assistant.");
        setMessages((prev) => [
          ...prev,
          {
            id: "error-" + Date.now(),
            role: "assistant",
            content: "Sorry, I encountered an issue retrieving your information. Please check your connection and try again.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: json.reply,
          suggestedFollowUps: json.suggestedFollowUps,
          refusedConfidentialQuery: json.refusedConfidentialQuery,
        },
      ]);
    } catch {
      toast.error("Network error communicating with Work Assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                BizMind Work Assistant
              </h1>
              <Badge variant="outline" className="text-xs border-indigo-300 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20">
                Employee AI Co-Pilot
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your guide for assigned deliverables, team procedures, attendance policies, and operational blocker resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([
                  {
                    id: "welcome-reset",
                    role: "assistant",
                    content:
                      "Conversation reset. How can I assist you with your assigned tasks or attendance procedures?",
                    suggestedFollowUps: STARTER_PROMPTS,
                  },
                ]);
              }}
              className="text-xs h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              <span>Reset Chat</span>
            </Button>
          </div>
        </div>

        {/* Scope and Security Notice Banner */}
        <div className="rounded-xl border bg-muted/20 p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Scope & Confidentiality Guardrail:</strong> This assistant answers questions regarding your assigned tasks, attendance rules, and standard work procedures. It does not provide company financial data, salaries, or owner-level strategy.
          </p>
        </div>

        {/* Chat Window */}
        <Card className="border shadow-xs flex flex-col h-[560px]">
          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/5">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-none shadow-xs"
                          : m.refusedConfidentialQuery
                          ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded-tl-none"
                          : "bg-card border text-foreground rounded-tl-none shadow-2xs whitespace-pre-line"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Follow Up Suggestions */}
                    {!isUser && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.suggestedFollowUps.map((p, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSend(p)}
                            disabled={loading}
                            className="text-[11px] font-medium bg-background hover:bg-muted/80 text-muted-foreground hover:text-foreground border px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                            <span>{p}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="h-8 w-8 rounded-xl bg-muted border text-foreground flex items-center justify-center shrink-0 text-xs shadow-xs font-bold">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-card border text-xs text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                  <span>Checking task records and company procedures...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Starter Bar */}
          <div className="p-3 border-t bg-card space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Ask about your tasks, how to submit deliverables, attendance policy..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="text-xs h-10 bg-muted/20"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 font-semibold text-xs"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                <span>Send</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
