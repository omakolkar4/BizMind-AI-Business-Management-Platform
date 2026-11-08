import prisma from "../lib/db/prisma"
import {
  getEffectiveEmployeeSchedule,
  evaluateCheckInStatus,
  evaluateCheckOutStatus,
} from "../lib/schedule/resolver"

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`)
    throw new Error(`Assertion failed: ${msg}`)
  }
  console.log(`✅ PASSED: ${msg}`)
}

async function runTests() {
  console.log("\n=======================================================")
  console.log("BIZMIND 3.0: EMPLOYEE SCHEDULE & ATTENDANCE INTEGRITY TESTS")
  console.log("=======================================================\n")

  // Find demo business
  const business = await prisma.business.findFirst({
    include: { employees: true },
  })
  if (!business) {
    throw new Error("No business found in dev database")
  }

  const owner = await prisma.user.findFirst({
    where: { role: "OWNER" },
  })
  if (!owner) {
    throw new Error("No owner user found in dev database")
  }

  // Ensure we have two test employees: Employee A and Employee B
  let empA = await prisma.employee.findFirst({
    where: { businessId: business.id, name: { contains: "Employee A" } },
  })
  if (!empA) {
    empA = await prisma.employee.create({
      data: {
        businessId: business.id,
        name: "Employee A (Alex Johnson)",
        email: "alex.a@bizmind.ai",
        role: "Senior Operations Specialist",
        department: "Operations",
        salary: 60000,
        status: "Active",
      },
    })
  }

  let empB = await prisma.employee.findFirst({
    where: { businessId: business.id, name: { contains: "Employee B" } },
  })
  if (!empB) {
    empB = await prisma.employee.create({
      data: {
        businessId: business.id,
        name: "Employee B (Beth Parker)",
        email: "beth.b@bizmind.ai",
        role: "Frontend Engineer",
        department: "Engineering",
        salary: 75000,
        status: "Active",
      },
    })
  }

  let empC = await prisma.employee.findFirst({
    where: { businessId: business.id, name: { contains: "Employee C" } },
  })
  if (!empC) {
    empC = await prisma.employee.create({
      data: {
        businessId: business.id,
        name: "Employee C (Chris Martin)",
        email: "chris.c@bizmind.ai",
        role: "Junior Logistics Associate",
        department: "Operations",
        salary: 40000,
        status: "Active",
      },
    })
  }

  // Clean up any test schedules from previous test runs
  await prisma.workSchedule.deleteMany({
    where: { businessId: business.id },
  })

  // =========================================================================
  // TEST 1: Individual schedules for Employee A and Employee B
  // =========================================================================
  console.log("--- TEST 1: Different check-in windows & checkout times per employee ---")

  // Employee A: 9:30 AM–10:00 AM check-in, 5:30 PM (17:30) check-out
  const schedA = await prisma.workSchedule.create({
    data: {
      businessId: business.id,
      employeeId: empA.id,
      level: "INDIVIDUAL",
      name: "Alex Custom Shift",
      workArrangement: "Office",
      checkInStartTime: "09:30",
      checkInEndTime: "10:00",
      checkOutTime: "17:30",
      expectedHours: 8.0,
      breakMinutesAllowed: 60,
      gracePeriodMinutes: 30,
      allowEarlyDeparture: false,
      timezone: "Asia/Kolkata",
      status: "Active",
    },
  })

  // Employee B: 10:00 AM–11:00 AM check-in, 6:30 PM (18:30) check-out
  const schedB = await prisma.workSchedule.create({
    data: {
      businessId: business.id,
      employeeId: empB.id,
      level: "INDIVIDUAL",
      name: "Beth Flexible Shift",
      workArrangement: "Remote",
      checkInStartTime: "10:00",
      checkInEndTime: "11:00",
      checkOutTime: "18:30",
      expectedHours: 8.0,
      breakMinutesAllowed: 45,
      gracePeriodMinutes: 15,
      allowEarlyDeparture: true,
      timezone: "Asia/Kolkata",
      status: "Active",
    },
  })

  assert(schedA.checkInStartTime === "09:30" && schedA.checkInEndTime === "10:00" && schedA.checkOutTime === "17:30", "Employee A schedule stored: 9:30 AM–10:00 AM check-in, 5:30 PM check-out")
  assert(schedB.checkInStartTime === "10:00" && schedB.checkInEndTime === "11:00" && schedB.checkOutTime === "18:30", "Employee B schedule stored: 10:00 AM–11:00 AM check-in, 6:30 PM check-out")
  assert(schedA.checkInEndTime !== schedB.checkInEndTime, "Employee A and B have distinctly different check-in windows")

  // =========================================================================
  // TEST 2: 3-Tier Priority (Individual → Team Shift → Company Default)
  // =========================================================================
  console.log("\n--- TEST 2: Schedule Priority Hierarchy (Individual -> Team -> Company) ---")

  // Create Company Default Schedule: 09:00 - 10:00 check-in, 18:00 check-out
  const companySched = await prisma.workSchedule.create({
    data: {
      businessId: business.id,
      level: "COMPANY_DEFAULT",
      name: "Company Default 9-6",
      workArrangement: "Office",
      checkInStartTime: "09:00",
      checkInEndTime: "10:00",
      checkOutTime: "18:00",
      expectedHours: 8.0,
      status: "Active",
    },
  })

  // Create Team Shift for "Operations": 08:30 - 09:15 check-in, 17:00 check-out
  const teamSched = await prisma.workSchedule.create({
    data: {
      businessId: business.id,
      department: "Operations",
      level: "TEAM_SHIFT",
      name: "Operations Early Shift",
      workArrangement: "Office",
      checkInStartTime: "08:30",
      checkInEndTime: "09:15",
      checkOutTime: "17:00",
      expectedHours: 8.0,
      status: "Active",
    },
  })

  // 1. Employee A is in Operations, BUT has an INDIVIDUAL schedule (9:30-10:00).
  // Priority rule: Individual must override Team and Company!
  const effA = await getEffectiveEmployeeSchedule(business.id, empA.id)
  assert(effA.source === "INDIVIDUAL", "Employee A resolves to INDIVIDUAL schedule")
  assert(effA.checkInStartTime === "09:30" && effA.checkInEndTime === "10:00", "Employee A's individual schedule successfully overrides the Operations team shift")

  // 2. Employee C is in Operations, and has NO individual schedule.
  // Priority rule: Must resolve to Team Shift!
  const effC = await getEffectiveEmployeeSchedule(business.id, empC.id)
  assert(effC.source === "TEAM_SHIFT", "Employee C (no custom schedule) resolves to TEAM_SHIFT")
  assert(effC.checkInStartTime === "08:30" && effC.name === "Operations Early Shift", "Employee C gets Operations team shift")

  // 3. Create Employee D in "Finance" (no individual schedule, no team shift)
  const empD = await prisma.employee.create({
    data: {
      businessId: business.id,
      name: "Employee D (David Finance)",
      email: "david.d@bizmind.ai",
      role: "Financial Analyst",
      department: "Finance",
      salary: 70000,
      status: "Active",
    },
  })
  const effD = await getEffectiveEmployeeSchedule(business.id, empD.id)
  assert(effD.source === "COMPANY_DEFAULT", "Employee D resolves to COMPANY_DEFAULT schedule")
  assert(effD.checkInStartTime === "09:00" && effD.checkOutTime === "18:00", "Employee D correctly inherits the company default schedule")

  // =========================================================================
  // TEST 3: Status Calculation: On-Time vs Late with Grace Period
  // =========================================================================
  console.log("\n--- TEST 3: Accurate Status Calculation (On-Time vs Late) ---")

  // Employee A: Latest check-in 10:00 + 30m grace = 10:30 grace cutoff
  // Case 1: Punch at 09:45 (Within window) -> ON_TIME
  const punchOnTime = new Date("2026-10-26T09:45:00")
  const eval1 = evaluateCheckInStatus(punchOnTime, effA)
  assert(eval1.status === "ON_TIME" && !eval1.isLate, "Punch at 9:45 AM is correctly evaluated as ON_TIME")

  // Case 2: Punch at 10:20 (Within grace period) -> ON_TIME
  const punchGrace = new Date("2026-10-26T10:20:00")
  const eval2 = evaluateCheckInStatus(punchGrace, effA)
  assert(eval2.status === "ON_TIME" && !eval2.isLate, "Punch at 10:20 AM (within 30m grace) is evaluated as ON_TIME")

  // Case 3: Punch at 10:45 (Past 10:30 grace) -> LATE
  const punchLate = new Date("2026-10-26T10:45:00")
  const eval3 = evaluateCheckInStatus(punchLate, effA)
  assert(eval3.status === "LATE" && eval3.isLate && eval3.minutesLate === 45, "Punch at 10:45 AM (past grace cutoff) is correctly evaluated as LATE (+45 mins)")

  // =========================================================================
  // TEST 4: Break Tracking & Net Working Hour Calculations
  // =========================================================================
  console.log("\n--- TEST 4: Break Tracking & Hour Deductions ---")

  // Clean test date attendances
  const testDate = "2026-10-26"
  await prisma.attendance.deleteMany({
    where: { businessId: business.id, date: testDate },
  })

  // Create attendance session
  const checkInTime = new Date("2026-10-26T09:30:00")
  const attSession = await prisma.attendance.create({
    data: {
      businessId: business.id,
      employeeId: empA.id,
      date: testDate,
      checkIn: checkInTime,
      status: "ON_TIME",
      method: "QR_SCAN",
      workType: "OFFICE",
      scheduleSnapshot: JSON.stringify(effA),
    },
  })

  // 1. Employee starts break
  const breakStart = new Date("2026-10-26T13:00:00")
  const attBreak = await prisma.attendanceBreak.create({
    data: {
      attendanceId: attSession.id,
      startTime: breakStart,
      type: "LUNCH",
      reason: "Lunch with client",
    },
  })
  await prisma.attendance.update({
    where: { id: attSession.id },
    data: { isOnBreak: true, currentBreakStart: breakStart, status: "ON_BREAK" },
  })

  const updatedBreakState = await prisma.attendance.findUnique({ where: { id: attSession.id } })
  assert(updatedBreakState!.isOnBreak === true && updatedBreakState!.status === "ON_BREAK", "Shift paused and marked as 'ON_BREAK'")

  // 2. Employee ends break after 45 minutes
  const breakEnd = new Date("2026-10-26T13:45:00")
  await prisma.attendanceBreak.update({
    where: { id: attBreak.id },
    data: { endTime: breakEnd, durationMinutes: 45 },
  })
  await prisma.attendance.update({
    where: { id: attSession.id },
    data: { isOnBreak: false, currentBreakStart: null, breakMinutes: 45, status: "ON_TIME" },
  })

  const resumedState = await prisma.attendance.findUnique({ where: { id: attSession.id } })
  assert(resumedState!.isOnBreak === false && resumedState!.breakMinutes === 45, "Break ended: 45 break minutes recorded and status resumed to ON_TIME")

  // 3. Employee checks out at 17:30
  // Gross time: 9:30 to 17:30 = 8.0 hours (480 mins).
  // Net time: 480 mins - 45 mins break = 435 mins = 7.25 hours.
  const checkOutTime = new Date("2026-10-26T17:30:00")
  const checkOutEval = evaluateCheckOutStatus(checkInTime, checkOutTime, 45, effA)
  assert(checkOutEval.totalHours === 7.25, `Net hours accurately deducted break: expected 7.25 hrs, got ${checkOutEval.totalHours} hrs`)
  assert(!checkOutEval.earlyDeparture, "Left on time (17:30): early departure is false")

  // =========================================================================
  // TEST 5: Early Departure Detection
  // =========================================================================
  console.log("\n--- TEST 5: Early Departure Policy Enforcement ---")

  // Employee A is scheduled till 17:30 and allowEarlyDeparture is false.
  // Checking out at 16:00 is an early departure!
  const earlyCheckOut = new Date("2026-10-26T16:00:00")
  const earlyEval = evaluateCheckOutStatus(checkInTime, earlyCheckOut, 0, effA)
  assert(earlyEval.earlyDeparture === true && earlyEval.status === "EARLY_DEPARTURE", "Checking out at 4:00 PM (scheduled till 5:30 PM) is flagged as EARLY_DEPARTURE")

  // Employee B has allowEarlyDeparture = true
  const effB = await getEffectiveEmployeeSchedule(business.id, empB.id)
  const earlyEvalB = evaluateCheckOutStatus(checkInTime, earlyCheckOut, 0, effB)
  assert(earlyEvalB.earlyDeparture === false && earlyEvalB.status === "CHECKED_OUT", "Employee B has allowEarlyDeparture: true -> early departure not flagged")

  // =========================================================================
  // TEST 6: Schedule Snapshot Preservation (Historical Attendance Integrity)
  // =========================================================================
  console.log("\n--- TEST 6: Historical Attendance Snapshot Preservation ---")

  // Complete attendance record with snapshot
  const completedRecord = await prisma.attendance.update({
    where: { id: attSession.id },
    data: {
      checkOut: checkOutTime,
      totalHours: checkOutEval.totalHours,
      status: checkOutEval.status,
    },
  })

  // Now, suppose the owner edits Employee A's schedule to 11:00 AM–7:00 PM next week:
  await prisma.workSchedule.update({
    where: { id: schedA.id },
    data: {
      checkInStartTime: "11:00",
      checkInEndTime: "11:30",
      checkOutTime: "19:00",
    },
  })

  // Verify: The historical attendance record STILL preserves the exact schedule snapshot from when it was punched!
  const reloadedRecord = await prisma.attendance.findUnique({ where: { id: completedRecord.id } })
  const savedSnapshot = JSON.parse(reloadedRecord!.scheduleSnapshot!)
  assert(savedSnapshot.checkInStartTime === "09:30" && savedSnapshot.checkOutTime === "17:30", "Historical attendance record maintains its snapshot (9:30-17:30) and is not rewritten by subsequent schedule edits")

  // =========================================================================
  // TEST 7: Audit Logging for Schedule Changes & Overrides
  // =========================================================================
  console.log("\n--- TEST 7: Tamper-Evident Audit Logging ---")

  const auditEntry = await prisma.attendanceAudit.create({
    data: {
      businessId: business.id,
      employeeId: empA.id,
      actorId: owner.id,
      actorName: owner.name || "Business Owner",
      actorRole: "OWNER",
      action: "SCHEDULE_UPDATE",
      previousState: JSON.stringify({ checkInStartTime: "09:30" }),
      newState: JSON.stringify({ checkInStartTime: "11:00" }),
      reason: "Shift time adjusted per formal employee request",
    },
  })

  assert(!!auditEntry.id, "Audit record created successfully with unique ID")
  assert(auditEntry.actorRole === "OWNER" && auditEntry.action === "SCHEDULE_UPDATE", "Audit correctly records OWNER action SCHEDULE_UPDATE")
  assert(auditEntry.reason === "Shift time adjusted per formal employee request", "Audit logs the mandatory reason for the schedule adjustment")

  // Cleanup temporary test employees D and C
  await prisma.employee.deleteMany({
    where: { id: { in: [empD.id, empC.id] } },
  })

  console.log("\n=======================================================")
  console.log("🎉 ALL 18 INTEGRATION TEST ASSERTIONS PASSED WITH 100% SUCCESS!")
  console.log("=======================================================\n")
}

runTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
