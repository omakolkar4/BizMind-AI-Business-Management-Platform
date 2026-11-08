"use client";

import * as React from "react";
import Link from "next/link";
import {
  Milestone,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Layers,
  ArrowRight,
  Target,
  Users,
  CheckSquare,
  FileText,
  Info,
  HelpCircle,
  Activity,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { EvaluatedPhase, RoadmapSummary, PhaseRequirement } from "@/lib/roadmap/engine";

export default function RoadmapPage() {
  const [phases, setPhases] = React.useState<EvaluatedPhase[]>([]);
  const [summary, setSummary] = React.useState<RoadmapSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("All");
  const [expandedPhaseId, setExpandedPhaseId] = React.useState<string | null>(null);

  // Regenerate Confirmation Modal
  const [regenerateModalOpen, setRegenerateModalOpen] = React.useState(false);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  // Manual Add Phase Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [objective, setObjective] = React.useState("");
  const [rationale, setRationale] = React.useState("");
  const [estimatedCost, setEstimatedCost] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [priority, setPriority] = React.useState("High");

  // Subtask Input
  const [taskInputPhaseId, setTaskInputPhaseId] = React.useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roadmap");
      if (res.ok) {
        const json = await res.json();
        setPhases(json.phases || []);
        setSummary(json.summary || null);
        if (json.phases?.length > 0 && !expandedPhaseId) {
          // Auto-expand the first in-progress or earliest phase
          const active = json.phases.find((p: EvaluatedPhase) => p.completionPercentage < 100) || json.phases[0];
          setExpandedPhaseId(active.id);
        }
      } else {
        toast.error("Failed to load roadmap.");
      }
    } catch {
      toast.error("Network error loading roadmap.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRoadmap();
  }, []);

  const handleRegenerateRoadmap = async () => {
    try {
      setIsRegenerating(true);
      toast.info("Regenerating strategic phases with AI...");
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: true }),
      });

      if (res.ok) {
        const json = await res.json();
        setPhases(json.phases || []);
        setSummary(json.summary || null);
        setRegenerateModalOpen(false);
        if (json.phases?.length > 0) {
          setExpandedPhaseId(json.phases[0].id);
        }
        toast.success("Strategic roadmap regenerated and calibrated successfully!");
      } else {
        toast.error("Could not regenerate roadmap.");
      }
    } catch {
      toast.error("Network error during roadmap regeneration.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Phase title is required.");
      return;
    }

    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || objective,
          objective,
          rationale,
          estimatedCost,
          startDate,
          dueDate,
          priority,
        }),
      });

      if (res.ok) {
        await fetchRoadmap();
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setObjective("");
        setRationale("");
        setEstimatedCost("");
        toast.success("New custom roadmap phase created!");
      }
    } catch {
      toast.error("Failed to add phase.");
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Are you sure you want to remove this phase?")) return;
    try {
      const res = await fetch(`/api/roadmap/${phaseId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchRoadmap();
        toast.success("Phase removed.");
      }
    } catch {
      toast.error("Error deleting phase.");
    }
  };

  const handleAddTaskToPhase = async (phase: EvaluatedPhase) => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `pt-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
    };

    const updated = [...(phase.tasks || []), newTask];

    try {
      const res = await fetch(`/api/roadmap/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated }),
      });

      if (res.ok) {
        await fetchRoadmap();
        setNewTaskTitle("");
        setTaskInputPhaseId(null);
        toast.success("Milestone subtask added!");
      }
    } catch {
      toast.error("Failed to add milestone.");
    }
  };

  const toggleSubtask = async (phase: EvaluatedPhase, taskId: string) => {
    const updated = (phase.tasks || []).map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    try {
      const res = await fetch(`/api/roadmap/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated }),
      });

      if (res.ok) {
        await fetchRoadmap();
      }
    } catch {
      toast.error("Failed to update milestone.");
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "employees":
        return <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      case "tasks":
        return <CheckSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case "finances":
        return <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />;
      case "business-plan":
        return <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Layers className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Critical":
        return <Badge variant="destructive" className="text-[10px] uppercase font-bold">Critical</Badge>;
      case "High":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold">High</Badge>;
      case "Low":
        return <Badge variant="secondary" className="text-[10px] uppercase">Low</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] uppercase">Medium</Badge>;
    }
  };

  const filteredPhases = phases.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Completed") return p.completionPercentage === 100;
    if (filter === "In Progress") return p.completionPercentage > 0 && p.completionPercentage < 100;
    if (filter === "Not Started") return p.completionPercentage === 0;
    if (filter === "Overdue") return p.isOverdue;
    return true;
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                AI Strategic Execution Roadmap
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Autonomous Tracking
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Phases and completion percentages are calculated dynamically from verified application records in Employees, Tasks, Finances, and Business Plan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateModalOpen(true)}
              className="text-xs font-semibold h-9"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Regenerate Roadmap</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Custom Phase</span>
            </Button>
          </div>
        </div>

        {/* Plan Approval & Execution Readiness Banner */}
        {summary && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs ${
              summary.isPlanAccepted
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100"
                : summary.planStatus === "REVISION_REQUIRED"
                ? "border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-950 dark:text-amber-100"
                : "border-indigo-300 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`p-2 rounded-xl text-white shrink-0 ${
                  summary.isPlanAccepted
                    ? "bg-emerald-600"
                    : summary.planStatus === "REVISION_REQUIRED"
                    ? "bg-amber-600"
                    : "bg-indigo-600"
                }`}
              >
                {summary.isPlanAccepted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {summary.isPlanAccepted
                      ? `Execution Mode Active — Business Plan v${summary.planVersion || 1} Accepted`
                      : summary.planStatus === "REVISION_REQUIRED"
                      ? "Plan Revision Required — Execution Paused"
                      : "Plan Acceptance Review Pending"}
                  </h3>
                  <Badge
                    variant={
                      summary.isPlanAccepted
                        ? "success"
                        : summary.planStatus === "REVISION_REQUIRED"
                        ? "warning"
                        : "ai"
                    }
                    className="text-[10px] font-bold"
                  >
                    {summary.executionReadiness.replace(/_/g, " ")}
                  </Badge>
                </div>
                <p className="text-xs opacity-90 mt-0.5">
                  {summary.isPlanAccepted
                    ? "Your strategic business plan has been officially accepted by the business owner. Execution metrics are active."
                    : summary.planStatus === "REVISION_REQUIRED"
                    ? "The founder requested revisions on this plan. Review feedback and update inputs before operational execution."
                    : "Review your business plan, feasibility findings, and budget assumptions, then confirm your Yes/No acceptance decision."}
                </p>
              </div>
            </div>

            <Link href="/business-plan" className="shrink-0">
              <Button
                size="sm"
                variant={summary.isPlanAccepted ? "outline" : "default"}
                className={`text-xs font-bold h-9 px-4 ${
                  !summary.isPlanAccepted ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""
                }`}
              >
                <span>{summary.isPlanAccepted ? "View Accepted Plan" : "Review & Decide Plan"}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* 4 Summary Telemetry Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Overall Progress */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Execution Progress</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {summary ? `${summary.overallProgress}%` : "0%"}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  {summary ? `${summary.completedPhasesCount}/${summary.totalPhasesCount} Phases Complete` : ""}
                </span>
              </div>
              <Progress value={summary?.overallProgress || 0} className="h-1.5" />
            </CardContent>
          </Card>

          {/* Card 2: Action Requirements */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Linked Requirements</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {summary ? `${summary.completedRequirementsCount} / ${summary.totalRequirementsCount}` : "0 / 0"}
                </span>
                <span className="text-xs text-emerald-600 font-semibold">
                  Verified In App
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary ? `${summary.pendingRequirementsCount} pending actions to complete phases` : "Loading..."}
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Planned Budget vs Spent */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Budget Allocated</span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-foreground truncate">
                {formatCurrency(summary?.totalPlannedBudget || 0)}
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Spent: {formatCurrency(summary?.totalSpentBudget || 0)}</span>
                <span className={summary && summary.budgetVariance >= 0 ? "text-emerald-600 font-medium" : "text-rose-600 font-medium"}>
                  Variance: {formatCurrency(summary?.budgetVariance || 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Overdue & Health */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Milestone Health</span>
                <div className={`p-1.5 rounded-lg ${summary?.overduePhasesCount ? "bg-rose-500/10 text-rose-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-foreground">
                  {summary?.overduePhasesCount === 0 ? "On Schedule" : `${summary?.overduePhasesCount} Overdue`}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary?.overduePhasesCount ? "Review overdue deadlines below" : "All phase milestones are within deadlines"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Next Recommended Action Banner */}
        {summary?.nextRecommendedAction && (
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-background to-purple-50/50 dark:from-indigo-950/40 dark:via-background dark:to-purple-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Next Recommended Step • Phase {summary.nextRecommendedAction.phaseNumber}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate hidden md:inline">
                    {summary.nextRecommendedAction.phaseTitle}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                  {summary.nextRecommendedAction.requirementTitle}
                </h3>
              </div>
            </div>

            <Link href={summary.nextRecommendedAction.actionUrl} className="shrink-0">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 h-9 shadow-sm">
                <span>{summary.nextRecommendedAction.actionLabel}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center justify-between gap-3 border-b pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["All", "In Progress", "Not Started", "Completed", "Overdue"].map((item) => (
              <Button
                key={item}
                variant={filter === item ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(item)}
                className={`text-xs h-8 ${filter === item ? "bg-indigo-600 text-white" : ""}`}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Showing {filteredPhases.length} of {phases.length} Phases
          </div>
        </div>

        {/* Phases List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted/50 border" />
            ))}
          </div>
        ) : filteredPhases.length === 0 ? (
          <Card className="border text-center py-16">
            <CardContent className="space-y-3">
              <Milestone className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Phases Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No roadmap phases match the current filter. Try selecting &ldquo;All&rdquo; or add a custom milestone.
              </p>
              <Button size="sm" onClick={() => setFilter("All")} variant="outline" className="text-xs">
                Reset Filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredPhases.map((phase) => {
              const isExpanded = expandedPhaseId === phase.id;
              const isCompleted = phase.completionPercentage === 100;

              return (
                <Card
                  key={phase.id}
                  className={`border transition-all shadow-xs ${
                    isCompleted
                      ? "border-emerald-300 dark:border-emerald-950 bg-emerald-500/[0.02]"
                      : phase.isOverdue
                      ? "border-rose-300 dark:border-rose-950 bg-rose-500/[0.02]"
                      : "border-border hover:border-indigo-200 dark:hover:border-indigo-900/60"
                  }`}
                >
                  <CardHeader className="p-4 sm:p-6 pb-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Phase Title, Number, Dates & Tags */}
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black shadow-xs ${
                            isCompleted
                              ? "bg-emerald-600 text-white"
                              : phase.isOverdue
                              ? "bg-rose-600 text-white"
                              : "bg-indigo-600 text-white"
                          }`}
                        >
                          {phase.phaseNumber}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                              {phase.title}
                            </h2>
                            {getPriorityBadge(phase.priority)}
                            {phase.isOverdue && (
                              <Badge variant="destructive" className="text-[10px] font-bold">
                                Overdue
                              </Badge>
                            )}
                            {phase.duration && (
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {phase.duration}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {phase.objective || phase.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Progress % Bar & Collapse Toggle */}
                      <div className="flex items-center gap-4 lg:shrink-0 justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0">
                        <div className="w-40 sm:w-48 space-y-1 text-right">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-muted-foreground text-[11px]">Completion</span>
                            <span className={isCompleted ? "text-emerald-600 font-bold" : "text-foreground font-bold"}>
                              {phase.completionPercentage}%
                            </span>
                          </div>
                          <Progress
                            value={phase.completionPercentage}
                            className={`h-2 ${isCompleted ? "[&>div]:bg-emerald-600" : ""}`}
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setExpandedPhaseId(isExpanded ? null : phase.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Expanded Body: Strategic Context + Linked Action Requirements + Milestones */}
                  {isExpanded && (
                    <CardContent className="p-4 sm:p-6 pt-0 space-y-6 border-t mt-2">
                      {/* 1. Strategic Context Block (Objective & Rationale) */}
                      {(phase.rationale || phase.expectedOutcome || phase.completionCriteria) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-4">
                          {phase.rationale && (
                            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                <span>Why This Phase Is Necessary</span>
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {phase.rationale}
                              </p>
                            </div>
                          )}

                          {phase.expectedOutcome && (
                            <div className="p-3.5 rounded-xl border bg-muted/30 space-y-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                <Target className="h-3.5 w-3.5" />
                                <span>Expected Strategic Outcome</span>
                              </span>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {phase.expectedOutcome}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Structured Application Module Requirements */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Linked Module Completion Requirements</span>
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            Evaluated in real-time from active records
                          </span>
                        </div>

                        {phase.requirements && phase.requirements.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {phase.requirements.map((req) => (
                              <div
                                key={req.id}
                                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                                  req.isCompleted
                                    ? "border-emerald-200 dark:border-emerald-950 bg-emerald-500/[0.04]"
                                    : "border-border bg-card"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <div className="p-1 rounded bg-muted shrink-0 mt-0.5">
                                      {getModuleIcon(req.linkedModule)}
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-bold text-foreground leading-snug">
                                        {req.title}
                                      </h5>
                                      {req.description && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                          {req.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {req.isCompleted ? (
                                      <Badge variant="success" className="text-[10px] gap-1">
                                        <Check className="h-3 w-3" />
                                        <span>Completed</span>
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] font-mono">
                                        {req.currentValue || 0} / {req.targetValue} {req.unit || ""}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1.5 pt-1">
                                  <Progress value={req.progressPercent || 0} className="h-1.5" />
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground">
                                      Weight: {req.weight || 1}x • {req.progressPercent || 0}% Progress
                                    </span>
                                    <Link
                                      href={req.actionUrl}
                                      className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      <span>{req.actionLabel}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground p-3 rounded-lg border bg-muted/20">
                            No structured requirements linked for this phase yet.
                          </div>
                        )}
                      </div>

                      {/* 3. Milestone Subtasks (Manual Checklist) */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                            <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Phase Operational Milestones ({phase.tasks?.length || 0})</span>
                          </h4>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTaskInputPhaseId(phase.id)}
                            className="text-[11px] h-7 text-indigo-600 dark:text-indigo-400 font-bold"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <span>Add Milestone</span>
                          </Button>
                        </div>

                        {taskInputPhaseId === phase.id && (
                          <div className="flex items-center gap-2 p-2 rounded-xl border bg-muted/30">
                            <Input
                              placeholder="Enter milestone title..."
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              className="text-xs h-8"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddTaskToPhase(phase);
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddTaskToPhase(phase)}
                              className="text-xs h-8 bg-indigo-600 text-white font-semibold"
                            >
                              Add
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setTaskInputPhaseId(null)}
                              className="text-xs h-8"
                            >
                              Cancel
                            </Button>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          {phase.tasks && phase.tasks.length > 0 ? (
                            phase.tasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => toggleSubtask(phase, task.id)}
                                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 cursor-pointer select-none transition-colors group"
                              >
                                <div
                                  className={`h-4 w-4 rounded flex items-center justify-center border text-white transition-colors ${
                                    task.completed ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/40 bg-background"
                                  }`}
                                >
                                  {task.completed && <Check className="h-3 w-3" />}
                                </div>
                                <span
                                  className={`text-xs ${
                                    task.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                                  }`}
                                >
                                  {task.title}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-muted-foreground italic p-2">
                              No milestone tasks added yet.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Phase Action Footer */}
                      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>Allocated: {formatCurrency(phase.estimatedCost)}</span>
                          {phase.dueDate && <span>Target Due: {new Date(phase.dueDate).toLocaleDateString()}</span>}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePhase(phase.id)}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs h-8"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          <span>Remove Phase</span>
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Regenerate Roadmap Safeguard */}
        <Dialog open={regenerateModalOpen} onOpenChange={setRegenerateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <span>Regenerate Strategic Roadmap</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Regenerating with AI will formulate fresh phase milestones and requirements calibrated to your business profile, budget, and stage.
              </DialogDescription>
            </DialogHeader>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Preservation Safeguard</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                Your actual saved employees, tasks, financial transactions, and business plan documents will remain untouched. Only the roadmap phase structure will be re-synthesized.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegenerateModalOpen(false)}
                disabled={isRegenerating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRegenerateRoadmap}
                disabled={isRegenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                {isRegenerating ? "Regenerating..." : "Confirm & Regenerate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal: Add Custom Phase */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Custom Strategic Phase</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a customized milestone phase tailored to your specific venture timeline.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddPhase} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="phase-title">Phase Title</Label>
                <Input
                  id="phase-title"
                  placeholder="Enter phase title (e.g., Regulatory Approvals & Retail Licensing)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phase-objective">Strategic Objective</Label>
                <Input
                  id="phase-objective"
                  placeholder="Enter the primary objective of this phase..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="phase-rationale">Why This Phase Is Necessary</Label>
                <Textarea
                  id="phase-rationale"
                  placeholder="Explain why this phase is required for your business execution..."
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phase-budget">Allocated Budget (₹)</Label>
                  <Input
                    id="phase-budget"
                    type="number"
                    placeholder="Enter estimated budget"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phase-priority">Priority Level</Label>
                  <select
                    id="phase-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="phase-start">Start Date</Label>
                  <Input
                    id="phase-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phase-due">Estimated Completion Date</Label>
                  <Input
                    id="phase-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
                >
                  Create Phase
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
