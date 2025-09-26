-- 카카오톡 공유 관련 컬럼 추가
ALTER TABLE public.page_settings
ADD COLUMN kko_img text DEFAULT '',
ADD COLUMN kko_title text DEFAULT '',
ADD COLUMN kko_date text DEFAULT '';

-- 기본값 설정: 카카오톡 공유가 활성화되면 자동으로 기본값이 설정되도록 함
-- 하지만 초기 데이터는 빈 문자열로 유지
