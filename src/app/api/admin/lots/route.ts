import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

const LotPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  starting_price: z.number().positive(),
  reserve_price: z.number().positive(),
  status: z.enum(["PRE_BID", "LIVE", "PAUSED", "SOLD"]),
  youtube_video_id: z.string().optional().nullable(),
  live_end_at: z.string().datetime({ offset: true }).optional().nullable(),
  image_urls: z.array(z.string().url()).optional().nullable(),
});

async function guardAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return data?.is_admin ? user : null;
}

// POST /api/admin/lots — create a new lot
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const admin = await guardAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = LotPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lots")
    .insert({ ...parsed.data, current_price: parsed.data.starting_price })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
