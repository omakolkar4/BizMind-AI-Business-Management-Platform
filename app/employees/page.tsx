"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  DollarSign,
  Star,
  CheckCircle2,
  Trash2,
  Edit,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Send,
  HelpCircle,
  Sparkles,
  UserCheck,
  UserX,
  Lock,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface EmployeeItem {
  id: string;
  userId?: string | null;
  name: string;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  department: string;
  salary?: number;
  status: "Active" | "On Leave" | "Inactive" | string;
  performanceRating?: number;
  notes?: string | null;
  inviteStatus?: string;
  inviteToken?: string;
  tasks?: {
    id: string;
    title: string;
    priority: string;
    status: string;
    dueDate?: string | null;
    blockerReason?: string | null;
    extensionStatus?: string | null;
  }[];
}

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<EmployeeItem[]>([]);
  const [isOwner, setIsOwner] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"directory" | "insights">("directory");
  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");

  // Modal: Add Employee with Owner-Created Credentials
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("");
  const [department, setDepartment] = React.useState("Operations");
  const [salary, setSalary] = React.useState("45000");
  const [status, setStatus] = React.useState("Active");
  const [notes, setNotes] = React.useState("");

  // One-Time Credential Confirmation Modal
  const [credentialModalOpen, setCredentialModalOpen] = React.useState(false);
  const [createdCredentials, setCreatedCredentials] = React.useState<{
    name: string;
    username: string;
    initialPassword: string;
    role: string;
    department: string;
  } | null>(null);
  const [copied, setCopied] = React.useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.employees || []);
        setIsOwner(json.isOwner ?? true);
      }
    } catch {
      toast.error("Network error loading team members.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password || !role || !department) {
      toast.error("Name, Username, Initial Password, Role, and Department are required.");
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          email,
          phone,
          role,
          department,
          salary,
          status,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create employee account.");
        return;
      }

      setEmployees((prev) => [json.employee, ...prev]);
      setModalOpen(false);

      // Open one-time credential confirmation modal
      if (json.credentials) {
        setCreatedCredentials(json.credentials);
        setCredentialModalOpen(true);
      }

      setName("");
      setUsername("");
      setPassword("");
      setEmail("");
      setPhone("");
      setRole("");
      setNotes("");
      toast.success(`Account created for ${json.employee.name}`);
    } catch {
      toast.error("Network error creating employee account.");
    }
  };

  const handleToggleStatus = async (emp: EmployeeItem) => {
    const newStatus = emp.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setEmployees((prev) =>
          prev.map((e) => (e.id === emp.id ? { ...e, status: newStatus } : e))
        );
        toast.success(
          newStatus === "Active"
            ? `${emp.name} account reactivated.`
            : `${emp.name} account deactivated (login access revoked).`
        );
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string, empName: string) => {
    if (!confirm(`Are you sure you want to remove ${empName}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));
        toast.success("Employee removed.");
      }
    } catch {
      toast.error("Error deleting employee.");
    }
  };

  // Metrics
  const totalPayroll = employees.reduce((acc, e) => acc + (e.salary ? (e.status === "Active" ? e.salary : 0) : 0), 0);
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  const filtered = employees.filter((e) => {
    const matchesSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "All" || e.department === deptFilter;
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate Operational Insights across team (Section 8)
  const teamInsights = React.useMemo(() => {
    return employees.map((emp) => {
      const tasks = emp.tasks || [];
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === "Completed").length;
      const inProgress = tasks.filter((t) => t.status === "In Progress" || t.status === "To Do").length;
      const inReview = tasks.filter((t) => t.status === "In Review").length;
      const blocked = tasks.filter((t) => t.status === "Blocked").length;
      const blockedReasons = tasks
        .filter((t) => t.status === "Blocked" && t.blockerReason)
        .map((t) => t.blockerReason as string);

      let observation = "Consistent execution flow with balanced workload.";
      let recommendation = "Maintain current project cadence and weekly touchpoints.";

      if (blocked > 0) {
        observation = `${blocked} task(s) currently blocked by external or resource dependencies.`;
        recommendation = `Review reported blocker reasons: "${blockedReasons[0] || "Dependency pending"}" to restore execution.`;
      } else if (inProgress > 4) {
        observation = `High active workload with ${inProgress} open deliverables concurrently.`;
        recommendation = "Consider rebalancing upcoming tasks to prevent context-switching delays.";
      } else if (inReview > 0) {
        observation = `${inReview} submitted deliverable(s) awaiting owner review.`;
        recommendation = "Review submissions in Task Manager to provide feedback and maintain momentum.";
      }

      return {
        emp,
        total,
        completed,
        inProgress,
        inReview,
        blocked,
        observation,
        recommendation,
      };
    });
  }, [employees]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {isOwner ? "Team & Workforce Management" : "Team Directory"}
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                {isOwner ? "Executive Workspace" : "Employee Workspace"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwner
                ? "Manage organizational roles, invite team members with secure token links, and monitor operational workload."
                : "View team members, departmental roles, and active collaboration channels."}
            </p>
          </div>

          {isOwner && (
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Create Employee Account</span>
            </Button>
          )}
        </div>

        {/* Tab Toggle: Directory vs Operational Insights */}
        {isOwner && (
          <div className="flex items-center gap-2 border-b pb-2 text-xs">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                activeTab === "directory"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Team Directory ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab("insights")}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === "insights"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Operational Workload & Performance Insights</span>
            </button>
          </div>
        )}

        {/* Metric Cards */}
        {isOwner && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Total Headcount</span>
                <div className="text-2xl font-extrabold text-foreground">{employees.length} Members</div>
                <span className="text-[11px] text-emerald-600 font-semibold">{activeCount} Currently Active</span>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Monthly Payroll Burn</span>
                <div className="text-2xl font-extrabold text-foreground">{formatCurrency(totalPayroll)}</div>
                <span className="text-[11px] text-muted-foreground">Verified direct salary compensation</span>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground">Workforce Governance</span>
                <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Secure RBAC</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Confidential compensation protected</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 1: Directory */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, role, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs h-9 bg-background"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1 text-muted-foreground font-medium">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Dept:</span>
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 text-muted-foreground font-medium">
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1 text-xs font-semibold text-foreground outline-none"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Employees Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((emp) => (
                  <Card
                    key={emp.id}
                    className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-all hover:shadow-md overflow-hidden group"
                  >
                    <CardHeader className="pb-3 border-b bg-card flex flex-row items-start justify-between space-y-0">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xs">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/employees/${emp.id}`}
                            className="text-sm font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 group-hover:underline flex items-center gap-1"
                          >
                            <span>{emp.name}</span>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <span className="text-xs text-muted-foreground block truncate">{emp.role}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={emp.status === "Active" ? "success" : "secondary"}
                          className="text-[10px] px-2 py-0"
                        >
                          {emp.status}
                        </Badge>
                        {isOwner && emp.inviteStatus === "INVITED" && (
                          <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                            Invite Pending
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-3 bg-muted/10 text-xs">
                      <div className="space-y-1 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-indigo-500" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                        {emp.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-indigo-500" />
                            <span>{emp.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">{emp.department}</span>
                        {isOwner && emp.salary !== undefined ? (
                          <span className="text-foreground">{formatCurrency(emp.salary)}/mo</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Restricted</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span>{emp.tasks?.length || 0} Assigned Deliverable(s)</span>
                        {emp.username && (
                          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded text-foreground font-semibold">
                            @{emp.username}
                          </span>
                        )}
                      </div>

                      {isOwner && (
                        <div className="pt-2 border-t flex items-center justify-between gap-1 flex-wrap">
                          <Link
                            href={`/employees/${emp.id}`}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline mr-auto flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            <span>Schedule & Profile →</span>
                          </Link>

                          <div className="flex items-center gap-1">
                            {/* Activate / Deactivate Toggle */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(emp)}
                              className={`h-7 px-2 text-xs font-semibold ${
                                emp.status === "Active"
                                  ? "text-amber-600 hover:text-amber-700"
                                  : "text-emerald-600 hover:text-emerald-700"
                              }`}
                              title={emp.status === "Active" ? "Deactivate Account" : "Activate Account"}
                            >
                              {emp.status === "Active" ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 mr-1" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                  <span>Activate</span>
                                </>
                              )}
                            </Button>

                            {/* Safe Remove */}
                            <button
                              onClick={() => handleDelete(emp.id, emp.name)}
                              className="text-muted-foreground hover:text-rose-600 p-1.5 rounded transition-colors"
                              title="Remove Employee (Tasks Preserved)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3 bg-card border rounded-2xl">
                <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-bold text-foreground">No employees found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {isOwner
                    ? "Add your first team member to start delegating tasks and tracking workload."
                    : "No colleagues found matching the selected filter."}
                </p>
                {isOwner && (
                  <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white font-semibold text-xs">
                    + Invite Employee
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Employee & Team Performance Insights (Section 8) */}
        {activeTab === "insights" && isOwner && (
          <div className="space-y-4">
            <Card className="border shadow-sm border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/40 via-card to-card dark:from-indigo-950/20">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Operational Performance & Workload Telemetry</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Evidence-based workload balance, blocker detection, and constructive intervention recommendations
                    </p>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-medium">
                  Objective Evidence-Based
                </Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <div className="p-3 rounded-lg bg-background border text-xs text-muted-foreground flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-foreground">Human-Centered Governance:</strong> BizMind evaluates completed deliverables, approved extensions, and reported blockers. It never infers personality, intent, or mental health from task metrics, and provides constructive interventions to unblock staff.
                  </div>
                </div>

                <div className="space-y-3">
                  {teamInsights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border bg-background/80 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 font-bold text-xs">
                            {item.emp.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-foreground text-xs">{item.emp.name}</span>
                            <span className="text-[11px] text-muted-foreground ml-2">({item.emp.role} • {item.emp.department})</span>
                          </div>
                        </div>

                        {/* Task Telemetry Badges */}
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                            {item.completed} Done
                          </span>
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
                            {item.inProgress} In Progress
                          </span>
                          {item.inReview > 0 && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
                              {item.inReview} In Review
                            </span>
                          )}
                          {item.blocked > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 font-bold">
                              {item.blocked} Blocked
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Operational Observation:
                          </span>
                          <p className="text-foreground leading-relaxed">
                            {item.observation}
                          </p>
                        </div>

                        <div className="space-y-1 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            Constructive Recommendation:
                          </span>
                          <p className="text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed">
                            {item.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal: Create Employee Account with Owner Credentials */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Employee Account</DialogTitle>
              <DialogDescription className="text-xs">
                Creates the employee record and their login account immediately. The employee can sign in with these credentials right away.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddEmployee} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              {/* Username & Initial Password */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-user">Username *</Label>
                  <Input
                    id="emp-user"
                    placeholder="e.g. sarah_j"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="text-xs font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-pass">Initial Password *</Label>
                  <Input
                    id="emp-pass"
                    type="password"
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-role">Role / Job Title *</Label>
                  <Input
                    id="emp-role"
                    placeholder="e.g. Marketing Lead"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-dept">Department *</Label>
                  <Input
                    id="emp-dept"
                    placeholder="e.g. Marketing"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-sal">Monthly Salary (₹)</Label>
                  <Input
                    id="emp-sal"
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-stat">Status</Label>
                  <select
                    id="emp-stat"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs rounded-lg border bg-background p-2 font-medium"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-email">Work Email (Optional)</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    placeholder="Optional contact email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-phone">Phone Number (Optional)</Label>
                  <Input
                    id="emp-phone"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-notes">Responsibilities & Bio Notes</Label>
                <Textarea
                  id="emp-notes"
                  placeholder="Key background, primary operational responsibilities..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs"
                  rows={2}
                />
              </div>

              <DialogFooter className="pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-indigo-600 text-white font-semibold">
                  Create Employee Account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal: One-Time Credential Confirmation */}
        <Dialog open={credentialModalOpen} onOpenChange={setCredentialModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <span>Employee Account Created</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Login credentials for <strong>{createdCredentials?.name}</strong> have been created. Share these details with the employee privately:
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-muted/40 rounded-2xl border space-y-3 mt-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border">
                  {createdCredentials?.username}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-muted-foreground">Initial Password:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-background px-2 py-0.5 rounded border">
                  {createdCredentials?.initialPassword}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Login Portal:</span>
                <span className="font-mono text-muted-foreground truncate max-w-[200px]">
                  {typeof window !== "undefined" ? `${window.location.origin}/login` : "/login"}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              ⚠️ This password is only shown once and cannot be retrieved later. The employee can change their password anytime in Settings.
            </p>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (createdCredentials) {
                    const text = `BizMind Account Credentials:\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.initialPassword}\nPortal: ${window.location.origin}/login`;
                    navigator.clipboard.writeText(text);
                    setCopied(true);
                    toast.success("Credentials copied to clipboard.");
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex-1"
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                <span>{copied ? "Copied" : "Copy Login Credentials"}</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCredentialModalOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
