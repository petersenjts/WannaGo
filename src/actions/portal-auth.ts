"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/customers";
import { createMagicLinkToken, clearPortalSessionCookie } from "@/lib/portal-auth";
import { sendPortalEmail } from "@/lib/email";

export type RequestLinkState = { sent?: boolean; error?: string };

export async function requestMagicLink(
  _prevState: RequestLinkState,
  formData: FormData
): Promise<RequestLinkState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { error: "Please enter the email address you used for your request." };
  }

  const customer = await db.customer.findFirst({ where: { email } });

  // Always respond the same way whether or not the email matched — don't
  // reveal which addresses have requests on file.
  if (customer) {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      throw new Error("APP_URL environment variable is not set");
    }
    const token = await createMagicLinkToken(email);
    const link = `${appUrl}/portal/verify?token=${token}`;

    await sendPortalEmail({
      to: email,
      subject: "Sign in to Wannago & Wanna Eats",
      heading: "Here's your sign-in link",
      body: "Click below to see your requests. This link expires in 15 minutes.",
      ctaLabel: "Sign in",
      ctaUrl: link,
    });
  }

  return { sent: true };
}

export async function logoutPortal(): Promise<void> {
  await clearPortalSessionCookie();
  redirect("/portal/login");
}
