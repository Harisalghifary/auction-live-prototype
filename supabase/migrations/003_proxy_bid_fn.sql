-- Migration: 003_proxy_bid_fn.sql
-- Adds a PostgreSQL function for the Proxy Bidding Engine.
-- Called by the Supabase Edge Function `process-proxy-bid`.
-- Logic: ARCHITECTURE.md — "Proxy Engine: Automatic counter-bidding logic."

-- Function: find and trigger the highest competing proxy bid
CREATE OR REPLACE FUNCTION public.process_proxy_bid(
  p_lot_id UUID,
  p_triggering_bid_amount DECIMAL,
  p_triggering_user_id UUID
)
RETURNS TABLE (
  proxy_user_id UUID,
  new_bid_amount DECIMAL,
  was_triggered BOOLEAN
) AS $$
DECLARE
  v_increment DECIMAL;
  v_current_price DECIMAL;
  v_proxy RECORD;
  v_new_bid DECIMAL;
BEGIN
  -- Get the current price and calculate increment
  SELECT current_price INTO v_current_price FROM public.lots WHERE id = p_lot_id;
  
  -- Determine increment per AI_INSTRUCTIONS.md § 4
  v_increment := CASE
    WHEN v_current_price < 500  THEN 25
    WHEN v_current_price < 2000 THEN 100
    ELSE 250
  END;

  -- Find the highest competing proxy bid (not from the triggering user)
  SELECT pb.user_id, pb.max_amount
  INTO v_proxy
  FROM public.proxy_bids pb
  WHERE pb.lot_id = p_lot_id
    AND pb.user_id != p_triggering_user_id
    AND pb.max_amount > p_triggering_bid_amount
  ORDER BY pb.max_amount DESC
  LIMIT 1;

  -- No competing proxy bid found
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, 0::DECIMAL, false;
    RETURN;
  END IF;

  -- Calculate the counter-bid: just enough to beat the trigger + increment
  v_new_bid := LEAST(
    v_proxy.max_amount,
    p_triggering_bid_amount + v_increment
  );

  -- Insert the proxy counter-bid
  INSERT INTO public.bids (lot_id, user_id, amount, is_proxy_bid)
  VALUES (p_lot_id, v_proxy.user_id, v_new_bid, true);

  RETURN QUERY SELECT v_proxy.user_id, v_new_bid, true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to the service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.process_proxy_bid TO service_role;
