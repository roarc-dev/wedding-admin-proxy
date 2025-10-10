-- 토글 기능을 위한 컬럼 추가
-- 안내사항, 계좌안내, 배경음악 섹션의 on/off 상태를 저장

ALTER TABLE page_settings 
ADD COLUMN IF NOT EXISTS info VARCHAR(10) DEFAULT 'off' CHECK (info IN ('on', 'off')),
ADD COLUMN IF NOT EXISTS account VARCHAR(10) DEFAULT 'off' CHECK (account IN ('on', 'off')),
ADD COLUMN IF NOT EXISTS bgm VARCHAR(10) DEFAULT 'off' CHECK (bgm IN ('on', 'off'));

-- 기존 레코드의 기본값 설정
UPDATE page_settings 
SET 
    info = 'off',
    account = 'off', 
    bgm = 'off'
WHERE info IS NULL OR account IS NULL OR bgm IS NULL;

-- 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE page_settings 
ALTER COLUMN info SET NOT NULL,
ALTER COLUMN account SET NOT NULL,
ALTER COLUMN bgm SET NOT NULL;

-- 인덱스 추가 (선택사항 - 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_page_settings_info ON page_settings(info);
CREATE INDEX IF NOT EXISTS idx_page_settings_account ON page_settings(account);
CREATE INDEX IF NOT EXISTS idx_page_settings_bgm ON page_settings(bgm);
