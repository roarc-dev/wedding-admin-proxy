-- Admin.tsx와 호환되는 추가 RLS 정책
-- API 서버와 프록시 서버를 통한 접근을 고려한 정책

-- 1. API 서버용 서비스 계정 권한 설정
-- Supabase 서비스 키를 사용하는 API 서버는 모든 권한을 가짐
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- 서비스 역할 확인 (service_role 키로 접근하는 경우)
  RETURN current_setting('role') = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. API 서버를 위한 정책 수정 (서비스 역할 우선)
CREATE POLICY "page_settings_service_role_all" ON page_settings
FOR ALL USING (is_service_role());

-- 3. 프록시 서버를 통한 접근을 위한 정책
-- 특정 IP나 도메인에서의 접근을 허용하는 정책 (선택사항)
CREATE OR REPLACE FUNCTION is_trusted_proxy()
RETURNS BOOLEAN AS $$
BEGIN
  -- 프록시 서버의 IP나 특정 헤더를 확인
  -- 실제 환경에 맞게 수정 필요
  RETURN true; -- 임시로 모든 접근 허용
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin.tsx의 인증 토큰 검증을 위한 함수
CREATE OR REPLACE FUNCTION validate_admin_token(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  token_data JSONB;
  user_id TEXT;
  expires BIGINT;
BEGIN
  -- Base64 디코딩
  token_data := jsonb_parse(decode(token, 'base64'));
  
  -- 토큰 구조 검증
  IF token_data IS NULL OR 
     NOT token_data ? 'userId' OR 
     NOT token_data ? 'expires' THEN
    RETURN FALSE;
  END IF;
  
  -- 만료 시간 확인
  expires := (token_data->>'expires')::BIGINT;
  IF expires < extract(epoch from now()) * 1000 THEN
    RETURN FALSE;
  END IF;
  
  -- 사용자 ID 확인
  user_id := token_data->>'userId';
  IF user_id IS NULL OR user_id = '' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Admin.tsx 호환 인증 함수
CREATE OR REPLACE FUNCTION is_admin_authenticated()
RETURNS BOOLEAN AS $$
DECLARE
  auth_header TEXT;
  token TEXT;
BEGIN
  -- Authorization 헤더에서 토큰 추출
  auth_header := current_setting('request.headers', true)::json->>'authorization';
  
  IF auth_header IS NULL OR NOT auth_header LIKE 'Bearer %' THEN
    RETURN FALSE;
  END IF;
  
  -- Bearer 토큰 추출
  token := substring(auth_header from 8);
  
  -- 토큰 검증
  RETURN validate_admin_token(token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Admin.tsx 호환 정책 (기존 정책 대체)
DROP POLICY IF EXISTS "page_settings_admin_insert" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_update" ON page_settings;
DROP POLICY IF EXISTS "page_settings_admin_delete" ON page_settings;

-- 새로운 Admin.tsx 호환 정책
CREATE POLICY "page_settings_admin_insert_v2" ON page_settings
FOR INSERT WITH CHECK (
  is_service_role() OR 
  is_admin_authenticated()
);

CREATE POLICY "page_settings_admin_update_v2" ON page_settings
FOR UPDATE USING (
  is_service_role() OR 
  is_admin_authenticated()
) WITH CHECK (
  is_service_role() OR 
  is_admin_authenticated()
);

CREATE POLICY "page_settings_admin_delete_v2" ON page_settings
FOR DELETE USING (
  is_service_role() OR 
  is_admin_authenticated()
);

-- 7. 페이지별 접근 제어 (선택사항)
-- 특정 페이지에 대한 관리자 권한 확인
CREATE OR REPLACE FUNCTION can_manage_page(target_page_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 서비스 역할은 모든 페이지 관리 가능
  IF is_service_role() THEN
    RETURN TRUE;
  END IF;
  
  -- 인증된 관리자는 모든 페이지 관리 가능 (현재 구현)
  -- 필요시 특정 페이지만 관리하도록 제한 가능
  IF is_admin_authenticated() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 페이지별 정책 (선택사항)
CREATE POLICY "page_settings_page_specific" ON page_settings
FOR ALL USING (
  can_manage_page(page_id)
);

-- 9. 감사 로그 개선
CREATE OR REPLACE FUNCTION log_page_settings_changes_v2()
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
  
  -- 클라이언트 IP 추출 (선택사항)
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
    CASE WHEN TG_OP = 'DELETE' THEN to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_json(NEW) ELSE NULL END,
    admin_user_id,
    NOW(),
    client_ip
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 감사 로그 테이블 개선
ALTER TABLE page_settings_audit_log 
ADD COLUMN IF NOT EXISTS client_ip TEXT;

-- 11. 트리거 업데이트
DROP TRIGGER IF EXISTS page_settings_audit_trigger ON page_settings;
CREATE TRIGGER page_settings_audit_trigger_v2
  AFTER INSERT OR UPDATE OR DELETE ON page_settings
  FOR EACH ROW EXECUTE FUNCTION log_page_settings_changes_v2();

-- 12. 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_action ON page_settings_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_changed_by ON page_settings_audit_log(changed_by);

-- 13. 통계 뷰 생성 (관리자용)
CREATE OR REPLACE VIEW page_settings_stats AS
SELECT 
  COUNT(*) as total_pages,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '24 hours' THEN 1 END) as recently_updated,
  COUNT(CASE WHEN wedding_date IS NOT NULL THEN 1 END) as with_wedding_date,
  COUNT(CASE WHEN venue_name IS NOT NULL AND venue_name != '' THEN 1 END) as with_venue,
  COUNT(CASE WHEN photo_section_image_url IS NOT NULL AND photo_section_image_url != '' THEN 1 END) as with_photo_section
FROM page_settings;

-- 14. 통계 뷰에 대한 RLS 정책
ALTER TABLE page_settings_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_settings_stats_admin_read" ON page_settings_stats
FOR SELECT USING (is_service_role() OR is_admin_authenticated());

-- 15. 권한 설정 업데이트
GRANT SELECT ON page_settings_stats TO authenticated;

-- 16. 설명 주석 업데이트
COMMENT ON FUNCTION is_admin_authenticated() IS 'Admin.tsx의 인증 토큰을 검증하는 함수';
COMMENT ON FUNCTION validate_admin_token() IS 'Base64 인코딩된 JWT 토큰을 검증하는 함수';
COMMENT ON FUNCTION can_manage_page() IS '특정 페이지에 대한 관리 권한을 확인하는 함수';
COMMENT ON VIEW page_settings_stats IS '페이지 설정 통계 뷰 (관리자용)'; 