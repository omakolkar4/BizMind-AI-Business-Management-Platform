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
  MoreVertical,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  priority: "Low" | "Medium" | "High" | "Critical" | string;
  status: "To Do" | "In Progress" | "Completed" | "Blocked" | string;
  category: string;
  dueDate?: string | null;
  assignedEmployeeId?: string | null;
  assignedEmployee?: { id: string; name: string; role: string } | null;
}

interface EmployeeSelect {
  id: string;
  name: string;
}

const COLUMNS: { id: "To Do" | "In Progress" | "Completed" | "Blocked"; title: string; color: string }[] = [
  { id: "To Do", title: "To Do", color: "border-slate-300 dark:border-slate-700" },
  { id: "In Progress", title: "In Progress", color: "border-indigo-500" },
  { id: "Blocked", title: "Blocked", color: "border-rose-500" },
  { id: "Completed", title: "Completed", color: "border-emerald-500" },
];

export default function TasksPage() {
  const [tasks, setTasks] = React.useState<TaskItem[]>([]);
  const [employees, setEmployees] = React.useState<EmployeeSelect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [view, setView] = React.useState<"kanban" | "list">("kanban");
  const [search, setSearch] = React.useState("");
  const [priorityFilter, setPriorityFilter] = React.useState("All");

  // Modal: Add Task
  const [modalOpen, setModalOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priority, setPriority] = React.useState("Medium");
  const [status, setStatus] = React.useState("To Do");
  const [category, setCategory] = React.useState("Operations");
  const [assignedEmployeeId, setAssignedEmployeeId] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, eRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/employees"),
      ]);

      if (tRes.ok) {
        const json = await tRes.json();
        setTasks(json.tasks || []);
      }
      if (eRes.ok) {
        const json = await eRes.json();
        setEmployees(json.employees?.map((e: any) => ({ id: e.id, name: e.name })) || []);
      }
    } catch {
      toast.error("Failed to load task pipeline.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

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
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setTasks((prev) => [json.task, ...prev]);
        setModalOpen(false);
        setTitle("");
        setDescription("");
        toast.success("Task created and routed!");
      }
    } catch {
      toast.error("Failed to add task.");
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
        );
        toast.success(`Task moved to ${newStatus}`);
      }
    } catch {
      toast.error("Status update failed.");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to remove this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        toast.success("Task removed from pipeline.");
      }
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge variant="warning">High</Badge>;
      case "medium":
        return <Badge variant="info">Medium</Badge>;
      default:
        return <Badge variant="secondary">Low</Badge>;
    }
  };

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
                Task Management
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                Kanban & Pipeline
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organize deliverables, assign team owners, and keep operational milestones unblocked.
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
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks or categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* KANBAN VIEW */}
        {view === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="rounded-2xl border bg-muted/20 p-3 space-y-3 min-h-[450px]"
                >
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{col.title}</span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border text-[11px] font-mono font-bold text-muted-foreground">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="p-3.5 space-y-2.5 border shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-foreground leading-snug">
                            {task.title}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-muted-foreground hover:text-rose-500 p-0.5"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                          <span className="font-semibold text-foreground">{task.category}</span>
                          {getPriorityBadge(task.priority)}
                        </div>

                        {task.assignedEmployee && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <User className="h-3 w-3 text-indigo-500" />
                            <span className="truncate">{task.assignedEmployee.name}</span>
                          </div>
                        )}

                        {task.dueDate && (
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </div>
                        )}

                        {/* Move Status Controls */}
                        <div className="pt-2 border-t flex items-center justify-between gap-1">
                          <span className="text-[10px] text-muted-foreground">Move to:</span>
                          <div className="flex items-center gap-1">
                            {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
                              <button
                                key={c.id}
                                onClick={() => handleUpdateStatus(task.id, c.id)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted hover:bg-indigo-600 hover:text-white transition-colors"
                              >
                                {c.id === "In Progress" ? "Prog" : c.id === "Completed" ? "Done" : c.id}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    ))}

                    {columnTasks.length === 0 && (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        No tasks in {col.title}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <Card className="border shadow-xs">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Task</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground">{task.title}</div>
                          {task.description && (
                            <div className="text-[11px] text-muted-foreground">{task.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{task.category}</td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {task.assignedEmployee?.name || "Unassigned"}
                        </td>
                        <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
                        <td className="py-3 px-4">
                          <select
                            value={task.status}
                            onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                            className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none"
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Blocked">Blocked</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal: Add Task */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Operational Task</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddTask} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="t-title">Task Title</Label>
                <Input
                  id="t-title"
                  placeholder="e.g. Audit cold-chain refrigerated delivery SLA"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="t-desc">Description</Label>
                <Textarea
                  id="t-desc"
                  placeholder="Deliverable specifications, acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-priority">Priority</Label>
                  <select
                    id="t-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="t-status">Initial Status</Label>
                  <select
                    id="t-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="t-cat">Category</Label>
                  <Input
                    id="t-cat"
                    placeholder="Operations, Marketing, Tech..."
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="t-emp">Assign Employee</Label>
                  <select
                    id="t-emp"
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
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

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white">
                  Add to Kanban
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
