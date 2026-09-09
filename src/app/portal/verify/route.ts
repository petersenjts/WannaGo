import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyMagicLinkToken, setPortalSessionCookie } from "@/lib/portal-auth";
import { db } from "@/lib/db";
import { linkExploreVisitorToCustomer } from "@/lib/explore";

// Redirects are built from APP_URL, not the incoming request's own URL —
// behind Railway's reverse proxy, request.url reflects the container's
// internal address (e.g. 0.0.0.0:8080), not the public domain.
function appUrl(): string {
  const url = process.env.APP_URL;
  if (!url) throw new Error("APP_URL environment variable is not set");
  return url;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const email = token ? await verifyMagicLinkToken(token) : null;

  if (!email) {
    return NextResponse.redirect(`${appUrl()}/portal/login?error=expired`);
  }

  await setPortalSessionCookie(email);

  const customer = await db.customer.findFirst({ where: { email } });
  if (customer) await linkExploreVisitorToCustomer(customer.id);

  return NextResponse.redirect(`${appUrl()}/portal`);
}
