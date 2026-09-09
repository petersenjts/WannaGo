import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16 sm:px-10">
      <header className="mb-16 sm:mb-24">
        <p className="font-serif text-lg italic text-muted">A concierge, not a search engine.</p>
        <h1 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
          Tell us what you want. We&apos;ll take it from there.
        </h1>
        <p className="mt-5 max-w-xl text-ink-soft">
          No listings to scroll through. Describe the stay or the table you&apos;re after, and a
          real person will follow up with options worth booking.
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          href="/stay"
          className="group flex flex-col justify-between rounded-2xl border border-stay-soft-line bg-stay-soft p-8 transition-colors hover:border-stay"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-stay-strong">Wannago</p>
            <h2 className="mt-3 font-serif text-3xl text-ink">A place to stay</h2>
            <p className="mt-4 text-ink-soft">
              Design-led hotels and quiet boutique stays, shortlisted for the trip you&apos;re
              actually taking.
            </p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 font-medium text-stay-strong">
            Request a stay
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>

        <Link
          href="/eats"
          className="group flex flex-col justify-between rounded-2xl border border-dine-soft-line bg-dine-soft p-8 transition-colors hover:border-dine"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-dine-strong">Wanna Eats</p>
            <h2 className="mt-3 font-serif text-3xl text-ink">Somewhere to eat</h2>
            <p className="mt-4 text-ink-soft">
              A table worth the occasion — tell us the night, the budget, the mood, and we&apos;ll
              recommend the place.
            </p>
          </div>
          <span className="mt-8 inline-flex items-center gap-2 font-medium text-dine-strong">
            Request a table
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      </div>

      <footer className="mt-16 flex gap-4 text-sm text-muted">
        <Link href="/portal/login" className="hover:text-ink-soft">
          Track your request
        </Link>
        <span aria-hidden>·</span>
        <Link href="/admin" className="hover:text-ink-soft">
          Concierge login
        </Link>
      </footer>
    </div>
  );
}
