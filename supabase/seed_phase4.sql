-- ============================================================
-- UAT Phase 4 Seed — Order Flow Testing
-- Run in Supabase SQL Editor AFTER seed_uat.sql
--
-- Creates: 1 SOLD lot with Bidder A as winner + pending order
-- ============================================================

DO $$
DECLARE
  v_lot_id    UUID;
  v_bidder_id UUID;
BEGIN
  -- Get Bidder A's user ID
  SELECT id INTO v_bidder_id
  FROM auth.users WHERE email = 'biddera@test.com';

  IF v_bidder_id IS NULL THEN
    RAISE EXCEPTION 'biddera@test.com not found — sign up first';
  END IF;

  -- Create a SOLD lot (auction already ended)
  INSERT INTO public.lots (
    title, description, category,
    status, starting_price, reserve_price, current_price,
    live_end_at, youtube_video_id
  ) VALUES (
    'George Jensen Sterling Silver Centerpiece (1930)',
    'Iconic Art Deco silverwork by master silversmith Georg Jensen. Hallmarked Copenhagen 1930. Museum-quality condition.',
    'Decorative Arts',
    'SOLD',
    12000000, 18000000, 22500000,   -- final bid: IDR 22.5M
    NOW() - INTERVAL '30 minutes',   -- ended 30 minutes ago
    NULL
  )
  RETURNING id INTO v_lot_id;

  -- Insert the winning bid from Bidder A
  INSERT INTO public.bids (lot_id, user_id, amount)
  VALUES (v_lot_id, v_bidder_id, 22500000);

  -- Create the pending order for Bidder A
  INSERT INTO public.orders (
    lot_id, winner_id,
    final_amount, buyers_premium, total_due,
    payment_status
  ) VALUES (
    v_lot_id, v_bidder_id,
    22500000,              -- final bid
    4500000,               -- 20% buyer's premium
    27000000,              -- total due
    'pending_payment'
  );

  RAISE NOTICE 'Phase 4 seed complete. Lot ID: %, Order for biddera@test.com created.', v_lot_id;
END $$;

-- Verify
SELECT
  o.id         AS order_id,
  l.title      AS lot_title,
  l.status     AS lot_status,
  o.final_amount,
  o.buyers_premium,
  o.total_due,
  o.payment_status,
  u.email      AS winner_email
FROM public.orders o
JOIN public.lots l ON l.id = o.lot_id
JOIN auth.users u  ON u.id = o.winner_id
ORDER BY o.created_at DESC
LIMIT 5;
