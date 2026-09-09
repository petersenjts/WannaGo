import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth";
import { PORTAL_SESSION_COOKIE } from "@/lib/portal-auth";

async function hasRole(token: string | undefined, role: string): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload.role === role;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/portal")) {
    if (pathname === "/portal/login" || pathname === "/portal/verify") {
      return NextResponse.next();
    }
    const token = request.cookies.get(PORTAL_SESSION_COOKIE)?.value;
    if (await hasRole(token, "customer")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/portal/login", request.url));
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await hasRole(token, "admin")) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
