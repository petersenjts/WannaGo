import Link from "next/link";
import { DiscoveryForm } from "@/components/admin/discovery-form";

export default function ExploreDiscoverPage() {
  return (
    <div>
      <Link href="/admin/explore" className="text-sm text-muted hover:text-ink-soft">
        ← All Explore listings
      </Link>

      <h1 className="mt-5 font-serif text-h1 text-ink">Discover new listings</h1>

      <DiscoveryForm />
    </div>
  );
}
