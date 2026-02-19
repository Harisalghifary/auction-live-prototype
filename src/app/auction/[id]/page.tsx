import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotSchema, BidSchema } from "@/types/auction";
import { AuctionRoomClient } from "./AuctionRoomClient";

interface AuctionPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>; // optional YouTube video ID override
}

export default async function AuctionPage({ params, searchParams }: AuctionPageProps) {
  const { id } = await params;
  const { v: videoIdOverride } = await searchParams;

  const supabase = await createSupabaseServerClient();

  // Auth guard — must be logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/auction/${id}`);

  // Fetch lot
  const { data: lotData, error } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lotData) notFound();

  const lot = LotSchema.parse(lotData);

  // Only LIVE lots have an auction room
  if (lot.status !== "LIVE" && lot.status !== "PAUSED") {
    redirect(`/lot/${id}`);
  }

  // Fetch user profile (KYC status)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified_bidder, kyc_status")
    .eq("id", user.id)
    .single();

  // Fetch last 50 bids for initial render
  const { data: bidsData } = await supabase
    .from("bids")
    .select("id, lot_id, user_id, amount, is_proxy_bid, created_at")
    .eq("lot_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  const initialBids = (bidsData ?? []).map((b) => BidSchema.parse(b));

  // YouTube video ID — stored in lot metadata or provided via ?v= query param
  // For now we use the override or a placeholder
  const youtubeVideoId = videoIdOverride ?? (lotData.youtube_video_id as string | null) ?? null;

  return (
    <AuctionRoomClient
      lot={lot}
      initialBids={initialBids}
      currentUserId={user.id}
      isVerifiedBidder={profile?.is_verified_bidder ?? false}
      youtubeVideoId={youtubeVideoId}
    />
  );
}
