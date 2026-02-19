-- Migration: 008_storage_bucket.sql
-- Creates the lot-images Supabase Storage bucket with RLS:
--   - Public read (lot images are public)
--   - Admin-only upload/delete

-- Create the bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lot-images',
  'lot-images',
  true,               -- public bucket (images are publicly accessible)
  5242880,            -- 5MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- RLS: Anyone can read lot images (they are public)
CREATE POLICY "lot_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lot-images');

-- RLS: Only admins can upload/update images
CREATE POLICY "lot_images_admin_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lot-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS: Only admins can delete images
CREATE POLICY "lot_images_admin_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lot-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
