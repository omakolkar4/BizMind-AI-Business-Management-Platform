"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  DollarSign,
  Star,
  CheckCircle2,
  Calendar,
  Briefcase,
  CheckSquare,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${employeeId}`);
        if (res.ok) {
          const json = await res.json();
          setEmployee(json.employee);
        } else {
          toast.error("Employee not found.");
          router.push("/employees");
        }
      } catch {
        toast.error("Failed to load employee.");
      } finally {
        setLoading(false);
      }
    }
    if (employeeId) load();
  }, [employeeId, router]);

  if (loading || !employee) {
    return (
      <DashboardShell>
        <div className="py-20 text-center animate-pulse text-sm text-muted-foreground">
          Loading employee profile...
        </div>
      </DashboardShell>
    );
  }

  const tasks = employee.tasks || [];
  const completedTasks = tasks.filter((t: any) => t.status === "Completed").length;

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <Link
          href="/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Employee Directory</span>
        </Link>

        {/* Profile Card Header */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600" />
          <CardContent className="p-6 relative pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-4">
              <div className="flex items-end gap-4">
                <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400 bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-foreground">{employee.name}</h1>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {employee.role} • {employee.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={employee.status === "Active" ? "success" : "secondary"}
                  className="text-xs px-3 py-1"
                >
                  {employee.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-xs">
              <div className="space-y-1">
                <span className="text-muted-foreground">Email Contact</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Phone</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{employee.phone || "Not recorded"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Compensation</span>
                <div className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
                  <DollarSign className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{formatCurrency(employee.salary)}/mo</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground">Performance Score</span>
                <div className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{employee.performanceRating.toFixed(1)} / 5.0</span>
                </div>
              </div>
            </div>

            {employee.notes && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                <strong className="text-foreground">Bio / Experience:</strong> {employee.notes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assigned Tasks Section */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Assigned Operational Tasks</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deliverables currently routed to {employee.name} ({completedTasks}/{tasks.length} Completed)
                </p>
              </div>
            </div>

            <Link href="/tasks">
              <Button variant="outline" size="sm" className="text-xs h-8">
                Open Kanban Board
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-xl border bg-card text-xs hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                          task.status === "Completed"
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-border"
                        }`}
                      >
                        {task.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                      <div>
                        <span className="font-bold text-foreground block">{task.title}</span>
                        {task.description && (
                          <span className="text-[11px] text-muted-foreground">{task.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {task.priority} Priority
                      </Badge>
                      <Badge
                        variant={task.status === "Completed" ? "success" : "info"}
                        className="text-[10px]"
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-muted-foreground">
                No active tasks assigned to this employee yet. You can assign tasks in the Task Manager.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
