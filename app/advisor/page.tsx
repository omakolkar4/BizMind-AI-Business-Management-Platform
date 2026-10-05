"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Building2,
  DollarSign,
  Users,
  CheckSquare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  contextUsed?: string[];
  priorityActions?: string[];
  sentiment?: "positive" | "warning" | "neutral" | "urgent";
}

export default function AdvisorPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "m-intro",
      role: "assistant",
      content:
        "Hello! I am BizMind — your AI Business Co-Pilot. I am continuously synced with your live business financial ledger, employee capacity, and task pipeline for NovaBite Foods. Ask me anything about controlling expenses, improving margins, hiring timing, or unblocking operational bottlenecks.",
      contextUsed: ["Financials", "Workforce", "Kanban Pipeline", "Business Health"],
      priorityActions: [
        "Audit packaging supply contract for 8% bulk discount",
        "Unblock cold-chain vendor SLA renegotiation",
        "Launch corporate lunch pilot in Hinjewadi Phase 1",
      ],
      sentiment: "positive",
    },
  ]);

  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [contextData, setContextData] = React.useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setContextData({
            revenue: json.metrics?.revenue || 845000,
            expenses: json.metrics?.expenses || 425000,
            netProfit: json.metrics?.netProfit || 420000,
            profitMargin: json.metrics?.profitMargin || 49.7,
            employeeCount: json.metrics?.employeeCount || 6,
            tasksCount: json.metrics?.tasksCount || { total: 8, blocked: 1, completed: 2 },
            healthScore: json.health?.score || 82,
          });
        }
      } catch (e) {
        console.warn("Notice loading advisor context:", e);
      }
    }
    loadSummary();
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (questionText?: string) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: q.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.trim(),
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: json.answer,
          contextUsed: json.contextUsed,
          priorityActions: json.priorityActions,
          sentiment: json.sentiment,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        toast.error("AI Advisor encountered an error.");
      }
    } catch {
      toast.error("Network error reaching AI Advisor.");
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Why are my expenses increasing?",
    "How can I improve profitability?",
    "Should I hire another employee?",
    "What should I do next to unblock operations?",
    "How can I reduce packaging costs?",
    "Which area should I focus on this quarter?",
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        {/* Header & Subtitle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Ask BizMind
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                AI Business Co-Pilot
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuous strategic, financial, and operational decision support powered by your actual business state.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Telemetry Context: <strong>Live Database</strong></span>
          </div>
        </div>

        {/* Real-time Context Chips Bar (Section 19) */}
        {contextData && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
              Active Context:
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-foreground font-semibold shrink-0">
              <DollarSign className="h-3 w-3 text-emerald-500" />
              <span>Rev: {formatCurrency(contextData.revenue)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-foreground font-semibold shrink-0">
              <span className="text-rose-500 font-bold">Exp:</span>
              <span>{formatCurrency(contextData.expenses)}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
              <span>Profit: {formatCurrency(contextData.netProfit)} ({contextData.profitMargin.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-foreground font-semibold shrink-0">
              <Users className="h-3 w-3 text-indigo-500" />
              <span>Staff: {contextData.employeeCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-card text-foreground font-semibold shrink-0">
              <CheckSquare className="h-3 w-3 text-amber-500" />
              <span>Tasks: {contextData.tasksCount.total} ({contextData.tasksCount.blocked} blocked)</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
              <Sparkles className="h-3 w-3" />
              <span>Health: {contextData.healthScore}/100</span>
            </div>
          </div>
        )}

        {/* Chat Message Scrollable Area */}
        <Card className="flex-1 border shadow-sm flex flex-col overflow-hidden bg-card">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((m) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-3xl ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 font-bold text-xs shadow-xs ${
                      isAssistant
                        ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-foreground"
                    }`}
                  >
                    {isAssistant ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  <div className={`space-y-3 ${isAssistant ? "text-left" : "text-right"}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        isAssistant
                          ? "bg-muted/40 border text-foreground"
                          : "bg-indigo-600 text-white font-medium"
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Context Chips Used by Assistant */}
                    {isAssistant && m.contextUsed && m.contextUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground">Data Analyzed:</span>
                        {m.contextUsed.map((ctx, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-muted border text-[10px] font-medium"
                          >
                            {ctx}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Priority Actions (Section 19) */}
                    {isAssistant && m.priorityActions && m.priorityActions.length > 0 && (
                      <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2 text-left">
                        <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Priority Actions Recommended by AI:</span>
                        </div>
                        <div className="space-y-1.5">
                          {m.priorityActions.map((action, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 text-xs text-indigo-900 dark:text-indigo-300 font-medium"
                            >
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span>{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-3 mr-auto">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white animate-pulse">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="p-3 rounded-2xl bg-muted/40 border text-xs text-muted-foreground flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  <span>BizMind AI analyzing financial ledger and synthesizing advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-muted-foreground font-semibold shrink-0">Suggestions:</span>
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => handleSend(sq)}
                className="px-2.5 py-1 rounded-full border bg-background hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 transition-colors whitespace-nowrap text-muted-foreground font-medium shrink-0"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 sm:p-4 border-t bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Ask about your expenses, hiring decisions, profit margin, or next steps..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="text-xs sm:text-sm h-11"
                disabled={loading}
                autoFocus
              />
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 px-5 shadow-sm shadow-indigo-600/20 shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
