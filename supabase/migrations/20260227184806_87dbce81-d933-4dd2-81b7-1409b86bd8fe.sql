-- Add page cataloging to media assets (nullable to avoid breaking existing rows)
ALTER TABLE public.media_assets
ADD COLUMN IF NOT EXISTS page text;

-- Constrain allowed values (NULL allowed for legacy/unassigned)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'media_assets_page_allowed'
  ) THEN
    ALTER TABLE public.media_assets
    ADD CONSTRAINT media_assets_page_allowed
    CHECK (page IS NULL OR page IN ('eden','locanda','masseria'));
  END IF;
END $$;

-- Helpful index for admin filtering
CREATE INDEX IF NOT EXISTS idx_media_assets_page_created_at
ON public.media_assets (page, created_at DESC);