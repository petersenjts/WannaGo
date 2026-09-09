"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitDiningRequest, type SubmitState } from "@/actions/public-requests";
import { Confirmation } from "@/components/confirmation";

const initialState: SubmitState = {};

export default function DiningRequestPage() {
  const [state, formAction, pending] = useActionState(submitDiningRequest, initialState);

  if (state.success) {
    return (
      <Confirmation
        heading="Your table request is in."
        body="We're lining up a recommendation worth the occasion."
        otherVerticalHref="/stay"
        otherVerticalLabel="Also planning a trip?"
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 [--accent:var(--color-dine)] sm:px-10">
      <Link href="/" className="text-sm text-muted hover:text-ink-soft">
        ← Back
      </Link>
      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-dine-strong">
        Wanna Eats
      </p>
      <h1 className="mt-2 font-serif text-3xl text-ink sm:text-4xl">
        Tell us about the table you want
      </h1>
      <p className="mt-3 text-ink-soft">
        Fill in as much as you can — we&apos;ll follow up within a day or two with a
        recommendation.
      </p>

      <form action={formAction} className="mt-10 space-y-8">
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
            <label className="field-label" htmlFor="date">
              Date
            </label>
            <input className="field-input" id="date" name="date" type="date" required />
          </div>
          <div>
            <label className="field-label" htmlFor="time">
              Time
            </label>
            <input className="field-input" id="time" name="time" type="time" required />
          </div>
          <div>
            <label className="field-label" htmlFor="partySize">
              Party size
            </label>
            <input
              className="field-input"
              id="partySize"
              name="partySize"
              type="number"
              min={1}
              defaultValue={2}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="budgetPerPerson">
              Budget per person
            </label>
            <input
              className="field-input"
              id="budgetPerPerson"
              name="budgetPerPerson"
              type="number"
              min={1}
              step="1"
              placeholder="e.g. 80"
              required
            />
            <p className="field-hint">In the local currency for that city.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="occasion">
              Occasion
            </label>
            <input
              className="field-input"
              id="occasion"
              name="occasion"
              type="text"
              placeholder="Birthday, date night, business..."
            />
          </div>
          <div>
            <label className="field-label" htmlFor="cuisine">
              Cuisine preference
            </label>
            <input
              className="field-input"
              id="cuisine"
              name="cuisine"
              type="text"
              placeholder="Italian, no preference..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="dietaryNeeds">
              Dietary needs
            </label>
            <input
              className="field-input"
              id="dietaryNeeds"
              name="dietaryNeeds"
              type="text"
              placeholder="Vegetarian, gluten-free, allergies..."
            />
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
            placeholder="Ambience, must-haves, dealbreakers..."
          />
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={pending}>
          {pending ? "Sending…" : "Send request"}
        </button>
      </form>
    </div>
  );
}
