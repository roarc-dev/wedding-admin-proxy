-- bgm 컬럼을 NULL 허용으로 변경
-- NOT NULL 제약조건으로 인한 문제 해결

-- 1) 기존 NULL 값이 있으면 기본값 'off'로 설정 (안전장치)
UPDATE page_settings 
SET bgm = 'off'
WHERE bgm IS NULL;

-- 2) NOT NULL 제약조건 제거
ALTER TABLE page_settings 
ALTER COLUMN bgm DROP NOT NULL;

-- 3) CHECK 제약조건은 유지 (NULL 또는 'on'/'off'만 허용)
-- 기존 CHECK 제약조건이 있으면 유지, 없으면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'page_settings_bgm_check'
    ) THEN
        ALTER TABLE page_settings
        ADD CONSTRAINT page_settings_bgm_check
        CHECK (bgm IS NULL OR bgm IN ('on', 'off'));
    END IF;
END $$;

-- 4) 코멘트 업데이트
COMMENT ON COLUMN page_settings.bgm IS 'BGM 토글: on/off (NULL 허용, 기본값 off)';


