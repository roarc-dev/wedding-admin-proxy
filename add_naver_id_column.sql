-- admin_users 테이블에 네이버 OAuth 식별자 컬럼 추가
-- - 네이버 로그인(nid.me) 응답의 response.id 값을 저장합니다.
-- - NULL 허용 + 값이 있는 경우에만 unique 강제(부분 인덱스)로 운영합니다.

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS naver_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_naver_id_unique
ON admin_users (naver_id)
WHERE naver_id IS NOT NULL;

COMMENT ON COLUMN admin_users.naver_id IS '네이버 OAuth 식별자 (nid.naver.com /v1/nid/me response.id)';


