-- admin_users 테이블에 예식 일자, 신랑 영문 이름, 신부 영문 이름 컬럼 추가
-- 회원가입 시 임시 저장용 필드들

ALTER TABLE admin_users 
ADD COLUMN wedding_date DATE,
ADD COLUMN groom_name_en TEXT,
ADD COLUMN bride_name_en TEXT;

-- 컬럼에 코멘트 추가
COMMENT ON COLUMN admin_users.wedding_date IS '예식 일자 (회원가입 시 입력)';
COMMENT ON COLUMN admin_users.groom_name_en IS '신랑 영문 이름 (회원가입 시 입력)';
COMMENT ON COLUMN admin_users.bride_name_en IS '신부 영문 이름 (회원가입 시 입력)';
