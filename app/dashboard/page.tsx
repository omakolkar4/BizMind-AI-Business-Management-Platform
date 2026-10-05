"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  CheckSquare,
  Sparkles,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  AlertCircle,
  FileText,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessHealthScore } from "@/components/dashboard/business-health-score";
import { AIRecommendations } from "@/components/dashboard/ai-recommendations";
import { RevenueExpenseChart } from "@/components/charts/revenue-expense-chart";
import { ExpensePieChart } from "@/components/charts/expense-pie-chart";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function DashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        toast.error("Failed to load dashboard metrics.");
      }
    } catch {
      toast.error("Network error loading dashboard.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <DashboardShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 w-64 bg-muted/60 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/50" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 rounded-xl bg-muted/50" />
            <div className="h-96 rounded-xl bg-muted/50" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  const business = data?.business || {
    name: "NovaBite Foods",
    stage: "Growing",
    type: "Food & Beverage",
    currency: "₹",
  };

  const metrics = data?.metrics || {
    revenue: 845000,
    expenses: 425000,
    netProfit: 420000,
    profitMargin: 49.7,
    investments: 650000,
    employeeCount: 6,
    activeEmployees: 6,
    tasksCount: { total: 8, completed: 2, inProgress: 2, todo: 3, blocked: 1 },
  };

  const health = data?.health || {
    score: 82,
    breakdown: { financial: 84, market: 78, operational: 88, team: 80, growth: 91 },
    explanation: "Your business health is strong. Expense growth is slightly higher than revenue growth. Consider reviewing operational costs.",
    recommendedAction: "Resolve 1 blocked task in your operational pipeline.",
  };

  const charts = data?.charts || {};
  const recentTransactions = data?.recentTransactions || [];

  return (
    <DashboardShell
      businessName={business.name}
      businessStage={business.stage}
    >
      <div className="space-y-6">
        {/* Welcome Header & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Executive Dashboard
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Autonomous Co-Pilot
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time operational metrics, multi-agent financial diagnostics, and strategic recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              className="text-xs font-semibold h-9"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Refresh Telemetry</span>
            </Button>

            <Link href="/finances">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20">
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Add Transaction</span>
              </Button>
            </Link>

            <Link href="/advisor">
              <Button size="sm" variant="gradient" className="font-semibold text-xs h-9">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                <span>Ask AI Advisor</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 8 Metric KPI Cards (Section 9) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Revenue */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {formatCurrency(metrics.revenue, business.currency)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>+18.4%</span>
                <span className="text-muted-foreground font-normal">vs. prev month</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Expenses */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Expenses</span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {formatCurrency(metrics.expenses, business.currency)}
              </div>
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span>Alert:</span>
                <span className="text-muted-foreground font-normal">Packaging up 18%</span>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Net Profit & Margin */}
          <Card className="hover:shadow-md transition-shadow border-indigo-200/50 dark:border-indigo-900/40">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Net Profit</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(metrics.netProfit, business.currency)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {metrics.profitMargin.toFixed(1)}% Profit Margin
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Total Investments */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Investments</span>
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Building2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {formatCurrency(metrics.investments, business.currency)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Seed & Founder Equity
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Employees */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Workforce</span>
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {metrics.employeeCount} <span className="text-xs font-normal text-muted-foreground">members</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                {metrics.activeEmployees} Active on duty
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Kanban Tasks */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Task Velocity</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <CheckSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-foreground">
                {metrics.tasksCount.completed}/{metrics.tasksCount.total} <span className="text-xs font-normal text-muted-foreground">done</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                {metrics.tasksCount.inProgress} in progress, {metrics.tasksCount.blocked} blocked
              </div>
            </CardContent>
          </Card>

          {/* Card 7: Business Health */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Business Health</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {health.score}/100
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold">
                Multi-Agent Synthesis
              </div>
            </CardContent>
          </Card>

          {/* Card 8: AI Score / Strategy Readiness */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">AI Strategy Index</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                87/100
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                High Growth Potential
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Section: Business Health Score + Revenue Expense Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Health Score Gauge (5 cols) */}
          <div className="lg:col-span-5">
            <BusinessHealthScore
              score={health.score}
              breakdown={health.breakdown}
              aiExplanation={health.explanation}
              recommendedAction={health.recommendedAction}
            />
          </div>

          {/* Revenue vs Expenses Chart (7 cols) */}
          <div className="lg:col-span-7">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Revenue vs Expenses</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Monthly income, operating expenditure, and profit spread
                  </p>
                </div>
                <Link
                  href="/finances"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Full P&L</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <RevenueExpenseChart data={charts.revenueExpense} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lower Section: AI Recommendations + Expense Pie Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Autonomous Recommendations (7 cols) */}
          <div className="lg:col-span-7">
            <AIRecommendations initialRecommendations={data?.recommendations} />
          </div>

          {/* Expense Distribution (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border shadow-sm">
              <CardHeader className="pb-2 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Expense Breakdown</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Categorical cost allocation
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  Real-time
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ExpensePieChart data={charts.expenseCategories} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Transactions List */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Ledger Transactions</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest ledger entries synced with financial models
                </p>
              </div>
            </div>
            <Link href="/finances">
              <Button variant="outline" size="sm" className="text-xs font-semibold h-8">
                View All Transactions
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {recentTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentTransactions.map((tx: any) => {
                      const isIncome = tx.type === "INCOME";
                      return (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-muted-foreground">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {tx.description}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {tx.category}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={isIncome ? "success" : "destructive"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {tx.type}
                            </Badge>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {isIncome ? "+" : "-"}{formatCurrency(tx.amount, business.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No recent transactions found. Add your first income or expense entry in the Finances tab.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
