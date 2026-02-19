-- Migration: 009_orders.sql
-- Tracks post-auction orders for won lots.
-- Payment is via manual bank transfer; shipping tracked by 3rd-party tracking ID.

CREATE TYPE payment_status AS ENUM (
  'pending_payment',   -- winner hasn't transferred yet
  'payment_submitted', -- winner submitted bank reference, awaiting admin confirmation
  'paid',              -- admin confirmed payment received
  'shipped',           -- admin added tracking ID
  'delivered'          -- admin marked as delivered
);

CREATE TABLE public.orders (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id          UUID REFERENCES public.lots(id) NOT NULL UNIQUE, -- one order per lot
  winner_id       UUID REFERENCES auth.users(id) NOT NULL,
  final_amount    DECIMAL(12,2) NOT NULL,   -- winning bid
  buyers_premium  DECIMAL(12,2) NOT NULL,   -- 20% fee
  total_due       DECIMAL(12,2) NOT NULL,   -- final_amount + buyers_premium
  payment_status  payment_status DEFAULT 'pending_payment',
  -- Winner fills these in:
  bank_reference  TEXT,                     -- transfer reference number from their bank
  payment_notes   TEXT,                     -- optional note from winner
  -- Admin fills these in:
  tracking_id     TEXT,                     -- 3rd party logistics tracking number
  courier         TEXT,                     -- e.g. JNE, SiCepat, J&T
  admin_notes     TEXT,
  paid_at         TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create order when a lot is marked SOLD
-- (triggered by the close_lot function result — we do this in the function instead)

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Winner can view their own orders
CREATE POLICY "orders_winner_select"
  ON public.orders FOR SELECT
  USING (auth.uid() = winner_id);

-- Admins can view all orders
CREATE POLICY "orders_admin_select"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Winner can update their own bank_reference and payment_notes
CREATE POLICY "orders_winner_update"
  ON public.orders FOR UPDATE
  USING (auth.uid() = winner_id)
  WITH CHECK (auth.uid() = winner_id);

-- Admins can update any order (tracking, status, etc.)
CREATE POLICY "orders_admin_update"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can insert orders (auto-created on lot close)
CREATE POLICY "orders_admin_insert"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Index for winner lookup + admin dashboard
CREATE INDEX idx_orders_winner ON public.orders(winner_id, created_at DESC);
CREATE INDEX idx_orders_status ON public.orders(payment_status);
