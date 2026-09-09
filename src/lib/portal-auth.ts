import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const PORTAL_SESSION_COOKIE = "wannago_portal_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAGIC_LINK_DURATION_SECONDS = 60 * 15; // 15 minutes

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

// --- Magic link tokens (short-lived, emailed to the customer) ---

export async function createMagicLinkToken(email: string): Promise<string> {
  return new SignJWT({ purpose: "magic-link", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_DURATION_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.purpose !== "magic-link" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

// --- Portal session (set once the magic link is verified) ---

async function createPortalSessionToken(email: string): Promise<string> {
  return new SignJWT({ role: "customer", email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey());
}

async function verifyPortalSessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "customer" || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}

export async function setPortalSessionCookie(email: string): Promise<void> {
  const token = await createPortalSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
}

/** Returns the signed-in customer's email, or null if not signed in. */
export async function getPortalSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyPortalSessionToken(token);
}

// Server Functions are reachable directly, bypassing any page-level guard —
// so every portal Server Action must call this itself, not just rely on proxy.ts.
export async function requirePortalCustomer(): Promise<string> {
  const email = await getPortalSession();
  if (!email) {
    redirect("/portal/login");
  }
  return email;
}
