-- ============================================================
-- UAT Seed Data — Anti-Gravity Auction
-- Run in Supabase SQL Editor (after all 10 migrations applied)
--
-- STEP 1: Create 3 user accounts in your app first:
--   • admin@test.com    / Test1234!
--   • biddera@test.com  / Test1234!
--   • bidderb@test.com  / Test1234!
--
-- STEP 2: Then run this entire script.
-- ============================================================


-- ── 1. Promote admin user ─────────────────────────────────────────────────────
-- Replace the email below with the email you used to sign up as admin.

UPDATE public.profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@test.com'
);


-- ── 2. Approve Bidder A as a verified bidder ─────────────────────────────────
-- This skips the KYC wizard for UAT speed.
-- To test the full KYC flow, skip this and use TC-04 → TC-05 instead.

UPDATE public.profiles
SET kyc_status = 'approved', is_verified_bidder = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'biddera@test.com'
);


-- ── 3. Insert UAT lots ────────────────────────────────────────────────────────
-- Creates 5 lots across all statuses for complete UAT coverage.

INSERT INTO public.lots (title, description, category, status, starting_price, reserve_price, current_price, live_end_at, youtube_video_id)
VALUES

-- PRE_BID lot (for proxy bid testing — TC-13, TC-14)
(
  'Louis Vuitton Monogram Keepall 50 (1985)',
  'A rare early-production Monogram Keepall 50 in excellent condition. Original brass hardware intact. Provenance documents included.',
  'Fashion & Accessories',
  'PRE_BID',
  1500000, -- IDR 1.5M starting
  2000000,
  1500000,
  NULL,
  NULL
),

-- LIVE lot ending in 10 minutes (for live bidding — TC-15, TC-16, TC-17)
(
  'Patek Philippe Calatrava 3796 (1972)',
  'A stunning example of mid-century Swiss watchmaking. 18k yellow gold case, original dial, manual-wind. Service history available.',
  'Horology',
  'LIVE',
  45000000,
  60000000,
  45000000,
  NOW() + INTERVAL '10 minutes',
  'jfKfPfyJRdk' -- replace with your actual YouTube live stream ID
),

-- LIVE lot ending very soon (for auto-close testing — TC-19)
(
  'Ming Dynasty Blue & White Porcelain Vase',
  'Authenticated 15th-century blue and white porcelain vase. Expert appraisal letter included. Minor restoration to rim.',
  'Ceramics & Porcelain',
  'LIVE',
  8000000,
  10000000,
  8000000,
  NOW() + INTERVAL '2 minutes',
  NULL
),

-- PRE_BID lot (for search/filter testing — TC-08, TC-11)
(
  'Ansel Adams — Moonrise, Hernandez (Silver Print)',
  'Original silver gelatin print, signed and editioned. 16x20 inches. Comes with certificate of authenticity from the Adams estate.',
  'Photography & Prints',
  'PRE_BID',
  25000000,
  35000000,
  25000000,
  NULL,
  NULL
),

-- SOLD lot (for recently-closed section + order flow context)
(
  'Omega Speedmaster Professional "Moonwatch" (1969)',
  'First-generation Apollo-era Speedmaster. Tritium dial with clean patina. Original bracelet and caseback.',
  'Horology',
  'SOLD',
  0,           -- no starting price used after close
  30000000,
  38500000,    -- final winning bid
  NOW() - INTERVAL '2 hours',
  NULL
);


-- ── 4. Verify setup ───────────────────────────────────────────────────────────
-- Run these SELECT statements to confirm everything is correct.

SELECT
  email,
  p.is_admin,
  p.is_verified_bidder,
  p.kyc_status
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE email IN ('admin@test.com', 'biddera@test.com', 'bidderb@test.com');

SELECT id, title, status, category, starting_price, live_end_at
FROM public.lots
ORDER BY created_at DESC
LIMIT 10;
