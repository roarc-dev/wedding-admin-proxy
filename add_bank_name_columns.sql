-- wedding_contacts 테이블에 예금주 이름 컬럼 추가
ALTER TABLE wedding_contacts 
ADD COLUMN groom_bank_name VARCHAR(255),
ADD COLUMN groom_father_bank_name VARCHAR(255),
ADD COLUMN groom_mother_bank_name VARCHAR(255),
ADD COLUMN bride_bank_name VARCHAR(255),
ADD COLUMN bride_father_bank_name VARCHAR(255),
ADD COLUMN bride_mother_bank_name VARCHAR(255);

-- 컬럼에 대한 코멘트 추가 (선택사항)
COMMENT ON COLUMN wedding_contacts.groom_bank_name IS '신랑 예금주명';
COMMENT ON COLUMN wedding_contacts.groom_father_bank_name IS '신랑 아버지 예금주명';
COMMENT ON COLUMN wedding_contacts.groom_mother_bank_name IS '신랑 어머니 예금주명';
COMMENT ON COLUMN wedding_contacts.bride_bank_name IS '신부 예금주명';
COMMENT ON COLUMN wedding_contacts.bride_father_bank_name IS '신부 아버지 예금주명';
COMMENT ON COLUMN wedding_contacts.bride_mother_bank_name IS '신부 어머니 예금주명';
