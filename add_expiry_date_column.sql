-- admin_users 테이블에 만료 기간 컬럼 추가
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 만료 기간 컬럼에 주석 추가
COMMENT ON COLUMN admin_users.expiry_date IS '서비스 만료 기간 (이 날짜 이후 서비스 이용 불가)';

-- 만료된 사용자를 확인하는 뷰 생성 (선택사항)
CREATE OR REPLACE VIEW expired_users AS
SELECT 
    id,
    username,
    name,
    page_id,
    expiry_date,
    CASE 
        WHEN expiry_date IS NULL THEN '만료 기간 없음'
        WHEN expiry_date < CURRENT_DATE THEN '만료됨'
        WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN '곧 만료'
        ELSE '활성'
    END as expiry_status,
    expiry_date - CURRENT_DATE as days_until_expiry
FROM admin_users
WHERE is_active = true
ORDER BY expiry_date ASC NULLS LAST;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_admin_users_expiry_date 
ON admin_users(expiry_date) 
WHERE expiry_date IS NOT NULL;

-- 만료 상태별 카운트 확인 쿼리 (테스트용)
-- SELECT 
--     COUNT(*) FILTER (WHERE expiry_date IS NULL) as no_expiry,
--     COUNT(*) FILTER (WHERE expiry_date >= CURRENT_DATE) as active,
--     COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) as expired,
--     COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND expiry_date >= CURRENT_DATE) as expiring_soon
-- FROM admin_users
-- WHERE is_active = true;
