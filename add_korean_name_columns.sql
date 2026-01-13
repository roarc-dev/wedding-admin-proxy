-- admin_users 테이블에 신랑/신부 이름 컬럼 추가
-- 한글 성/이름과 영문 성/이름을 저장하기 위한 컬럼

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS last_groom_name_kr TEXT,
ADD COLUMN IF NOT EXISTS groom_name_kr TEXT,
ADD COLUMN IF NOT EXISTS last_groom_name_en TEXT,
ADD COLUMN IF NOT EXISTS groom_name_en TEXT,
ADD COLUMN IF NOT EXISTS last_bride_name_kr TEXT,
ADD COLUMN IF NOT EXISTS bride_name_kr TEXT,
ADD COLUMN IF NOT EXISTS last_bride_name_en TEXT,
ADD COLUMN IF NOT EXISTS bride_name_en TEXT;
