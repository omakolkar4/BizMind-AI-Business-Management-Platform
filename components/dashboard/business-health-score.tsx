"use client";

import * as React from "react";
import { Sparkles, TrendingUp, AlertCircle, ArrowUpRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HealthBreakdown {
  financial: number;
  market: number;
  operational: number;
  team: number;
  growth: number;
}

interface BusinessHealthScoreProps {
  score?: number;
  breakdown?: HealthBreakdown;
  aiExplanation?: string;
  recommendedAction?: string;
}

export function BusinessHealthScore({
  score = 82,
  breakdown = {
    financial: 84,
    market: 78,
    operational: 88,
    team: 80,
    growth: 91,
  },
  aiExplanation = "Your business health is strong. Expense growth is slightly higher than revenue growth. Consider reviewing operational costs.",
  recommendedAction = "Review your top 3 operating expenses to improve net contribution margin.",
}: BusinessHealthScoreProps) {
  // SVG circular gauge math
  const radius = 48;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val >= 80) return "text-emerald-600 dark:text-emerald-400 stroke-emerald-500";
    if (val >= 65) return "text-indigo-600 dark:text-indigo-400 stroke-indigo-500";
    if (val >= 50) return "text-amber-600 dark:text-amber-400 stroke-amber-500";
    return "text-rose-600 dark:text-rose-400 stroke-rose-500";
  };

  const getRatingText = (val: number) => {
    if (val >= 80) return "Optimal Condition";
    if (val >= 65) return "Good Traction";
    if (val >= 50) return "Moderate Risk";
    return "Action Needed";
  };

  const items = [
    { label: "Financial Health", value: breakdown.financial, color: "bg-emerald-500" },
    { label: "Market Position", value: breakdown.market, color: "bg-indigo-500" },
    { label: "Operational Efficiency", value: breakdown.operational, color: "bg-cyan-500" },
    { label: "Team Productivity", value: breakdown.team, color: "bg-purple-500" },
    { label: "Growth Potential", value: breakdown.growth, color: "bg-amber-500" },
  ];

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Business Health Score</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Continuously aggregated by Multi-Agent AI
            </p>
          </div>
        </div>
        <Badge variant="success" className="text-xs font-semibold px-2 py-0.5">
          {getRatingText(score)}
        </Badge>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Main circular score gauge & high level verdict */}
        <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="relative flex items-center justify-center">
            <svg height="120" width="120" className="transform -rotate-90">
              <circle
                stroke="currentColor"
                className="text-muted/40"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx="60"
                cy="60"
              />
              <circle
                stroke="currentColor"
                className={getScoreColor(score)}
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + " " + circumference}
                style={{
                  strokeDashoffset,
                  transition: "stroke-dashoffset 1s ease-in-out",
                }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx="60"
                cy="60"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {score}
              </span>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
              <span>Multi-Agent Synthesis</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              &ldquo;{aiExplanation}&rdquo;
            </p>
            <div className="pt-1">
              <Link
                href="/analysis"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 group"
              >
                <span>View Full Multi-Agent SWOT Analysis</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Breakdown sub-metrics */}
        <div className="space-y-3 pt-2 border-t">
          <div className="text-xs font-bold text-foreground">Performance Dimensions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="space-y-1 p-2 rounded-lg bg-muted/30 border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{item.label}</span>
                  <span className="font-bold text-foreground">{item.value}/100</span>
                </div>
                <Progress value={item.value} indicatorColor={item.color} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Contextual next action */}
        {recommendedAction && (
          <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/20 flex items-start gap-3">
            <div className="p-1 rounded-md bg-indigo-600 text-white shrink-0 mt-0.5">
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block">
                Recommended Next Action
              </span>
              <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80 mt-0.5 leading-snug">
                {recommendedAction}
              </p>
            </div>
            <Link
              href="/finances"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
            >
              Take Action
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
