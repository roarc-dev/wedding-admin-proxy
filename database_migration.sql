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

-- invite_cards 테이블에 아들/딸 호칭 커스텀 컬럼 추가
ALTER TABLE invite_cards
ADD COLUMN IF NOT EXISTS son_label TEXT DEFAULT '아들',
ADD COLUMN IF NOT EXISTS daughter_label TEXT DEFAULT '딸';
