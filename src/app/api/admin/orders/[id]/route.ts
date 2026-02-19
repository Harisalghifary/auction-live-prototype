import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

const AdminOrderUpdateSchema = z.object({
  payment_status: z.enum(["pending_payment", "payment_submitted", "paid", "shipped", "delivered"]).optional(),
  tracking_id: z.string().optional().nullable(),
  courier: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
});

async function guardAdmin(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  return data?.is_admin ? user : null;
}

// PATCH /api/admin/orders/[id] — admin updates order status, tracking, etc.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = await guardAdmin(supabase);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = AdminOrderUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Auto-set timestamps based on status transitions
  const extras: Record<string, string | null> = {};
  if (parsed.data.payment_status === "paid") extras.paid_at = new Date().toISOString();
  if (parsed.data.payment_status === "shipped") extras.shipped_at = new Date().toISOString();
  if (parsed.data.payment_status === "delivered") extras.delivered_at = new Date().toISOString();

  const { error } = await supabase
    .from("orders")
    .update({ ...parsed.data, ...extras })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
