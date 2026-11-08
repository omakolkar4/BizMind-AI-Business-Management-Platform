"use client";

import * as React from "react";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Calendar,
  User,
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  FileCheck,
  RotateCcw,
  Sparkles,
  Edit3,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

interface TaskComment {
  id: string;
  userName: string;
  userRole: string;
  content: string;
  type: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  createdAt: string;
}

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority: "Low" | "Medium" | "High" | "Critical" | string;
  status: "To Do" | "In Progress" | "In Review" | "Blocked" | "Completed" | string;
  category: string;
  dueDate?: string | null;
  assignedEmployeeId?: string | null;
  assignedEmployee?: { id: string; name: string; role: string; department?: string } | null;
  blockerReason?: string | null;
  completionNotes?: string | null;
  managerFeedback?: string | null;
  estimatedBudget?: number | null;
  successMetric?: string | null;
  requestedDueDate?: string | null;
  extensionReason?: string | null;
  extensionStatus?: string | null;
  comments?: TaskComment[];
}

interface EmployeeSelect {
  id: string;
  name: string;
  role: string;
}

const COLUMNS: { id: "To Do" | "In Progress" | "In Review" | "Blocked" | "Completed"; title: string; color: string; badge: string }[] = [
  { id: "To Do", title: "To Do", color: "border-slate-300 dark:border-slate-700", badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
  { id: "In Progress", title: "In Progress", color: "border-indigo-500", badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200" },
  { id: "In Review", title: "In Review", color: "border-purple-500", badge: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200" },
  { id: "Blocked", title: "Blocked", color: "border-rose-500", badge: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" },
  { id: "Completed", title: "Completed", color: "border-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
];

function TasksContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "requests" ? "requests" : "tasks";

  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeSelect[]>([]);
  const [currentUserRole, setCurrentUserRole] = React.useState<string>("OWNER");
  const [currentEmployeeId, setCurrentEmployeeId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"tasks" | "requests">(initialTab);
  const [view, setView] = React.useState<"kanban" | "list">("kanban");
  const [myOnly, setMyOnly] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("All");

  // Requests state
  const [requests, setRequests] = React.useState<any[]>([]);

  // Modal: Add Task
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState("Medium");
  const [status, setStatus] = React.useState("To Do");
  const [category, setCategory] = React.useState("Operations");
  const [assignedEmployeeId, setAssignedEmployeeId] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [estimatedBudget, setEstimatedBudget] = React.useState("");
  const [successMetric, setSuccessMetric] = React.useState("");

  // Modal: Task Detail & Work Updates
  const [selectedTask, setSelectedTask] = React.useState<TaskItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const [submittingAction, setSubmittingAction] = React.useState(false);

  // Sub-actions in Task Detail
  const [submissionNotes, setSubmissionNotes] = React.useState("");
  const [blockerText, setBlockerText] = React.useState("");
  const [feedbackText, setFeedbackText] = React.useState("");
  const [extensionDate, setExtensionDate] = React.useState("");
  const [extensionReasonText, setExtensionReasonText] = React.useState("");
  const [activeActionForm, setActiveActionForm] = React.useState<"none" | "submit" | "block" | "feedback" | "extension">("none");

  // Owner Edit Task State
  const [isEditingTask, setIsEditingTask] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editPriority, setEditPriority] = React.useState("Medium");
  const [editCategory, setEditCategory] = React.useState("Operations");
  const [editAssignedEmployeeId, setEditAssignedEmployeeId] = React.useState("");
  const [editDueDate, setEditDueDate] = React.useState("");
  const [editBudget, setEditBudget] = React.useState("");
  const [editMetric, setEditMetric] = React.useState("");

  const isTaskOverdue = (task: TaskItem) => {
    if (!task.dueDate || task.status === "Completed") return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const url = myOnly ? "/api/tasks?myOnly=true" : "/api/tasks";
      const [tRes, eRes, rRes] = await Promise.all([
        fetch(url),
        fetch("/api/employees"),
        fetch("/api/requests"),
      ]);

      if (tRes.ok) {
        const json = await tRes.json();
        setTasks(json.tasks || []);
        setCurrentUserRole(json.currentUserRole || "OWNER");
        setCurrentEmployeeId(json.currentEmployeeId || null);
      }
      if (eRes.ok) {
        const json = await eRes.json();
        setEmployees(json.employees?.map((e: any) => ({ id: e.id, name: e.name, role: e.role })) || []);
      }
      if (rRes.ok) {
        const json = await rRes.json();
        setRequests(json.requests || []);
      }
    } catch {
      toast.error("Failed to load task pipeline.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [myOnly]);

  const handleOpenTaskDetail = async (task: TaskItem) => {
    setSelectedTask(task);
    setActiveActionForm("none");
    setIsEditingTask(false);
    setEditTitle(task.title || "");
    setEditDescription(task.description || "");
    setEditPriority(task.priority || "Medium");
    setEditCategory(task.category || "Operations");
    setEditAssignedEmployeeId(task.assignedEmployeeId || "");
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setEditBudget(task.estimatedBudget ? String(task.estimatedBudget) : "");
    setEditMetric(task.successMetric || "");
    setDetailModalOpen(true);

    // Fetch full task with comments
    try {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedTask(json.task);
        setEditTitle(json.task.title || "");
        setEditDescription(json.task.description || "");
        setEditPriority(json.task.priority || "Medium");
        setEditCategory(json.task.category || "Operations");
        setEditAssignedEmployeeId(json.task.assignedEmployeeId || "");
        setEditDueDate(json.task.dueDate ? json.task.dueDate.split("T")[0] : "");
        setEditBudget(json.task.estimatedBudget ? String(json.task.estimatedBudget) : "");
        setEditMetric(json.task.successMetric || "");
      }
    } catch {
      // keep basic task
    }
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!editTitle.trim()) {
      toast.error("Task title cannot be empty.");
      return;
    }
    await handleUpdateTask(selectedTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      priority: editPriority,
      category: editCategory,
      assignedEmployeeId: editAssignedEmployeeId || null,
      dueDate: editDueDate || null,
      estimatedBudget: editBudget ? parseFloat(editBudget) : null,
      successMetric: editMetric.trim() || null,
    });
    setIsEditingTask(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          status,
          category,
          assignedEmployeeId: assignedEmployeeId || null,
          dueDate: dueDate || null,
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
          successMetric: successMetric || null,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => [json.task, ...prev]);
        setAddModalOpen(false);
        setTitle("");
        setDescription("");
        setEstimatedBudget("");
        setSuccessMetric("");
        toast.success("Task created and scheduled!");
      }
    } catch {
      toast.error("Failed to add task.");
    }
  };

  const handleUpdateTask = async (taskId: string, payload: any) => {
    try {
      setSubmittingAction(true);
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? json.task : t)));
        setSelectedTask(json.task);
        setActiveActionForm("none");
        setNewComment("");
        setSubmissionNotes("");
        setBlockerText("");
        setFeedbackText("");
        setExtensionDate("");
        setExtensionReasonText("");
        toast.success("Task updated successfully!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed.");
      }
    } catch {
      toast.error("Network error updating task.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to remove this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setDetailModalOpen(false);
        toast.success("Task removed from pipeline.");
      }
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  const isOwner = currentUserRole === "OWNER";

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase())) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Task Management & Execution
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                {isOwner ? "Owner Kanban" : "My Deliverables"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              5-column structured pipeline: To Do → In Progress → In Review → Completed (with Blocker resolution).
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Toggle */}
            <div className="flex items-center rounded-xl border bg-muted/40 p-1">
              <button
                onClick={() => setView("kanban")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  view === "kanban" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  view === "list" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {isOwner && (
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>Create Task</span>
              </Button>
            )}
          </div>
        </div>

        {/* Top Controls: Tabs & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeTab === "tasks" ? "bg-indigo-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isOwner ? "All Deliverables" : "My Deliverables"} ({tasks.length})
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab("requests")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  activeTab === "requests" ? "bg-indigo-600 text-white shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Blockers & Requests ({requests.filter(r => r.status === "PENDING").length})</span>
              </button>
            )}
            {isOwner && (
              <>
                <div className="h-4 w-px bg-border mx-1" />
                <button
                  onClick={() => setMyOnly(!myOnly)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    myOnly ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {myOnly ? "✓ My Tasks Only" : "Filter: My Tasks"}
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8 bg-background"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none h-8"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Tab 1: Tasks Pipeline */}
        {activeTab === "tasks" && (
          <>
            {view === "kanban" ? (
              /* 5-Column Kanban Board */
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-start">
                {COLUMNS.map((col) => {
                  const colTasks = filteredTasks.filter((t) => t.status === col.id);
                  return (
                    <div
                      key={col.id}
                      className="rounded-2xl border bg-muted/20 p-3 flex flex-col space-y-2.5 min-h-[450px]"
                    >
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            col.id === "Completed" ? "bg-emerald-500" :
                            col.id === "Blocked" ? "bg-rose-500" :
                            col.id === "In Review" ? "bg-purple-500" :
                            col.id === "In Progress" ? "bg-indigo-500" : "bg-slate-400"
                          }`} />
                          <span className="font-bold text-xs text-foreground">{col.title}</span>
                        </div>
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => handleOpenTaskDetail(task)}
                            className="p-3 rounded-xl border bg-card hover:border-indigo-400 dark:hover:border-indigo-700 transition-all hover:shadow-xs cursor-pointer space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-bold text-foreground leading-snug line-clamp-2">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {isTaskOverdue(task) && (
                                  <Badge variant="destructive" className="text-[9px] px-1 py-0 flex items-center gap-0.5">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    <span>Overdue</span>
                                  </Badge>
                                )}
                                <Badge
                                  variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "warning" : "secondary"}
                                  className="text-[9px] px-1.5 py-0 shrink-0"
                                >
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {task.blockerReason && task.status === "Blocked" && (
                              <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200 text-[10px] font-medium">
                                <strong>Blocker:</strong> {task.blockerReason}
                              </div>
                            )}

                            <div className="pt-2 border-t flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <User className="h-3 w-3 text-indigo-500" />
                                <span className="truncate max-w-[90px]">
                                  {task.assignedEmployee?.name || "Unassigned"}
                                </span>
                              </span>
                              {task.dueDate && (
                                <span className={`flex items-center gap-1 ${isTaskOverdue(task) ? "text-rose-600 font-bold" : ""}`}>
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDate(task.dueDate)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}

                        {colTasks.length === 0 && (
                          <div className="py-12 text-center text-xs text-muted-foreground italic">
                            Empty
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="rounded-2xl border bg-card overflow-hidden">
                <div className="divide-y">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleOpenTaskDetail(task)}
                      className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                          task.status === "Completed" ? "bg-emerald-500" :
                          task.status === "Blocked" ? "bg-rose-500" :
                          task.status === "In Review" ? "bg-purple-500" :
                          task.status === "In Progress" ? "bg-indigo-500" : "bg-slate-400"
                        }`} />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate">{task.title}</span>
                          <span className="text-muted-foreground text-[11px]">{task.category} • Assigned to {task.assignedEmployee?.name || "Unassigned"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        {isTaskOverdue(task) && (
                          <Badge variant="destructive" className="text-[10px] px-2 py-0 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Overdue</span>
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">
                          {task.status}
                        </Badge>
                        <Badge
                          variant={task.priority === "High" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {task.priority}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Requests & Blockers */}
        {activeTab === "requests" && isOwner && (
          <div className="space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Team Blocker Reports & Deadline Extension Requests</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Formal requests submitted by employees to resolve dependencies, request resource support, or revise delivery targets.
                </p>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {requests.length > 0 ? (
                  requests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-xl border bg-background/80 shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={req.type === "BLOCKER" ? "destructive" : "warning"} className="text-[10px]">
                            {req.type}
                          </Badge>
                          <span className="font-bold text-foreground">{req.title}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {req.status}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground">{req.details}</p>

                      <div className="pt-2 border-t flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">
                          From: <strong>{req.employee?.name || "Team Member"}</strong> ({formatDate(req.createdAt)})
                        </span>
                        {req.status === "PENDING" && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={async () => {
                                await fetch(`/api/requests/${req.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ status: "RESOLVED", resolutionNotes: "Blocker cleared by manager" }),
                                });
                                toast.success("Request resolved!");
                                fetchData();
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                            >
                              Mark Resolved
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground italic">
                    No active requests or blockers reported.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Task Detail & Work Updates */}
        {selectedTask && (
          <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedTask.category}
                    </Badge>
                    <Badge
                      variant={selectedTask.priority === "High" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {selectedTask.priority}
                    </Badge>
                    {isTaskOverdue(selectedTask) && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex items-center gap-1 font-semibold">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Overdue</span>
                      </Badge>
                    )}
                  </div>

                  {isOwner && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingTask(!isEditingTask)}
                      className="text-xs h-7 gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>{isEditingTask ? "View Details" : "Edit Task"}</span>
                    </Button>
                  )}
                </div>

                <DialogTitle className="text-lg font-bold pt-1">
                  {selectedTask.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Status: <strong className="text-foreground">{selectedTask.status}</strong> • Assigned to: <strong className="text-foreground">{selectedTask.assignedEmployee?.name || "Unassigned"}</strong>
                </DialogDescription>
              </DialogHeader>

              {isEditingTask && isOwner ? (
                /* Owner Edit Task Form */
                <form onSubmit={handleSaveTaskEdit} className="space-y-3 pt-2 text-xs border rounded-xl p-4 bg-muted/10">
                  <span className="font-bold text-foreground text-sm block">Edit Task Parameters</span>

                  <div className="space-y-1">
                    <Label htmlFor="e-title">Task Title</Label>
                    <Input
                      id="e-title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="e-desc">Deliverable Description & Requirements</Label>
                    <Textarea
                      id="e-desc"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="text-xs"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="e-cat">Category</Label>
                      <Input
                        id="e-cat"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e-prio">Priority</Label>
                      <select
                        id="e-prio"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="e-assign">Assigned Employee</Label>
                      <select
                        id="e-assign"
                        value={editAssignedEmployeeId}
                        onChange={(e) => setEditAssignedEmployeeId(e.target.value)}
                        className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                      >
                        <option value="">Unassigned</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e-due">Due Date</Label>
                      <Input
                        id="e-due"
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="e-bud">Budget Cap (₹)</Label>
                      <Input
                        id="e-bud"
                        type="number"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="e-metric">Success Criteria / Metric</Label>
                      <Input
                        id="e-metric"
                        value={editMetric}
                        onChange={(e) => setEditMetric(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingTask(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={submittingAction} className="bg-indigo-600 text-white">
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 pt-2 text-xs">
                  {selectedTask.description && (
                    <div className="p-3 rounded-xl border bg-muted/20 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Deliverable Description:
                      </span>
                      <p className="text-foreground leading-relaxed whitespace-pre-line">
                        {selectedTask.description}
                      </p>
                    </div>
                  )}

                  {/* Success Metric & Budget if set */}
                  {(selectedTask.successMetric || selectedTask.estimatedBudget) && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border bg-background">
                      {selectedTask.successMetric && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold block">Target Metric:</span>
                          <span className="font-bold text-indigo-600">{selectedTask.successMetric}</span>
                        </div>
                      )}
                      {selectedTask.estimatedBudget && (
                        <div>
                          <span className="text-[10px] text-muted-foreground font-semibold block">Budget Cap:</span>
                          <span className="font-mono font-bold text-foreground">₹{selectedTask.estimatedBudget.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blocker Alert if Blocked */}
                  {selectedTask.status === "Blocked" && selectedTask.blockerReason && (
                    <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Execution Blocker Reported</span>
                      </div>
                      <p>{selectedTask.blockerReason}</p>
                    </div>
                  )}

                  {/* Submissions & Manager Feedback info */}
                  {selectedTask.completionNotes && (
                    <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 space-y-1">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                        Submission Notes:
                      </span>
                      <p className="text-foreground">{selectedTask.completionNotes}</p>
                    </div>
                  )}

                  {selectedTask.managerFeedback && (
                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                        Manager Review Feedback:
                      </span>
                      <p className="text-foreground">{selectedTask.managerFeedback}</p>
                    </div>
                  )}

                  {/* Interactive Action Bar based on Role & Status */}
                  <div className="p-3 rounded-xl border bg-muted/40 space-y-3">
                    <span className="text-[11px] font-bold text-foreground block">
                      Execution Actions:
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Move: To In Progress - ONLY for assigned employee */}
                      {selectedTask.status === "To Do" && (
                        !isOwner && selectedTask.assignedEmployeeId === currentEmployeeId ? (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTask(selectedTask.id, { status: "In Progress" })}
                            disabled={submittingAction}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                          >
                            Start Work (In Progress)
                          </Button>
                        ) : isOwner ? (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border">
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Awaiting assigned employee ({selectedTask.assignedEmployee?.name || "Assignee"}) to commence work.</span>
                          </div>
                        ) : null
                      )}

                      {/* Employee: Submit for Review */}
                      {!isOwner && selectedTask.assignedEmployeeId === currentEmployeeId &&
                        (selectedTask.status === "In Progress" || selectedTask.status === "To Do") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveActionForm(activeActionForm === "submit" ? "none" : "submit")}
                          className="text-xs h-8"
                        >
                          <FileCheck className="h-3.5 w-3.5 mr-1 text-purple-600" />
                          <span>Submit Deliverable for Review</span>
                        </Button>
                      )}

                      {/* Employee: Report Blocker */}
                      {!isOwner && selectedTask.assignedEmployeeId === currentEmployeeId &&
                        selectedTask.status !== "Completed" && selectedTask.status !== "Blocked" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveActionForm(activeActionForm === "block" ? "none" : "block")}
                          className="text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                          <span>Report Blocker</span>
                        </Button>
                      )}

                      {/* Manager Approval Actions */}
                      {isOwner && selectedTask.status === "In Review" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setActiveActionForm(activeActionForm === "feedback" ? "none" : "feedback")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            <span>Approve & Complete</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateTask(selectedTask.id, { status: "In Progress", managerFeedback: "Revisions requested. Please review requirements." })}
                            className="text-xs h-8 text-amber-600 border-amber-300"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            <span>Request Revisions</span>
                          </Button>
                        </>
                      )}

                      {/* Employee In Review info badge */}
                      {!isOwner && selectedTask.status === "In Review" && (
                        <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-lg border border-purple-200">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          <span>Deliverable submitted. Awaiting manager review and sign-off.</span>
                        </div>
                      )}

                      {/* Clear Blocker if Owner */}
                      {isOwner && selectedTask.status === "Blocked" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(selectedTask.id, { status: "In Progress" })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                        >
                          Clear Blocker (Resume Work)
                        </Button>
                      )}

                      {/* Completed badge */}
                      {selectedTask.status === "Completed" && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Deliverable completed and verified.</span>
                        </div>
                      )}

                      {/* Request Deadline Extension (Employee only) */}
                      {!isOwner && selectedTask.assignedEmployeeId === currentEmployeeId && selectedTask.status !== "Completed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveActionForm(activeActionForm === "extension" ? "none" : "extension")}
                          className="text-xs h-8 text-muted-foreground"
                        >
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          <span>Request Extension</span>
                        </Button>
                      )}
                    </div>

                    {/* Dynamic Action Forms */}
                    {activeActionForm === "submit" && (
                      <div className="p-3 rounded-lg border bg-background space-y-2 pt-2">
                        <Label>Deliverable Submission Notes</Label>
                        <Textarea
                          placeholder="Detail the work accomplished, links to files, or results..."
                          value={submissionNotes}
                          onChange={(e) => setSubmissionNotes(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(selectedTask.id, { status: "In Review", completionNotes: submissionNotes })}
                          disabled={submittingAction || !submissionNotes.trim()}
                          className="bg-purple-600 text-white text-xs h-7"
                        >
                          Submit to Manager
                        </Button>
                      </div>
                    )}

                    {activeActionForm === "block" && (
                      <div className="p-3 rounded-lg border bg-background space-y-2 pt-2">
                        <Label className="text-rose-600">What is blocking this task?</Label>
                        <Textarea
                          placeholder="Detail the dependency, missing resources, or approval blocker..."
                          value={blockerText}
                          onChange={(e) => setBlockerText(e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(selectedTask.id, { status: "Blocked", blockerReason: blockerText })}
                          disabled={submittingAction || !blockerText.trim()}
                          className="bg-rose-600 text-white text-xs h-7"
                        >
                          Submit Blocker
                        </Button>
                      </div>
                    )}

                    {activeActionForm === "feedback" && (
                      <div className="p-3 rounded-lg border bg-background space-y-2 pt-2">
                        <Label>Manager Approval Feedback (Optional)</Label>
                        <Input
                          placeholder="Great work on this deliverable..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(selectedTask.id, { status: "Completed", managerFeedback: feedbackText })}
                          disabled={submittingAction}
                          className="bg-emerald-600 text-white text-xs h-7"
                        >
                          Confirm Approval & Complete Phase Milestone
                        </Button>
                      </div>
                    )}

                    {activeActionForm === "extension" && (
                      <div className="p-3 rounded-lg border bg-background space-y-2 pt-2">
                        <Label>Requested Due Date</Label>
                        <Input
                          type="date"
                          value={extensionDate}
                          onChange={(e) => setExtensionDate(e.target.value)}
                          className="text-xs"
                        />
                        <Label>Reason for Extension</Label>
                        <Input
                          placeholder="Detail why additional time is necessary..."
                          value={extensionReasonText}
                          onChange={(e) => setExtensionReasonText(e.target.value)}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateTask(selectedTask.id, {
                            requestExtension: true,
                            requestedDueDate: extensionDate,
                            extensionReason: extensionReasonText,
                          })}
                          disabled={submittingAction || !extensionDate}
                          className="bg-indigo-600 text-white text-xs h-7"
                        >
                          Submit Extension Request
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Comments & Work Updates Stream */}
                  <div className="space-y-3 pt-2 border-t">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Task Activity & Audit History ({selectedTask.comments?.length || 0})</span>
                    </span>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {(selectedTask.comments || []).map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg border bg-background text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground">{c.userName}</span>
                              <Badge
                                variant={c.userRole === "OWNER" ? "outline" : "secondary"}
                                className={`text-[9px] px-1.5 py-0 ${c.userRole === "OWNER" ? "border-purple-300 text-purple-700 dark:text-purple-300" : ""}`}
                              >
                                {c.userRole}
                              </Badge>

                              {/* Status Transition Pill */}
                              {c.previousStatus && c.newStatus && (
                                <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[9px] text-foreground font-semibold border">
                                  {c.previousStatus} → {c.newStatus}
                                </span>
                              )}

                              {/* Action Type Badge */}
                              {c.type === "WORK_STARTED" && (
                                <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 text-[9px] px-1.5 py-0">
                                  Work Started
                                </Badge>
                              )}
                              {c.type === "SUBMISSION" && (
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 text-[9px] px-1.5 py-0">
                                  Deliverable Submitted
                                </Badge>
                              )}
                              {c.type === "REVISION_REQUESTED" && (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 text-[9px] px-1.5 py-0">
                                  Revision Requested
                                </Badge>
                              )}
                              {c.type === "APPROVAL" && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-[9px] px-1.5 py-0">
                                  Approved & Completed
                                </Badge>
                              )}
                              {c.type === "BLOCKER" && (
                                <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-[9px] px-1.5 py-0">
                                  Blocker Logged
                                </Badge>
                              )}
                              {c.type === "UNBLOCKED" && (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 text-[9px] px-1.5 py-0">
                                  Blocker Cleared
                                </Badge>
                              )}
                            </div>

                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        placeholder="Add a work progress note or question..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateTask(selectedTask.id, { comment: newComment })}
                        disabled={submittingAction || !newComment.trim()}
                        className="bg-indigo-600 text-white text-xs h-8 shrink-0"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-3 border-t">
                {isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="text-rose-600 text-xs mr-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Delete Task</span>
                  </Button>
                )}
                <Button size="sm" onClick={() => setDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal: Create Task */}
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Operational Task</DialogTitle>
              <DialogDescription className="text-xs">
                Tasks link directly to roadmap phase criteria and team workload calculations.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddTask} className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <Label htmlFor="t-title">Task Title</Label>
                <Input
                  id="t-title"
                  placeholder="e.g. Conduct Customer Discovery Interviews"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="t-desc">Deliverable Description & Acceptance Criteria</Label>
                <Textarea
                  id="t-desc"
                  placeholder="Clear description of what deliverables are expected..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-cat">Category</Label>
                  <Input
                    id="t-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-prio">Priority</Label>
                  <select
                    id="t-prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-assign">Assign Team Member</Label>
                  <select
                    id="t-assign"
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-due">Due Date</Label>
                  <Input
                    id="t-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-bud">Budget Allocation (₹)</Label>
                  <Input
                    id="t-bud"
                    type="number"
                    placeholder="Optional budget"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="t-metric">Success Metric</Label>
                  <Input
                    id="t-metric"
                    placeholder="e.g. 10 interviews completed"
                    value={successMetric}
                    onChange={(e) => setSuccessMetric(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white font-semibold">
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}

export default function TasksPage() {
  return (
    <React.Suspense
      fallback={
        <DashboardShell>
          <div className="py-20 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Loading task pipeline...</span>
          </div>
        </DashboardShell>
      }
    >
      <TasksContent />
    </React.Suspense>
  );
}
