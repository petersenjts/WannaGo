"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/actions/admin-auth";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/explore", label: "Explore" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <div className="flex items-center gap-10">
          <Link href="/admin" className="font-serif text-lg text-ink">
            Wannago Concierge
          </Link>
          <nav className="flex gap-1">
            {LINKS.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active ? "bg-paper-alt text-ink" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={logout}>
          <button type="submit" className="eyebrow hover:text-ink-soft">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
