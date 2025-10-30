-- BGM 볼륨 컬럼 추가
ALTER TABLE page_settings 
ADD COLUMN bgm_vol INTEGER DEFAULT 3;

-- 기존 데이터에 기본값 설정 (1-10 범위, 기본값 3)
UPDATE page_settings 
SET bgm_vol = 3 
WHERE bgm_vol IS NULL;

-- 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE page_settings 
ALTER COLUMN bgm_vol SET NOT NULL;

-- 볼륨 범위 체크 제약조건 추가 (1-10)
ALTER TABLE page_settings 
ADD CONSTRAINT bgm_vol_range_check 
CHECK (bgm_vol >= 1 AND bgm_vol <= 10);

-- 코멘트 추가
COMMENT ON COLUMN page_settings.bgm_vol IS 'BGM 볼륨 레벨 (1-10, 기본값 5)';
