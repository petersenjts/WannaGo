import { AdminNav } from "@/components/admin-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 sm:py-16">{children}</main>
    </div>
  );
}
