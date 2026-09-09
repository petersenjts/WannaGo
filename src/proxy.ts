import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth";
import { PORTAL_SESSION_COOKIE } from "@/lib/portal-auth";

// Duplicated from lib/explore.ts's EXPLORE_VISITOR_COOKIE rather than
// imported — that module also imports the Prisma client, which isn't safe
// to pull into this edge-runtime proxy bundle. Keep this string in sync
// with the one there if it ever changes.
const EXPLORE_VISITOR_COOKIE = "wannago_explore_visitor";

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

  if (pathname.startsWith("/explore")) {
    // Public, unauthenticated — just make sure an anonymous visitor id
    // exists so swipes have something to attach to. No DB write here;
    // the visitor row itself is created lazily on first swipe.
    if (request.cookies.get(EXPLORE_VISITOR_COOKIE)?.value) {
      return NextResponse.next();
    }
    const response = NextResponse.next();
    response.cookies.set(EXPLORE_VISITOR_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  }

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
  matcher: ["/admin/:path*", "/portal/:path*", "/explore/:path*"],
};
