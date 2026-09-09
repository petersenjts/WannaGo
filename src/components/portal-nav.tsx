import Link from "next/link";
import { logoutPortal } from "@/actions/portal-auth";

export function PortalNav() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/portal" className="font-serif text-lg text-ink">
          Wannago &amp; Wanna Eats
        </Link>
        <form action={logoutPortal}>
          <button type="submit" className="text-sm text-muted hover:text-ink-soft">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
