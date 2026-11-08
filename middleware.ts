import { NextResponse, type NextRequest } from "next/server";

const OWNER_ONLY_ROUTES = [
  "/analysis",
  "/business-plan",
  "/roadmap",
  "/finances",
  "/investments",
  "/reports",
  "/advisor",
  "/employees",
];

const PROTECTED_ROUTES = [
  "/dashboard",
  "/tasks",
  "/attendance",
  "/team",
  "/settings",
  "/notifications",
  "/assistant",
  ...OWNER_ONLY_ROUTES,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("bizmind_session");

  let sessionUser: { role?: string; id?: string } | null = null;
  if (sessionCookie?.value) {
    try {
      sessionUser = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    } catch {
      sessionUser = null;
    }
  }

  const isAuth = Boolean(sessionUser?.id);
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 1. Redirect unauthenticated users trying to access protected routes
  if (isProtected && !isAuth) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from auth pages
  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Enforce strict Owner-Only page protection against Employees
  if (isAuth && sessionUser?.role === "EMPLOYEE") {
    const isOwnerOnly = OWNER_ONLY_ROUTES.some((route) => pathname.startsWith(route));
    if (isOwnerOnly) {
      // Redirect employee to their dedicated dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/attendance/:path*",
    "/team/:path*",
    "/settings/:path*",
    "/assistant/:path*",
    "/notifications/:path*",
    "/analysis/:path*",
    "/business-plan/:path*",
    "/roadmap/:path*",
    "/finances/:path*",
    "/investments/:path*",
    "/reports/:path*",
    "/advisor/:path*",
    "/employees/:path*",
    "/login",
    "/register",
  ],
};
