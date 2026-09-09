import { Resend } from "resend";

function resendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}

function emailHtml({
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): string {
  return `
  <div style="background:#faf6f0;padding:40px 20px;font-family:ui-sans-serif,system-ui,sans-serif;color:#2a231c;">
    <div style="max-width:480px;margin:0 auto;background:#fffdfa;border:1px solid #e4d9c6;border-radius:16px;padding:32px;">
      <p style="font-style:italic;color:#8c8172;margin:0 0 8px;">Wannago &amp; Wanna Eats</p>
      <h1 style="font-size:22px;margin:0 0 16px;">${heading}</h1>
      <p style="line-height:1.6;margin:0 0 24px;">${body}</p>
      <a href="${ctaUrl}" style="display:inline-block;background:#b1502f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600;">${ctaLabel}</a>
      <p style="margin:24px 0 0;font-size:12px;color:#8c8172;">If the button doesn't work, copy this link: ${ctaUrl}</p>
    </div>
  </div>`;
}

/**
 * Sends a magic-link style email (sign-in link, or shortlist-ready notification —
 * both are just "here's your link" emails with different copy). Falls back to
 * logging the link to the console when RESEND_API_KEY isn't set, so the whole
 * portal flow can be tested locally before a Resend account/domain exists.
 */
export async function sendPortalEmail({
  to,
  subject,
  heading,
  body,
  ctaLabel,
  ctaUrl,
}: {
  to: string;
  subject: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
}): Promise<void> {
  const client = resendClient();

  if (!client) {
    console.log(`[email:dev] Would send "${subject}" to ${to} — link: ${ctaUrl}`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  await client.emails.send({
    from,
    to,
    subject,
    html: emailHtml({ heading, body, ctaLabel, ctaUrl }),
  });
}
