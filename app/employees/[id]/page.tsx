"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
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
  Clock,
  Settings2,
  ShieldCheck,
  History,
  AlertCircle,
  Coffee,
  Globe,
  Building,
  Laptop,
  Check,
  Save,
  RotateCcw,
} from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "sonner"

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const employeeId = params.id as string

  const [employee, setEmployee] = React.useState<any>(null)
  const [scheduleData, setScheduleData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [historyRecords, setHistoryRecords] = React.useState<any[]>([])

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false)
  const [savingSchedule, setSavingSchedule] = React.useState(false)

  // Edit form state
  const [formData, setFormData] = React.useState({
    name: "Custom Individual Schedule",
    workArrangement: "Office",
    checkInStartTime: "09:30",
    checkInEndTime: "10:00",
    checkOutTime: "17:30",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    expectedHours: 8.0,
    breakPolicy: "60 min flexible breaks",
    breakMinutesAllowed: 60,
    trackBreaks: true,
    gracePeriodMinutes: 30,
    allowEarlyDeparture: false,
    timezone: "Asia/Kolkata",
    effectiveDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    isOvernight: false,
    reason: "Schedule updated by business owner",
  })

  // Load employee profile and schedule data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      const [empRes, schedRes, attRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}`),
        fetch(`/api/employees/${employeeId}/schedule`),
        fetch(`/api/attendance?employeeId=${employeeId}&date=All`),
      ])

      if (empRes.ok) {
        const empJson = await empRes.json()
        setEmployee(empJson.employee)
      } else {
        toast.error("Employee not found.")
        router.push("/employees")
        return
      }

      if (schedRes.ok) {
        const schedJson = await schedRes.json()
        setScheduleData(schedJson)

        // Pre-fill form data with effective or individual schedule
        const current = schedJson.individualSchedule || schedJson.effectiveSchedule
        if (current) {
          setFormData({
            name: current.name || "Custom Individual Schedule",
            workArrangement: current.workArrangement || "Office",
            checkInStartTime: current.checkInStartTime || "09:30",
            checkInEndTime: current.checkInEndTime || "10:00",
            checkOutTime: current.checkOutTime || "17:30",
            workingDays: Array.isArray(current.workingDays)
              ? current.workingDays
              : typeof current.workingDays === "string"
              ? JSON.parse(current.workingDays)
              : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            expectedHours: current.expectedHours || 8.0,
            breakPolicy: current.breakPolicy || "60 min flexible breaks",
            breakMinutesAllowed: current.breakMinutesAllowed || 60,
            trackBreaks: current.trackBreaks !== undefined ? current.trackBreaks : true,
            gracePeriodMinutes: current.gracePeriodMinutes || 30,
            allowEarlyDeparture: Boolean(current.allowEarlyDeparture),
            timezone: current.timezone || "Asia/Kolkata",
            effectiveDate: current.effectiveDate || new Date().toISOString().slice(0, 10),
            status: current.status || "Active",
            isOvernight: Boolean(current.isOvernight),
            reason: "Schedule adjusted by business owner",
          })
        }
      }

      if (attRes.ok) {
        const attJson = await attRes.json()
        setHistoryRecords(attJson.records || [])
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load employee details.")
    } finally {
      setLoading(false)
    }
  }, [employeeId, router])

  React.useEffect(() => {
    if (employeeId) {
      loadData()
    }
  }, [employeeId, loadData])

  // Save changes handler
  const handleSaveSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setSavingSchedule(true)
      const res = await fetch(`/api/employees/${employeeId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update schedule")
      }

      toast.success("Work schedule & attendance settings updated!")
      setIsEditModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Could not save schedule")
    } finally {
      setSavingSchedule(false)
    }
  }

  // Quick preset loader
  const applyPreset = (presetName: string) => {
    if (presetName === "Standard") {
      setFormData((prev) => ({
        ...prev,
        name: "Standard Core Schedule",
        workArrangement: "Office",
        checkInStartTime: "09:30",
        checkInEndTime: "10:00",
        checkOutTime: "17:30",
        expectedHours: 8.0,
        gracePeriodMinutes: 30,
        breakMinutesAllowed: 60,
      }))
    } else if (presetName === "Morning") {
      setFormData((prev) => ({
        ...prev,
        name: "Early Bird Morning Shift",
        workArrangement: "Office",
        checkInStartTime: "08:00",
        checkInEndTime: "08:30",
        checkOutTime: "16:30",
        expectedHours: 8.0,
        gracePeriodMinutes: 15,
        breakMinutesAllowed: 45,
      }))
    } else if (presetName === "Flexible") {
      setFormData((prev) => ({
        ...prev,
        name: "Flexible Core Shift",
        workArrangement: "Hybrid",
        checkInStartTime: "10:00",
        checkInEndTime: "11:00",
        checkOutTime: "18:30",
        expectedHours: 8.0,
        gracePeriodMinutes: 30,
        breakMinutesAllowed: 60,
      }))
    } else if (presetName === "Remote") {
      setFormData((prev) => ({
        ...prev,
        name: "Distributed Remote Schedule",
        workArrangement: "Remote",
        checkInStartTime: "09:00",
        checkInEndTime: "10:30",
        checkOutTime: "18:00",
        expectedHours: 8.0,
        gracePeriodMinutes: 45,
        breakMinutesAllowed: 60,
      }))
    }
    toast.info(`Applied ${presetName} preset configuration`)
  }

  const toggleDay = (day: string) => {
    setFormData((prev) => {
      const exists = prev.workingDays.includes(day)
      const newDays = exists ? prev.workingDays.filter((d) => d !== day) : [...prev.workingDays, day]
      return { ...prev, workingDays: newDays }
    })
  }

  if (loading || !employee) {
    return (
      <DashboardShell>
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            Loading employee profile and schedule settings...
          </p>
        </div>
      </DashboardShell>
    )
  }

  const tasks = employee.tasks || []
  const completedTasks = tasks.filter((t: any) => t.status === "Completed").length
  const eff = scheduleData?.effectiveSchedule
  const ind = scheduleData?.individualSchedule
  const isIndividualOverride = eff?.source === "INDIVIDUAL"

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Employee Directory</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryModalOpen(true)}
              className="text-xs h-8 gap-1.5"
            >
              <History className="h-3.5 w-3.5 text-indigo-600" />
              <span>View Attendance History</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs h-8 gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Edit Schedule</span>
            </Button>
          </div>
        </div>

        {/* Profile Card Header */}
        <Card className="border border-indigo-100/60 dark:border-indigo-950/60 shadow-xs overflow-hidden bg-card/95 backdrop-blur-xs">
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600" />
          <CardContent className="p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="h-24 w-24 shrink-0 rounded-2xl bg-card border-4 border-card shadow-xl flex items-center justify-center text-3xl font-black text-indigo-600 dark:text-indigo-400 bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 z-10">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div className="pt-2 sm:pt-0 sm:pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                      {employee.name}
                    </h1>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                      ID: {employee.id.slice(-8)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {employee.role} • {employee.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:pb-1">
                <Badge
                  variant={employee.status === "Active" ? "success" : "secondary"}
                  className="text-xs px-3 py-1"
                >
                  {employee.status}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs px-2.5 py-1 gap-1 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                >
                  {eff?.workArrangement === "Remote" ? (
                    <Laptop className="h-3 w-3" />
                  ) : eff?.workArrangement === "Hybrid" ? (
                    <Globe className="h-3 w-3" />
                  ) : (
                    <Building className="h-3 w-3" />
                  )}
                  <span>{eff?.workArrangement || "Office"}</span>
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-xs">
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

        {/* =========================================================================
            PART 1: WORK SCHEDULE & ATTENDANCE SETTINGS
           ========================================================================= */}
        <Card className="border border-indigo-100/70 dark:border-indigo-950/70 shadow-xs bg-card/95">
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-background dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-background flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">
                    Work Schedule & Attendance Settings
                  </CardTitle>
                  <Badge
                    variant={isIndividualOverride ? "default" : "secondary"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {isIndividualOverride
                      ? "Custom Individual Override"
                      : eff?.source === "TEAM_SHIFT"
                      ? "Team Shift Assigned"
                      : "Company Default"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Individual working hours, check-in window, break policy, and priority resolution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHistoryModalOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <History className="h-3.5 w-3.5 text-indigo-600" />
                <span>View Attendance History</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Edit Schedule</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Employee ID & Name */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Employee Name & ID</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    #{employee.id.slice(-6)}
                  </Badge>
                </div>
                <div className="text-sm font-bold text-foreground">{employee.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  Dept: {employee.department} • Role: {employee.role}
                </div>
              </div>

              {/* Work Arrangement */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Work Arrangement</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>{eff?.workArrangement || "Office"}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    {eff?.workArrangement === "Office"
                      ? "Office QR Required"
                      : "Direct Auth Punch"}
                  </Badge>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {eff?.workArrangement === "Office"
                    ? "In-office check-in via security QR scan"
                    : "Authenticated remote punch permitted"}
                </div>
              </div>

              {/* Assigned Shift / Schedule */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Assigned Schedule / Shift</span>
                  <Badge variant="info" className="text-[10px]">
                    {eff?.source}
                  </Badge>
                </div>
                <div className="text-sm font-bold text-foreground truncate">
                  {eff?.name || "Standard Core Schedule"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Priority: Individual → Team Shift → Company Default
                </div>
              </div>

              {/* Permitted Check-In Window */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Permitted Check-In Window</span>
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {eff?.checkInStartTime} – {eff?.checkInEndTime}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  On-time cutoff: {eff?.checkInEndTime} (+{eff?.gracePeriodMinutes || 30}m grace)
                </div>
              </div>

              {/* Scheduled Check-Out Time */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Scheduled Check-Out Time</span>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="text-sm font-bold text-foreground font-mono">
                  {eff?.checkOutTime}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {eff?.allowEarlyDeparture
                    ? "Early departure is permitted"
                    : "Early departure strictly flagged"}
                </div>
              </div>

              {/* Expected Hours & Breaks */}
              <div className="p-4 rounded-xl border bg-muted/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span>Expected Daily Hours</span>
                  <Coffee className="h-3.5 w-3.5 text-purple-500" />
                </div>
                <div className="text-sm font-bold text-foreground">
                  {eff?.expectedHours || 8.0} hrs / day
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Break allowance: {eff?.breakMinutesAllowed || 60}m (
                  {eff?.trackBreaks ? "Tracked" : "Untracked"})
                </div>
              </div>
            </div>

            {/* Working Days Row */}
            <div className="mt-6 pt-5 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Assigned Working Days of the Week
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Employee is expected to be on duty on these selected calendar days
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isWorking = (eff?.workingDays || []).includes(day)
                    return (
                      <span
                        key={day}
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                          isWorking
                            ? "bg-indigo-600 text-white font-semibold shadow-2xs"
                            : "bg-muted text-muted-foreground/50 border border-dashed"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Meta details footer */}
            <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>
                  <strong>Time Zone:</strong> {eff?.timezone || "Asia/Kolkata"}
                </span>
                <span>
                  <strong>Effective Date:</strong> {eff?.effectiveDate || "2026-01-01"}
                </span>
                <span>
                  <strong>Shift Type:</strong> {eff?.isOvernight ? "Overnight Shift" : "Day Shift"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={eff?.status === "Active" ? "success" : "secondary"}
                  className="text-[10px]"
                >
                  Schedule: {eff?.status || "Active"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Operational Tasks Section */}
        <Card className="border border-indigo-100/60 dark:border-indigo-950/60 shadow-xs bg-card/95">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-bold">Assigned Operational Tasks</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deliverables currently routed to {employee.name} ({completedTasks}/{tasks.length}{" "}
                  Completed)
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
                          <span className="text-[11px] text-muted-foreground">
                            {task.description}
                          </span>
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
                No active tasks assigned to this employee yet. You can assign tasks in the Task
                Manager.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* =========================================================================
          MODAL: EDIT WORK SCHEDULE & ATTENDANCE SETTINGS
         ========================================================================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-indigo-600" />
              <span>Configure Schedule for {employee.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Individual employee schedule overrides team shifts and company defaults. All changes
              are captured in the attendance audit log.
            </DialogDescription>
          </DialogHeader>

          {/* Quick Presets */}
          <div className="p-3 rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2">
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 block">
              Quick Shift Presets:
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-white dark:bg-card"
                onClick={() => applyPreset("Standard")}
              >
                Standard (9:30 AM–5:30 PM)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-white dark:bg-card"
                onClick={() => applyPreset("Morning")}
              >
                Morning (8:00 AM–4:30 PM)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-white dark:bg-card"
                onClick={() => applyPreset("Flexible")}
              >
                Flexible (10:00 AM–6:30 PM)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-7 bg-white dark:bg-card"
                onClick={() => applyPreset("Remote")}
              >
                Distributed Remote
              </Button>
            </div>
          </div>

          <form onSubmit={handleSaveSchedule} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Schedule Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Individual Core Shift"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Work Arrangement</Label>
                <select
                  value={formData.workArrangement}
                  onChange={(e) => setFormData({ ...formData, workArrangement: e.target.value })}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="Office">Office (Requires office QR scan)</option>
                  <option value="Remote">Remote (Authenticated self punch)</option>
                  <option value="Hybrid">Hybrid (Office or Remote)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Permitted Check-In Start Time</Label>
                <Input
                  type="time"
                  value={formData.checkInStartTime}
                  onChange={(e) => setFormData({ ...formData, checkInStartTime: e.target.value })}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Latest Permitted On-Time Check-In</Label>
                <Input
                  type="time"
                  value={formData.checkInEndTime}
                  onChange={(e) => setFormData({ ...formData, checkInEndTime: e.target.value })}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Scheduled Check-Out Time</Label>
                <Input
                  type="time"
                  value={formData.checkOutTime}
                  onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Late-Arrival Grace Period (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.gracePeriodMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, gracePeriodMinutes: parseInt(e.target.value) || 0 })
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Expected Daily Working Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={formData.expectedHours}
                  onChange={(e) =>
                    setFormData({ ...formData, expectedHours: parseFloat(e.target.value) || 8.0 })
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Break Allowance (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  max="240"
                  value={formData.breakMinutesAllowed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      breakMinutesAllowed: parseInt(e.target.value) || 60,
                    })
                  }
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            {/* Working Days Selector */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold">Working Days of the Week</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {DAYS_OF_WEEK.map((day) => {
                  const active = formData.workingDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 inline mr-1" />}
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Break Policy & Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Break Policy Description</Label>
                <Input
                  value={formData.breakPolicy}
                  onChange={(e) => setFormData({ ...formData, breakPolicy: e.target.value })}
                  placeholder="e.g. 60 min lunch + 15 min tea break"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Time Zone</Label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC">UTC (GMT +0:00)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT +8:00)</option>
                </select>
              </div>
            </div>

            {/* Checkbox Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.trackBreaks}
                  onChange={(e) => setFormData({ ...formData, trackBreaks: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-xs font-medium">Track Breaks Actively</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allowEarlyDeparture}
                  onChange={(e) =>
                    setFormData({ ...formData, allowEarlyDeparture: e.target.checked })
                  }
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-xs font-medium">Allow Early Departure</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isOvernight}
                  onChange={(e) => setFormData({ ...formData, isOvernight: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600"
                />
                <span className="text-xs font-medium">Overnight Shift</span>
              </label>
            </div>

            {/* Mandatory Audit Reason */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Reason for Schedule Adjustment (Audit Logged)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Mandatory</span>
              </Label>
              <Input
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g. Adjusted check-in window per employee request and manager agreement"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingSchedule}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{savingSchedule ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: ATTENDANCE HISTORY & AUDIT TRAIL
         ========================================================================= */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-indigo-600" />
              <span>Attendance History & Audit Trail: {employee.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review verified punch timestamps, break durations, schedule snapshots, and audit
              history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Recent Punches Table */}
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
                <span>Recorded Attendance Events ({historyRecords.length})</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Server-generated timestamps
                </span>
              </h3>

              {historyRecords.length > 0 ? (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Method</th>
                        <th className="p-2.5">Check-In</th>
                        <th className="p-2.5">Check-Out</th>
                        <th className="p-2.5">Hours</th>
                        <th className="p-2.5">Breaks</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {historyRecords.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="p-2.5 font-medium">{r.date}</td>
                          <td className="p-2.5">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted">
                              {r.method}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono">
                            {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="p-2.5 font-mono">
                            {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In Progress"}
                          </td>
                          <td className="p-2.5 font-bold">{r.totalHours ? `${r.totalHours} hrs` : "—"}</td>
                          <td className="p-2.5 text-muted-foreground">
                            {r.breakMinutes ? `${r.breakMinutes}m` : "0m"}
                          </td>
                          <td className="p-2.5">
                            <Badge
                              variant={
                                r.status === "ON_TIME" || r.status === "PRESENT"
                                  ? "success"
                                  : r.status === "LATE"
                                  ? "warning"
                                  : r.status === "EARLY_DEPARTURE"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10">
                  No attendance records recorded for this employee yet.
                </div>
              )}
            </div>

            {/* Schedule Change & Override Audits */}
            <div>
              <h3 className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
                <span>Schedule & Attendance Audit Log</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Tamper-evident system log
                </span>
              </h3>

              {scheduleData?.audits && scheduleData.audits.length > 0 ? (
                <div className="space-y-2">
                  {scheduleData.audits.map((a: any) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border bg-muted/15 text-xs flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {a.action}
                          </Badge>
                          <span className="font-semibold text-foreground">
                            By {a.actorName} ({a.actorRole})
                          </span>
                        </div>
                        {a.reason && (
                          <p className="text-[11px] text-muted-foreground">Reason: {a.reason}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                        {new Date(a.createdAt).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground border rounded-xl bg-muted/10">
                  No schedule modification audit records found.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
