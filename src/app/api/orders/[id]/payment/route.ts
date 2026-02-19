import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { z } from "zod";

const PaymentSubmitSchema = z.object({
  bank_reference: z.string().min(1, "Reference is required"),
  payment_notes: z.string().optional().nullable(),
});

// PATCH /api/orders/[id]/payment — winner submits bank reference
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the order belongs to this user
  const { data: order } = await supabase
    .from("orders")
    .select("id, winner_id, payment_status")
    .eq("id", id)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.winner_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["pending_payment", "payment_submitted"].includes(order.payment_status)) {
    return NextResponse.json({ error: "Payment already confirmed" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = PaymentSubmitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { error } = await supabase
    .from("orders")
    .update({
      bank_reference: parsed.data.bank_reference,
      payment_notes: parsed.data.payment_notes ?? null,
      payment_status: "payment_submitted",
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
