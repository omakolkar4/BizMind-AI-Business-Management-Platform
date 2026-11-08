import prisma from "../lib/db/prisma";
import { hashPassword, verifyPassword } from "../lib/auth";

async function runLoginModeTests() {
  console.log("=================================================");
  console.log("BIZMIND 3.0 — OWNER & EMPLOYEE LOGIN MODE TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  const BASE_URL = "http://localhost:3000";

  // Cleanup test accounts
  const ownerEmail = "test_mode_owner@bizmind.io";
  const employeeEmail = "test_mode_emp@bizmind.io";
  const employeeUsername = "test_mode_emp";
  const rawPassword = "SecurePassword123!";
  const hashedPassword = await hashPassword(rawPassword);

  await prisma.user.deleteMany({
    where: {
      email: { in: [ownerEmail, employeeEmail] },
    },
  });

  // 1. Create a Test Owner and Company
  const ownerUser = await prisma.user.create({
    data: {
      name: "Alice Owner",
      email: ownerEmail,
      username: "alice_owner",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  const business = await prisma.business.create({
    data: {
      userId: ownerUser.id,
      name: "Alice Corp",
      idea: "Enterprise SaaS platform",
      type: "Technology",
      location: "Bengaluru, India",
    },
  });

  // 2. Create a Test Employee for Alice Corp
  const employeeUser = await prisma.user.create({
    data: {
      name: "Bob Employee",
      email: employeeEmail,
      username: employeeUsername,
      password: hashedPassword,
      role: "EMPLOYEE",
    },
  });

  const employeeRecord = await prisma.employee.create({
    data: {
      userId: employeeUser.id,
      businessId: business.id,
      name: "Bob Employee",
      email: employeeEmail,
      username: employeeUsername,
      role: "Frontend Engineer",
      department: "Engineering",
      status: "Active",
    },
  });

  console.log("--- 1. Testing UI Markup and Elements (/login) ---");
  try {
    const loginPageRes = await fetch(`${BASE_URL}/login`);
    assert(loginPageRes.status === 200, "GET /login returns HTTP 200");
    const html = await loginPageRes.text();

    assert(html.includes("Owner Login"), "Login page renders 'Owner Login' selector");
    assert(html.includes("Employee Login"), "Login page renders 'Employee Login' selector");
    assert(html.includes("Access and manage your company"), "Owner option describes company management");
    assert(html.includes("Access your assigned tasks and workspace"), "Employee option describes tasks/workspace");
    assert(html.includes("Sign In to Your Workspace"), "Heading matches BizMind workspace branding");
  } catch (e) {
    console.warn("UI fetch notice:", e);
  }

  console.log("\n--- 2. Testing Valid Owner Login (Mode: OWNER) ---");
  const ownerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ownerEmail,
      password: rawPassword,
      mode: "OWNER",
      rememberMe: true,
    }),
  });

  assert(ownerLoginRes.status === 200, "Owner login succeeds with status 200");
  const ownerLoginJson = await ownerLoginRes.json();
  assert(ownerLoginJson.success === true, "Owner response returns success: true");
  assert(ownerLoginJson.user?.role === "OWNER", "User role returned is OWNER");
  assert(ownerLoginJson.user?.email === ownerEmail, "Returned user email matches owner");

  // Check Set-Cookie
  const ownerCookie = ownerLoginRes.headers.get("set-cookie");
  assert(Boolean(ownerCookie && ownerCookie.includes("bizmind_session")), "Owner session cookie set");

  console.log("\n--- 3. Testing Valid Employee Login (Mode: EMPLOYEE) ---");
  const empLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: employeeUsername,
      password: rawPassword,
      mode: "EMPLOYEE",
      rememberMe: false,
    }),
  });

  assert(empLoginRes.status === 200, "Employee login succeeds with status 200");
  const empLoginJson = await empLoginRes.json();
  assert(empLoginJson.success === true, "Employee response returns success: true");
  assert(empLoginJson.user?.role === "EMPLOYEE", "User role returned is EMPLOYEE");
  assert(empLoginJson.user?.employeeId === employeeRecord.id, "Returned employeeId matches record");

  const empCookie = empLoginRes.headers.get("set-cookie");
  assert(Boolean(empCookie && empCookie.includes("bizmind_session")), "Employee session cookie set");

  console.log("\n--- 4. Cross-Role Protection: Employee Attempting Owner Login ---");
  const empInOwnerModeRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: employeeUsername,
      password: rawPassword,
      mode: "OWNER", // WRONG MODE!
    }),
  });

  assert(empInOwnerModeRes.status === 403, `Server blocks Employee from Owner Login with 403 (got ${empInOwnerModeRes.status})`);
  const empInOwnerJson = await empInOwnerModeRes.json();
  assert(empInOwnerJson.error?.includes("registered as an Employee"), "Error message tells user account is an Employee");
  assert(empInOwnerJson.suggestedMode === "EMPLOYEE", "Suggests switching to EMPLOYEE mode");

  console.log("\n--- 5. Cross-Role Protection: Owner Attempting Employee Login ---");
  const ownerInEmpModeRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ownerEmail,
      password: rawPassword,
      mode: "EMPLOYEE", // WRONG MODE!
    }),
  });

  assert(ownerInEmpModeRes.status === 403, `Server blocks Owner from Employee Login with 403 (got ${ownerInEmpModeRes.status})`);
  const ownerInEmpJson = await ownerInEmpModeRes.json();
  assert(ownerInEmpJson.error?.includes("registered as a Business Owner"), "Error message tells user account is an Owner");
  assert(ownerInEmpJson.suggestedMode === "OWNER", "Suggests switching to OWNER mode");

  console.log("\n--- 6. Testing Invalid Credentials (Does not leak account existence) ---");
  const invalidCredsRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "non_existent_user@bizmind.io",
      password: "WrongPassword123!",
      mode: "OWNER",
    }),
  });

  assert(invalidCredsRes.status === 401, "Invalid credentials returns 401 Unauthorized");
  const invalidJson = await invalidCredsRes.json();
  assert(invalidJson.error === "Invalid username, email, or password", "Generic non-leaking error message");

  const wrongPasswordRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: ownerEmail,
      password: "WrongPassword999!",
      mode: "OWNER",
    }),
  });

  assert(wrongPasswordRes.status === 401, "Wrong password for valid user returns 401 Unauthorized");

  console.log("\n--- 7. Deactivated Employee Protection ---");
  // Mark employee inactive
  await prisma.employee.update({
    where: { id: employeeRecord.id },
    data: { status: "Inactive" },
  });

  const inactiveEmpRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: employeeUsername,
      password: rawPassword,
      mode: "EMPLOYEE",
    }),
  });

  assert(inactiveEmpRes.status === 403, "Inactive employee login rejected with 403");
  const inactiveJson = await inactiveEmpRes.json();
  assert(inactiveJson.error?.includes("deactivated"), "Reports account deactivated message");

  // Restore active
  await prisma.employee.update({
    where: { id: employeeRecord.id },
    data: { status: "Active" },
  });

  console.log("\n--- 8. Role Authorization Enforcement on Protected API Routes ---");
  // Extract cookie values for authenticated requests
  const extractCookie = (raw: string | null) => {
    if (!raw) return "";
    return raw.split(";")[0];
  };

  const empCookieVal = extractCookie(empCookie);

  // Employee tries to call owner-only finances API
  const financesRes = await fetch(`${BASE_URL}/api/finances/diagnosis`, {
    headers: { Cookie: empCookieVal },
  });
  assert(financesRes.status === 403, `Employee blocked from /api/finances/diagnosis with 403 (got ${financesRes.status})`);

  // Employee tries to call owner-only analysis API
  const analysisRes = await fetch(`${BASE_URL}/api/analysis`, {
    headers: { Cookie: empCookieVal },
  });
  assert(analysisRes.status === 403, `Employee blocked from /api/analysis with 403 (got ${analysisRes.status})`);

  console.log("\n--- 9. Forgot Password Route Integrity ---");
  const forgotRes = await fetch(`${BASE_URL}/forgot-password`);
  assert(forgotRes.status === 200, "GET /forgot-password accessible with 200 OK");
  const forgotHtml = await forgotRes.text();
  assert(forgotHtml.includes("Reset Your Password"), "Forgot password heading rendered");

  console.log("\n--- 10. Existing Accounts and Company Associations Integrity ---");
  await (await import("../lib/db/seedDemo")).ensureDemoData();
  const demoEmail = (await import("../lib/db/seedDemo")).DEMO_USER_EMAIL;
  const demoUser = await prisma.user.findFirst({
    where: { email: demoEmail },
    include: { businesses: true },
  });
  assert(demoUser !== null, "Demo user exists");
  assert((demoUser?.businesses?.length || 0) > 0, "Demo user retains company association");

  // Cleanup test accounts
  await prisma.user.deleteMany({
    where: { email: { in: [ownerEmail, employeeEmail] } },
  });

  console.log("\n=================================================");
  console.log(`ALL LOGIN MODE TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLoginModeTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
