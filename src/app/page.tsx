import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotCard } from "@/components/LotCard";
import { LotSchema } from "@/types/auction";
import { z } from "zod";

export const revalidate = 30; // Revalidate every 30s

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .order("status", { ascending: false })  // LIVE first
    .order("created_at", { ascending: false });

  const lots = error ? [] : z.array(LotSchema).parse(data ?? []);

  const liveLots = lots.filter((l) => l.status === "LIVE");
  const preBidLots = lots.filter((l) => l.status === "PRE_BID");
  const closedLots = lots.filter((l) => l.status === "SOLD" || l.status === "PAUSED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="mb-14 text-center">
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
          Real-time Antique Auctions
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight text-platinum-200 md:text-6xl">
          Discover Rare<br />
          <span className="text-gold-400">Antiques & Art</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base text-platinum-500">
          Bid live alongside the world on authenticated antiques — watches, fine art, jewelry, and more.
        </p>
      </div>

      {/* LIVE section */}
      {liveLots.length > 0 && (
        <section className="mb-12">
          <div className="mb-5 flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-auction-live opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-auction-live" />
            </span>
            <h2 className="font-display text-2xl font-semibold text-platinum-200">Live Now</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {liveLots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
          </div>
        </section>
      )}

      {/* PRE-BID section */}
      {preBidLots.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-5 font-display text-2xl font-semibold text-platinum-200">
            Upcoming Lots
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {preBidLots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
          </div>
        </section>
      )}

      {/* Closed section */}
      {closedLots.length > 0 && (
        <section>
          <h2 className="mb-5 font-display text-2xl font-semibold text-platinum-500">
            Recently Closed
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
            {closedLots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
          </div>
        </section>
      )}

      {/* Empty state */}
      {lots.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 text-center text-platinum-500">
          <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="font-display text-xl">No lots available yet.</p>
          <p className="font-body text-sm">Check back soon — new auctions are added weekly.</p>
        </div>
      )}
    </div>
  );
}
