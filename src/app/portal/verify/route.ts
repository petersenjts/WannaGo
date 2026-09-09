import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyMagicLinkToken, setPortalSessionCookie } from "@/lib/portal-auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = token ? await verifyMagicLinkToken(token) : null;

  if (!email) {
    return NextResponse.redirect(new URL("/portal/login?error=expired", request.url));
  }

  await setPortalSessionCookie(email);
  return NextResponse.redirect(new URL("/portal", request.url));
}
