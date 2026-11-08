import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"
import { getCurrentUser, getActiveBusinessId } from "@/lib/auth"
import crypto from "crypto"
import {
  getEffectiveEmployeeSchedule,
  evaluateCheckInStatus,
  evaluateCheckOutStatus,
  type EffectiveSchedule,
} from "@/lib/schedule/resolver"

function getTodayString(): string {
  const d = new Date()
  return d.toISOString().split("T")[0]
}

function getDayOfWeekName(date: Date = new Date()): string {
  return [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ][date.getDay()]
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const todayDate = getTodayString()
    const isEmployee = user.role === "EMPLOYEE"
    const now = new Date()
    const todayDayName = getDayOfWeekName(now)

    // =========================================================================
    // EMPLOYEE VIEW: strictly personal data
    // =========================================================================
    if (isEmployee) {
      if (!user.employeeId) {
        return NextResponse.json({ error: "Employee profile not found" }, { status: 404 })
      }

      // Effective schedule for this employee
      const effectiveSchedule = await getEffectiveEmployeeSchedule(businessId, user.employeeId)

      // 1. Employee personal today record with breaks
      const todayRecord = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId: user.employeeId,
          date: todayDate,
        },
        include: {
          breaks: {
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { checkIn: "desc" },
      })

      // 2. Personal attendance history (last 30 records)
      const history = await prisma.attendance.findMany({
        where: {
          businessId,
          employeeId: user.employeeId,
        },
        include: {
          breaks: true,
        },
        orderBy: { checkIn: "desc" },
        take: 30,
      })

      // 3. Approved Remote / Field Work Requests for Today
      const approvedRemoteToday = await prisma.employeeRequest.findFirst({
        where: {
          businessId,
          employeeId: user.employeeId,
          type: { in: ["REMOTE_WORK", "FIELD_WORK"] },
          status: "APPROVED",
          title: { contains: todayDate },
        },
      })

      // 4. Pending / Historical Attendance Requests
      const attendanceRequests = await prisma.employeeRequest.findMany({
        where: {
          businessId,
          employeeId: user.employeeId,
          type: { in: ["REMOTE_WORK", "FIELD_WORK", "ATTENDANCE_CORRECTION"] },
        },
        orderBy: { createdAt: "desc" },
        take: 15,
      })

      // 5. Weekly / Monthly statistics
      const totalDays = history.length
      const totalHours = history.reduce((acc, curr) => acc + (curr.totalHours || 0), 0)
      const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : "0.0"

      // Calculate current break state
      let activeBreak = null
      if (todayRecord?.isOnBreak) {
        activeBreak = todayRecord.breaks?.find((b) => !b.endTime) || null
      }

      return NextResponse.json({
        isOwner: false,
        todayRecord,
        activeBreak,
        history,
        effectiveSchedule,
        approvedRemoteToday,
        attendanceRequests,
        todayDayName,
        isScheduledToday: effectiveSchedule.workingDays.includes(todayDayName),
        summary: {
          totalDays,
          totalHours: parseFloat(totalHours.toFixed(1)),
          avgHours: parseFloat(avgHours),
          isCheckedIn: Boolean(todayRecord && !todayRecord.checkOut),
          isOnBreak: Boolean(todayRecord?.isOnBreak),
        },
      })
    }

    // =========================================================================
    // OWNER VIEW: Company-wide attendance with filtering and real analytics
    // =========================================================================
    const { searchParams } = new URL(req.url)
    const dateFilter = searchParams.get("date") || todayDate
    const empFilter = searchParams.get("employeeId")
    const deptFilter = searchParams.get("department")
    const statusFilter = searchParams.get("status")
    const arrangementFilter = searchParams.get("arrangement")

    // Fetch all active employees
    const allEmployees = await prisma.employee.findMany({
      where: { businessId, status: "Active" },
      include: {
        workSchedule: true,
      },
      orderBy: { name: "asc" },
    })

    // Fetch attendance records for selected date
    const whereClause: any = { businessId }
    if (dateFilter && dateFilter !== "All") {
      whereClause.date = dateFilter
    }
    if (empFilter && empFilter !== "All") {
      whereClause.employeeId = empFilter
    }

    const [allRecords, activeQr, pendingRequests, recentAudits] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              role: true,
              department: true,
              workSchedule: true,
            },
          },
          breaks: true,
        },
        orderBy: { checkIn: "desc" },
      }),
      prisma.officeQrCode.findFirst({
        where: {
          businessId,
          date: todayDate,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employeeRequest.findMany({
        where: {
          businessId,
          type: { in: ["REMOTE_WORK", "FIELD_WORK", "ATTENDANCE_CORRECTION"] },
          status: "PENDING",
        },
        include: {
          employee: {
            select: { id: true, name: true, role: true, department: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendanceAudit.findMany({
        where: { businessId },
        include: {
          employee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ])

    // Filter in-memory by department, arrangement, or status if requested
    let filteredRecords = allRecords
    if (deptFilter && deptFilter !== "All") {
      filteredRecords = filteredRecords.filter((r) => r.employee.department === deptFilter)
    }
    if (statusFilter && statusFilter !== "All") {
      filteredRecords = filteredRecords.filter((r) => r.status === statusFilter)
    }
    if (arrangementFilter && arrangementFilter !== "All") {
      filteredRecords = filteredRecords.filter(
        (r) => (r.employee.workSchedule?.workArrangement || "Office") === arrangementFilter
      )
    }

    // Real Statistics Calculation based on effective schedules
    const targetDateObj = dateFilter === "All" ? now : new Date(dateFilter)
    const targetDayName = getDayOfWeekName(targetDateObj)

    // Employees scheduled on target date
    const scheduledEmployees = allEmployees.filter((emp) => {
      const scheduleDays = emp.workSchedule?.workingDays
        ? JSON.parse(emp.workSchedule.workingDays)
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      return scheduleDays.includes(targetDayName)
    })

    const checkedInEmpIds = new Set(allRecords.map((r) => r.employeeId))
    const totalScheduled = scheduledEmployees.length
    const totalCheckedIn = allRecords.length
    const notCheckedIn = scheduledEmployees.filter((emp) => !checkedInEmpIds.has(emp.id)).length
    const lateArrivals = allRecords.filter((r) => r.status === "LATE").length
    const onBreakCount = allRecords.filter((r) => r.isOnBreak).length
    const checkedOutCount = allRecords.filter((r) => r.checkOut !== null).length
    const earlyDepartures = allRecords.filter((r) => r.earlyDeparture).length

    // Generate trend data over past 7 days for the chart
    const past7Days: { date: string; onTime: number; late: number; total: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split("T")[0]
      // fetch count or estimate from records
      const dayRecs = allRecords.filter((r) => r.date === ds)
      const onTime = dayRecs.filter((r) => r.status === "ON_TIME" || r.status === "PRESENT").length
      const late = dayRecs.filter((r) => r.status === "LATE").length
      past7Days.push({
        date: ds.slice(5), // "MM-DD"
        onTime,
        late,
        total: dayRecs.length,
      })
    }

    return NextResponse.json({
      isOwner: true,
      records: filteredRecords,
      employees: allEmployees.map((e) => ({
        id: e.id,
        name: e.name,
        role: e.role,
        department: e.department,
        arrangement: e.workSchedule?.workArrangement || "Office",
      })),
      selectedDate: dateFilter,
      activeQrCode: activeQr?.code || null,
      qrExpiresAt: activeQr?.expiresAt || null,
      pendingRequests,
      recentAudits,
      summary: {
        totalScheduled,
        totalCheckedIn,
        notCheckedIn,
        lateArrivals,
        onBreakCount,
        checkedOutCount,
        earlyDepartures,
        pendingApprovalsCount: pendingRequests.length,
      },
      trends: past7Days,
    })
  } catch (error: any) {
    console.error("GET /api/attendance error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const body = await req.json()
    const action = body.action
    const todayDate = getTodayString()
    const now = new Date()
    const isOwner = user.role === "OWNER"

    // =========================================================================
    // 1. OWNER ACTION: GENERATE OFFICE ATTENDANCE QR CODE
    // =========================================================================
    if (action === "GENERATE_QR") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden: Only authorized company owners can generate office QR codes." },
          { status: 403 }
        )
      }

      const code = `bizmind_qr_${crypto.randomBytes(12).toString("hex")}`
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000)

      await prisma.officeQrCode.deleteMany({
        where: { businessId, date: todayDate },
      })

      const qrRecord = await prisma.officeQrCode.create({
        data: {
          businessId,
          code,
          date: todayDate,
          expiresAt,
          createdBy: user.id,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Office Attendance QR Code generated successfully.",
        qrCode: qrRecord.code,
        expiresAt: qrRecord.expiresAt,
      })
    }

    // =========================================================================
    // 2. EMPLOYEE ACTION: CHECK IN VIA OFFICE QR CODE SCAN
    // =========================================================================
    if (action === "CHECK_IN_QR") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const inputCode = body.qrCode?.trim()
      if (!inputCode) {
        return NextResponse.json({ error: "QR code token is required." }, { status: 400 })
      }

      const validQr = await prisma.officeQrCode.findFirst({
        where: {
          businessId,
          code: inputCode,
          expiresAt: { gt: now },
        },
      })

      if (!validQr) {
        return NextResponse.json(
          { error: "Invalid, expired, or unauthorized office QR code. Please scan the current code displayed at the office." },
          { status: 400 }
        )
      }

      // Prevent duplicate active check-in
      const activeSession = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId,
          date: todayDate,
          checkOut: null,
        },
      })

      if (activeSession) {
        return NextResponse.json(
          { error: "You already have an active check-in session recorded for today." },
          { status: 400 }
        )
      }

      // Resolve effective schedule and evaluate status
      const effectiveSchedule = await getEffectiveEmployeeSchedule(businessId, employeeId)
      const evaluation = evaluateCheckInStatus(now, effectiveSchedule)

      const newAttendance = await prisma.attendance.create({
        data: {
          businessId,
          employeeId,
          date: todayDate,
          checkIn: now,
          status: evaluation.status,
          method: "QR_SCAN",
          workType: "OFFICE",
          scheduleSnapshot: JSON.stringify(effectiveSchedule),
          notes: evaluation.isLate
            ? `Late check-in (+${evaluation.minutesLate}m) via Office QR`
            : "On-time check-in via Office QR",
        },
      })

      // Log Attendance Audit
      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: newAttendance.id,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "CHECK_IN",
          newState: JSON.stringify({
            status: evaluation.status,
            checkIn: now,
            method: "QR_SCAN",
            schedule: effectiveSchedule.name,
          }),
          reason: "Employee QR scan check-in",
        },
      })

      return NextResponse.json({
        success: true,
        message: `Office check-in verified successfully. Status: ${evaluation.status}.`,
        record: newAttendance,
      })
    }

    // =========================================================================
    // 3. EMPLOYEE ACTION: CHECK IN VIA REMOTE / FIELD WORK
    // =========================================================================
    if (action === "CHECK_IN_REMOTE") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const effectiveSchedule = await getEffectiveEmployeeSchedule(businessId, employeeId)

      // If employee's schedule is Remote or Hybrid, remote check-in is intrinsically allowed!
      // Otherwise, require an approved request
      const isConfiguredRemote =
        effectiveSchedule.workArrangement === "Remote" ||
        effectiveSchedule.workArrangement === "Hybrid"

      let approvedRequestId: string | null = null

      if (!isConfiguredRemote) {
        const approvedRequest = await prisma.employeeRequest.findFirst({
          where: {
            businessId,
            employeeId,
            type: { in: ["REMOTE_WORK", "FIELD_WORK"] },
            status: "APPROVED",
            title: { contains: todayDate },
          },
        })

        if (!approvedRequest) {
          return NextResponse.json(
            {
              error:
                "Your schedule arrangement is Office. Please submit a Remote/Field Work request and obtain owner approval before recording remote attendance.",
            },
            { status: 403 }
          )
        }
        approvedRequestId = approvedRequest.id
      }

      // Prevent duplicate active check-in
      const activeSession = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId,
          date: todayDate,
          checkOut: null,
        },
      })

      if (activeSession) {
        return NextResponse.json(
          { error: "You already have an active check-in session recorded for today." },
          { status: 400 }
        )
      }

      const evaluation = evaluateCheckInStatus(now, effectiveSchedule)
      const workType = effectiveSchedule.workArrangement === "Remote" ? "REMOTE" : "FIELD"

      const newAttendance = await prisma.attendance.create({
        data: {
          businessId,
          employeeId,
          date: todayDate,
          checkIn: now,
          status: evaluation.status,
          method: isConfiguredRemote ? "REMOTE_SELF" : "REMOTE_APPROVED",
          workType,
          approvalRequestId: approvedRequestId,
          scheduleSnapshot: JSON.stringify(effectiveSchedule),
          notes: evaluation.isLate
            ? `Late check-in (+${evaluation.minutesLate}m) via Remote punch`
            : "On-time remote check-in",
        },
      })

      // Log Attendance Audit
      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: newAttendance.id,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "CHECK_IN",
          newState: JSON.stringify({
            status: evaluation.status,
            checkIn: now,
            method: isConfiguredRemote ? "REMOTE_SELF" : "REMOTE_APPROVED",
            schedule: effectiveSchedule.name,
          }),
          reason: "Remote employee authenticated punch",
        },
      })

      return NextResponse.json({
        success: true,
        message: `Remote check-in recorded successfully. Status: ${evaluation.status}.`,
        record: newAttendance,
      })
    }

    // =========================================================================
    // 4. BREAK TRACKING: START BREAK
    // =========================================================================
    if (action === "START_BREAK") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const activeSession = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId,
          date: todayDate,
          checkOut: null,
        },
        include: { breaks: true },
      })

      if (!activeSession) {
        return NextResponse.json(
          { error: "No active check-in session found to start a break from." },
          { status: 400 }
        )
      }

      if (activeSession.isOnBreak) {
        return NextResponse.json(
          { error: "You are already currently on a break." },
          { status: 400 }
        )
      }

      const breakType = body.breakType || "LUNCH"
      const reason = body.reason || null

      const attendanceBreak = await prisma.attendanceBreak.create({
        data: {
          attendanceId: activeSession.id,
          startTime: now,
          type: breakType,
          reason,
        },
      })

      const updated = await prisma.attendance.update({
        where: { id: activeSession.id },
        data: {
          isOnBreak: true,
          currentBreakStart: now,
          status: "ON_BREAK",
        },
      })

      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: activeSession.id,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "BREAK_START",
          newState: JSON.stringify({ breakId: attendanceBreak.id, type: breakType, startTime: now }),
          reason: reason || `Started ${breakType} break`,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Break started at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        record: updated,
        activeBreak: attendanceBreak,
      })
    }

    // =========================================================================
    // 5. BREAK TRACKING: END BREAK
    // =========================================================================
    if (action === "END_BREAK") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const activeSession = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId,
          date: todayDate,
          checkOut: null,
        },
        include: { breaks: true },
      })

      if (!activeSession || !activeSession.isOnBreak) {
        return NextResponse.json(
          { error: "You are not currently on an active break." },
          { status: 400 }
        )
      }

      const openBreak = activeSession.breaks.find((b) => !b.endTime)
      let durationMinutes = 0

      if (openBreak) {
        const diffMs = now.getTime() - new Date(openBreak.startTime).getTime()
        durationMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
        await prisma.attendanceBreak.update({
          where: { id: openBreak.id },
          data: {
            endTime: now,
            durationMinutes,
          },
        })
      }

      // Sum all completed breaks
      const allBreaks = await prisma.attendanceBreak.findMany({
        where: { attendanceId: activeSession.id },
      })
      const totalBreakMinutes = allBreaks.reduce(
        (sum, b) => sum + (b.durationMinutes || 0),
        0
      )

      // Revert status to ON_TIME or LATE based on initial notes or snapshot
      const wasLate = activeSession.notes?.includes("Late") || false
      const restoredStatus = wasLate ? "LATE" : "ON_TIME"

      const updated = await prisma.attendance.update({
        where: { id: activeSession.id },
        data: {
          isOnBreak: false,
          currentBreakStart: null,
          breakMinutes: totalBreakMinutes,
          status: restoredStatus,
        },
      })

      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: activeSession.id,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "BREAK_END",
          newState: JSON.stringify({
            durationMinutes,
            totalBreakMinutes,
            restoredStatus,
          }),
          reason: `Ended break after ${durationMinutes} minutes`,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Break ended. Duration: ${durationMinutes} mins. Total breaks today: ${totalBreakMinutes} mins.`,
        record: updated,
      })
    }

    // =========================================================================
    // 6. COMMON ACTION: CHECK OUT
    // =========================================================================
    if (action === "CHECK_OUT") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const activeSession = await prisma.attendance.findFirst({
        where: {
          businessId,
          employeeId,
          date: todayDate,
          checkOut: null,
        },
        include: { breaks: true },
        orderBy: { checkIn: "desc" },
      })

      if (!activeSession) {
        return NextResponse.json(
          { error: "No active check-in found to check out from." },
          { status: 400 }
        )
      }

      // If user was still on break, close the break automatically
      let totalBreakMinutes = activeSession.breakMinutes || 0
      if (activeSession.isOnBreak) {
        const openBreak = activeSession.breaks.find((b) => !b.endTime)
        if (openBreak) {
          const diffMs = now.getTime() - new Date(openBreak.startTime).getTime()
          const dur = Math.max(1, Math.round(diffMs / (1000 * 60)))
          await prisma.attendanceBreak.update({
            where: { id: openBreak.id },
            data: { endTime: now, durationMinutes: dur },
          })
          totalBreakMinutes += dur
        }
      }

      // Retrieve snapshot schedule or calculate effective schedule
      let schedule: EffectiveSchedule
      if (activeSession.scheduleSnapshot) {
        try {
          schedule = JSON.parse(activeSession.scheduleSnapshot)
        } catch {
          schedule = await getEffectiveEmployeeSchedule(businessId, employeeId)
        }
      } else {
        schedule = await getEffectiveEmployeeSchedule(businessId, employeeId)
      }

      const evaluation = evaluateCheckOutStatus(
        new Date(activeSession.checkIn),
        now,
        totalBreakMinutes,
        schedule
      )

      const updated = await prisma.attendance.update({
        where: { id: activeSession.id },
        data: {
          checkOut: now,
          totalHours: evaluation.totalHours,
          earlyDeparture: evaluation.earlyDeparture,
          isOnBreak: false,
          currentBreakStart: null,
          breakMinutes: totalBreakMinutes,
          status: evaluation.status,
          notes: body.notes
            ? `${activeSession.notes ? activeSession.notes + " | " : ""}${body.notes}`
            : activeSession.notes,
        },
      })

      // Log Attendance Audit
      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: activeSession.id,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "CHECK_OUT",
          newState: JSON.stringify({
            checkOut: now,
            totalHours: evaluation.totalHours,
            earlyDeparture: evaluation.earlyDeparture,
            status: evaluation.status,
          }),
          reason: body.notes || "Employee check-out",
        },
      })

      return NextResponse.json({
        success: true,
        message: `Checked out successfully. Logged: ${evaluation.totalHours} hrs (Break: ${totalBreakMinutes} mins).`,
        record: updated,
      })
    }

    // =========================================================================
    // 7. OWNER OVERRIDE ACTION
    // =========================================================================
    if (action === "OWNER_OVERRIDE") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden: Only business owners can perform attendance overrides." },
          { status: 403 }
        )
      }

      const {
        employeeId,
        date,
        checkInTime,
        checkOutTime,
        status = "ON_TIME",
        reason,
        notes,
      } = body

      if (!employeeId || !date || !reason) {
        return NextResponse.json(
          { error: "Employee, date, and override authorization reason are required." },
          { status: 400 }
        )
      }

      const employee = await prisma.employee.findFirst({
        where: { id: employeeId, businessId },
      })
      if (!employee) {
        return NextResponse.json({ error: "Employee not found." }, { status: 404 })
      }

      const [inH, inM] = (checkInTime || "09:30").split(":").map(Number)
      const cIn = new Date(`${date}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`)

      let cOut: Date | null = null
      let totalHours = 0
      if (checkOutTime) {
        const [outH, outM] = checkOutTime.split(":").map(Number)
        cOut = new Date(`${date}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00`)
        totalHours = Math.max(0.1, Math.round(((cOut.getTime() - cIn.getTime()) / (1000 * 60 * 60)) * 100) / 100)
      }

      const existingRecord = await prisma.attendance.findFirst({
        where: { businessId, employeeId, date },
      })

      let savedRecord
      if (existingRecord) {
        savedRecord = await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            checkIn: cIn,
            checkOut: cOut,
            totalHours: totalHours || existingRecord.totalHours,
            status,
            method: "MANUAL_CORRECTION",
            correctedBy: user.name || "Owner",
            notes: notes ? `Owner override: ${notes}` : `Owner override: ${reason}`,
          },
        })
      } else {
        savedRecord = await prisma.attendance.create({
          data: {
            businessId,
            employeeId,
            date,
            checkIn: cIn,
            checkOut: cOut,
            totalHours,
            status,
            method: "MANUAL_CORRECTION",
            correctedBy: user.name || "Owner",
            notes: notes ? `Owner override: ${notes}` : `Owner override: ${reason}`,
          },
        })
      }

      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          attendanceId: savedRecord.id,
          actorId: user.id,
          actorName: user.name || "Owner",
          actorRole: "OWNER",
          action: "OVERRIDE",
          previousState: existingRecord ? JSON.stringify(existingRecord) : null,
          newState: JSON.stringify(savedRecord),
          reason: `Owner override: ${reason}`,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Attendance overridden and audited successfully.",
        record: savedRecord,
      })
    }

    // =========================================================================
    // 8. EMPLOYEE ACTION: SUBMIT REMOTE WORK / FIELD WORK REQUEST
    // =========================================================================
    if (action === "REQUEST_REMOTE") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const { requestDate, workType, reason, details } = body
      if (!requestDate || !reason) {
        return NextResponse.json(
          { error: "Date and reason are required for remote/field request." },
          { status: 400 }
        )
      }

      const reqType = workType === "FIELD" ? "FIELD_WORK" : "REMOTE_WORK"
      const title = `${workType === "FIELD" ? "Field Work" : "Remote Work"} Request for ${requestDate}`

      const newRequest = await prisma.employeeRequest.create({
        data: {
          businessId,
          employeeId,
          type: reqType,
          title,
          details: `Reason: ${reason}${details ? ` | Notes: ${details}` : ""}`,
          status: "PENDING",
        },
      })

      return NextResponse.json({
        success: true,
        message: `${workType === "FIELD" ? "Field Work" : "Remote Work"} request for ${requestDate} submitted for owner approval.`,
        request: newRequest,
      })
    }

    // =========================================================================
    // 9. EMPLOYEE ACTION: REQUEST ATTENDANCE CORRECTION
    // =========================================================================
    if (action === "REQUEST_CORRECTION") {
      const employeeId = user.employeeId
      if (!employeeId) {
        return NextResponse.json({ error: "Employee record not found." }, { status: 404 })
      }

      const { targetDate, proposedCheckIn, proposedCheckOut, reason } = body
      if (!targetDate || !reason) {
        return NextResponse.json(
          { error: "Date and explanation reason are required for attendance correction." },
          { status: 400 }
        )
      }

      const title = `Attendance Correction Request for ${targetDate}`
      const payloadDetails = JSON.stringify({
        date: targetDate,
        proposedCheckIn: proposedCheckIn || "09:30",
        proposedCheckOut: proposedCheckOut || "18:30",
        reason,
      })

      const newRequest = await prisma.employeeRequest.create({
        data: {
          businessId,
          employeeId,
          type: "ATTENDANCE_CORRECTION",
          title,
          details: payloadDetails,
          status: "PENDING",
        },
      })

      await prisma.attendanceAudit.create({
        data: {
          businessId,
          employeeId,
          actorId: user.id,
          actorName: user.name || "Employee",
          actorRole: "EMPLOYEE",
          action: "CORRECTION_REQUEST",
          newState: payloadDetails,
          reason,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Correction request for ${targetDate} submitted for manager review.`,
        request: newRequest,
      })
    }

    // =========================================================================
    // 10. OWNER ACTION: APPROVE / REJECT REMOTE OR CORRECTION REQUEST
    // =========================================================================
    if (action === "REVIEW_REQUEST") {
      if (!isOwner) {
        return NextResponse.json(
          { error: "Forbidden: Only owners can review attendance requests." },
          { status: 403 }
        )
      }

      const { requestId, decision, notes: reviewNotes } = body
      if (!requestId || !decision) {
        return NextResponse.json({ error: "Request ID and decision are required." }, { status: 400 })
      }

      const existingReq = await prisma.employeeRequest.findFirst({
        where: { id: requestId, businessId },
      })

      if (!existingReq) {
        return NextResponse.json({ error: "Request not found." }, { status: 404 })
      }

      const updatedRequest = await prisma.employeeRequest.update({
        where: { id: requestId },
        data: {
          status: decision,
          resolution: reviewNotes || `Decision: ${decision} by ${user.name}`,
          resolvedAt: now,
        },
      })

      // If ATTENDANCE_CORRECTION was approved, apply the correction to Attendance record!
      if (decision === "APPROVED" && existingReq.type === "ATTENDANCE_CORRECTION") {
        try {
          const parsed = JSON.parse(existingReq.details)
          const correctionDate = parsed.date
          const [inH, inM] = (parsed.proposedCheckIn || "09:30").split(":").map(Number)
          const [outH, outM] = (parsed.proposedCheckOut || "18:30").split(":").map(Number)

          const cIn = new Date(`${correctionDate}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`)
          const cOut = new Date(`${correctionDate}T${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}:00`)
          const diffMs = Math.max(0, cOut.getTime() - cIn.getTime())
          const totalHours = Math.max(0.1, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)))

          const existingAttendance = await prisma.attendance.findFirst({
            where: { businessId, employeeId: existingReq.employeeId, date: correctionDate },
          })

          let updatedAttendance
          if (existingAttendance) {
            updatedAttendance = await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                checkIn: cIn,
                checkOut: cOut,
                totalHours,
                status: "ON_TIME",
                method: "MANUAL_CORRECTION",
                correctionStatus: "APPROVED",
                correctedBy: user.name,
                notes: `Corrected via approval: ${parsed.reason}`,
              },
            })
          } else {
            updatedAttendance = await prisma.attendance.create({
              data: {
                businessId,
                employeeId: existingReq.employeeId,
                date: correctionDate,
                checkIn: cIn,
                checkOut: cOut,
                totalHours,
                status: "ON_TIME",
                method: "MANUAL_CORRECTION",
                correctionStatus: "APPROVED",
                correctedBy: user.name,
                notes: `Created via approved correction: ${parsed.reason}`,
              },
            })
          }

          // Log Audit
          await prisma.attendanceAudit.create({
            data: {
              businessId,
              employeeId: existingReq.employeeId,
              attendanceId: updatedAttendance.id,
              actorId: user.id,
              actorName: user.name || "Owner",
              actorRole: "OWNER",
              action: "CORRECTION_APPROVED",
              newState: JSON.stringify(updatedAttendance),
              reason: `Correction approved: ${parsed.reason}`,
            },
          })
        } catch (e) {
          console.error("Failed to apply attendance correction record:", e)
        }
      }

      return NextResponse.json({
        success: true,
        message: `Request marked as ${decision}.`,
        request: updatedRequest,
      })
    }

    return NextResponse.json({ error: "Invalid attendance action." }, { status: 400 })
  } catch (error: any) {
    console.error("POST /api/attendance error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
