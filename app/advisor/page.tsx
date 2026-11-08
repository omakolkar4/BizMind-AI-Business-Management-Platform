"use client";

import * as React from "react";
import {
  Sparkles,
  Send,
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
  ListPlus,
  HelpCircle,
  ExternalLink,
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
  recommendation?: string;
  evidence?: string;
  explanation?: string;
  priorityActions?: string[];
  estimatesAndAssumptions?: string;
  risksAndUncertainty?: string;
  sentiment?: "positive" | "warning" | "neutral" | "urgent";
  contextUsed?: string[];
  actionPrompt?: {
    actionType: "CREATE_TASK" | "UPDATE_ROADMAP";
    title: string;
    description: string;
    category?: string;
    priority?: string;
    suggestedBudget?: number;
    successMetric?: string;
  };
  relevantLinks?: Array<{ label: string; href: string }>;
}

export default function AdvisorPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "m-intro",
      role: "assistant",
      content:
        "Welcome to BizMind — your AI Business Mentor. I analyze your actual financial records, workforce capacity, and roadmap progress to provide evidence-based, actionable guidance. Ask me about budget feasibility, weekly priorities, controlling expenses, hiring readiness, or improving margins.",
      recommendation: "Focus on establishing clean baseline financial records and validating demand before significant capital expenditure.",
      evidence: "Live database synced with your company profile and operational modules.",
      priorityActions: [
        "Record initial operational transactions to establish P&L metrics",
        "Review roadmap phase requirements for next execution steps",
        "Assign high-priority tasks to active team members",
      ],
      contextUsed: ["Financials", "Workforce", "Kanban Pipeline", "Business Health"],
      sentiment: "positive",
      relevantLinks: [
        { label: "Finances & P&L", href: "/finances" },
        { label: "Roadmap", href: "/roadmap" },
        { label: "Task Manager", href: "/tasks" },
      ],
    },
  ]);

  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [convertingTaskId, setConvertingTaskId] = React.useState<string | null>(null);
  const [contextData, setContextData] = React.useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          setContextData({
            revenue: json.metrics?.revenue ?? 0,
            expenses: json.metrics?.expenses ?? 0,
            netProfit: json.metrics?.netProfit ?? 0,
            profitMargin: json.metrics?.profitMargin ?? 0,
            employeeCount: json.metrics?.employeeCount ?? 0,
            tasksCount: json.metrics?.tasksCount ?? { total: 0, blocked: 0, completed: 0, inProgress: 0, todo: 0 },
            healthScore: json.health?.score ?? 80,
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
          content: json.answer || json.recommendation,
          recommendation: json.recommendation,
          evidence: json.evidence,
          explanation: json.explanation,
          priorityActions: json.priorityActions,
          estimatesAndAssumptions: json.estimatesAndAssumptions,
          risksAndUncertainty: json.risksAndUncertainty,
          sentiment: json.sentiment,
          contextUsed: json.contextUsed,
          actionPrompt: json.actionPrompt,
          relevantLinks: json.relevantLinks,
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

  const handleConvertActionToTask = async (msgId: string, actionPrompt: NonNullable<ChatMessage["actionPrompt"]>) => {
    try {
      setConvertingTaskId(msgId);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: actionPrompt.title,
          description: actionPrompt.description,
          category: actionPrompt.category || "Operations",
          priority: actionPrompt.priority || "High",
          estimatedBudget: actionPrompt.suggestedBudget || 0,
          successMetric: actionPrompt.successMetric || "Task completed to acceptance criteria",
        }),
      });

      if (res.ok) {
        toast.success(`Task created: "${actionPrompt.title}" in Task Manager!`, {
          action: {
            label: "View Tasks",
            onClick: () => window.location.href = "/tasks",
          },
        });
      } else {
        toast.error("Failed to create task from recommendation.");
      }
    } catch {
      toast.error("Error converting recommendation to task.");
    } finally {
      setConvertingTaskId(null);
    }
  };

  const sampleQuestions = [
    "Is my business idea practical with my current budget?",
    "What should I do this week?",
    "Why are my expenses increasing?",
    "Should I hire another employee now?",
    "How can I improve my margins?",
    "Which tasks or risks need immediate attention?",
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)]">
        {/* Header & Subtitle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Ask BizMind Advisor
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                AI Startup Mentor Layer
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuous strategic, financial, and operational guidance grounded in your actual business records.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Context Grounding: <strong>Verified Company Records</strong></span>
          </div>
        </div>

        {/* Real-time Context Chips Bar */}
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
                      {/* Short Recommendation */}
                      {isAssistant && m.recommendation ? (
                        <div className="space-y-3 text-left">
                          <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 font-semibold text-xs flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div>
                              <strong className="block text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Mentor Recommendation</strong>
                              {m.recommendation}
                            </div>
                          </div>

                          {m.evidence && (
                            <div className="text-xs text-muted-foreground">
                              <strong className="text-foreground">Evidence from Records:</strong> {m.evidence}
                            </div>
                          )}

                          {m.explanation && (
                            <div className="text-xs text-foreground leading-relaxed">
                              {m.explanation}
                            </div>
                          )}

                          {m.estimatesAndAssumptions && (
                            <div className="text-[11px] p-2 rounded-lg bg-background border text-muted-foreground">
                              <strong className="text-foreground">Estimates & Assumptions:</strong> {m.estimatesAndAssumptions}
                            </div>
                          )}

                          {m.risksAndUncertainty && (
                            <div className="text-[11px] p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 text-rose-900 dark:text-rose-300">
                              <strong className="text-rose-700 dark:text-rose-400">Risks & Uncertainty:</strong> {m.risksAndUncertainty}
                            </div>
                          )}
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>

                    {/* Context Chips Used by Assistant */}
                    {isAssistant && m.contextUsed && m.contextUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                        <span className="font-semibold text-foreground">Data Evaluated:</span>
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

                    {/* Priority Actions */}
                    {isAssistant && m.priorityActions && m.priorityActions.length > 0 && (
                      <div className="rounded-xl border border-indigo-200/60 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2 text-left">
                        <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Prioritized Next Actions:</span>
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

                    {/* Interactive Action Prompt: Convert to Task */}
                    {isAssistant && m.actionPrompt && (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                            Actionable Next Step
                          </span>
                          <p className="text-xs font-bold text-foreground">
                            {m.actionPrompt.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {m.actionPrompt.description}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleConvertActionToTask(m.id, m.actionPrompt!)}
                          disabled={convertingTaskId === m.id}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-semibold shrink-0 shadow-2xs"
                        >
                          <ListPlus className="h-3.5 w-3.5 mr-1" />
                          <span>{convertingTaskId === m.id ? "Creating..." : "Convert to Task"}</span>
                        </Button>
                      </div>
                    )}

                    {/* Relevant Module Links */}
                    {isAssistant && m.relevantLinks && m.relevantLinks.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-0.5">
                        <span className="text-[11px] font-medium">Jump to module:</span>
                        {m.relevantLinks.map((link, idx) => (
                          <Link
                            key={idx}
                            href={link.href}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        ))}
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
                  <span>BizMind Mentor analyzing company records and formulating strategic advice...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-4 py-2 border-t bg-muted/20 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-muted-foreground font-semibold shrink-0">Ask Mentor:</span>
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
                placeholder="Ask about your budget, feasibility, weekly actions, expenses, hiring, or margins..."
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
