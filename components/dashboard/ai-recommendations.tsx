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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export interface RecommendationItem {
  id: string;
  type: string; // Expense Alert, Growth Opportunity, Task Risk, Financial Insight
  priority: "Low" | "Medium" | "High" | "Urgent" | string;
  title: string;
  explanation: string;
  recommendedAction: string;
  actionLink?: string;
}

interface AIRecommendationsProps {
  initialRecommendations?: RecommendationItem[];
}

export function AIRecommendations({ initialRecommendations }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = React.useState<RecommendationItem[]>(
    initialRecommendations || [
      {
        id: "rec-1",
        type: "Expense Alert",
        priority: "High",
        title: "Packaging costs increased 18% over past 45 days",
        explanation:
          "Recent spike in biodegradable container purchase volume without tier discounts is eroding food contribution margins from 48% to 42%.",
        recommendedAction:
          "Consolidate supplier bulk orders to a quarterly contract for an immediate 8% margin improvement.",
        actionLink: "/finances",
      },
      {
        id: "rec-2",
        type: "Growth Opportunity",
        priority: "Medium",
        title: "Corporate meal subscription demand in Pune West grew 34%",
        explanation:
          "Tech enterprises in Hinjewadi Phase 1 show high interest in sponsored healthy lunch stipends for return-to-office employees.",
        recommendedAction:
          "Launch a specialized 5-day corporate lunch pilot targeting HR managers with free tasting samples.",
        actionLink: "/tasks",
      },
      {
        id: "rec-3",
        type: "Task Risk",
        priority: "Urgent",
        title: "Cold-chain vendor SLA renegotiation is currently blocked",
        explanation:
          "Morning delivery delays risk ingredient freshness and can create 15-minute kitchen prep delays for peak lunch rush.",
        recommendedAction:
          "Escalate to procurement manager Siddharth Joshi with backup supplier shortlist immediately.",
        actionLink: "/tasks",
      },
      {
        id: "rec-4",
        type: "Financial Insight",
        priority: "Low",
        title: "Healthy net profit margin sustained at 49.7%",
        explanation:
          "Recent B2B event catering contracts provided high operating leverage and strong cash flow velocity.",
        recommendedAction:
          "Allocate 15% of surplus into high-efficiency induction cookers to increase batch capacity by 20%.",
        actionLink: "/finances",
      },
    ]
  );

  const handleDismiss = (id: string) => {
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
    toast.success("AI Recommendation dismissed");
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
      case "expense alert":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "growth opportunity":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
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
            <CardTitle className="text-base">Autonomous AI Recommendations</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Targeted real-time business interventions
            </p>
          </div>
        </div>
        <Badge variant="ai" className="text-xs font-semibold">
          {recommendations.length} Active Insights
        </Badge>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="group relative rounded-xl border bg-card p-4 transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xs"
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
                  </div>
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                    title="Dismiss Recommendation"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-2 text-sm font-semibold text-foreground">
                  {rec.title}
                </div>

                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {rec.explanation}
                </p>

                <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-muted/20 p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-950 dark:text-indigo-300 font-medium">
                    <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>{rec.recommendedAction}</span>
                  </div>
                  {rec.actionLink && (
                    <Link
                      href={rec.actionLink}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 shrink-0 ml-auto sm:ml-0"
                    >
                      <span>Resolve</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
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
