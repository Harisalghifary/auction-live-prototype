import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { LotEditForm } from "../../LotEditForm";
import Link from "next/link";

interface EditLotPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLotPage({ params }: EditLotPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: lot, error } = await supabase
    .from("lots")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lot) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/admin/lots" className="font-body text-xs text-platinum-500 hover:text-platinum-300">
          ← Lots
        </Link>
        <span className="text-platinum-500">/</span>
        <h1 className="font-display text-2xl font-bold text-platinum-200 truncate">{lot.title}</h1>
      </div>

      <div className="rounded-2xl border border-obsidian-700 bg-obsidian-800 p-6">
        <LotEditForm
          lotId={id}
          initial={{
            title: lot.title,
            description: lot.description ?? "",
            category: lot.category ?? "",
            starting_price: lot.starting_price,
            reserve_price: lot.reserve_price,
            status: lot.status,
            youtube_video_id: lot.youtube_video_id ?? "",
            live_end_at: lot.live_end_at ?? "",
          }}
        />
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-2xl border border-auction-live/20 bg-auction-live/5 p-5">
        <h3 className="mb-2 font-body text-xs font-semibold uppercase tracking-widest text-auction-live">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          {lot.status === "LIVE" && (
            <CloseNowButton lotId={id} />
          )}
        </div>
        <p className="mt-2 font-body text-xs text-platinum-500">Quick status changes are logged in the audit trail.</p>
      </div>
    </div>
  );
}

// Inline close button — triggers close-lot Edge Function immediately
function CloseNowButton({ lotId }: { lotId: string }) {
  return (
    <form action={`/api/admin/lots/${lotId}/close`} method="POST">
      <button
        type="submit"
        className="rounded-lg border border-auction-live/30 bg-auction-live/10 px-3 py-1.5 font-body text-xs text-auction-live transition hover:bg-auction-live/20"
      >
        Close Lot Now
      </button>
    </form>
  );
}
