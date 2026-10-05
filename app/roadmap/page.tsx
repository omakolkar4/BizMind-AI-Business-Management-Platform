"use client";

import * as React from "react";
import {
  Milestone,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  DollarSign,
  ChevronRight,
  Trash2,
  Edit,
  Check,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PhaseTask {
  id: string;
  title: string;
  completed: boolean;
}

interface RoadmapPhaseItem {
  id: string;
  phaseNumber: number;
  title: string;
  description: string;
  status: "Not Started" | "In Progress" | "Completed" | "Blocked" | string;
  estimatedCost: number;
  startDate?: string | null;
  dueDate?: string | null;
  tasks: string; // JSON string
}

export default function RoadmapPage() {
  const [phases, setPhases] = React.useState<RoadmapPhaseItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("All");

  // Modal State for Add Phase
  const [modalOpen, setModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedCost, setEstimatedCost] = React.useState("100000");
  const [startDate, setStartDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

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
          description,
          estimatedCost,
          startDate,
          dueDate,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setPhases((prev) => [...prev, json.phase]);
        setModalOpen(false);
        setTitle("");
        setDescription("");
        toast.success("New roadmap phase added!");
      }
    } catch {
      toast.error("Failed to add phase.");
    }
  };

  const handleStatusChange = async (phaseId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/roadmap/${phaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setPhases((prev) =>
          prev.map((p) => (p.id === phaseId ? { ...p, status: newStatus } : p))
        );
        toast.success(`Phase status changed to ${newStatus}`);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Are you sure you want to remove this phase?")) return;
    try {
      const res = await fetch(`/api/roadmap/${phaseId}`, { method: "DELETE" });
      if (res.ok) {
        setPhases((prev) => prev.filter((p) => p.id !== phaseId));
        toast.success("Phase removed.");
      }
    } catch {
      toast.error("Error deleting phase.");
    }
  };

  const toggleTaskCompletion = async (phase: RoadmapPhaseItem, taskId: string) => {
    let taskList: PhaseTask[] = [];
    try {
      taskList = JSON.parse(phase.tasks);
    } catch {
      taskList = [];
    }

    const updated = taskList.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    // Save to DB
    try {
      await fetch(`/api/roadmap/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated }),
      });

      setPhases((prev) =>
        prev.map((p) => (p.id === phase.id ? { ...p, tasks: JSON.stringify(updated) } : p))
      );
    } catch {
      toast.error("Failed to toggle milestone.");
    }
  };

  const handleAddTaskToPhase = async (phase: RoadmapPhaseItem) => {
    if (!newTaskTitle.trim()) return;

    let taskList: PhaseTask[] = [];
    try {
      taskList = JSON.parse(phase.tasks);
    } catch {
      taskList = [];
    }

    const newTask: PhaseTask = {
      id: `pt-${Date.now()}`,
      title: newTaskTitle.trim(),
      completed: false,
    };

    const updated = [...taskList, newTask];

    try {
      await fetch(`/api/roadmap/${phase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: updated }),
      });

      setPhases((prev) =>
        prev.map((p) => (p.id === phase.id ? { ...p, tasks: JSON.stringify(updated) } : p))
      );
      setNewTaskTitle("");
      setTaskInputPhaseId(null);
      toast.success("Milestone task added to phase!");
    } catch {
      toast.error("Failed to add milestone.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return <Badge variant="success">Completed</Badge>;
      case "In Progress":
        return <Badge variant="info">In Progress</Badge>;
      case "Blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  const completedPhasesCount = phases.filter((p) => p.status === "Completed").length;
  const overallRoadmapProgress = phases.length > 0 ? Math.round((completedPhasesCount / phases.length) * 100) : 0;

  const filteredPhases = phases.filter((p) => {
    if (filter === "All") return true;
    return p.status === filter;
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Strategic Roadmap
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                7-Phase Framework
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Phased startup journey tracking execution milestones, estimated budgets, and delivery velocity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Phase</span>
            </Button>
          </div>
        </div>

        {/* Progress Bar Header */}
        <Card className="border shadow-xs bg-muted/20">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-foreground">
                Overall Venture Execution Progress: {overallRoadmapProgress}%
              </div>
              <p className="text-[11px] text-muted-foreground">
                {completedPhasesCount} of {phases.length} strategic phases fully completed.
              </p>
            </div>
            <div className="w-full sm:w-64">
              <Progress value={overallRoadmapProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {["All", "In Progress", "Completed", "Not Started", "Blocked"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filter === tab
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Timeline Phases */}
        <div className="space-y-4">
          {filteredPhases.map((phase, idx) => {
            let taskList: PhaseTask[] = [];
            try {
              taskList = JSON.parse(phase.tasks);
            } catch {
              taskList = [];
            }

            const completedTasks = taskList.filter((t) => t.completed).length;

            return (
              <Card
                key={phase.id}
                className="border shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all overflow-hidden"
              >
                <CardHeader className="pb-3 border-b bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-sm font-bold shrink-0">
                      {phase.phaseNumber || idx + 1}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{phase.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap ml-11 sm:ml-0">
                    {getStatusBadge(phase.status)}

                    <select
                      value={phase.status}
                      onChange={(e) => handleStatusChange(phase.id, e.target.value)}
                      className="text-xs rounded-lg border bg-background px-2 py-1 text-foreground font-medium outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>

                    <button
                      onClick={() => handleDeletePhase(phase.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-muted"
                      title="Delete Phase"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4 bg-muted/10">
                  {/* Meta Details: Cost & Dates */}
                  <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Budget: <strong>{formatCurrency(phase.estimatedCost)}</strong></span>
                    </span>
                    {(phase.startDate || phase.dueDate) && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Timeline: {phase.startDate || "TBD"} – {phase.dueDate || "TBD"}</span>
                      </span>
                    )}
                    <span>
                      Milestones: <strong>{completedTasks}/{taskList.length} done</strong>
                    </span>
                  </div>

                  {/* Task Checklist */}
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-foreground">Phase Milestones</div>
                    <div className="space-y-1.5">
                      {taskList.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTaskCompletion(phase, task.id)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-card border text-xs cursor-pointer hover:bg-muted/40 transition-colors"
                        >
                          <div
                            className={`h-4 w-4 rounded-md border flex items-center justify-center transition-colors ${
                              task.completed
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-border bg-background"
                            }`}
                          >
                            {task.completed && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span
                            className={`font-medium ${
                              task.completed ? "line-through text-muted-foreground" : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Add Task Input */}
                    {taskInputPhaseId === phase.id ? (
                      <div className="flex items-center gap-2 pt-2">
                        <Input
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="e.g. Conduct taste test surveys..."
                          className="text-xs h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTaskToPhase(phase);
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddTaskToPhase(phase)}
                          className="text-xs h-8 bg-indigo-600 text-white"
                        >
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskInputPhaseId(null)}
                          className="text-xs h-8"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTaskInputPhaseId(phase.id);
                          setNewTaskTitle("");
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Milestone Task</span>
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal: Add New Phase */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Strategic Roadmap Phase</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddPhase} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="ph-title">Phase Title</Label>
                <Input
                  id="ph-title"
                  placeholder="e.g. Phase 8: International Expansion"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ph-desc">Description</Label>
                <Textarea
                  id="ph-desc"
                  placeholder="Objectives, deliverables, and scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="ph-cost">Estimated Budget (₹)</Label>
                <Input
                  id="ph-cost"
                  type="number"
                  placeholder="250000"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="ph-start">Start Date</Label>
                  <Input
                    id="ph-start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ph-due">Target Completion</Label>
                  <Input
                    id="ph-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white">
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
