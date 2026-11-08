import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "../db/prisma";

const SESSION_COOKIE_NAME = "bizmind_session";

export interface SessionUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  image?: string | null;
  role: "OWNER" | "EMPLOYEE";
  employeeId?: string | null;
  businessId?: string;
  businessName?: string;
  status?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (sessionCookie && sessionCookie.value) {
      try {
        const decoded = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
        if (decoded?.id) {
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: {
              businesses: { take: 1, orderBy: { createdAt: "desc" } },
              employee: {
                include: { business: true },
              },
            },
          });

          if (user) {
            const role = (user.role as "OWNER" | "EMPLOYEE") || "OWNER";

            // If employee is marked Inactive/Deactivated, deny session
            if (role === "EMPLOYEE" && user.employee?.status === "Inactive") {
              return null;
            }

            let businessId = user.businesses[0]?.id;
            let businessName = user.businesses[0]?.name;

            if (role === "EMPLOYEE" && user.employee) {
              businessId = user.employee.businessId;
              businessName = user.employee.business?.name;
            }

            return {
              id: user.id,
              name: user.name || (role === "EMPLOYEE" ? "Team Member" : "Founder"),
              username: user.username || user.employee?.username || null,
              email: user.email,
              image: user.image,
              role,
              employeeId: user.employee?.id || null,
              businessId,
              businessName,
              status: user.employee?.status || "Active",
            };
          }
        }
      } catch (e) {
        console.warn("Invalid session cookie parse, falling back");
      }
    }

    return null;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function getActiveBusinessId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.businessId) return user.businessId;

  if (user.role === "EMPLOYEE" && user.employeeId) {
    const emp = await prisma.employee.findUnique({ where: { id: user.employeeId } });
    return emp ? emp.businessId : null;
  }

  // Query latest business belonging strictly to the authenticated owner
  const business = await prisma.business.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return business ? business.id : null;
}

