import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC = ["/auth/login", "/auth/register", "/api/auth"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes and static assets
  if (
    PUBLIC.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Not logged in → login page
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  const role = (token.role as string) ?? "student";

  // Role-based route guards
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
  }
  if (pathname.startsWith("/trainer") && role !== "teacher" && role !== "admin") {
    return NextResponse.redirect(new URL(roleHome(role), req.url));
  }

  return NextResponse.next();
}

function roleHome(role: string) {
  if (role === "admin") return "/admin";
  if (role === "teacher") return "/trainer";
  return "/student";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
