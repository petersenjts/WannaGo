import { PortalNav } from "@/components/portal-nav";

export default function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <PortalNav />
      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}
