-- page_settings 테이블에 venue 좌표 컬럼 추가
-- 실행 전에 기존 데이터 백업을 권장합니다.

-- venue_lat 컬럼 추가 (위도)
ALTER TABLE page_settings 
ADD COLUMN IF NOT EXISTS venue_lat NUMERIC(10, 8);

-- venue_lng 컬럼 추가 (경도)  
ALTER TABLE page_settings 
ADD COLUMN IF NOT EXISTS venue_lng NUMERIC(11, 8);

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN page_settings.venue_lat IS '식장 위도 좌표 (Google Geocoding API 결과)';
COMMENT ON COLUMN page_settings.venue_lng IS '식장 경도 좌표 (Google Geocoding API 결과)';

-- 인덱스 추가 (위치 기반 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_page_settings_venue_coordinates 
ON page_settings (venue_lat, venue_lng) 
WHERE venue_lat IS NOT NULL AND venue_lng IS NOT NULL;

-- 확인 쿼리 (실행 후 확인용)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'page_settings' 
-- AND column_name IN ('venue_lat', 'venue_lng');
