import { NextResponse } from "next/server"
import prisma from "@/lib/db/prisma"
import { getActiveBusinessId, getCurrentUser } from "@/lib/auth"
import { SYSTEM_DEFAULT_SCHEDULE } from "@/lib/schedule/resolver"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const schedules = await prisma.workSchedule.findMany({
      where: { businessId },
      include: {
        employee: {
          select: { id: true, name: true, department: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      schedules,
      systemDefault: SYSTEM_DEFAULT_SCHEDULE,
    })
  } catch (error: any) {
    console.error("GET /api/schedules error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can create or edit schedule templates." },
        { status: 403 }
      )
    }

    const businessId = await getActiveBusinessId()
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 })
    }

    const body = await req.json()
    const {
      level = "COMPANY_DEFAULT",
      department,
      name,
      workArrangement = "Office",
      checkInStartTime = "09:00",
      checkInEndTime = "10:00",
      checkOutTime = "18:30",
      workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      expectedHours = 8.0,
      breakPolicy = "60 min flexible break",
      breakMinutesAllowed = 60,
      trackBreaks = true,
      gracePeriodMinutes = 30,
      allowEarlyDeparture = false,
      timezone = "Asia/Kolkata",
      effectiveDate = new Date().toISOString().slice(0, 10),
      status = "Active",
      isOvernight = false,
    } = body

    const workingDaysStr = typeof workingDays === "string" ? workingDays : JSON.stringify(workingDays)

    // If setting COMPANY_DEFAULT, update existing or create new
    if (level === "COMPANY_DEFAULT") {
      const existing = await prisma.workSchedule.findFirst({
        where: { businessId, level: "COMPANY_DEFAULT" },
      })

      if (existing) {
        const updated = await prisma.workSchedule.update({
          where: { id: existing.id },
          data: {
            name: name || "Company Default Schedule",
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
        return NextResponse.json({ schedule: updated })
      }
    }

    const created = await prisma.workSchedule.create({
      data: {
        businessId,
        level,
        department: department || null,
        name: name || `${level === "TEAM_SHIFT" ? department : "Company"} Schedule`,
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

    return NextResponse.json({ schedule: created }, { status: 201 })
  } catch (error: any) {
    console.error("POST /api/schedules error:", error)
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
