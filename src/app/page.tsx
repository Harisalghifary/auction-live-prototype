import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotCard } from "@/components/LotCard";
import { LotFilters } from "@/components/LotFilters";
import { LotSchema } from "@/types/auction";
import { z } from "zod";
import { Suspense } from "react";

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    sort?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, status, category, sort } = await searchParams;

  const supabase = await createSupabaseServerClient();

  // ── Build query with filters ─────────────────────────────────────────────────
  let query = supabase.from("lots").select("*");

  // Full-text search on title + description
  if (q?.trim()) {
    query = query.or(`title.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`);
  }

  // Status filter
  if (status && ["LIVE", "PRE_BID", "SOLD", "PAUSED"].includes(status)) {
    query = query.eq("status", status);
  }

  // Category filter
  if (category?.trim()) {
    query = query.eq("category", category.trim());
  }

  // Sort
  switch (sort) {
    case "price_asc":
      query = query.order("current_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("current_price", { ascending: false });
      break;
    case "ending_soon":
      query = query.order("live_end_at", { ascending: true, nullsFirst: false });
      break;
    default: // newest
      query = query
        .order("status", { ascending: false }) // LIVE first
        .order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  const lots = error ? [] : z.array(LotSchema).parse(data ?? []);

  // ── Derive categories for the filter bar ─────────────────────────────────────
  const { data: allCats } = await supabase
    .from("lots")
    .select("category")
    .not("category", "is", null);
  const categories = [...new Set((allCats ?? []).map((r) => r.category as string))].sort();

  // ── Split into sections only when no filters are active ──────────────────────
  const isFiltered = !!(q || status || category);

  const liveLots    = isFiltered ? [] : lots.filter((l) => l.status === "LIVE");
  const preBidLots  = isFiltered ? [] : lots.filter((l) => l.status === "PRE_BID");
  const closedLots  = isFiltered ? [] : lots.filter((l) => l.status === "SOLD" || l.status === "PAUSED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="mb-12 text-center">
        <p className="mb-3 font-body text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
          Real-time Antique Auctions
        </p>
        <h1 className="font-display text-5xl font-bold leading-tight text-platinum-200 md:text-6xl">
          Discover Rare<br />
          <span className="text-gold-400">Antiques &amp; Art</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md font-body text-base text-platinum-500">
          Bid live alongside the world on authenticated antiques — watches, fine art, jewelry, and more.
        </p>
      </div>

      {/* Filters — wrapped in Suspense for useSearchParams() */}
      <Suspense fallback={null}>
        <LotFilters categories={categories} />
      </Suspense>

      {/* ── Filtered view: flat grid ────────────────────────────────────────── */}
      {isFiltered && (
        <>
          <div className="mb-5 flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-platinum-200">
              {lots.length} result{lots.length !== 1 ? "s" : ""}
            </h2>
            {q && (
              <span className="rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-0.5 font-body text-xs text-gold-400">
                &quot;{q}&quot;
              </span>
            )}
          </div>

          {lots.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {lots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-center text-platinum-500">
              <svg className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-display text-xl">No lots found</p>
              <p className="font-body text-sm">Try a different search or clear the filters.</p>
            </div>
          )}
        </>
      )}

      {/* ── Default view: grouped by status ────────────────────────────────── */}
      {!isFiltered && (
        <>
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

          {preBidLots.length > 0 && (
            <section className="mb-12">
              <h2 className="mb-5 font-display text-2xl font-semibold text-platinum-200">Upcoming Lots</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {preBidLots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
              </div>
            </section>
          )}

          {closedLots.length > 0 && (
            <section>
              <h2 className="mb-5 font-display text-2xl font-semibold text-platinum-500">Recently Closed</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                {closedLots.map((lot) => <LotCard key={lot.id} lot={lot} />)}
              </div>
            </section>
          )}

          {lots.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-24 text-center text-platinum-500">
              <svg className="h-14 w-14 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="font-display text-xl">No lots available yet.</p>
              <p className="font-body text-sm">Check back soon — new auctions are added weekly.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
