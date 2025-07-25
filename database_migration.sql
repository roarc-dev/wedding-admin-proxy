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
