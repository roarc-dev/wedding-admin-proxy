-- 성함 입력을 성과 이름으로 분리하기 위한 컬럼 추가
ALTER TABLE page_settings 
ADD COLUMN last_groom_name_kr TEXT,
ADD COLUMN last_bride_name_kr TEXT,
ADD COLUMN last_groom_name_en TEXT,
ADD COLUMN last_bride_name_en TEXT;
