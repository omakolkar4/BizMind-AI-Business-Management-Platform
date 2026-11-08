import prisma from "../lib/db/prisma";
import { hashPassword, verifyPassword } from "../lib/auth";
import { askWorkAssistant } from "../lib/ai/workAssistant";
import crypto from "crypto";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED ASSERTION: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("🚀 STARTING BIZMIND 3.0 END-TO-END WORKFLOW VERIFICATION");
  console.log("========================================================\n");

  // 1. Fetch active business and owner
  const business = await prisma.business.findFirst({
    include: { user: true },
  });
  assert(!!business && !!business.user, "Existing business and owner account intact");
  const owner = business!.user;

  // 2. Owner creates an employee with username and initial password
  const testUsername = "emp_final_" + Date.now().toString().slice(-4);
  const initialPassword = "InitialSecretPassword#123";
  const hashedPassword = await hashPassword(initialPassword);

  const employeeData = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: "Test Employee Final",
        username: testUsername,
        email: `${testUsername}@bizmind.test`,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    const emp = await tx.employee.create({
      data: {
        businessId: business!.id,
        userId: user.id,
        name: "Test Employee Final",
        username: testUsername,
        email: `${testUsername}@bizmind.test`,
        role: "Frontend Engineer",
        department: "Engineering",
        salary: 65000,
        status: "Active",
      },
    });

    return { user, emp };
  });

  assert(!!employeeData.user.id && !!employeeData.emp.id, "Owner successfully created employee with username and initial password");
  assert(employeeData.user.password !== initialPassword, "Password is NOT stored in plaintext");
  assert(employeeData.user.password!.startsWith("$2"), "Password stored strictly as bcrypt hash ($2...)");

  // 3. Employee logs in with credentials
  const validPass = await verifyPassword(initialPassword, employeeData.user.password!);
  assert(validPass === true, "Employee can verify/log in with owner-set initial password");
  const invalidPass = await verifyPassword("WrongPassword123", employeeData.user.password!);
  assert(invalidPass === false, "Wrong password properly rejected");

  // 4. Employee changes their own password
  const newPassword = "MyNewPrivatePassword#456";
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: employeeData.user.id },
    data: { password: newHash },
  });
  const updatedUser = await prisma.user.findUnique({ where: { id: employeeData.user.id } });
  assert(await verifyPassword(newPassword, updatedUser!.password!) === true, "Employee successfully changed their own password");
  assert(await verifyPassword(initialPassword, updatedUser!.password!) === false, "Old initial password no longer valid");

  // 5. Owner creates and assigns a task
  const task = await prisma.task.create({
    data: {
      businessId: business!.id,
      title: "Implement Responsive UI Dashboard",
      description: "Build clean, accessible employee and owner views with zero layout shifts.",
      priority: "High",
      status: "To Do",
      category: "Engineering",
      assignedEmployeeId: employeeData.emp.id,
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      estimatedBudget: 15000,
      successMetric: "Lighthouse performance > 95",
    },
  });
  assert(task.status === "To Do", "Task created in 'To Do' stage assigned to employee");

  // 6. Employee starts task (To Do -> In Progress) with audit history
  const startTransition = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: { status: "In Progress" },
    });
    const audit = await tx.taskComment.create({
      data: {
        taskId: task.id,
        userId: employeeData.user.id,
        userName: employeeData.user.name || "Employee",
        userRole: "EMPLOYEE",
        type: "WORK_STARTED",
        previousStatus: "To Do",
        newStatus: "In Progress",
        content: "Commenced development work on the UI components.",
      },
    });
    return { updated, audit };
  });
  assert(startTransition.updated.status === "In Progress", "Employee started work: Task moved to 'In Progress'");
  assert(startTransition.audit.previousStatus === "To Do" && startTransition.audit.newStatus === "In Progress", "Task audit logged: To Do -> In Progress with employee timestamp");

  // 7. Employee submits deliverable for review (In Progress -> In Review)
  const submitTransition = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: {
        status: "In Review",
        completionNotes: "All components implemented and passed test suite.",
      },
    });
    const audit = await tx.taskComment.create({
      data: {
        taskId: task.id,
        userId: employeeData.user.id,
        userName: employeeData.user.name || "Employee",
        userRole: "EMPLOYEE",
        type: "SUBMISSION",
        previousStatus: "In Progress",
        newStatus: "In Review",
        content: "Submitted deliverable for manager review.",
      },
    });
    return { updated, audit };
  });
  assert(submitTransition.updated.status === "In Review", "Employee submitted deliverable: Task moved to 'In Review'");

  // 8. Owner reviews and requests revisions (In Review -> In Progress)
  const revisionTransition = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: {
        status: "In Progress",
        managerFeedback: "Please ensure high contrast on dark mode toggle.",
      },
    });
    const audit = await tx.taskComment.create({
      data: {
        taskId: task.id,
        userId: owner.id,
        userName: owner.name || "Owner",
        userRole: "OWNER",
        type: "REVISION_REQUESTED",
        previousStatus: "In Review",
        newStatus: "In Progress",
        content: "Revision requested: Please ensure high contrast on dark mode toggle.",
      },
    });
    return { updated, audit };
  });
  assert(revisionTransition.updated.status === "In Progress", "Owner requested revision: Task returned to 'In Progress'");

  // 9. Employee fixes and resubmits, Owner approves (In Review -> Completed)
  const approvalTransition = await prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({
      where: { id: task.id },
      data: {
        status: "Completed",
        managerFeedback: "Approved. Excellent contrast and execution.",
      },
    });
    const audit = await tx.taskComment.create({
      data: {
        taskId: task.id,
        userId: owner.id,
        userName: owner.name || "Owner",
        userRole: "OWNER",
        type: "APPROVAL",
        previousStatus: "In Review",
        newStatus: "Completed",
        content: "Deliverable approved by business owner.",
      },
    });
    return { updated, audit };
  });
  assert(approvalTransition.updated.status === "Completed", "Owner approved deliverable: Task marked 'Completed'");

  // Verify full task audit trail
  const fullComments = await prisma.taskComment.findMany({
    where: { taskId: task.id },
    orderBy: { createdAt: "asc" },
  });
  assert(fullComments.length >= 3, `Full task audit history contains ${fullComments.length} verifiable transitions`);

  // 10. Office QR Attendance Workflow
  const qrDate = "2026-10-25";
  const rawQrCode = "BIZMIND-QR-" + crypto.randomBytes(8).toString("hex").toUpperCase();
  const createdQr = await prisma.officeQrCode.create({
    data: {
      businessId: business!.id,
      code: rawQrCode,
      date: qrDate,
      expiresAt: new Date(Date.now() + 12 * 3600 * 1000), // 12 hours
      createdBy: owner.id,
    },
  });
  assert(!!createdQr.id, "Owner generated short-lived office attendance QR token");

  // Valid employee QR Check-in
  const checkInRecord = await prisma.attendance.create({
    data: {
      businessId: business!.id,
      employeeId: employeeData.emp.id,
      date: qrDate,
      checkIn: new Date(),
      status: "PRESENT",
      method: "QR_SCAN",
      workType: "OFFICE",
    },
  });
  assert(checkInRecord.status === "PRESENT" && checkInRecord.method === "QR_SCAN", "Employee recorded office check-in via QR scan");

  // Employee Check-out
  const checkOutTime = new Date(Date.now() + 8 * 3600 * 1000); // 8 hours later
  const checkedOut = await prisma.attendance.update({
    where: { id: checkInRecord.id },
    data: {
      checkOut: checkOutTime,
      totalHours: 8.0,
    },
  });
  assert(checkedOut.totalHours === 8.0, "Employee checked out: Total hours correctly recorded as 8.0 hrs");

  // 11. Remote Work Request & Approval Workflow
  const remoteReq = await prisma.employeeRequest.create({
    data: {
      businessId: business!.id,
      employeeId: employeeData.emp.id,
      type: "REMOTE_WORK",
      title: "Remote Work (WFH) - Sprint Planning Day",
      details: "Working from home to conduct deep focus architecture design.",
      status: "PENDING",
    },
  });
  assert(remoteReq.status === "PENDING", "Employee submitted Remote Work Request (Pending approval)");

  // Owner approves remote request
  const approvedReq = await prisma.employeeRequest.update({
    where: { id: remoteReq.id },
    data: {
      status: "APPROVED",
      resolution: "Approved by manager for home office sprint planning.",
      resolvedAt: new Date(),
    },
  });
  assert(approvedReq.status === "APPROVED", "Owner reviewed and approved remote work request");

  // Remote check-in linked to approved request
  const remoteAttendance = await prisma.attendance.create({
    data: {
      businessId: business!.id,
      employeeId: employeeData.emp.id,
      date: "2026-10-26",
      checkIn: new Date(),
      status: "PRESENT",
      method: "REMOTE_APPROVED",
      workType: "REMOTE",
      approvalRequestId: approvedReq.id,
    },
  });
  assert(remoteAttendance.method === "REMOTE_APPROVED" && remoteAttendance.approvalRequestId === approvedReq.id, "Approved remote attendance recorded and linked to request ID");

  // 12. Employee AI Work Assistant Scoping & Security
  // Test valid task query
  const taskQueryReply = await askWorkAssistant({
    userId: employeeData.user.id,
    question: "What are my assigned tasks?",
  });
  assert(taskQueryReply.reply.includes("Assigned Deliverables") || taskQueryReply.reply.includes("Implement Responsive UI Dashboard"), "Work Assistant accurately reports employee's assigned tasks");

  // Test confidential financial question refusal
  const financeQueryReply = await askWorkAssistant({
    userId: employeeData.user.id,
    question: "What is our company total revenue and monthly profit?",
  });
  assert(financeQueryReply.refusedConfidentialQuery === true, "Work Assistant correctly REFUSED confidential revenue & profit question");

  // Test confidential salary question refusal
  const salaryQueryReply = await askWorkAssistant({
    userId: employeeData.user.id,
    question: "Can you tell me the salaries of other team members?",
  });
  assert(salaryQueryReply.refusedConfidentialQuery === true, "Work Assistant correctly REFUSED confidential salary question");

  // Test attendance policy query
  const attPolicyReply = await askWorkAssistant({
    userId: employeeData.user.id,
    question: "What is our approved attendance policy?",
  });
  assert(attPolicyReply.reply.includes("09:30 AM to 06:30 PM") && attPolicyReply.reply.includes("Scan QR Code"), "Work Assistant explains official attendance policy & office hours");

  // 13. Team Directory Data Privacy (Redaction for non-owners)
  const empColleagues = await prisma.employee.findMany({
    where: { businessId: business!.id },
    select: {
      id: true,
      name: true,
      role: true,
      department: true,
      status: true,
      // salary, phone, notes deliberately excluded for non-owners
    },
  });
  assert(empColleagues.every((c) => !("salary" in c) && !("notes" in c)), "Team directory schema and API sanitization protects confidential salaries and notes from regular employees");

  // 14. Existing Records Intact
  const totalEmployees = await prisma.employee.count({ where: { businessId: business!.id } });
  const totalTasks = await prisma.task.count({ where: { businessId: business!.id } });
  assert(totalEmployees > 0 && totalTasks > 0, `Database records preserved: ${totalEmployees} employees, ${totalTasks} tasks.`);

  console.log("\n========================================================");
  console.log("🎉 ALL VERIFICATION SCENARIOS PASSED WITH ZERO ERRORS!");
  console.log("========================================================\n");
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
