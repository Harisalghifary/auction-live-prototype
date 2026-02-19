import { notFound } from "next/navigation";
import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotSchema } from "@/types/auction";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BidButton } from "@/components/BidButton";
import { KycGuard } from "@/components/KycGuard";
import { PreBidForm } from "@/components/PreBidForm";
import { LotImageGallery } from "@/components/LotImageGallery";

import { formatPrice, getBidIncrement, applyBuyersPremium } from "@/lib/bidUtils";

interface LotPageProps {
  params: Promise<{ id: string }>;
}

export default async function LotPage({ params }: LotPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const lot = LotSchema.parse(data);
  const isLive = lot.status === "LIVE";
  const isPreBid = lot.status === "PRE_BID";
  const increment = getBidIncrement(lot.current_price);
  const currentBid = lot.current_price || lot.starting_price;
  const buyersPremium = applyBuyersPremium(currentBid);

  // Fetch last 10 bids for this lot
  const { data: recentBids } = await supabase
    .from("bids")
    .select("id, amount, created_at, user_id")
    .eq("lot_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch current user's proxy bid (if any) for PRE_BID lots
  let existingProxyBid: number | null = null;
  if (isPreBid) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: proxyBid } = await supabase
        .from("proxy_bids")
        .select("max_amount")
        .eq("lot_id", id)
        .eq("user_id", user.id)
        .single();
      existingProxyBid = proxyBid?.max_amount ?? null;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Left: Images + Details */}
        <div>
          <LotImageGallery
            imageUrls={lot.image_urls ?? []}
            title={lot.title}
          />

          {/* Lot details */}
          <div>
            {lot.category && (
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-widest text-gold-500">
                {lot.category}
              </p>
            )}
            <h1 className="mb-3 font-display text-3xl font-bold text-platinum-200 md:text-4xl">
              {lot.title}
            </h1>
            {lot.description && (
              <p className="font-body text-base leading-relaxed text-platinum-500">
                {lot.description}
              </p>
            )}
          </div>
        </div>

        {/* Right: Bidding Panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
            {/* Status + Timer */}
            <div className="mb-5 flex items-center justify-between">
              <StatusBadge status={lot.status} />
              {isLive && <CountdownTimer liveEndAt={lot.live_end_at} />}
            </div>

            {/* Current price */}
            <div className="mb-1">
              <p className="font-body text-xs uppercase tracking-widest text-platinum-500">
                {lot.status === "PRE_BID" ? "Starting Bid" : "Current Bid"}
              </p>
              <p className="font-display text-4xl font-bold text-gold-400">
                {formatPrice(currentBid)}
              </p>
            </div>

            {/* Increment info */}
            <p className="mb-6 font-body text-xs text-platinum-500">
              Min. increment: <span className="text-platinum-300">{formatPrice(increment)}</span>
              {" · "}Buyer&apos;s Premium: <span className="text-platinum-300">20%</span>
              {" · "}Est. total: <span className="text-platinum-300">{formatPrice(buyersPremium)}</span>
            </p>

            {/* Bid CTA */}
            {isLive ? (
              <>
                {/* Enter Live Room — primary CTA for LIVE lots */}
                <Link
                  href={`/auction/${lot.id}`}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-auction-live py-3 font-body font-semibold text-white transition hover:bg-red-600"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  Enter Live Room
                </Link>
                <KycGuard>
                  <BidButton
                    lotId={lot.id}
                    currentPrice={currentBid}
                  />
                </KycGuard>
              </>
            ) : isPreBid ? (
              <KycGuard>
                <PreBidForm
                  lotId={lot.id}
                  startingPrice={currentBid}
                  existingProxyBid={existingProxyBid}
                />
              </KycGuard>
            ) : (
              <div className="rounded-xl border border-obsidian-700 bg-obsidian-900 p-4 text-center font-body text-sm text-platinum-500">
                {lot.status === "SOLD"
                  ? `Sold for ${formatPrice(currentBid)} (+ 20% premium)`
                  : "This lot is currently paused."}
              </div>
            )}

            {/* Bid history */}
            {(recentBids?.length ?? 0) > 0 && (
              <div className="mt-6 border-t border-obsidian-700 pt-5">
                <h3 className="mb-3 font-body text-xs font-semibold uppercase tracking-widest text-platinum-500">
                  Bid History
                </h3>
                <ul className="space-y-2">
                  {(recentBids as { id: string; amount: number; user_id: string; created_at: string }[]).map((bid, i) => (
                    <li key={bid.id} className="flex items-center justify-between font-body text-sm">
                      <span className="text-platinum-500">
                        Bidder ···{bid.user_id.slice(-4)}
                        {i === 0 && <span className="ml-1.5 text-[10px] text-gold-500">HIGH BIDDER</span>}
                      </span>
                      <span className={i === 0 ? "font-semibold text-gold-400" : "text-platinum-300"}>
                        {formatPrice(bid.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
