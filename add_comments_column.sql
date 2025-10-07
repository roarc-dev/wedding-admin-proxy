-- Add "comments" column to page_settings to control guestbook feature (on/off)
-- Safe to run multiple times: uses IF NOT EXISTS guards

-- 1) Add column with default 'off' and a CHECK constraint to allow only 'on' or 'off'
ALTER TABLE IF EXISTS page_settings
ADD COLUMN IF NOT EXISTS comments TEXT NOT NULL DEFAULT 'off';

-- 2) Ensure constraint exists (Postgres doesn't support IF NOT EXISTS for constraints directly),
-- so create it only when missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'page_settings_comments_on_off_chk'
    ) THEN
        ALTER TABLE page_settings
        ADD CONSTRAINT page_settings_comments_on_off_chk
        CHECK (comments IN ('on','off'));
    END IF;
END $$;

-- 3) Optional: add a comment for documentation
COMMENT ON COLUMN page_settings.comments IS 'Guestbook visibility toggle: on/off (default off)';


