-- ANTI-GRAVITY AUCTION MASTER SCHEMA (2026)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auction Status Enum
CREATE TYPE auction_status AS ENUM ('PRE_BID', 'LIVE', 'SOLD', 'PAUSED');

-- 1. Profiles (Linked to Auth)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  username TEXT UNIQUE,
  is_verified_bidder BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Lots (Antique Items)
CREATE TABLE public.lots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  starting_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  reserve_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status auction_status DEFAULT 'PRE_BID',
  live_end_at TIMESTAMPTZ, -- The Master Clock
  image_urls TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bids (Real-time Feed)
CREATE TABLE public.bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(12,2) NOT NULL,
  is_proxy_bid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Proxy Bids (Private Max Bids)
CREATE TABLE public.proxy_bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  max_amount DECIMAL(12,2) NOT NULL,
  UNIQUE(lot_id, user_id)
);

-- 5. Anti-Sniping Trigger
CREATE OR REPLACE FUNCTION handle_sniping()
RETURNS TRIGGER AS $$
BEGIN
  -- If bid is within 15s of end, add 30s
  IF EXISTS (
    SELECT 1 FROM lots 
    WHERE id = NEW.lot_id 
    AND live_end_at < (NOW() + INTERVAL '15 seconds')
  ) THEN
    UPDATE lots SET live_end_at = NOW() + INTERVAL '30 seconds' WHERE id = NEW.lot_id;
  END IF;
  
  -- Update current price
  UPDATE lots SET current_price = NEW.amount WHERE id = NEW.lot_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bid_received
  AFTER INSERT ON bids
  FOR EACH ROW EXECUTE FUNCTION handle_sniping();