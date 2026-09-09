import Link from "next/link";

export function Confirmation({
  heading,
  body,
  otherVerticalHref,
  otherVerticalLabel,
}: {
  heading: string;
  body: string;
  otherVerticalHref: string;
  otherVerticalLabel: string;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-lg italic text-muted">Got it.</p>
      <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">{heading}</h1>
      <p className="mt-4 text-ink-soft">{body}</p>
      <p className="mt-1 text-ink-soft">
        We follow up within a day or two — no automated matches, just a real look at what&apos;s
        available.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/" className="text-sm font-medium text-ink-soft hover:text-ink">
          Back to home
        </Link>
        <span className="hidden text-line sm:inline">·</span>
        <Link href={otherVerticalHref} className="text-sm font-medium text-ink-soft hover:text-ink">
          {otherVerticalLabel}
        </Link>
      </div>
    </div>
  );
}
