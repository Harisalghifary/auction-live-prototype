-- Migration: 005_admin_role.sql
-- Adds is_admin flag to profiles for the Admin Panel route guard.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- RLS: admins can view all profiles (for KYC queue)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- RLS: admins can update any profile (approve/reject KYC)
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- RLS: admins can manage lots (insert, update, delete)
CREATE POLICY "Admins can manage lots"
  ON public.lots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles AS p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- Grant yourself admin access (run once with your user ID):
-- UPDATE public.profiles SET is_admin = true WHERE id = 'your-user-uuid';
