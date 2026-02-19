-- ANTI-GRAVITY AUCTION MASTER SCHEMA (2026)
-- Migration: 001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auction Status Enum
CREATE TYPE auction_status AS ENUM ('PRE_BID', 'LIVE', 'SOLD', 'PAUSED');

-- ─── 1. Profiles (Linked to Auth) ────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  is_verified_bidder BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. Lots (Antique Items) ──────────────────────────────────────────────────
CREATE TABLE public.lots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  starting_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reserve_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status auction_status DEFAULT 'PRE_BID',
  live_end_at TIMESTAMPTZ,  -- The Master Clock (Bid Log source of truth)
  image_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. Bids (Real-time Feed) ─────────────────────────────────────────────────
CREATE TABLE public.bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  is_proxy_bid BOOLEAN DEFAULT false,
  ip_address INET,        -- Audit trail per ARCHITECTURE.md
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 4. Proxy Bids (Private Max Bids — Hidden by RLS) ────────────────────────
CREATE TABLE public.proxy_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  max_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lot_id, user_id)
);

-- ─── 5. Anti-Sniping Trigger (ARCHITECTURE.md: Supabase Level) ───────────────
CREATE OR REPLACE FUNCTION public.handle_sniping()
RETURNS TRIGGER AS $$
BEGIN
  -- If bid is within last 15s of end time, extend by 30s
  IF EXISTS (
    SELECT 1 FROM public.lots
    WHERE id = NEW.lot_id
    AND live_end_at IS NOT NULL
    AND live_end_at < (NOW() + INTERVAL '15 seconds')
    AND status = 'LIVE'
  ) THEN
    UPDATE public.lots
    SET live_end_at = NOW() + INTERVAL '30 seconds'
    WHERE id = NEW.lot_id;
  END IF;

  -- Update current price on the lot
  UPDATE public.lots
  SET current_price = NEW.amount
  WHERE id = NEW.lot_id AND NEW.amount > current_price;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bid_received
  AFTER INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.handle_sniping();

-- ─── 6. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proxy_bids ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own profile; others see public info
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (true);  -- public read

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Lots: public read
CREATE POLICY "lots_public_read" ON public.lots
  FOR SELECT USING (true);

-- Bids: public read (for bid history transparency)
CREATE POLICY "bids_public_read" ON public.bids
  FOR SELECT USING (true);

-- Bids: authenticated users can insert their own bids
CREATE POLICY "bids_insert_own" ON public.bids
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Proxy bids: only the owner can see and manage their own proxy bids (privacy)
CREATE POLICY "proxy_bids_owner_only" ON public.proxy_bids
  FOR ALL USING (auth.uid() = user_id);

-- ─── 7. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX idx_bids_lot_id ON public.bids(lot_id, created_at DESC);
CREATE INDEX idx_lots_status ON public.lots(status);
CREATE INDEX idx_proxy_bids_lot ON public.proxy_bids(lot_id);
