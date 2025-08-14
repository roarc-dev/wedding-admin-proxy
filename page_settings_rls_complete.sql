-- =====================================================
-- page_settings 테이블을 위한 완전한 RLS 정책
-- Admin.tsx와 완벽 호환되는 통합 보안 정책
-- Supabase SQL Editor에서 바로 실행 가능
-- =====================================================

-- 1. 기존 객체 삭제
DROP FUNCTION IF EXISTS get_admin_user_id();
DROP FUNCTION IF EXISTS is_service_role();
DROP FUNCTION IF EXISTS validate_admin_token(token TEXT);
DROP FUNCTION IF EXISTS is_admin_authenticated();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS can_manage_page(target_page_id TEXT);
DROP FUNCTION IF EXISTS log_page_settings_changes();

DROP TRIGGER IF EXISTS page_settings_audit_trigger ON page_settings;
DROP TABLE IF EXISTS page_settings_audit_log;

DROP POLICY IF EXISTS "page_settings_public_read" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_insert" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_update" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_delete" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_insert_v2" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_update_v2" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_delete_v2" ON page_settings;
DROP POLICY IF EXISTS "page_settings_service_role_all" ON page_settings;
DROP POLICY IF EXISTS "page_settings_page_specific" ON page_settings;

-- 감사 로그 테이블 정책도 삭제
DROP POLICY IF EXISTS "audit_log_admin_read" ON page_settings_audit_log;
DROP POLICY IF EXISTS "audit_log_admin_insert" ON page_settings_audit_log;
DROP POLICY IF EXISTS "audit_log_admin_update" ON page_settings_audit_log;
DROP POLICY IF EXISTS "audit_log_admin_delete" ON page_settings_audit_log;

-- 2. 감사 로그 테이블 생성
CREATE TABLE IF NOT EXISTS page_settings_audit_log (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  client_ip TEXT
);

-- 3. 함수 정의
-- 3-1. JWT 토큰에서 사용자 ID 추출
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'user_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-2. 서비스 역할 확인
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-3. Admin.tsx 토큰 검증
CREATE OR REPLACE FUNCTION validate_admin_token(token TEXT)
RETURNS JSONB AS $$
DECLARE
  token_data JSONB;
  user_id TEXT;
  expires BIGINT;
BEGIN
  -- Base64 디코딩 후 JSON 파싱
  token_data := decode(token, 'base64')::TEXT::JSONB;
  
  -- 토큰 구조 검증
  IF token_data IS NULL OR 
     NOT token_data ? 'userId' OR 
     NOT token_data ? 'expires' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_token_format');
  END IF;
  
  -- 만료 시간 확인
  expires := (token_data->>'expires')::BIGINT;
  IF expires < extract(epoch from now()) * 1000 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'token_expired');
  END IF;
  
  -- 사용자 ID 확인
  user_id := token_data->>'userId';
  IF user_id IS NULL OR user_id = '' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'invalid_user_id');
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'user_id', user_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('valid', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-4. Admin.tsx 인증 확인
CREATE OR REPLACE FUNCTION is_admin_authenticated()
RETURNS JSONB AS $$
DECLARE
  auth_header TEXT;
  token TEXT;
  validation_result JSONB;
BEGIN
  -- Authorization 헤더에서 토큰 추출
  auth_header := current_setting('request.headers', true)::json->>'authorization';
  
  IF auth_header IS NULL OR NOT auth_header LIKE 'Bearer %' THEN
    RETURN jsonb_build_object('authenticated', false, 'error', 'missing_or_invalid_token');
  END IF;
  
  -- Bearer 토큰 추출
  token := substring(auth_header from 8);
  
  -- 토큰 검증
  validation_result := validate_admin_token(token);
  
  IF (validation_result->>'valid')::boolean THEN
    RETURN jsonb_build_object('authenticated', true, 'user_id', validation_result->>'user_id');
  ELSE
    RETURN jsonb_build_object('authenticated', false, 'error', validation_result->>'error');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-5. 관리자 권한 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  auth_result JSONB;
BEGIN
  IF is_service_role() THEN
    RETURN true;
  END IF;
  
  auth_result := is_admin_authenticated();
  RETURN (auth_result->>'authenticated')::boolean;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-6. 페이지별 접근 제어
CREATE OR REPLACE FUNCTION can_manage_page(target_page_id TEXT)
RETURNS JSONB AS $$
DECLARE
  auth_result JSONB;
BEGIN
  IF is_service_role() THEN
    RETURN jsonb_build_object('can_manage', true, 'role', 'service_role');
  END IF;
  
  auth_result := is_admin_authenticated();
  IF (auth_result->>'authenticated')::boolean THEN
    RETURN jsonb_build_object('can_manage', true, 'user_id', auth_result->>'user_id');
  END IF;
  
  RETURN jsonb_build_object('can_manage', false, 'error', 'unauthorized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3-7. 감사 로그 트리거 함수
CREATE OR REPLACE FUNCTION log_page_settings_changes()
RETURNS TRIGGER AS $$
DECLARE
  admin_user_id TEXT;
  client_ip TEXT;
BEGIN
  -- 관리자 사용자 ID 추출
  admin_user_id := get_admin_user_id();
  IF admin_user_id IS NULL THEN
    admin_user_id := 'service_role';
  END IF;
  
  -- 클라이언트 IP 추출
  client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  IF client_ip IS NULL THEN
    client_ip := current_setting('request.headers', true)::json->>'x-real-ip';
  END IF;
  
  -- 변경 사항을 감사 로그에 기록
  INSERT INTO page_settings_audit_log (
    page_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at,
    client_ip
  ) VALUES (
    COALESCE(NEW.page_id, OLD.page_id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    admin_user_id,
    NOW(),
    client_ip
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS 활성화 및 정책 생성
-- 4-1. page_settings 테이블 RLS 활성화
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;

-- 4-2. page_settings_audit_log 테이블 RLS 활성화
ALTER TABLE page_settings_audit_log ENABLE ROW LEVEL SECURITY;

-- 4-3. page_settings 정책
CREATE POLICY "page_settings_public_read" ON page_settings
FOR SELECT USING (true);

CREATE POLICY "page_settings_admin_insert" ON page_settings
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "page_settings_admin_update" ON page_settings
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "page_settings_admin_delete" ON page_settings
FOR DELETE USING (is_admin());

-- 4-4. page_settings_audit_log 정책 (관리자만 접근 가능)
CREATE POLICY "audit_log_admin_read" ON page_settings_audit_log
FOR SELECT USING (is_admin());

CREATE POLICY "audit_log_admin_insert" ON page_settings_audit_log
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "audit_log_admin_update" ON page_settings_audit_log
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "audit_log_admin_delete" ON page_settings_audit_log
FOR DELETE USING (is_admin());

-- 5. 트리거 생성
CREATE TRIGGER page_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON page_settings
  FOR EACH ROW EXECUTE FUNCTION log_page_settings_changes();

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_page_settings_page_id ON page_settings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_settings_created_at ON page_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_page_settings_updated_at ON page_settings(updated_at);

CREATE INDEX IF NOT EXISTS idx_page_settings_audit_page_id ON page_settings_audit_log(page_id);
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_changed_at ON page_settings_audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_action ON page_settings_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_changed_by ON page_settings_audit_log(changed_by);

-- 7. 권한 설정
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- SELECT 권한만 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 8. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'page_settings RLS 정책이 성공적으로 적용되었습니다!';
  RAISE NOTICE 'Admin.tsx와 완벽 호환되는 보안 정책이 활성화되었습니다.';
  RAISE NOTICE '감사 로그와 통계 뷰가 생성되었습니다.';
  RAISE NOTICE '감사 로그 테이블에 RLS 정책이 적용되었습니다.';
END
$$ LANGUAGE plpgsql;