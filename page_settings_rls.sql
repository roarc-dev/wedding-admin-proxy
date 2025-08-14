-- page_settings 테이블을 위한 RLS(Row Level Security) 정책
-- Admin.tsx와 호환되도록 설계

-- 1. RLS 활성화
ALTER TABLE page_settings ENABLE ROW LEVEL SECURITY;

-- 2. 관리자 역할을 위한 함수 생성 (JWT 토큰에서 사용자 정보 추출)
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS TEXT AS $$
BEGIN
  -- JWT 토큰에서 사용자 ID 추출
  RETURN current_setting('request.jwt.claims', true)::json->>'user_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 관리자 권한 확인 함수
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- JWT 토큰이 있고, 사용자 ID가 존재하는 경우 관리자로 간주
  RETURN get_admin_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 공개 읽기 정책 (모든 사용자가 page_id로 조회 가능)
CREATE POLICY "page_settings_public_read" ON page_settings
FOR SELECT USING (true);

-- 5. 관리자 쓰기 정책 (인증된 관리자만 INSERT 가능)
CREATE POLICY "page_settings_admin_insert" ON page_settings
FOR INSERT WITH CHECK (is_admin());

-- 6. 관리자 수정 정책 (인증된 관리자만 UPDATE 가능)
CREATE POLICY "page_settings_admin_update" ON page_settings
FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- 7. 관리자 삭제 정책 (인증된 관리자만 DELETE 가능)
CREATE POLICY "page_settings_admin_delete" ON page_settings
FOR DELETE USING (is_admin());

-- 8. 추가 보안 정책: page_id 유효성 검사
-- page_id는 비어있지 않아야 함
ALTER TABLE page_settings 
ADD CONSTRAINT page_settings_page_id_not_empty 
CHECK (page_id IS NOT NULL AND page_id != '');

-- 9. 추가 보안 정책: 특정 필드의 유효성 검사
-- highlight_shape는 'circle' 또는 'heart'만 허용
ALTER TABLE page_settings 
ADD CONSTRAINT page_settings_highlight_shape_check 
CHECK (highlight_shape IN ('circle', 'heart'));

-- highlight_text_color는 'black' 또는 'white'만 허용
ALTER TABLE page_settings 
ADD CONSTRAINT page_settings_highlight_text_color_check 
CHECK (highlight_text_color IN ('black', 'white'));

-- gallery_type은 'thumbnail' 또는 'slide'만 허용
ALTER TABLE page_settings 
ADD CONSTRAINT page_settings_gallery_type_check 
CHECK (gallery_type IN ('thumbnail', 'slide'));

-- 10. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_page_settings_page_id ON page_settings(page_id);
CREATE INDEX IF NOT EXISTS idx_page_settings_created_at ON page_settings(created_at);
CREATE INDEX IF NOT EXISTS idx_page_settings_updated_at ON page_settings(updated_at);

-- 11. 감사 로그를 위한 트리거 함수 (선택사항)
CREATE OR REPLACE FUNCTION log_page_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- 변경 사항을 별도 테이블에 로그 (선택사항)
  INSERT INTO page_settings_audit_log (
    page_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at
  ) VALUES (
    COALESCE(NEW.page_id, OLD.page_id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_json(NEW) ELSE NULL END,
    get_admin_user_id(),
    NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 감사 로그 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS page_settings_audit_log (
  id SERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 감사 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_page_id ON page_settings_audit_log(page_id);
CREATE INDEX IF NOT EXISTS idx_page_settings_audit_changed_at ON page_settings_audit_log(changed_at);

-- 14. 트리거 생성 (선택사항)
CREATE TRIGGER page_settings_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON page_settings
  FOR EACH ROW EXECUTE FUNCTION log_page_settings_changes();

-- 15. 뷰 생성 (읽기 전용 접근용)
CREATE OR REPLACE VIEW page_settings_public AS
SELECT 
  page_id,
  groom_name_kr,
  groom_name_en,
  bride_name_kr,
  bride_name_en,
  wedding_date,
  wedding_hour,
  wedding_minute,
  venue_name,
  venue_address,
  photo_section_image_url,
  photo_section_overlay_position,
  photo_section_overlay_color,
  highlight_shape,
  highlight_color,
  highlight_text_color,
  gallery_type,
  created_at,
  updated_at
FROM page_settings;

-- 16. 뷰에 대한 RLS 정책
ALTER TABLE page_settings_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_settings_public_view_read" ON page_settings_public
FOR SELECT USING (true);

-- 17. 관리자 전용 뷰 (모든 필드 포함)
CREATE OR REPLACE VIEW page_settings_admin AS
SELECT * FROM page_settings;

-- 18. 관리자 뷰에 대한 RLS 정책
ALTER TABLE page_settings_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_settings_admin_view_read" ON page_settings_admin
FOR SELECT USING (is_admin());

-- 19. 설명 주석 추가
COMMENT ON TABLE page_settings IS '웨딩 페이지 설정 정보 테이블';
COMMENT ON COLUMN page_settings.page_id IS '페이지 고유 식별자';
COMMENT ON COLUMN page_settings.groom_name_kr IS '신랑 한글 이름';
COMMENT ON COLUMN page_settings.groom_name_en IS '신랑 영문 이름';
COMMENT ON COLUMN page_settings.bride_name_kr IS '신부 한글 이름';
COMMENT ON COLUMN page_settings.bride_name_en IS '신부 영문 이름';
COMMENT ON COLUMN page_settings.wedding_date IS '결혼식 날짜';
COMMENT ON COLUMN page_settings.wedding_hour IS '결혼식 시간 (시)';
COMMENT ON COLUMN page_settings.wedding_minute IS '결혼식 시간 (분)';
COMMENT ON COLUMN page_settings.venue_name IS '예식장 이름';
COMMENT ON COLUMN page_settings.venue_address IS '예식장 주소';
COMMENT ON COLUMN page_settings.photo_section_image_url IS '포토섹션 메인 이미지 URL';
COMMENT ON COLUMN page_settings.photo_section_overlay_position IS '포토섹션 오버레이 위치';
COMMENT ON COLUMN page_settings.photo_section_overlay_color IS '포토섹션 오버레이 색상';
COMMENT ON COLUMN page_settings.highlight_shape IS '캘린더 하이라이트 모양 (circle/heart)';
COMMENT ON COLUMN page_settings.highlight_color IS '캘린더 하이라이트 색상';
COMMENT ON COLUMN page_settings.highlight_text_color IS '캘린더 하이라이트 텍스트 색상 (black/white)';
COMMENT ON COLUMN page_settings.gallery_type IS '갤러리 타입 (thumbnail/slide)';

-- 20. 권한 설정
-- 공개 사용자는 읽기만 가능
GRANT SELECT ON page_settings_public TO anon;
GRANT SELECT ON page_settings_public TO authenticated;

-- 인증된 사용자는 관리자 뷰 읽기 가능
GRANT SELECT ON page_settings_admin TO authenticated;

-- 관리자만 전체 테이블 접근 가능
GRANT ALL ON page_settings TO authenticated;
GRANT ALL ON page_settings_audit_log TO authenticated; 