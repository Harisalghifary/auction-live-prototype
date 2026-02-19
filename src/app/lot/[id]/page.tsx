import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotSchema } from "@/types/auction";
import { StatusBadge } from "@/components/StatusBadge";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BidButton } from "@/components/BidButton";
import { KycGuard } from "@/components/KycGuard";
import { PreBidForm } from "@/components/PreBidForm";
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
          {/* Main Image */}
          <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-obsidian-800">
            {lot.image_urls?.[0] ? (
              <Image
                src={lot.image_urls[0]}
                alt={lot.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-platinum-500 opacity-30">
                <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {(lot.image_urls?.length ?? 0) > 1 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {lot.image_urls!.map((url, i) => (
                <div key={i} className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-obsidian-800">
                  <Image src={url} alt={`${lot.title} — image ${i + 1}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}

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
              <KycGuard>
                <BidButton
                  lotId={lot.id}
                  currentPrice={currentBid}
                />
              </KycGuard>
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
