import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { getCurrentUser, getActiveBusinessId, hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    const isOwner = user.role === "OWNER";

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const where: any = { businessId };
    if (department && department !== "All") where.department = department;
    if (status && status !== "All") where.status = status;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            priority: true,
            status: true,
            dueDate: true,
            blockerReason: true,
            extensionStatus: true,
          },
        },
        requests: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If an employee is viewing the directory, redact confidential salary, phone, and notes of colleagues
    const sanitizedEmployees = employees.map((emp) => {
      const isSelf = emp.id === user.employeeId;
      if (!isOwner && !isSelf) {
        return {
          id: emp.id,
          userId: emp.userId,
          name: emp.name,
          username: emp.username,
          role: emp.role,
          department: emp.department,
          status: emp.status,
          joiningDate: emp.joiningDate,
          avatar: emp.avatar,
          tasks: emp.tasks,
          // salary, notes, phone, and performanceRating redacted for privacy
        };
      }
      return emp;
    });

    return NextResponse.json({ employees: sanitizedEmployees, isOwner });
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "EMPLOYEE") {
      return NextResponse.json(
        { error: "Forbidden: Only business owners can create employee accounts." },
        { status: 403 }
      );
    }

    const businessId = await getActiveBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "No active business" }, { status: 404 });
    }

    // Verify company ownership
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: user.id },
    });
    if (!business) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, password, email, phone, role, department, salary, status, performanceRating, notes } = body;

    if (!name || !role || !department) {
      return NextResponse.json(
        { error: "Full Name, Role/Job Title, and Department are required." },
        { status: 400 }
      );
    }

    // Validate username
    const rawUsername = (username || "").trim();
    if (!rawUsername) {
      return NextResponse.json(
        { error: "Username is required for employee account creation." },
        { status: 400 }
      );
    }

    const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (cleanUsername.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters long and contain only letters, numbers, underscores, or hyphens." },
        { status: 400 }
      );
    }

    // Validate initial password
    const rawPassword = (password || "").trim();
    if (!rawPassword || rawPassword.length < 6) {
      return NextResponse.json(
        { error: "Initial Password is required and must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingUsername = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: rawUsername },
        ],
      },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: `The username "${cleanUsername}" is already taken. Please choose another username.` },
        { status: 400 }
      );
    }

    // Determine final work email (optional by user, fallback to unique system domain)
    let finalEmail = (email || "").trim().toLowerCase();
    if (finalEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: finalEmail },
      });
      if (existingEmail) {
        return NextResponse.json(
          { error: `An account with email "${finalEmail}" already exists.` },
          { status: 400 }
        );
      }
    } else {
      finalEmail = `${cleanUsername}@${business.id.slice(0, 8)}.bizmind.local`;
    }

    // Hash initial password securely with bcrypt
    const hashedPassword = await hashPassword(rawPassword);

    // Create User account and Employee record in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      const userAccount = await tx.user.create({
        data: {
          name,
          username: cleanUsername,
          email: finalEmail,
          password: hashedPassword,
          role: "EMPLOYEE",
        },
      });

      const employeeRecord = await tx.employee.create({
        data: {
          businessId,
          userId: userAccount.id,
          name,
          username: cleanUsername,
          email: finalEmail,
          phone: phone || null,
          role,
          department,
          salary: salary ? parseFloat(salary) : 0,
          status: status === "Inactive" ? "Inactive" : "Active",
          performanceRating: performanceRating ? parseFloat(performanceRating) : 4.5,
          notes: notes || null,
          inviteStatus: "ACTIVE",
        },
      });

      return { userAccount, employeeRecord };
    });

    return NextResponse.json({
      success: true,
      employee: result.employeeRecord,
      credentials: {
        name,
        username: cleanUsername,
        initialPassword: rawPassword, // Returned once for founder confirmation modal
        email: finalEmail,
        role,
        department,
      },
      message: `Employee account created successfully for ${name}. Share the login credentials privately with them.`,
    });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
