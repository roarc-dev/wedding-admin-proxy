-- 목적: page_id는 내부 고정 키로 유지하고, 공개 URL은 user_url로 분리하여 관리
-- 적용 대상:
-- - public.admin_users (일반 회원가입)
-- - public.naver_admin_accounts (네이버 OAuth 가입)
--
-- IMPORTANT:
-- - user_url은 "날짜(YYMMDD) + user_url" 조합으로 공개 URL이 결정되므로,
--   중복 방지는 (wedding_date, user_url) 단위로만 처리합니다.
-- - 중복을 suffix로 자동 수정하지 않습니다. (중복 입력은 Admin UI에서 차단)

-- 0) 컬럼 추가
alter table public.admin_users
  add column if not exists user_url text;

alter table public.naver_admin_accounts
  add column if not exists user_url text;

-- 1) 입력 규칙(선택): URL-safe 문자만 허용 (소문자 영문/숫자/하이픈)
-- NOTE: 데이터 정합성은 UI에서도 보장하지만, 서버 레벨에서 한 번 더 방어합니다.
-- PostgreSQL에서는 "add constraint if not exists"가 지원되지 않으므로 PL/pgSQL로 처리
do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name = 'admin_users_user_url_format_chk'
  ) then
    alter table public.admin_users
      add constraint admin_users_user_url_format_chk
      check (user_url is null or user_url ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.check_constraints
    where constraint_schema = 'public'
      and constraint_name = 'naver_admin_accounts_user_url_format_chk'
  ) then
    alter table public.naver_admin_accounts
      add constraint naver_admin_accounts_user_url_format_chk
      check (user_url is null or user_url ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  end if;
end $$;

-- 2) 중복 방지 인덱스(테이블 내부): 같은 날짜(wedding_date) 내에서 user_url은 유니크
-- NOTE: wedding_date가 NULL인 경우는 비교 불가하므로, wedding_date가 있을 때만 유니크 적용
create unique index if not exists admin_users_wedding_date_user_url_unique
  on public.admin_users (wedding_date, user_url)
  where wedding_date is not null and user_url is not null;

create unique index if not exists naver_admin_accounts_wedding_date_user_url_unique
  on public.naver_admin_accounts (wedding_date, user_url)
  where wedding_date is not null and user_url is not null;

-- 3) 조회 최적화(선택): user_url 조회용 인덱스
create index if not exists admin_users_user_url_idx
  on public.admin_users (user_url)
  where user_url is not null;

create index if not exists naver_admin_accounts_user_url_idx
  on public.naver_admin_accounts (user_url)
  where user_url is not null;


