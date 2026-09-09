"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestMagicLink, type RequestLinkState } from "@/actions/portal-auth";

const initialState: RequestLinkState = {};

export default function PortalLoginPage() {
  return (
    <Suspense>
      <PortalLoginForm />
    </Suspense>
  );
}

function PortalLoginForm() {
  const [state, formAction, pending] = useActionState(requestMagicLink, initialState);
  const searchParams = useSearchParams();
  const expired = searchParams.get("error") === "expired";

  if (state.sent) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 text-center">
        <p className="font-serif text-lg italic text-muted">Check your email</p>
        <h1 className="mt-3 font-serif text-h1 text-ink">Almost there</h1>
        <p className="mt-5 text-ink-soft">
          If that email has any requests on file, a sign-in link is on its way — it
          expires in 15 minutes.
        </p>
        <Link href="/" className="mt-10 text-sm font-medium text-ink-soft hover:text-ink">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-serif text-lg italic text-muted">Your requests</p>
      <h1 className="mt-3 font-serif text-h1 text-ink">Sign in</h1>
      <p className="mt-4 text-ink-soft">
        Enter the email you used when you submitted a request, and we&apos;ll send you
        a link to sign in — no password needed.
      </p>

      <form action={formAction} className="mt-10 space-y-5">
        {(state.error || expired) && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error ?? "That link has expired — request a new one below."}
          </p>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input className="field-input" id="email" name="email" type="email" required autoFocus />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Sending…" : "Send sign-in link"}
        </button>
      </form>
    </div>
  );
}
