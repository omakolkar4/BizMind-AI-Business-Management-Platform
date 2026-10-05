import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "../db/prisma";
import { DEMO_USER_EMAIL, ensureDemoData } from "../db/seedDemo";

const SESSION_COOKIE_NAME = "bizmind_session";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  businessId?: string;
  businessName?: string;
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
            include: { businesses: { take: 1, orderBy: { createdAt: "desc" } } },
          });

          if (user) {
            return {
              id: user.id,
              name: user.name || "Founder",
              email: user.email,
              image: user.image,
              businessId: user.businesses[0]?.id,
              businessName: user.businesses[0]?.name,
            };
          }
        }
      } catch (e) {
        console.warn("Invalid session cookie parse, falling back");
      }
    }

    // Out-of-the-box fallback: Demo user so the platform is immediately active
    await ensureDemoData();
    const demoUser = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
      include: { businesses: { take: 1 } },
    });

    if (demoUser) {
      return {
        id: demoUser.id,
        name: demoUser.name || "Demo Founder",
        email: demoUser.email,
        image: demoUser.image,
        businessId: demoUser.businesses[0]?.id,
        businessName: demoUser.businesses[0]?.name,
      };
    }

    return null;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

export async function getActiveBusinessId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (user?.businessId) return user.businessId;

  // Query latest business directly
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return business ? business.id : null;
}
