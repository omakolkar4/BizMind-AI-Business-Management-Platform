"use client"

import * as React from "react"
import Link from "next/link"
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  Timer,
  RefreshCw,
  LogIn,
  LogOut,
  Building2,
  QrCode,
  Laptop,
  MapPin,
  FileEdit,
  ShieldCheck,
  Copy,
  Check,
  X,
  AlertTriangle,
  Coffee,
  Play,
  Pause,
  Filter,
  Search,
  ArrowRight,
  TrendingUp,
  History,
  Settings2,
  Briefcase,
  Globe,
} from "lucide-react"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function AttendancePage() {
  const [data, setData] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)

  // Filters (Owner)
  const [dateFilter, setDateFilter] = React.useState<string>("")
  const [empFilter, setEmpFilter] = React.useState<string>("All")
  const [deptFilter, setDeptFilter] = React.useState<string>("All")
  const [arrangementFilter, setArrangementFilter] = React.useState<string>("All")
  const [statusFilter, setStatusFilter] = React.useState<string>("All")

  // Modals
  const [qrModalOpen, setQrModalOpen] = React.useState(false)
  const [qrInputToken, setQrInputToken] = React.useState("")
  const [remoteModalOpen, setRemoteModalOpen] = React.useState(false)
  const [remoteDate, setRemoteDate] = React.useState("")
  const [remoteType, setRemoteType] = React.useState<"REMOTE" | "FIELD">("REMOTE")
  const [remoteReason, setRemoteReason] = React.useState("")
  const [remoteDetails, setRemoteDetails] = React.useState("")

  const [breakModalOpen, setBreakModalOpen] = React.useState(false)
  const [breakType, setBreakType] = React.useState<string>("LUNCH")
  const [breakReason, setBreakReason] = React.useState<string>("")

  const [correctionModalOpen, setCorrectionModalOpen] = React.useState(false)
  const [corrDate, setCorrDate] = React.useState("")
  const [corrIn, setCorrIn] = React.useState("09:30")
  const [corrOut, setCorrOut] = React.useState("18:30")
  const [corrReason, setCorrReason] = React.useState("")

  const [overrideModalOpen, setOverrideModalOpen] = React.useState(false)
  const [overrideEmpId, setOverrideEmpId] = React.useState("")
  const [overrideDate, setOverrideDate] = React.useState(new Date().toISOString().split("T")[0])
  const [overrideIn, setOverrideIn] = React.useState("09:30")
  const [overrideOut, setOverrideOut] = React.useState("18:30")
  const [overrideStatus, setOverrideStatus] = React.useState("ON_TIME")
  const [overrideReason, setOverrideReason] = React.useState("")

  const [copiedToken, setCopiedToken] = React.useState(false)

  // Live timer for active session
  const [elapsedTime, setElapsedTime] = React.useState<string>("00:00:00")
  const [breakElapsedTime, setBreakElapsedTime] = React.useState<string>("00:00:00")

  const loadAttendance = React.useCallback(async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (dateFilter) query.set("date", dateFilter)
      if (empFilter && empFilter !== "All") query.set("employeeId", empFilter)
      if (deptFilter && deptFilter !== "All") query.set("department", deptFilter)
      if (arrangementFilter && arrangementFilter !== "All") query.set("arrangement", arrangementFilter)
      if (statusFilter && statusFilter !== "All") query.set("status", statusFilter)

      const res = await fetch(`/api/attendance?${query.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        toast.error("Failed to fetch attendance data.")
      }
    } catch {
      toast.error("Network error fetching attendance.")
    } finally {
      setLoading(false)
    }
  }, [dateFilter, empFilter, deptFilter, arrangementFilter, statusFilter])

  React.useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  // Live timer ticking
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (data?.todayRecord?.checkIn && !data?.todayRecord?.checkOut) {
        const diffMs = new Date().getTime() - new Date(data.todayRecord.checkIn).getTime()
        const totalSec = Math.floor(Math.max(0, diffMs) / 1000)
        const hrs = Math.floor(totalSec / 3600)
        const mins = Math.floor((totalSec % 3600) / 60)
        const secs = totalSec % 60
        setElapsedTime(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        )
      }

      if (data?.todayRecord?.isOnBreak && data?.todayRecord?.currentBreakStart) {
        const diffMs = new Date().getTime() - new Date(data.todayRecord.currentBreakStart).getTime()
        const totalSec = Math.floor(Math.max(0, diffMs) / 1000)
        const hrs = Math.floor(totalSec / 3600)
        const mins = Math.floor((totalSec % 3600) / 60)
        const secs = totalSec % 60
        setBreakElapsedTime(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        )
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [data])

  // QR Check In
  const handleCheckInQr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrInputToken.trim()) {
      toast.error("Please enter or scan the office QR code token.")
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_IN_QR", qrCode: qrInputToken.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to verify office QR code.")
        return
      }
      toast.success(json.message)
      setQrModalOpen(false)
      setQrInputToken("")
      await loadAttendance()
    } catch {
      toast.error("Network error submitting QR check-in.")
    } finally {
      setActionLoading(false)
    }
  }

  // Remote Check In (Direct auth or approved)
  const handleCheckInRemote = async () => {
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_IN_REMOTE" }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Remote check-in failed.")
        return
      }
      toast.success(json.message)
      await loadAttendance()
    } catch {
      toast.error("Network error submitting remote attendance.")
    } finally {
      setActionLoading(false)
    }
  }

  // Start Break
  const handleStartBreak = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "START_BREAK", breakType, reason: breakReason }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to start break.")
        return
      }
      toast.success(json.message)
      setBreakModalOpen(false)
      setBreakReason("")
      await loadAttendance()
    } catch {
      toast.error("Network error starting break.")
    } finally {
      setActionLoading(false)
    }
  }

  // End Break
  const handleEndBreak = async () => {
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_BREAK" }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to end break.")
        return
      }
      toast.success(json.message)
      await loadAttendance()
    } catch {
      toast.error("Network error ending break.")
    } finally {
      setActionLoading(false)
    }
  }

  // Check Out
  const handleCheckOut = async () => {
    if (!confirm("Are you sure you want to end your shift and check out?")) return
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CHECK_OUT" }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Check out failed.")
        return
      }
      toast.success(json.message)
      await loadAttendance()
    } catch {
      toast.error("Network error during checkout.")
    } finally {
      setActionLoading(false)
    }
  }

  // Generate QR Token (Owner)
  const handleGenerateQr = async () => {
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_QR" }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to generate office QR code.")
        return
      }
      toast.success("Office attendance QR token generated!")
      await loadAttendance()
    } catch {
      toast.error("Network error generating QR code.")
    } finally {
      setActionLoading(false)
    }
  }

  // Submit Remote Work Request (Employee)
  const handleSubmitRemoteRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!remoteDate || !remoteReason.trim()) {
      toast.error("Date and reason are required.")
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_REMOTE",
          requestDate: remoteDate,
          workType: remoteType,
          reason: remoteReason,
          details: remoteDetails,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to submit request.")
        return
      }
      toast.success(json.message)
      setRemoteModalOpen(false)
      setRemoteDate("")
      setRemoteReason("")
      setRemoteDetails("")
      await loadAttendance()
    } catch {
      toast.error("Network error submitting request.")
    } finally {
      setActionLoading(false)
    }
  }

  // Submit Correction Request (Employee)
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!corrDate || !corrReason.trim()) {
      toast.error("Date and reason are required.")
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_CORRECTION",
          targetDate: corrDate,
          proposedCheckIn: corrIn,
          proposedCheckOut: corrOut,
          reason: corrReason,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to submit correction request.")
        return
      }
      toast.success(json.message)
      setCorrectionModalOpen(false)
      setCorrDate("")
      setCorrReason("")
      await loadAttendance()
    } catch {
      toast.error("Network error submitting correction.")
    } finally {
      setActionLoading(false)
    }
  }

  // Owner Review Request
  const handleReviewRequest = async (requestId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVIEW_REQUEST", requestId, decision }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to process review.")
        return
      }
      toast.success(`Request marked as ${decision}.`)
      await loadAttendance()
    } catch {
      toast.error("Network error reviewing request.")
    } finally {
      setActionLoading(false)
    }
  }

  // Owner Manual Override
  const handleOwnerOverride = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!overrideEmpId || !overrideDate || !overrideReason.trim()) {
      toast.error("Employee, date, and reason are required.")
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "OWNER_OVERRIDE",
          employeeId: overrideEmpId,
          date: overrideDate,
          checkInTime: overrideIn,
          checkOutTime: overrideOut,
          status: overrideStatus,
          reason: overrideReason,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Failed to override attendance.")
        return
      }
      toast.success("Attendance overridden and recorded in audit log.")
      setOverrideModalOpen(false)
      setOverrideReason("")
      await loadAttendance()
    } catch {
      toast.error("Network error during override.")
    } finally {
      setActionLoading(false)
    }
  }

  const copyQrToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(true)
    toast.success("Office attendance token copied to clipboard!")
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const isOwner = data?.isOwner
  const todayRec = data?.todayRecord
  const isCheckedIn = Boolean(todayRec && !todayRec?.checkOut)
  const isOnBreak = Boolean(todayRec?.isOnBreak)
  const effSchedule = data?.effectiveSchedule

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>
                {isOwner ? "Company Attendance & Work Schedules" : "My Work Schedule & Attendance"}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isOwner
                ? "Live employee attendance overview, schedule management, break tracking, and verifiable audit records."
                : "View your assigned work schedule, permitted check-in window, start/end breaks, and log your hours."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverrideModalOpen(true)}
                className="text-xs h-8 gap-1.5"
              >
                <FileEdit className="h-3.5 w-3.5 text-indigo-600" />
                <span>Manual Override</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAttendance}
              disabled={loading}
              className="text-xs h-8"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Roster</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EMPLOYEE WORKSPACE VIEW                                                   */}
        {/* ========================================================================= */}
        {!isOwner && (
          <div className="space-y-6">
            {/* Assigned Work Schedule Banner */}
            {effSchedule && (
              <Card className="border border-indigo-100/70 dark:border-indigo-950/70 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-background dark:from-indigo-950/30 dark:via-purple-950/15 dark:to-background overflow-hidden shadow-xs">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-[10px] bg-indigo-600">
                          {effSchedule.source === "INDIVIDUAL"
                            ? "Custom Individual Schedule"
                            : effSchedule.source === "TEAM_SHIFT"
                            ? "Department Shift Schedule"
                            : "Company Default Schedule"}
                        </Badge>
                        <span className="text-xs font-bold text-foreground">
                          {effSchedule.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permitted Check-In Window:{" "}
                        <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
                          {effSchedule.checkInStartTime} – {effSchedule.checkInEndTime}
                        </strong>{" "}
                        (+{effSchedule.gracePeriodMinutes}m grace) • Scheduled Out:{" "}
                        <strong className="text-foreground font-mono">
                          {effSchedule.checkOutTime}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        <span>
                          Arrangement: <strong>{effSchedule.workArrangement}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border">
                        <Coffee className="h-4 w-4 text-purple-500" />
                        <span>
                          Break: <strong>{effSchedule.breakMinutesAllowed}m</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interactive Punch & Break Card */}
            <Card className="border border-indigo-100/80 dark:border-indigo-950/80 shadow-md bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Status & Live Timer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          isOnBreak
                            ? "warning"
                            : isCheckedIn
                            ? "success"
                            : todayRec?.checkOut
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs px-2.5 py-0.5 font-bold"
                      >
                        {isOnBreak
                          ? "● Currently On Break"
                          : isCheckedIn
                          ? `● Shift Active (${todayRec?.status})`
                          : todayRec?.checkOut
                          ? `Shift Completed (${todayRec?.status})`
                          : "○ Not Checked In Today"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {data?.todayDayName}, {new Date().toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-4">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          {isOnBreak ? "Break Duration:" : "Total Shift Elapsed:"}
                        </span>
                        <div className="text-3xl sm:text-4xl font-mono font-black text-foreground tracking-tight">
                          {isOnBreak ? breakElapsedTime : isCheckedIn ? elapsedTime : "00:00:00"}
                        </div>
                      </div>

                      {todayRec?.breakMinutes ? (
                        <div className="pl-4 border-l">
                          <span className="text-[11px] text-muted-foreground block">
                            Total Breaks:
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {todayRec.breakMinutes} mins
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {todayRec?.checkIn && (
                      <p className="text-xs text-muted-foreground">
                        Check-in verified at{" "}
                        <span className="font-semibold text-foreground">
                          {new Date(todayRec.checkIn).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>{" "}
                        via {todayRec.method} ({todayRec.workType})
                      </p>
                    )}
                  </div>

                  {/* Punch & Break Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {!isCheckedIn && !todayRec?.checkOut ? (
                      <>
                        {/* Office QR Punch */}
                        <Button
                          onClick={() => setQrModalOpen(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 px-5 gap-2 shadow-xs"
                          disabled={actionLoading}
                        >
                          <QrCode className="h-4 w-4" />
                          <span>Office QR Check-In</span>
                        </Button>

                        {/* Remote Check-In */}
                        <Button
                          onClick={handleCheckInRemote}
                          variant="outline"
                          className="font-bold h-10 px-5 gap-2 border-indigo-200 dark:border-indigo-900"
                          disabled={actionLoading}
                        >
                          <Laptop className="h-4 w-4 text-indigo-600" />
                          <span>Remote Punch</span>
                        </Button>
                      </>
                    ) : isCheckedIn ? (
                      <>
                        {/* Break Tracking Buttons */}
                        {effSchedule?.trackBreaks && (
                          <>
                            {isOnBreak ? (
                              <Button
                                onClick={handleEndBreak}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 px-4 gap-2 shadow-xs"
                                disabled={actionLoading}
                              >
                                <Play className="h-4 w-4 fill-current" />
                                <span>End Break (Resume Shift)</span>
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setBreakModalOpen(true)}
                                variant="outline"
                                className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold h-10 px-4 gap-2"
                                disabled={actionLoading}
                              >
                                <Coffee className="h-4 w-4" />
                                <span>Take a Break</span>
                              </Button>
                            )}
                          </>
                        )}

                        {/* Check Out */}
                        <Button
                          onClick={handleCheckOut}
                          variant="destructive"
                          className="font-bold h-10 px-5 gap-2 shadow-xs"
                          disabled={actionLoading}
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Check Out</span>
                        </Button>
                      </>
                    ) : (
                      <div className="p-3 rounded-xl bg-muted/30 border text-xs text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>Workday completed. Total: {todayRec.totalHours} hrs</span>
                      </div>
                    )}

                    {/* Correction / Exception Request */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCorrectionModalOpen(true)}
                      className="text-xs h-9 text-muted-foreground hover:text-foreground"
                    >
                      <FileEdit className="h-3.5 w-3.5 mr-1" />
                      <span>Request Correction</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="p-4 border shadow-2xs space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Logged Days</span>
                <div className="text-2xl font-black text-foreground">
                  {data?.summary?.totalDays || 0} Days
                </div>
                <span className="text-[10px] text-muted-foreground">Historical verified sessions</span>
              </Card>

              <Card className="p-4 border shadow-2xs space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Total Hours</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {data?.summary?.totalHours || 0} hrs
                </div>
                <span className="text-[10px] text-muted-foreground">Net working time</span>
              </Card>

              <Card className="p-4 border shadow-2xs space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Avg Daily Hours</span>
                <div className="text-2xl font-black text-foreground">
                  {data?.summary?.avgHours || 0} hrs
                </div>
                <span className="text-[10px] text-muted-foreground">Per completed shift</span>
              </Card>

              <Card className="p-4 border shadow-2xs space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Assigned Shift</span>
                <div className="text-sm font-bold text-foreground truncate">
                  {effSchedule?.name || "Standard Core"}
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                  {effSchedule?.checkInStartTime} – {effSchedule?.checkOutTime}
                </span>
              </Card>
            </div>

            {/* Personal Attendance History Table */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Personal Attendance History</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your authenticated attendance logs with break deductions and status
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data?.history?.length || 0} Records
                </Badge>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Method & Type</th>
                      <th className="p-3">Check-In</th>
                      <th className="p-3">Check-Out</th>
                      <th className="p-3">Breaks</th>
                      <th className="p-3">Net Hours</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.history && data.history.length > 0 ? (
                      data.history.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="p-3 font-semibold">{r.date}</td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted">
                              {r.method} ({r.workType})
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            {r.checkIn
                              ? new Date(r.checkIn).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="p-3 font-mono">
                            {r.checkOut
                              ? new Date(r.checkOut).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "In Progress"}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {r.breakMinutes ? `${r.breakMinutes}m` : "0m"}
                          </td>
                          <td className="p-3 font-bold text-foreground">
                            {r.totalHours ? `${r.totalHours} hrs` : "—"}
                          </td>
                          <td className="p-3">
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-muted-foreground">
                          No attendance records found. Check in to record today&apos;s attendance.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* OWNER DASHBOARD VIEW                                                      */}
        {/* ========================================================================= */}
        {isOwner && (
          <div className="space-y-6">
            {/* Real Database KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Scheduled
                </span>
                <div className="text-xl font-black text-foreground">
                  {data?.summary?.totalScheduled || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Expected today</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Checked In
                </span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {data?.summary?.totalCheckedIn || 0}
                </div>
                <span className="text-[9px] text-emerald-600 font-semibold">Active/Finished</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Not In Yet
                </span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                  {data?.summary?.notCheckedIn || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Awaiting check-in</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Late Arrivals
                </span>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {data?.summary?.lateArrivals || 0}
                </div>
                <span className="text-[9px] text-rose-600 font-semibold">Past cutoff window</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  On Break
                </span>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                  {data?.summary?.onBreakCount || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Paused shift</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Checked Out
                </span>
                <div className="text-xl font-black text-foreground">
                  {data?.summary?.checkedOutCount || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Ended day</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Early Dep.
                </span>
                <div className="text-xl font-black text-orange-600 dark:text-orange-400">
                  {data?.summary?.earlyDepartures || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Left before shift</span>
              </Card>

              <Card className="p-3.5 border shadow-2xs space-y-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
                  Pending Req.
                </span>
                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {data?.summary?.pendingApprovalsCount || 0}
                </div>
                <span className="text-[9px] text-muted-foreground">Corrections/Remote</span>
              </Card>
            </div>

            {/* Office QR Code Generation Card */}
            <Card className="border border-indigo-100/70 dark:border-indigo-950/70 bg-card/95 shadow-xs">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Office Attendance Security Token
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      In-office employees scan or enter this short-lived cryptographic token to check in.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {data?.activeQrCode ? (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-muted border font-bold">
                        {data.activeQrCode}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyQrToken(data.activeQrCode)}
                        className="text-xs h-8 gap-1"
                      >
                        {copiedToken ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span>{copiedToken ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>
                  ) : null}

                  <Button
                    size="sm"
                    onClick={handleGenerateQr}
                    disabled={actionLoading}
                    className="text-xs h-8 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${actionLoading ? "animate-spin" : ""}`} />
                    <span>{data?.activeQrCode ? "Regenerate Token" : "Generate Token"}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Filter Toolbar */}
            <div className="p-3.5 rounded-2xl border bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filters:</span>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Date:</span>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="h-8 text-xs w-36 bg-background"
                  />
                  {dateFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateFilter("")}
                      className="h-8 px-1.5 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Employee Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Employee:</span>
                  <select
                    value={empFilter}
                    onChange={(e) => setEmpFilter(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="All">All Employees</option>
                    {data?.employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="All">All Statuses</option>
                    <option value="ON_TIME">On Time / Present</option>
                    <option value="LATE">Late Arrivals</option>
                    <option value="ON_BREAK">Currently On Break</option>
                    <option value="CHECKED_OUT">Checked Out</option>
                    <option value="EARLY_DEPARTURE">Early Departure</option>
                  </select>
                </div>

                {/* Work Arrangement Filter */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Arrangement:</span>
                  <select
                    value={arrangementFilter}
                    onChange={(e) => setArrangementFilter(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                  >
                    <option value="All">All Arrangements</option>
                    <option value="Office">Office</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <span className="text-xs font-semibold text-muted-foreground">
                Showing {data?.records?.length || 0} records
              </span>
            </div>

            {/* Attendance Roster Table */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Today&apos;s Attendance Roster</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click an employee&apos;s name to open their profile and configure their work schedule
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data?.records?.length || 0} Logged
                </Badge>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/40 border-b text-[11px] font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3">Employee & Role</th>
                      <th className="p-3">Arrangement</th>
                      <th className="p-3">Check-In</th>
                      <th className="p-3">Breaks</th>
                      <th className="p-3">Check-Out</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data?.records && data.records.length > 0 ? (
                      data.records.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/20">
                          <td className="p-3">
                            <Link
                              href={`/employees/${r.employee.id}`}
                              className="font-bold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                              <span>{r.employee.name}</span>
                              <ArrowRight className="h-3 w-3 opacity-50" />
                            </Link>
                            <span className="text-[11px] text-muted-foreground block">
                              {r.employee.role} • {r.employee.department}
                            </span>
                          </td>

                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {r.employee.workSchedule?.workArrangement || "Office"}
                            </Badge>
                          </td>

                          <td className="p-3 font-mono">
                            {r.checkIn ? (
                              <div>
                                <span>
                                  {new Date(r.checkIn).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-[10px] text-muted-foreground block font-sans">
                                  {r.method}
                                </span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>

                          <td className="p-3">
                            {r.isOnBreak ? (
                              <Badge variant="warning" className="text-[10px] animate-pulse">
                                On Break
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">
                                {r.breakMinutes ? `${r.breakMinutes}m` : "0m"}
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono">
                            {r.checkOut ? (
                              new Date(r.checkOut).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            ) : (
                              <span className="text-muted-foreground italic">In Progress</span>
                            )}
                          </td>

                          <td className="p-3 font-bold text-foreground">
                            {r.totalHours ? `${r.totalHours} hrs` : "—"}
                          </td>

                          <td className="p-3">
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

                          <td className="p-3 text-right">
                            <Link href={`/employees/${r.employee.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-indigo-600 dark:text-indigo-400 gap-1"
                              >
                                <Settings2 className="h-3 w-3" />
                                <span>Schedule</span>
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground">
                          No attendance records matching the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Pending Requests & Audit History Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Approvals */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Pending Attendance Requests</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {data?.pendingRequests?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {data?.pendingRequests && data.pendingRequests.length > 0 ? (
                    data.pendingRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-xl border bg-card space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{req.title}</span>
                          <Badge variant="info" className="text-[10px]">
                            {req.type}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          By <strong>{req.employee?.name}</strong> • {req.details}
                        </p>
                        <div className="flex items-center justify-end gap-2 pt-1 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewRequest(req.id, "REJECTED")}
                            disabled={actionLoading}
                            className="h-7 text-xs text-rose-600"
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReviewRequest(req.id, "APPROVED")}
                            disabled={actionLoading}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No pending remote work or correction requests.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Audit Log */}
              <Card className="border shadow-xs">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">Verifiable Audit Trail</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      Tamper-Evident
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2 max-h-80 overflow-y-auto">
                  {data?.recentAudits && data.recentAudits.length > 0 ? (
                    data.recentAudits.map((a: any) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-lg border bg-muted/10 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {a.action}
                            </Badge>
                            <span className="font-semibold text-foreground">
                              {a.employee?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              (by {a.actorName})
                            </span>
                          </div>
                          {a.reason && (
                            <p className="text-[11px] text-muted-foreground">{a.reason}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {new Date(a.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No audit history entries recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}

      {/* Modal: Office QR Check In */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-indigo-600" />
              <span>Office QR Check-In</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter or paste the 24-character security token displayed on the office board.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCheckInQr} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Security Token</Label>
              <Input
                placeholder="e.g. bizmind_qr_..."
                value={qrInputToken}
                onChange={(e) => setQrInputToken(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQrModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {actionLoading ? "Verifying..." : "Verify & Check In"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Start Break */}
      <Dialog open={breakModalOpen} onOpenChange={setBreakModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-amber-600" />
              <span>Take a Break</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Your shift timer will pause until you resume work.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStartBreak} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Break Type</Label>
              <select
                value={breakType}
                onChange={(e) => setBreakType(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
              >
                <option value="LUNCH">Lunch Break (30–60 mins)</option>
                <option value="COFFEE_BREAK">Coffee / Tea Break (15 mins)</option>
                <option value="PERSONAL">Personal / Rest (Flexible)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notes (Optional)</Label>
              <Input
                placeholder="e.g. Grabbing quick team lunch"
                value={breakReason}
                onChange={(e) => setBreakReason(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBreakModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white"
              >
                {actionLoading ? "Starting..." : "Start Break"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Request Attendance Correction */}
      <Dialog open={correctionModalOpen} onOpenChange={setCorrectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-indigo-600" />
              <span>Submit Attendance Correction Request</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Did you forget to scan or checkout? Submit a correction with exact times for owner
              review.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitCorrection} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Date of Incident</Label>
              <Input
                type="date"
                value={corrDate}
                onChange={(e) => setCorrDate(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Actual Check-In</Label>
                <Input
                  type="time"
                  value={corrIn}
                  onChange={(e) => setCorrIn(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Actual Check-Out</Label>
                <Input
                  type="time"
                  value={corrOut}
                  onChange={(e) => setCorrOut(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Reason for Correction</Label>
              <Textarea
                placeholder="Explain why the timestamp was missed or needs adjustment..."
                value={corrReason}
                onChange={(e) => setCorrReason(e.target.value)}
                className="text-xs min-h-[80px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCorrectionModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {actionLoading ? "Submitting..." : "Submit for Review"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Owner Manual Override */}
      <Dialog open={overrideModalOpen} onOpenChange={setOverrideModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <span>Owner Attendance Override</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Manually create or override an employee&apos;s punch record. Every action is audited
              with your reason.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleOwnerOverride} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Employee</Label>
              <select
                value={overrideEmpId}
                onChange={(e) => setOverrideEmpId(e.target.value)}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                required
              >
                <option value="">Select Employee...</option>
                {data?.employees?.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} • {emp.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date</Label>
                <Input
                  type="date"
                  value={overrideDate}
                  onChange={(e) => setOverrideDate(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="ON_TIME">On Time / Present</option>
                  <option value="LATE">Late Arrival</option>
                  <option value="EARLY_DEPARTURE">Early Departure</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Check-In Time</Label>
                <Input
                  type="time"
                  value={overrideIn}
                  onChange={(e) => setOverrideIn(e.target.value)}
                  className="text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Check-Out Time</Label>
                <Input
                  type="time"
                  value={overrideOut}
                  onChange={(e) => setOverrideOut(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Mandatory Override Reason</span>
                <span className="text-[10px] text-muted-foreground font-normal">Audited</span>
              </Label>
              <Input
                placeholder="e.g. Employee attended offsite client meeting with owner approval"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOverrideModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {actionLoading ? "Recording..." : "Save Override"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  )
}
