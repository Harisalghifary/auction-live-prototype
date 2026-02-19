-- Migration: 004_youtube_video_id.sql
-- Adds youtube_video_id to lots so each live lot can be linked to a YouTube Live stream.

ALTER TABLE public.lots
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;

-- Update sample LIVE seed lots with placeholder video IDs
-- (replace with real YouTube Live stream IDs before going live)
COMMENT ON COLUMN public.lots.youtube_video_id IS
  'YouTube Live video ID. Live auction room uses this to embed the stream. Format: 11-char YouTube video ID.';
