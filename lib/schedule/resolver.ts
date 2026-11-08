import prisma from "@/lib/db/prisma"

export interface EffectiveSchedule {
  id?: string
  source: "INDIVIDUAL" | "TEAM_SHIFT" | "COMPANY_DEFAULT" | "SYSTEM_FALLBACK"
  name: string
  workArrangement: "Office" | "Remote" | "Hybrid"
  checkInStartTime: string // "09:00"
  checkInEndTime: string   // "10:00"
  checkOutTime: string     // "18:30"
  workingDays: string[]    // ["Monday", "Tuesday", ...]
  expectedHours: number    // 8.0
  breakPolicy: string
  breakMinutesAllowed: number
  trackBreaks: boolean
  gracePeriodMinutes: number
  allowEarlyDeparture: boolean
  timezone: string
  effectiveDate: string
  status: "Active" | "Inactive"
  isOvernight: boolean
  employeeId?: string
  department?: string
}

export const SYSTEM_DEFAULT_SCHEDULE: EffectiveSchedule = {
  source: "SYSTEM_FALLBACK",
  name: "Standard Core Schedule",
  workArrangement: "Office",
  checkInStartTime: "09:00",
  checkInEndTime: "10:00",
  checkOutTime: "18:30",
  workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  expectedHours: 8.0,
  breakPolicy: "60 min flexible breaks",
  breakMinutesAllowed: 60,
  trackBreaks: true,
  gracePeriodMinutes: 30,
  allowEarlyDeparture: false,
  timezone: "Asia/Kolkata",
  effectiveDate: "2026-01-01",
  status: "Active",
  isOvernight: false,
}

function parseWorkingDays(jsonOrStr?: string | null): string[] {
  if (!jsonOrStr) return SYSTEM_DEFAULT_SCHEDULE.workingDays
  try {
    const parsed = JSON.parse(jsonOrStr)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // maybe comma-separated
    return jsonOrStr.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return SYSTEM_DEFAULT_SCHEDULE.workingDays
}

/**
 * Resolves the effective schedule for an employee based on the 3-tier priority:
 * 1. Individual Employee Schedule
 * 2. Team / Department Shift Schedule
 * 3. Company Default Schedule
 * 4. System Default Fallback
 */
export async function getEffectiveEmployeeSchedule(
  businessId: string,
  employeeId: string
): Promise<EffectiveSchedule> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, businessId: true, department: true },
  })

  if (!employee) {
    return SYSTEM_DEFAULT_SCHEDULE
  }

  // 1. Check for Active Individual Schedule
  const individualSchedule = await prisma.workSchedule.findFirst({
    where: {
      businessId,
      employeeId,
      level: "INDIVIDUAL",
      status: "Active",
    },
  })

  if (individualSchedule) {
    return {
      id: individualSchedule.id,
      source: "INDIVIDUAL",
      name: individualSchedule.name,
      workArrangement: individualSchedule.workArrangement as any,
      checkInStartTime: individualSchedule.checkInStartTime,
      checkInEndTime: individualSchedule.checkInEndTime,
      checkOutTime: individualSchedule.checkOutTime,
      workingDays: parseWorkingDays(individualSchedule.workingDays),
      expectedHours: individualSchedule.expectedHours,
      breakPolicy: individualSchedule.breakPolicy || "Standard breaks",
      breakMinutesAllowed: individualSchedule.breakMinutesAllowed,
      trackBreaks: individualSchedule.trackBreaks,
      gracePeriodMinutes: individualSchedule.gracePeriodMinutes,
      allowEarlyDeparture: individualSchedule.allowEarlyDeparture,
      timezone: individualSchedule.timezone,
      effectiveDate: individualSchedule.effectiveDate || "2026-01-01",
      status: individualSchedule.status as any,
      isOvernight: individualSchedule.isOvernight,
      employeeId: employee.id,
      department: employee.department,
    }
  }

  // 2. Check for Team / Department Shift Schedule
  if (employee.department) {
    const teamSchedule = await prisma.workSchedule.findFirst({
      where: {
        businessId,
        department: employee.department,
        level: "TEAM_SHIFT",
        status: "Active",
      },
    })

    if (teamSchedule) {
      return {
        id: teamSchedule.id,
        source: "TEAM_SHIFT",
        name: teamSchedule.name,
        workArrangement: teamSchedule.workArrangement as any,
        checkInStartTime: teamSchedule.checkInStartTime,
        checkInEndTime: teamSchedule.checkInEndTime,
        checkOutTime: teamSchedule.checkOutTime,
        workingDays: parseWorkingDays(teamSchedule.workingDays),
        expectedHours: teamSchedule.expectedHours,
        breakPolicy: teamSchedule.breakPolicy || "Standard breaks",
        breakMinutesAllowed: teamSchedule.breakMinutesAllowed,
        trackBreaks: teamSchedule.trackBreaks,
        gracePeriodMinutes: teamSchedule.gracePeriodMinutes,
        allowEarlyDeparture: teamSchedule.allowEarlyDeparture,
        timezone: teamSchedule.timezone,
        effectiveDate: teamSchedule.effectiveDate || "2026-01-01",
        status: teamSchedule.status as any,
        isOvernight: teamSchedule.isOvernight,
        department: employee.department,
      }
    }
  }

  // 3. Check for Company Default Schedule
  const companySchedule = await prisma.workSchedule.findFirst({
    where: {
      businessId,
      level: "COMPANY_DEFAULT",
      status: "Active",
    },
  })

  if (companySchedule) {
    return {
      id: companySchedule.id,
      source: "COMPANY_DEFAULT",
      name: companySchedule.name,
      workArrangement: companySchedule.workArrangement as any,
      checkInStartTime: companySchedule.checkInStartTime,
      checkInEndTime: companySchedule.checkInEndTime,
      checkOutTime: companySchedule.checkOutTime,
      workingDays: parseWorkingDays(companySchedule.workingDays),
      expectedHours: companySchedule.expectedHours,
      breakPolicy: companySchedule.breakPolicy || "Standard breaks",
      breakMinutesAllowed: companySchedule.breakMinutesAllowed,
      trackBreaks: companySchedule.trackBreaks,
      gracePeriodMinutes: companySchedule.gracePeriodMinutes,
      allowEarlyDeparture: companySchedule.allowEarlyDeparture,
      timezone: companySchedule.timezone,
      effectiveDate: companySchedule.effectiveDate || "2026-01-01",
      status: companySchedule.status as any,
      isOvernight: companySchedule.isOvernight,
    }
  }

  // 4. Fallback
  return SYSTEM_DEFAULT_SCHEDULE
}

/**
 * Converts a time string "HH:MM" (24-hour) into minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

/**
 * Calculates local minutes from midnight for a given Date in the target timezone
 */
export function getLocalMinutesFromMidnight(date: Date, timezone: string = "Asia/Kolkata"): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    })
    const parts = formatter.formatToParts(date)
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10)
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10)
    return hour * 60 + minute
  } catch {
    return date.getHours() * 60 + date.getMinutes()
  }
}

/**
 * Evaluates whether a check-in is ON_TIME or LATE relative to the schedule's
 * latest check-in time and configured grace period.
 */
export function evaluateCheckInStatus(
  checkInTime: Date,
  schedule: EffectiveSchedule
): { status: "ON_TIME" | "LATE"; isLate: boolean; minutesLate: number } {
  const actualMinutes = getLocalMinutesFromMidnight(checkInTime, schedule.timezone)
  const scheduledCutoff = timeStringToMinutes(schedule.checkInEndTime)
  const graceCutoff = scheduledCutoff + (schedule.gracePeriodMinutes || 0)

  if (actualMinutes <= graceCutoff) {
    return {
      status: "ON_TIME",
      isLate: false,
      minutesLate: 0,
    }
  } else {
    return {
      status: "LATE",
      isLate: true,
      minutesLate: actualMinutes - scheduledCutoff,
    }
  }
}

/**
 * Evaluates check-out timing, deducting break minutes, checking for early departure.
 */
export function evaluateCheckOutStatus(
  checkInTime: Date,
  checkOutTime: Date,
  totalBreakMinutes: number,
  schedule: EffectiveSchedule
): {
  totalHours: number
  earlyDeparture: boolean
  status: "CHECKED_OUT" | "EARLY_DEPARTURE"
} {
  const diffMs = checkOutTime.getTime() - checkInTime.getTime()
  const grossMinutes = Math.max(0, diffMs / (1000 * 60))
  const netMinutes = Math.max(0, grossMinutes - totalBreakMinutes)
  const totalHours = Math.round((netMinutes / 60) * 100) / 100

  // Check early departure
  const actualMinutes = getLocalMinutesFromMidnight(checkOutTime, schedule.timezone)
  const scheduledOut = timeStringToMinutes(schedule.checkOutTime)

  let earlyDeparture = false
  if (!schedule.allowEarlyDeparture && actualMinutes < scheduledOut - 10) {
    // Left more than 10 mins before scheduled end time
    earlyDeparture = true
  }

  return {
    totalHours,
    earlyDeparture,
    status: earlyDeparture ? "EARLY_DEPARTURE" : "CHECKED_OUT",
  }
}
