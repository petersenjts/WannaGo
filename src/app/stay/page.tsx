"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitStayRequest, type SubmitState } from "@/actions/public-requests";
import { STAY_PREFERENCE_TAGS } from "@/lib/constants";
import { Confirmation } from "@/components/confirmation";

const initialState: SubmitState = {};

export default function StayRequestPage() {
  const [state, formAction, pending] = useActionState(submitStayRequest, initialState);

  if (state.success) {
    return (
      <Confirmation
        heading="Your stay request is in."
        body="We're on it — matching you with boutique stays that fit the brief."
        otherVerticalHref="/eats"
        otherVerticalLabel="Also looking for somewhere to eat?"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 [--accent:var(--color-stay)] sm:px-10 sm:py-24">
      <Link href="/" className="text-sm text-muted hover:text-ink-soft">
        ← Back
      </Link>
      <p className="eyebrow mt-8 text-stay-strong">Wannago</p>
      <h1 className="mt-3 font-serif text-h1 text-ink">
        Tell us about the stay you want
      </h1>
      <p className="mt-4 text-lg text-ink-soft">
        Fill in as much as you can — we&apos;ll follow up within a day or two with a shortlist of
        options.
      </p>

      <form action={formAction} className="mt-12 space-y-10">
        {state.error && (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="name">
              Your name
            </label>
            <input className="field-input" id="name" name="name" type="text" required />
          </div>
          <div />
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input className="field-input" id="email" name="email" type="email" />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">
              Phone
            </label>
            <input className="field-input" id="phone" name="phone" type="tel" />
          </div>
          <p className="-mt-3 text-xs text-muted sm:col-span-2">
            Give us at least an email or a phone number so we can reach you.
          </p>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="city">
              City
            </label>
            <input
              className="field-input"
              id="city"
              name="city"
              type="text"
              required
              placeholder="e.g. Amsterdam"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="checkIn">
              Check-in
            </label>
            <input className="field-input" id="checkIn" name="checkIn" type="date" required />
          </div>
          <div>
            <label className="field-label" htmlFor="checkOut">
              Check-out
            </label>
            <input className="field-input" id="checkOut" name="checkOut" type="date" required />
          </div>
          <div>
            <label className="field-label" htmlFor="guests">
              Guests
            </label>
            <input
              className="field-input"
              id="guests"
              name="guests"
              type="number"
              min={1}
              defaultValue={2}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="budgetPerNight">
              Budget per night
            </label>
            <input
              className="field-input"
              id="budgetPerNight"
              name="budgetPerNight"
              type="number"
              min={1}
              step="1"
              placeholder="e.g. 250"
              required
            />
            <p className="field-hint">In the local currency for that city.</p>
          </div>
        </div>

        <div>
          <p className="field-label">What matters to you</p>
          <div className="flex flex-wrap gap-2">
            {STAY_PREFERENCE_TAGS.map((tag) => (
              <label key={tag} className="tag-chip">
                <input type="checkbox" name="tags" value={tag} className="sr-only" />
                {tag}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="notes">
            Anything else we should know
          </label>
          <textarea
            className="field-input"
            id="notes"
            name="notes"
            rows={4}
            placeholder="Occasion, must-haves, dealbreakers..."
          />
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </button>
      </form>
    </div>
  );
}
