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
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface EmployeeItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  department: string;
  salary: number;
  status: "Active" | "On Leave" | "Inactive" | string;
  performanceRating: number;
  notes?: string | null;
  tasks?: { id: string; title: string; priority: string; status: string }[];
}

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<EmployeeItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");

  // Modal: Add Employee
  const [modalOpen, setModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState("");
  const [department, setDepartment] = React.useState("Operations");
  const [salary, setSalary] = React.useState("45000");
  const [status, setStatus] = React.useState("Active");
  const [notes, setNotes] = React.useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.employees || []);
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
    if (!name || !email || !role) {
      toast.error("Name, email, and role are required.");
      return;
    }

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          department,
          salary,
          status,
          notes,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setEmployees((prev) => [json.employee, ...prev]);
        setModalOpen(false);
        setName("");
        setEmail("");
        setPhone("");
        setRole("");
        setNotes("");
        toast.success(`Team member ${json.employee.name} onboarded!`);
      }
    } catch {
      toast.error("Failed to add employee.");
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
  const totalPayroll = employees.reduce((acc, e) => acc + (e.status === "Active" ? e.salary : 0), 0);
  const activeCount = employees.filter((e) => e.status === "Active").length;
  const avgRating = employees.length > 0 ? (employees.reduce((acc, e) => acc + e.performanceRating, 0) / employees.length).toFixed(1) : "4.7";

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

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Employee Management
              </h1>
              <Badge variant="ai" className="text-xs font-semibold">
                HR & Talent
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Manage organization roles, compensation payrolls, and individual operational task assignments.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 shadow-sm shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span>Add Team Member</span>
          </Button>
        </div>

        {/* 3 Metric Cards */}
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
              <span className="text-[11px] text-muted-foreground">Direct operational salary cost</span>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Avg Performance Rating</span>
              <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <span>{avgRating}</span>
                <Star className="h-4 w-4 fill-indigo-600 dark:fill-indigo-400" />
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">High Team Productivity</span>
            </CardContent>
          </Card>
        </div>

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

                  <Badge
                    variant={emp.status === "Active" ? "success" : "secondary"}
                    className="text-[10px] px-2 py-0"
                  >
                    {emp.status}
                  </Badge>
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
                    <span className="text-foreground">{formatCurrency(emp.salary)}/mo</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-amber-600 font-semibold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>{emp.performanceRating.toFixed(1)} Rating</span>
                    </span>
                    <span>{emp.tasks?.length || 0} Assigned Tasks</span>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View Profile & Tasks →
                    </Link>
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="text-muted-foreground hover:text-rose-600 p-1 transition-colors"
                      title="Delete Employee"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-3 bg-card border rounded-2xl">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="text-base font-bold text-foreground">No employees match criteria</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Add your first team member to start managing your workforce and delegating tasks.
            </p>
            <Button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white font-semibold text-xs">
              + Add Employee
            </Button>
          </div>
        )}

        {/* Modal: Add Employee */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Onboard New Team Member</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleAddEmployee} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input
                  id="emp-name"
                  placeholder="e.g. Rohit Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-email">Email</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    placeholder="rohit@novabite.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-phone">Phone Number</Label>
                  <Input
                    id="emp-phone"
                    placeholder="+91 98231 44521"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="emp-role">Role Title</Label>
                  <Input
                    id="emp-role"
                    placeholder="e.g. Head Chef"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-dept">Department</Label>
                  <Input
                    id="emp-dept"
                    placeholder="Culinary & Kitchen"
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
                    placeholder="50000"
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
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-notes">Bio / Experience Notes</Label>
                <Textarea
                  id="emp-notes"
                  placeholder="Key background, past companies, certifications..."
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
                <Button type="submit" size="sm" className="bg-indigo-600 text-white">
                  Add Employee
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  );
}
