import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-20 sm:px-10 sm:py-28">
      <header className="mb-20 sm:mb-28">
        <p className="font-serif text-lg italic text-muted">A concierge, not a search engine.</p>
        <h1 className="mt-4 max-w-2xl text-display font-serif leading-[1.05] text-ink">
          Tell us what you want. We&apos;ll take it from there.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-soft">
          No listings to scroll through. Describe the stay or the table you&apos;re after, and a
          real person will follow up with options worth booking.
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        <Link href="/stay" className="group card [--accent:var(--color-stay)] flex flex-col justify-between bg-stay-soft transition-shadow hover:shadow-[0_1px_24px_-4px_rgba(122,68,41,0.25)]">
          <div>
            <p className="eyebrow text-stay-strong">Wannago</p>
            <h2 className="mt-4 font-serif text-h1 text-ink">A place to stay</h2>
            <p className="mt-4 text-ink-soft">
              Design-led hotels and quiet boutique stays, shortlisted for the trip you&apos;re
              actually taking.
            </p>
          </div>
          <span className="mt-10 inline-flex items-center gap-2 font-medium text-stay-strong">
            Request a stay
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>

        <Link href="/eats" className="group card [--accent:var(--color-dine)] flex flex-col justify-between bg-dine-soft transition-shadow hover:shadow-[0_1px_24px_-4px_rgba(78,85,64,0.25)]">
          <div>
            <p className="eyebrow text-dine-strong">Wanna Eats</p>
            <h2 className="mt-4 font-serif text-h1 text-ink">Somewhere to eat</h2>
            <p className="mt-4 text-ink-soft">
              A table worth the occasion — tell us the night, the budget, the mood, and we&apos;ll
              recommend the place.
            </p>
          </div>
          <span className="mt-10 inline-flex items-center gap-2 font-medium text-dine-strong">
            Request a table
            <span aria-hidden className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      </div>

      <footer className="mt-20 flex gap-5 text-sm text-muted">
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
