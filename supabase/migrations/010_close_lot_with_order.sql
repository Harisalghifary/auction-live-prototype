-- Update to close_lot function: auto-create order when lot is sold.
-- Run this AFTER 009_orders.sql.

CREATE OR REPLACE FUNCTION public.close_lot(p_lot_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lot RECORD;
  v_winner RECORD;
  v_premium DECIMAL(12,2);
  v_total DECIMAL(12,2);
BEGIN
  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'lot_not_found');
  END IF;

  IF v_lot.status != 'LIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_live', 'status', v_lot.status);
  END IF;

  IF v_lot.live_end_at IS NULL OR v_lot.live_end_at > NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'timer_not_expired');
  END IF;

  IF v_lot.current_price >= v_lot.reserve_price THEN
    -- Find the highest bidder
    SELECT user_id, amount INTO v_winner
    FROM public.bids
    WHERE lot_id = p_lot_id
    ORDER BY amount DESC, created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
      -- No bids — pass the lot
      UPDATE public.lots SET status = 'PAUSED' WHERE id = p_lot_id;
      RETURN jsonb_build_object('success', true, 'outcome', 'passed', 'reason', 'no_bids');
    END IF;

    -- Mark lot as SOLD
    UPDATE public.lots SET status = 'SOLD' WHERE id = p_lot_id;

    -- Calculate totals
    v_premium := ROUND(v_lot.current_price * 0.20, 2);  -- 20% buyer's premium
    v_total   := v_lot.current_price + v_premium;

    -- Auto-create the order (ignore if already exists)
    INSERT INTO public.orders (
      lot_id, winner_id, final_amount, buyers_premium, total_due
    ) VALUES (
      p_lot_id, v_winner.user_id, v_lot.current_price, v_premium, v_total
    )
    ON CONFLICT (lot_id) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'outcome', 'sold',
      'final_price', v_lot.current_price,
      'winner_id', v_winner.user_id,
      'total_due', v_total
    );
  ELSE
    UPDATE public.lots SET status = 'PAUSED' WHERE id = p_lot_id;
    RETURN jsonb_build_object(
      'success', true,
      'outcome', 'passed',
      'final_price', v_lot.current_price,
      'reserve_price', v_lot.reserve_price
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.close_lot TO service_role;
