-- Migration: 006_close_lot_fn.sql
-- SQL function called by the close-lot Edge Function to atomically
-- close a lot when its live_end_at has passed.

CREATE OR REPLACE FUNCTION public.close_lot(p_lot_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_lot RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_lot FROM public.lots WHERE id = p_lot_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'lot_not_found');
  END IF;

  -- Only close LIVE lots whose timer has expired
  IF v_lot.status != 'LIVE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_live', 'status', v_lot.status);
  END IF;

  IF v_lot.live_end_at IS NULL OR v_lot.live_end_at > NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'timer_not_expired');
  END IF;

  -- Check reserve price
  IF v_lot.current_price >= v_lot.reserve_price THEN
    -- Hammer! Mark as SOLD
    UPDATE public.lots
      SET status = 'SOLD'
      WHERE id = p_lot_id;

    RETURN jsonb_build_object(
      'success', true,
      'outcome', 'sold',
      'final_price', v_lot.current_price
    );
  ELSE
    -- Reserve not met — mark as PAUSED (passed)
    UPDATE public.lots
      SET status = 'PAUSED'
      WHERE id = p_lot_id;

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
