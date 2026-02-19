-- Migration: 002_kyc.sql
-- Adds KYC status tracking to the profiles table.
-- Supports the bidder verification flow (WBS Task 1.2).

-- KYC status progression: unverified → pending → approved | rejected
CREATE TYPE kyc_status AS ENUM ('unverified', 'pending', 'approved', 'rejected');

-- Add kyc_status and payment_method_added to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_method_on_file BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- When kyc_status is set to 'approved', auto-flip is_verified_bidder
CREATE OR REPLACE FUNCTION public.handle_kyc_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kyc_status = 'approved' AND OLD.kyc_status != 'approved' THEN
    NEW.is_verified_bidder := true;
  END IF;
  IF NEW.kyc_status = 'rejected' THEN
    NEW.is_verified_bidder := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_kyc_status_change
  BEFORE UPDATE OF kyc_status ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_kyc_approval();

-- Index for admin queries filtering by KYC status
CREATE INDEX idx_profiles_kyc_status ON public.profiles(kyc_status);
