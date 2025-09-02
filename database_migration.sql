-- 수정된 Supabase SQL 스크립트 생성
-- 기존 테이블에 새로운 컬럼들 추가
ALTER TABLE page_settings 
ADD COLUMN IF NOT EXISTS groom_name_kr TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_name_en TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_name_kr TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_name_en TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS wedding_hour TEXT DEFAULT '14',
ADD COLUMN IF NOT EXISTS wedding_minute TEXT DEFAULT '00',
ADD COLUMN IF NOT EXISTS venue_name TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS venue_address TEXT DEFAULT '';

-- 기존 컬럼들을 새로운 구조로 마이그레이션
-- groom_name -> groom_name_kr로 이동
UPDATE page_settings 
SET groom_name_kr = groom_name 
WHERE groom_name IS NOT NULL AND groom_name_kr = '';

-- bride_name -> bride_name_kr로 이동  
UPDATE page_settings 
SET bride_name_kr = bride_name 
WHERE bride_name IS NOT NULL AND bride_name_kr = '';

-- wedding_location -> venue_name으로 이동
UPDATE page_settings 
SET venue_name = wedding_location 
WHERE wedding_location IS NOT NULL AND venue_name = '';

-- wedding_time을 wedding_hour와 wedding_minute으로 분리 (TIME 타입 처리)
UPDATE page_settings 
SET 
  wedding_hour = CASE 
    WHEN wedding_time IS NOT NULL THEN LPAD(EXTRACT(HOUR FROM wedding_time)::TEXT, 2, '0')
    ELSE '14'
  END,
  wedding_minute = CASE 
    WHEN wedding_time IS NOT NULL THEN LPAD(EXTRACT(MINUTE FROM wedding_time)::TEXT, 2, '0')
    ELSE '00'
  END
WHERE wedding_time IS NOT NULL;

-- wedding_contacts 테이블에 계좌 정보 필드 추가
ALTER TABLE wedding_contacts
ADD COLUMN IF NOT EXISTS groom_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_bank TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_father_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_father_bank TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_mother_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS groom_mother_bank TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_bank TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_father_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_father_bank TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_mother_account TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS bride_mother_bank TEXT DEFAULT '';

-- page_settings 테이블에 하이라이트 설정 필드 추가
ALTER TABLE page_settings
ADD COLUMN IF NOT EXISTS highlight_shape TEXT DEFAULT 'circle' CHECK (highlight_shape IN ('circle', 'heart')),
ADD COLUMN IF NOT EXISTS highlight_color TEXT DEFAULT '#e0e0e0',
ADD COLUMN IF NOT EXISTS highlight_text_color TEXT DEFAULT 'black' CHECK (highlight_text_color IN ('black', 'white')),
ADD COLUMN IF NOT EXISTS gallery_type TEXT DEFAULT 'thumbnail' CHECK (gallery_type IN ('thumbnail', 'slide'));

-- invite_cards 테이블에 호칭 필드 추가
ALTER TABLE invite_cards
ADD COLUMN IF NOT EXISTS son_label TEXT DEFAULT '아들',
ADD COLUMN IF NOT EXISTS daughter_label TEXT DEFAULT '딸';

-- =====================================================
-- GROOM/BRIDE NAME 동기화 마이그레이션 (Trigger 방식)
-- page_settings.groom_name_kr ↔ invite_cards.groom_name 자동 동기화
-- =====================================================

-- 1. 기존 groom_name, bride_name 컬럼명을 백업
ALTER TABLE invite_cards
ADD COLUMN IF NOT EXISTS groom_name_old TEXT,
ADD COLUMN IF NOT EXISTS bride_name_old TEXT;

-- 2. 기존 데이터 백업 (안전하게 보존)
UPDATE invite_cards
SET groom_name_old = groom_name,
    bride_name_old = bride_name
WHERE groom_name IS NOT NULL OR bride_name IS NOT NULL;

-- 3. 기존 데이터로 현재 값 설정 (초기 동기화)
UPDATE invite_cards
SET groom_name = COALESCE(
    (SELECT groom_name_kr FROM page_settings WHERE page_id = invite_cards.page_id LIMIT 1),
    groom_name_old,
    groom_name
)
WHERE page_id IN (SELECT page_id FROM page_settings);

UPDATE invite_cards
SET bride_name = COALESCE(
    (SELECT bride_name_kr FROM page_settings WHERE page_id = invite_cards.page_id LIMIT 1),
    bride_name_old,
    bride_name
)
WHERE page_id IN (SELECT page_id FROM page_settings);

-- 4. Trigger Function 생성 (page_settings 변경 시 invite_cards 자동 업데이트)
CREATE OR REPLACE FUNCTION sync_groom_bride_names()
RETURNS TRIGGER AS $$
BEGIN
    -- groom_name_kr이 변경되었을 때
    IF (OLD.groom_name_kr IS DISTINCT FROM NEW.groom_name_kr) THEN
        UPDATE invite_cards
        SET groom_name = NEW.groom_name_kr
        WHERE page_id = NEW.page_id;
    END IF;

    -- bride_name_kr이 변경되었을 때
    IF (OLD.bride_name_kr IS DISTINCT FROM NEW.bride_name_kr) THEN
        UPDATE invite_cards
        SET bride_name = NEW.bride_name_kr
        WHERE page_id = NEW.page_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger 생성 (page_settings 업데이트 시 자동 실행)
DROP TRIGGER IF EXISTS trigger_sync_groom_bride_names ON page_settings;
CREATE TRIGGER trigger_sync_groom_bride_names
    AFTER UPDATE ON page_settings
    FOR EACH ROW
    EXECUTE FUNCTION sync_groom_bride_names();

-- 6. 인덱스 생성으로 성능 향상
CREATE INDEX IF NOT EXISTS idx_invite_cards_page_id ON invite_cards(page_id);
CREATE INDEX IF NOT EXISTS idx_page_settings_page_id ON page_settings(page_id);

-- 7. 데이터 검증 쿼리 (마이그레이션 후 실행 권장)
-- 다음 쿼리로 데이터 일치 확인 가능:
-- SELECT
--     ic.page_id,
--     ic.groom_name,
--     ps.groom_name_kr,
--     ic.bride_name,
--     ps.bride_name_kr,
--     CASE WHEN ic.groom_name = ps.groom_name_kr THEN '✅' ELSE '❌' END as groom_match,
--     CASE WHEN ic.bride_name = ps.bride_name_kr THEN '✅' ELSE '❌' END as bride_match
-- FROM invite_cards ic
-- LEFT JOIN page_settings ps ON ic.page_id = ps.page_id
-- LIMIT 10;
