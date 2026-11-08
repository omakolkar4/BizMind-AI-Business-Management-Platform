import prisma from "../lib/db/prisma";

async function testHttpEndpoints() {
  console.log("=================================================");
  console.log("HTTP END-TO-END ONBOARDING API & PAGE TESTS");
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

  // 1. Fetch onboarding HTML page to check UI content
  try {
    const pageRes = await fetch("http://localhost:3000/onboarding");
    assert(pageRes.status === 200, `GET /onboarding returns status 200 (got ${pageRes.status})`);
    const html = await pageRes.text();
    assert(html.includes("Let"), "Page contains 'Let' heading text");
    assert(html.includes("business idea") || html.includes("onboarding"), "Page contains onboarding structure");
  } catch (err) {
    console.warn("Local server fetch notice:", err);
  }

  // 2. Create test user and session cookie
  const testEmail = "http_test_founder@bizmind.io";
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const testUser = await prisma.user.create({
    data: {
      name: "HTTP Test Founder",
      email: testEmail,
      role: "OWNER",
    },
  });

  const sessionData = {
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  };
  const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString("base64");
  const cookieHeader = `bizmind_session=${sessionToken}`;

  // 3. Test validation: POST with NO idea
  const noIdeaRes = await fetch("http://localhost:3000/api/business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "Some Name",
      idea: "", // Empty idea
    }),
  });
  assert(noIdeaRes.status === 400, `POST /api/business with empty idea returns 400 (got ${noIdeaRes.status})`);
  const noIdeaJson = await noIdeaRes.json();
  assert(noIdeaJson.error?.includes("idea"), "Returns appropriate error message for missing idea");

  // 4. Test Path B: POST with NO business name (Empty name: "")
  const noNameRes = await fetch("http://localhost:3000/api/business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "", // NO business name chosen
      idea: "Handcrafted bamboo bicycle frames designed for urban commuters",
      type: "Manufacturing",
      location: "Bengaluru, India",
      budget: 350000,
      stage: "Idea",
    }),
  });

  assert(noNameRes.status === 200, `POST /api/business without name succeeds with status 200 (got ${noNameRes.status})`);
  const noNameJson = await noNameRes.json();
  assert(noNameJson.success === true, "Response reports success: true");
  assert(noNameJson.business?.id !== undefined, "Created/updated business profile returned");
  assert(noNameJson.business?.name === "", "Business name stored as empty string (not fabricated)");
  assert(noNameJson.business?.idea.includes("bamboo bicycle"), "Business idea correctly saved");

  // 5. Test Path A: POST with a specified business name
  const withNameRes = await fetch("http://localhost:3000/api/business", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      name: "Bambooda Mobility Co.",
      idea: "Handcrafted bamboo bicycle frames designed for urban commuters",
      type: "Manufacturing",
      location: "Bengaluru, India",
      budget: 350000,
      stage: "Idea",
    }),
  });

  assert(withNameRes.status === 200, `POST /api/business with name succeeds with status 200 (got ${withNameRes.status})`);
  const withNameJson = await withNameRes.json();
  assert(withNameJson.success === true, "Response reports success: true");
  assert(withNameJson.business?.name === "Bambooda Mobility Co.", "Business name stored as chosen brand");

  // Verify that the existing draft business was reused and NOT duplicated
  const userBizCount = await prisma.business.count({ where: { userId: testUser.id } });
  assert(userBizCount === 1, `Total business records for user is 1 (reused draft, no duplicates)`);

  // Cleanup
  await prisma.user.deleteMany({ where: { email: testEmail } });

  console.log("\n=================================================");
  console.log(`HTTP TESTS FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

testHttpEndpoints().catch((err) => {
  console.error("HTTP test error:", err);
  process.exit(1);
});
