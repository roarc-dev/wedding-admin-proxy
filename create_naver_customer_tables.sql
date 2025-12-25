-- 네이버 OAuth 기반 사용자(=naver_id) 전용 테이블
-- 목표:
-- 1) naver_id로 최초 로그인 시 계정 레코드를 만들고,
-- 2) 최초 1회 "코드 입력"으로 page_id(초대장 식별자)와 매핑,
-- 3) 이후에는 naver_id → page_id로 바로 편집 화면 진입.
--
-- NOTE:
-- - naver 흐름에서는 page_settings에 "기본 날짜/신랑신부 이름"을 생성/주입하지 않습니다.
-- - page_settings는 page_id 기반 단일 설정 테이블로 유지(추천). naver는 page_id가 확정된 뒤에만 접근합니다.

-- 1) 네이버 계정 테이블 (로그인 세션의 주체)
CREATE TABLE IF NOT EXISTS public.naver_admin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  naver_id text NOT NULL UNIQUE,
  -- 코드 입력 완료 후 매핑되는 초대장 식별자
  page_id text UNIQUE,
  code_redeemed_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.naver_admin_accounts IS '네이버 OAuth 사용자 계정(=naver_id)과 page_id 매핑';
COMMENT ON COLUMN public.naver_admin_accounts.naver_id IS '네이버 /v1/nid/me response.id';
COMMENT ON COLUMN public.naver_admin_accounts.page_id IS '편집 대상 초대장 식별자 (page_settings.page_id 등과 연결)';

-- 2) 코드 테이블 (page_id 연결을 위한 1회성 코드)
-- 운영 방식 예시:
-- - 코드(code)는 스토어 구매 후 제공되는 문자열
-- - 코드 1개는 page_id 1개에 대응
-- - 1회만 사용 가능(used_at으로 보호)
CREATE TABLE IF NOT EXISTS public.naver_redeem_codes (
  code text PRIMARY KEY,
  -- 구매/발송 시점에 외부 프로그램이 할당 (사전 코드 풀 운영을 위해 NULL 허용)
  page_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  used_by_naver_id text,
  used_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS naver_redeem_codes_page_id_unique
ON public.naver_redeem_codes (page_id)
WHERE page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS naver_redeem_codes_used_by_idx
ON public.naver_redeem_codes (used_by_naver_id);

COMMENT ON TABLE public.naver_redeem_codes IS '네이버 사용자 최초 코드 입력용(1회성) 코드→page_id 매핑';


