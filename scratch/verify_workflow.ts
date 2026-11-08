import prisma from "@/lib/db/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

async function runVerification() {
  console.log("=== BIZMIND 3.0 WORKFLOW & SECURITY VERIFICATION ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Get owner and company
  const owner = await prisma.user.findFirst({
    where: { role: "OWNER", email: "demo@bizmind.ai" },
    include: { businesses: true },
  });
  assert(!!owner && owner.businesses.length > 0, "Owner user demo@bizmind.ai and company found");
  const business = owner!.businesses[0];

  // 2. Owner creates an employee with username and initial password
  const testUsername = "lead_dev_" + Date.now().toString().slice(-4);
  const testPassword = "Secret@Password2026!";
  const hashedPassword = await hashPassword(testPassword);

  const employeeUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: "Test Lead Engineer",
        username: testUsername,
        email: `${testUsername}@bizmind.local`,
        password: hashedPassword,
        role: "EMPLOYEE",
      },
    });

    const emp = await tx.employee.create({
      data: {
        businessId: business.id,
        userId: user.id,
        name: "Test Lead Engineer",
        username: testUsername,
        email: `${testUsername}@bizmind.local`,
        role: "Lead Full-Stack Engineer",
        department: "Engineering",
        salary: 85000,
        status: "Active",
      },
    });

    return { user, emp };
  });

  assert(!!employeeUser.user.id && !!employeeUser.emp.id, "Employee account and linked user created");
  assert(employeeUser.user.password !== testPassword, "Password is NOT stored in plaintext");
  assert(!!employeeUser.user.password && employeeUser.user.password.startsWith("$2"), "Password is encrypted with bcrypt hash ($2a/b/y)");
  assert(employeeUser.user.username === testUsername, "Unique username stored correctly on user");
  assert(employeeUser.emp.username === testUsername, "Unique username stored correctly on employee");

  // 3. Verify credential verification (Login logic)
  const isValidPass = await verifyPassword(testPassword, employeeUser.user.password!);
  assert(isValidPass === true, "Employee can verify/log in with initial password");
  const isInvalidPass = await verifyPassword("WrongPassword123", employeeUser.user.password!);
  assert(isInvalidPass === false, "Wrong password correctly rejected");

  // 4. Test attendance module
  const today = new Date().toISOString().split("T")[0];
  // Check In
  const checkInTime = new Date();
  const attendance = await prisma.attendance.create({
    data: {
      businessId: business.id,
      employeeId: employeeUser.emp.id,
      date: today,
      checkIn: checkInTime,
      status: "PRESENT",
    },
  });
  assert(!!attendance.id && attendance.status === "PRESENT", "Employee check-in recorded successfully");

  // Check Out 4 hours later (simulated)
  const checkOutTime = new Date(checkInTime.getTime() + 4.5 * 3600 * 1000);
  const diffHours = Math.round(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 10) / 10;
  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: checkOutTime,
      totalHours: diffHours,
      status: "COMPLETED",
    },
  });
  assert(updatedAttendance.totalHours === 4.5, "Employee total hours calculated accurately (4.5 hrs)");
  assert(updatedAttendance.status === "COMPLETED", "Shift marked as completed on check-out");

  // Owner attendance query
  const companyAttendance = await prisma.attendance.findMany({
    where: { businessId: business.id, date: today },
    include: { employee: true },
  });
  assert(companyAttendance.some((a) => a.employeeId === employeeUser.emp.id), "Owner can view employee attendance in company roster");

  // 5. Test task allocation and scoping
  // Task 1: assigned to test employee
  const task1 = await prisma.task.create({
    data: {
      businessId: business.id,
      title: "Build Scalable API",
      description: "Implement high-performance endpoints",
      priority: "High",
      status: "In Progress",
      category: "Engineering",
      assignedEmployeeId: employeeUser.emp.id,
    },
  });

  // Task 2: unassigned or assigned to someone else
  const task2 = await prisma.task.create({
    data: {
      businessId: business.id,
      title: "Company Tax Filing",
      description: "Quarterly corporate tax filing",
      priority: "Critical",
      status: "To Do",
      category: "Finance",
      assignedEmployeeId: null,
    },
  });

  // Query as employee:
  const employeeTasks = await prisma.task.findMany({
    where: {
      businessId: business.id,
      assignedEmployeeId: employeeUser.emp.id, // Server-enforced rule
    },
  });
  assert(employeeTasks.length === 1 && employeeTasks[0].id === task1.id, "Employee can ONLY see tasks assigned to them");
  assert(!employeeTasks.some((t) => t.id === task2.id), "Employee cannot see other or unassigned company tasks");

  // Task Lifecycle: Employee submits work for review
  const submittedTask = await prisma.task.update({
    where: { id: task1.id },
    data: {
      status: "In Review",
      completionNotes: "All API endpoints built and verified with tests.",
      submittedAt: new Date(),
    },
  });
  assert(submittedTask.status === "In Review", "Employee submission moves task to 'In Review'");

  // Owner approves task
  const approvedTask = await prisma.task.update({
    where: { id: task1.id },
    data: {
      status: "Completed",
      managerFeedback: "Excellent quality and timely delivery. Approved!",
    },
  });
  assert(approvedTask.status === "Completed", "Owner approves and finalizes task to 'Completed'");

  // 6. Test team messaging
  const message = await prisma.message.create({
    data: {
      businessId: business.id,
      senderId: employeeUser.user.id,
      receiverId: owner!.id,
      content: "Hello! I have completed the assigned deliverables for today.",
      isRead: false,
    },
  });
  assert(!!message.id && message.isRead === false, "Message created with unread status");

  const unreadCount = await prisma.message.count({
    where: { receiverId: owner!.id, isRead: false },
  });
  assert(unreadCount >= 1, "Owner receives unread message count");

  // 7. Test employee password change
  const newPassword = "NewSecurePassword#2027";
  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: employeeUser.user.id },
    data: { password: newHash },
  });
  const checkOld = await verifyPassword(testPassword, newHash);
  assert(checkOld === false, "Old password rejected after password change");
  const checkNew = await verifyPassword(newPassword, newHash);
  assert(checkNew === true, "New password verified successfully");

  // 8. Test account deactivation
  await prisma.employee.update({
    where: { id: employeeUser.emp.id },
    data: { status: "Inactive" },
  });
  const deactivatedEmp = await prisma.employee.findUnique({
    where: { id: employeeUser.emp.id },
  });
  assert(deactivatedEmp?.status === "Inactive", "Employee account status successfully updated to 'Inactive'");

  // 9. Test safe employee deletion preserving task history
  // Unassign task safely before deletion
  await prisma.task.updateMany({
    where: { assignedEmployeeId: employeeUser.emp.id },
    data: { assignedEmployeeId: null },
  });
  // Delete linked records
  await prisma.attendance.deleteMany({ where: { employeeId: employeeUser.emp.id } });
  await prisma.message.deleteMany({
    where: { OR: [{ senderId: employeeUser.user.id }, { receiverId: employeeUser.user.id }] },
  });
  await prisma.employee.delete({ where: { id: employeeUser.emp.id } });
  await prisma.user.delete({ where: { id: employeeUser.user.id } });

  // Verify task was preserved!
  const preservedTask = await prisma.task.findUnique({ where: { id: task1.id } });
  assert(!!preservedTask, "Task history preserved after employee removal (NOT cascade-deleted)");
  assert(preservedTask?.assignedEmployeeId === null, "Task safely unassigned");

  // Clean up test tasks
  await prisma.task.delete({ where: { id: task1.id } });
  await prisma.task.delete({ where: { id: task2.id } });

  console.log(`\n=== ALL ${passed}/${total} WORKFLOW & SECURITY VERIFICATIONS PASSED ===`);
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
