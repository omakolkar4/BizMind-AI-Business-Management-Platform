"use client";

import * as React from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  X,
  ArrowRight,
  Check,
  ListPlus,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export interface RecommendationItem {
  id: string;
  type: string;
  priority: "Low" | "Medium" | "High" | "Urgent" | string;
  title: string;
  explanation: string;
  recommendedAction: string;
  estimatedSavings?: string | null;
  successMetric?: string | null;
  status?: string;
  actionLink?: string;
}

interface AIRecommendationsProps {
  initialRecommendations?: RecommendationItem[];
}

export function AIRecommendations({ initialRecommendations }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>(
    initialRecommendations || []
  );
  const [loading, setLoading] = React.useState(!initialRecommendations);
  const [convertingId, setConvertingId] = React.useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/recommendations");
      if (res.ok) {
        const json = await res.json();
        setRecommendations(json.recommendations || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!initialRecommendations) {
      fetchRecommendations();
    }
  }, [initialRecommendations]);

  const handleDismiss = async (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch("/api/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dismissed: true }),
      });
      toast.success("Recommendation dismissed");
    } catch {
      // ignore
    }
  };

  const handleTurnIntoTask = async (rec: RecommendationItem) => {
    try {
      setConvertingId(rec.id);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Recommendation] ${rec.recommendedAction.slice(0, 50)}...`,
          description: `${rec.explanation}\n\nRecommended Action:\n${rec.recommendedAction}`,
          category: rec.type.includes("Expense") ? "Finance" : "Operations",
          priority: rec.priority === "Urgent" ? "High" : rec.priority,
          successMetric: rec.successMetric || "Recommendation implemented",
        }),
      });

      if (res.ok) {
        await fetch("/api/recommendations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: rec.id, status: "ACCEPTED", actionTaken: "Converted to Task" }),
        });

        setRecommendations((prev) =>
          prev.map((r) => (r.id === rec.id ? { ...r, status: "ACCEPTED" } : r))
        );

        toast.success(`Task created: "${rec.title}" in Task Manager!`, {
          action: {
            label: "View Tasks",
            onClick: () => window.location.href = "/tasks",
          },
        });
      } else {
        toast.error("Failed to create task.");
      }
    } catch {
      toast.error("Error converting recommendation to task.");
    } finally {
      setConvertingId(null);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "high":
        return <Badge variant="warning">High Priority</Badge>;
      case "medium":
        return <Badge variant="info">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "loss prevention":
      case "expense alert":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "growth opportunity":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      case "operational bottleneck":
      case "task risk":
        return <AlertCircle className="h-4 w-4 text-rose-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-indigo-500" />;
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Proactive AI Recommendations</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuous intelligence evaluating financial ledger, tasks, and workforce state
            </p>
          </div>
        </div>
        <Badge variant="ai" className="text-xs font-semibold">
          {recommendations.length} Active Insights
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Analyzing business telemetry...</span>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-1 rounded-md bg-muted">
                      {getTypeIcon(rec.type)}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {rec.type}
                    </span>
                    {getPriorityBadge(rec.priority)}
                    {rec.status === "ACCEPTED" && (
                      <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0">
                        Accepted
                      </Badge>
                    )}
                  </div>
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                    title="Dismiss Recommendation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-sm font-semibold text-foreground">
                  {rec.title}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.explanation}
                </p>

                {(rec.estimatedSavings || rec.successMetric) && (
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium pt-1">
                    {rec.estimatedSavings && (
                      <span><strong>Impact:</strong> <span className="text-emerald-600">{rec.estimatedSavings}</span></span>
                    )}
                    {rec.successMetric && (
                      <span><strong>Target:</strong> {rec.successMetric}</span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-muted/20 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-300 font-medium">
                    <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{rec.recommendedAction}</span>
                  </div>

                  <div className="flex items-center gap-2 ml-auto sm:ml-0 shrink-0">
                    {rec.status !== "ACCEPTED" ? (
                      <Button
                        size="sm"
                        onClick={() => handleTurnIntoTask(rec)}
                        disabled={convertingId === rec.id}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-7 font-semibold"
                      >
                        <ListPlus className="h-3 w-3 mr-1" />
                        <span>{convertingId === rec.id ? "Adding..." : "Turn into Task"}</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Task Created</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="h-8 w-8 text-indigo-400 mx-auto opacity-70" />
            <div className="text-sm font-bold text-foreground">
              All Recommendations Resolved!
            </div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your business parameters are currently aligned with strategic benchmarks. BizMind AI is continuously monitoring for new opportunities.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
