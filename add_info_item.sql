-- 안내 사항 테이블 생성 (info_item)
-- 안내 사항 정보를 저장하는 테이블 (transport_infos 구조 참고)
-- 실행 전에 기존 데이터 백업을 권장합니다.

-- info_item 테이블 생성 (transport_infos와 동일한 구조)
CREATE TABLE IF NOT EXISTS info_item (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    display_order INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (page_id 기준 정렬)
CREATE INDEX IF NOT EXISTS idx_info_item_page_id_order
ON info_item (page_id, display_order);

-- 인덱스 추가 (page_id 기준만)
CREATE INDEX IF NOT EXISTS idx_info_item_page_id
ON info_item (page_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_info_item_updated_at
    BEFORE UPDATE ON info_item
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 설정
ALTER TABLE info_item ENABLE ROW LEVEL SECURITY;

-- 관리자만 읽기/쓰기 가능
CREATE POLICY "Admin can manage info items" ON info_item
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.id = auth.uid()
            AND au.page_id = info_item.page_id
        )
    );

-- 공개 조회는 page_id로만 제한 (인증 없이)
CREATE POLICY "Public can view info items" ON info_item
    FOR SELECT USING (true);

-- 확인 쿼리 (실행 후 확인용)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'info_item'
-- ORDER BY ordinal_position;

-- 샘플 데이터 (테스트용)
-- INSERT INTO info_item (page_id, title, description, display_order)
-- VALUES
--     ('your-page-id-here', '첫 번째 안내 사항', '첫 번째 안내 사항 내용입니다.', 1),
--     ('your-page-id-here', '두 번째 안내 사항', '두 번째 안내 사항 내용입니다.', 2);
