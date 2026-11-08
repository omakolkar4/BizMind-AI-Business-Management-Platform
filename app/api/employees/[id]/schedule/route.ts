import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"
import { getActiveBusinessId, getCurrentUser } from "@/lib/auth"
import { getEffectiveEmployeeSchedule } from "@/lib/schedule/resolver"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, businessId },
      include: {
        workSchedule: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // Role check: Employee can only view their own schedule; Owner can view any
    if (user.role === "EMPLOYEE") {
      const currentEmployee = await prisma.employee.findFirst({
        where: { userId: user.id, businessId },
      })
      if (!currentEmployee || currentEmployee.id !== employeeId) {
        return NextResponse.json(
          { error: "Forbidden: You can only view your own schedule." },
          { status: 403 }
        )
      }
    }

    // Resolve the effective schedule using the 3-tier hierarchy
    const effectiveSchedule = await getEffectiveEmployeeSchedule(businessId, employeeId)

    // Also get available team / company shift templates for easy assignment
    const availableTemplates = await prisma.workSchedule.findMany({
      where: {
        businessId,
        level: { in: ["COMPANY_DEFAULT", "TEAM_SHIFT"] },
        status: "Active",
      },
      orderBy: { createdAt: "desc" },
    })

    // Also fetch recent attendance audits for this employee
    const audits = await prisma.attendanceAudit.findMany({
      where: { employeeId, businessId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        role: employee.role,
      },
      individualSchedule: employee.workSchedule,
      effectiveSchedule,
      availableTemplates,
      audits,
    })
  } catch (error: any) {
    console.error("GET /api/employees/[id]/schedule error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can configure work schedules." },
        { status: 403 }
      )
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const { id: employeeId } = await params
    const body = await req.json()

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, businessId },
      include: { workSchedule: true },
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const {
      name = "Custom Individual Schedule",
      workArrangement = "Office",
      checkInStartTime = "09:00",
      checkInEndTime = "10:00",
      checkOutTime = "18:30",
      workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      expectedHours = 8.0,
      breakPolicy = "60 min flexible breaks",
      breakMinutesAllowed = 60,
      trackBreaks = true,
      gracePeriodMinutes = 30,
      allowEarlyDeparture = false,
      timezone = "Asia/Kolkata",
      effectiveDate = new Date().toISOString().slice(0, 10),
      status = "Active",
      isOvernight = false,
      reason = "Schedule configured by owner",
    } = body

    const workingDaysStr =
      typeof workingDays === "string" ? workingDays : JSON.stringify(workingDays)

    const previousState = employee.workSchedule
      ? JSON.stringify(employee.workSchedule)
      : null

    let savedSchedule
    if (employee.workSchedule) {
      savedSchedule = await prisma.workSchedule.update({
        where: { id: employee.workSchedule.id },
        data: {
          name,
          workArrangement,
          checkInStartTime,
          checkInEndTime,
          checkOutTime,
          workingDays: workingDaysStr,
          expectedHours: Number(expectedHours),
          breakPolicy,
          breakMinutesAllowed: Number(breakMinutesAllowed),
          trackBreaks: Boolean(trackBreaks),
          gracePeriodMinutes: Number(gracePeriodMinutes),
          allowEarlyDeparture: Boolean(allowEarlyDeparture),
          timezone,
          effectiveDate,
          status,
          isOvernight: Boolean(isOvernight),
        },
      })
    } else {
      savedSchedule = await prisma.workSchedule.create({
        data: {
          businessId,
          employeeId,
          level: "INDIVIDUAL",
          name,
          workArrangement,
          checkInStartTime,
          checkInEndTime,
          checkOutTime,
          workingDays: workingDaysStr,
          expectedHours: Number(expectedHours),
          breakPolicy,
          breakMinutesAllowed: Number(breakMinutesAllowed),
          trackBreaks: Boolean(trackBreaks),
          gracePeriodMinutes: Number(gracePeriodMinutes),
          allowEarlyDeparture: Boolean(allowEarlyDeparture),
          timezone,
          effectiveDate,
          status,
          isOvernight: Boolean(isOvernight),
        },
      })
    }

    // Create Audit record
    await prisma.attendanceAudit.create({
      data: {
        businessId,
        employeeId,
        actorId: user.id,
        actorName: user.name || "Owner",
        actorRole: "OWNER",
        action: "SCHEDULE_UPDATE",
        previousState,
        newState: JSON.stringify(savedSchedule),
        reason: reason || "Individual schedule updated by owner",
      },
    })

    const effectiveSchedule = await getEffectiveEmployeeSchedule(businessId, employeeId)

    return NextResponse.json({
      message: "Schedule updated successfully",
      schedule: savedSchedule,
      effectiveSchedule,
    })
  } catch (error: any) {
    console.error("PUT /api/employees/[id]/schedule error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
