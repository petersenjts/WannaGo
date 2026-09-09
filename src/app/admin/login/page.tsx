"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/actions/admin-auth";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="font-serif text-lg italic text-muted">Concierge</p>
      <h1 className="mt-2 font-serif text-3xl text-ink">Sign in</h1>

      <form action={formAction} className="mt-8 space-y-5">
        {state.error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email
          </label>
          <input className="field-input" id="email" name="email" type="email" required autoFocus />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input className="field-input" id="password" name="password" type="password" required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
