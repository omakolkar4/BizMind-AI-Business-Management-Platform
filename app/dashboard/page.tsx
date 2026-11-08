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
  Clock,
  CheckCircle2,
  LogIn,
  LogOut,
  MessageSquare,
  ChevronRight,
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

function EmployeeDashboardView({ data, onRefresh }: { data: any; onRefresh: () => void }) {
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [attendance, setAttendance] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [punchLoading, setPunchLoading] = React.useState(false);
  const [taskFilter, setTaskFilter] = React.useState("ALL");

  const loadEmployeeData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, attRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/attendance"),
      ]);
      if (tasksRes.ok) {
        const json = await tasksRes.json();
        setTasks(json.tasks || []);
      }
      if (attRes.ok) {
        const json = await attRes.json();
        setAttendance(json);
      }
    } catch {
      toast.error("Failed to load employee dashboard metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  const handlePunch = async (action: "CHECK_IN" | "CHECK_OUT") => {
    try {
      setPunchLoading(true);
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Attendance action failed.");
        return;
      }
      toast.success(json.message);
      await loadEmployeeData();
    } catch {
      toast.error("Network error submitting attendance.");
    } finally {
      setPunchLoading(false);
    }
  };

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "To Do").length;
  const inReview = tasks.filter((t) => t.status === "In Review").length;
  const blocked = tasks.filter((t) => t.status === "Blocked").length;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "IN_PROGRESS") return t.status === "In Progress" || t.status === "To Do";
    if (taskFilter === "IN_REVIEW") return t.status === "In Review";
    if (taskFilter === "BLOCKED") return t.status === "Blocked";
    if (taskFilter === "COMPLETED") return t.status === "Completed";
    return true;
  });

  const isCheckedIn = attendance?.summary?.isCheckedIn;
  const todayRecord = attendance?.todayRecord;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-indigo-100/80 dark:border-indigo-950/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-background p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Welcome, {data?.user?.name || "Team Member"}
            </h1>
            <Badge variant="outline" className="text-xs px-2 py-0 border-indigo-300 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20">
              Employee Workspace
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Track assigned deliverables, log shift hours, and collaborate with your team.</span>
            <span>•</span>
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Calendar className="h-3 w-3 text-indigo-500" />
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadEmployeeData} disabled={loading} className="text-xs h-9">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/attendance">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shadow-xs">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              <span>Attendance & Punch</span>
            </Button>
          </Link>
          <Link href="/tasks">
            <Button variant="outline" size="sm" className="text-xs h-9">
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              <span>Tasks</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Personal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Active Deliverables</span>
            <div className="text-2xl font-black text-foreground">{inProgress} Tasks</div>
            <span className="text-[11px] text-muted-foreground">To Do & In Progress</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Under Owner Review</span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{inReview} Tasks</div>
            <span className="text-[11px] text-muted-foreground">Submitted for sign-off</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Blocked Deliverables</span>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{blocked} Tasks</div>
            <span className="text-[11px] text-muted-foreground">Blocker reported to owner</span>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Completed Tasks</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completed} Tasks</div>
            <span className="text-[11px] text-muted-foreground">Verified & approved</span>
          </CardContent>
        </Card>
      </div>

      {/* Main 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): My Work Today */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-indigo-600" />
                  <span>My Assigned Work & Deadlines</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tasks assigned strictly to you by the business owner.
                </p>
              </div>

              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 h-8">
                  <span>Full Kanban Board</span>
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { label: "All Tasks", value: "ALL", count: tasks.length },
                  { label: "Active", value: "IN_PROGRESS", count: inProgress },
                  { label: "In Review", value: "IN_REVIEW", count: inReview },
                  { label: "Blocked", value: "BLOCKED", count: blocked },
                  { label: "Completed", value: "COMPLETED", count: completed },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setTaskFilter(tab.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      taskFilter === tab.value
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Tasks List */}
              {loading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse border" />
                  ))}
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border bg-card hover:bg-muted/10 transition-colors space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-foreground leading-snug">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={
                              task.priority === "Critical"
                                ? "destructive"
                                : task.priority === "High"
                                ? "warning"
                                : "outline"
                            }
                            className="text-[10px] px-2 py-0"
                          >
                            {task.priority}
                          </Badge>
                          <Badge
                            variant={
                              task.status === "Completed"
                                ? "success"
                                : task.status === "In Review"
                                ? "info"
                                : task.status === "Blocked"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-[10px] px-2 py-0"
                          >
                            {task.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Blocker Notice */}
                      {task.status === "Blocked" && task.blockerReason && (
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-400 flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><strong>Reported Blocker:</strong> {task.blockerReason}</span>
                        </div>
                      )}

                      {/* Manager Feedback Notice */}
                      {task.managerFeedback && (
                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-400 flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-600" />
                          <span><strong>Owner Feedback:</strong> {task.managerFeedback}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
                        <span>Due: {task.dueDate ? formatDate(task.dueDate) : "No deadline"}</span>
                        <Link
                          href={`/tasks?taskId=${task.id}`}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Update Progress & Submit →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No deliverables found in this category.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Attendance Widget + Team Links */}
        <div className="space-y-4">
          {/* Quick Attendance Widget */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-600" />
                <span>Today's Attendance</span>
              </CardTitle>
              <Link href="/attendance">
                <Button variant="ghost" size="sm" className="text-xs text-indigo-600 h-7 px-2">
                  <span>Log</span>
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Shift Status:</span>
                <Badge
                  variant={isCheckedIn ? "success" : todayRecord?.checkOut ? "info" : "secondary"}
                  className="text-xs"
                >
                  {isCheckedIn
                    ? "Checked In"
                    : todayRecord?.checkOut
                    ? "Shift Finished"
                    : "Not Checked In"}
                </Badge>
              </div>

              {isCheckedIn ? (
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={punchLoading}
                  onClick={() => handlePunch("CHECK_OUT")}
                  className="w-full h-10 font-bold"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  <span>Check Out Now</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={punchLoading}
                  onClick={() => handlePunch("CHECK_IN")}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  <span>Check In Now</span>
                </Button>
              )}

              {todayRecord && (
                <div className="pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Check-In</span>
                    <span className="font-mono font-bold text-foreground">
                      {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Hours Logged</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {todayRecord.totalHours ? `${todayRecord.totalHours} hrs` : "Tracking..."}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                <span>Month Total:</span>
                <span className="font-bold text-foreground font-mono">
                  {attendance?.summary?.totalHours || 0} hrs ({attendance?.summary?.totalDays || 0} shifts)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Employee Work Assistant Card */}
          <Card className="border shadow-sm bg-gradient-to-br from-indigo-50/40 via-card to-purple-50/30 dark:from-indigo-950/20 dark:via-card dark:to-purple-950/20">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>BizMind Work Assistant</span>
              </CardTitle>
              <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-300">
                AI Helper
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Get instant guidance on your assigned deliverables, blocker resolution, and approved attendance procedures.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  "What are my assigned tasks?",
                  "How to submit deliverables?",
                  "Attendance policy rules",
                ].map((prompt, i) => (
                  <Link key={i} href="/assistant">
                    <span className="text-[10px] font-medium bg-background hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 border px-2 py-0.5 rounded-full transition-colors cursor-pointer block">
                      {prompt}
                    </span>
                  </Link>
                ))}
              </div>
              <Link href="/assistant" className="block pt-1">
                <Button size="sm" className="w-full text-xs font-semibold h-8 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  <span>Launch Work Assistant</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Team Link Card */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Team Communication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                Need to coordinate on a deliverable? Reach out directly to your colleagues or project lead.
              </p>
              <Link href="/team" className="block">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold h-9">
                  <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                  <span>Open Colleague Directory & Chat</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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

  const isEmployee = data?.user?.role === "EMPLOYEE";

  if (isEmployee) {
    return (
      <DashboardShell
        businessName={data?.business?.name || "Company Workspace"}
        businessStage={data?.business?.stage || "Active"}
        userName={data?.user?.name}
        userEmail={data?.user?.email}
        userRole="EMPLOYEE"
      >
        <EmployeeDashboardView data={data} onRefresh={fetchDashboardData} />
      </DashboardShell>
    );
  }

  const business = data?.business || {
    name: "My Business",
    stage: "Idea",
    type: "Enterprise",
    currency: "₹",
  };

  const metrics = data?.metrics || {
    revenue: 0,
    expenses: 0,
    netProfit: 0,
    profitMargin: 0,
    investments: 0,
    employeeCount: 0,
    activeEmployees: 0,
    tasksCount: { total: 0, completed: 0, inProgress: 0, todo: 0, blocked: 0 },
  };

  const health = data?.health || {
    score: 80,
    breakdown: { financial: 80, market: 80, operational: 80, team: 80, growth: 80 },
    explanation: "Real-time telemetry updated. Check your operational metrics and transactions.",
    recommendedAction: "Review financial indicators and pending roadmap tasks.",
  };

  const charts = data?.charts || {};
  const recentTransactions = data?.recentTransactions || [];

  return (
    <DashboardShell
      businessName={business.name}
      businessStage={business.stage}
      userName={data?.user?.name}
      userEmail={data?.user?.email}
      userRole="OWNER"
    >
      <div className="space-y-6">
        {/* Welcome Header & Action Buttons */}
        <div className="rounded-2xl border border-indigo-100/80 dark:border-indigo-950/80 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-background dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-background p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {data?.user?.name || "Founder"}
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Autonomous Co-Pilot
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span><strong>{business.name}</strong> • {business.type} • {business.stage} Stage</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Calendar className="h-3 w-3 text-indigo-500" />
                {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </span>
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
              <span>Refresh</span>
            </Button>

            <Link href="/attendance">
              <Button variant="outline" size="sm" className="text-xs font-semibold h-9 border-indigo-200 dark:border-indigo-900 gap-1.5">
                <Clock className="h-3.5 w-3.5 text-indigo-600" />
                <span>Attendance Pulse</span>
              </Button>
            </Link>

            <Link href="/finances">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-xs">
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

        {/* Business Plan Status Alert (Section 2 & 5) */}
        {business && business.planStatus && business.planStatus !== "ACCEPTED" && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              business.planStatus === "REVISION_REQUIRED"
                ? "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                : "border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-xl text-white shrink-0 ${
                  business.planStatus === "REVISION_REQUIRED" ? "bg-amber-600" : "bg-indigo-600"
                }`}
              >
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm">
                    {business.planStatus === "REVISION_REQUIRED"
                      ? "Plan Revision Required — Execution Paused"
                      : "Business Plan Awaiting Founder Acceptance Review"}
                  </h3>
                  <Badge variant={business.planStatus === "REVISION_REQUIRED" ? "warning" : "ai"} className="text-[10px]">
                    {business.planStatus.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {business.planStatus === "REVISION_REQUIRED"
                    ? "Founder requested strategic revisions. Update inputs or plan sections to complete acceptance."
                    : "Review the business idea, feasibility findings, budget, and roadmap to confirm your Yes/No acceptance decision."}
                </p>
              </div>
            </div>

            <Link href="/business-plan" className="shrink-0">
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3.5 shadow-xs"
              >
                <span>Review & Decide Plan</span>
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}

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
