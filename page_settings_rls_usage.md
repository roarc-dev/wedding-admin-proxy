# page_settings RLS 정책 사용 가이드

## 📋 개요

이 문서는 `page_settings` 테이블을 위한 RLS(Row Level Security) 정책의 사용법과 Admin.tsx와의 호환성을 설명합니다.

## 🔐 보안 정책 구조

### 1. 기본 정책
- **공개 읽기**: 모든 사용자가 `page_id`로 설정을 조회 가능
- **관리자 쓰기**: 인증된 관리자만 INSERT/UPDATE/DELETE 가능
- **서비스 역할**: API 서버는 모든 권한을 가짐

### 2. 인증 방식
- **JWT 토큰**: Admin.tsx에서 사용하는 Base64 인코딩된 토큰
- **서비스 키**: Supabase 서비스 키를 통한 API 서버 접근
- **프록시 서버**: Vercel 프록시를 통한 접근

## 🚀 설치 방법

### 1. 기본 RLS 정책 적용
```sql
-- Supabase SQL Editor에서 실행
\i page_settings_rls.sql
```

### 2. Admin.tsx 호환 정책 적용
```sql
-- 추가 정책 적용
\i page_settings_rls_extended.sql
```

## 🔧 Admin.tsx와의 호환성

### 1. 인증 토큰 구조
Admin.tsx에서 사용하는 토큰 구조:
```javascript
{
  userId: "user_id",
  username: "username", 
  expires: Date.now() + 24 * 60 * 60 * 1000
}
```

### 2. API 호출 방식
```javascript
// Admin.tsx에서 사용하는 방식
const response = await fetch(`${PROXY_BASE_URL}/api/page-settings`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}` // Base64 인코딩된 토큰
  },
  body: JSON.stringify({
    pageId: "page_id",
    settings: { ... }
  })
});
```

## 📊 테스트 방법

### 1. 공개 읽기 테스트
```sql
-- 익명 사용자로 읽기 테스트
SELECT * FROM page_settings WHERE page_id = 'test_page';
```

### 2. 관리자 인증 테스트
```sql
-- JWT 토큰으로 인증된 사용자 테스트
-- (실제 환경에서는 Admin.tsx를 통해 테스트)
```

### 3. API 서버 테스트
```javascript
// API 서버를 통한 접근 테스트
const { data, error } = await supabase
  .from('page_settings')
  .select('*')
  .eq('page_id', 'test_page');
```

## 🛡️ 보안 기능

### 1. 데이터 유효성 검사
- `page_id` 필수 입력
- `highlight_shape`: 'circle' 또는 'heart'만 허용
- `highlight_text_color`: 'black' 또는 'white'만 허용
- `gallery_type`: 'thumbnail' 또는 'slide'만 허용

### 2. 감사 로그
모든 변경사항이 `page_settings_audit_log` 테이블에 기록됩니다:
- 변경 전/후 데이터
- 변경자 정보
- 클라이언트 IP
- 변경 시간

### 3. 통계 뷰
관리자용 통계 정보:
```sql
SELECT * FROM page_settings_stats;
```

## 🔍 문제 해결

### 1. 권한 오류 발생 시
```sql
-- 현재 사용자 확인
SELECT current_user, current_setting('role');

-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'page_settings';
```

### 2. 토큰 검증 실패 시
```sql
-- 토큰 검증 함수 테스트
SELECT validate_admin_token('your_base64_token');
```

### 3. 감사 로그 확인
```sql
-- 최근 변경사항 확인
SELECT * FROM page_settings_audit_log 
ORDER BY changed_at DESC 
LIMIT 10;
```

## 📈 성능 최적화

### 1. 인덱스
다음 인덱스가 자동으로 생성됩니다:
- `idx_page_settings_page_id`: 페이지 ID 검색 최적화
- `idx_page_settings_created_at`: 생성일 검색 최적화
- `idx_page_settings_updated_at`: 수정일 검색 최적화

### 2. 뷰 활용
- `page_settings_public`: 공개 읽기용
- `page_settings_admin`: 관리자용
- `page_settings_stats`: 통계용

## 🔄 마이그레이션

### 1. 기존 데이터 보존
```sql
-- 기존 데이터 백업
CREATE TABLE page_settings_backup AS 
SELECT * FROM page_settings;

-- RLS 적용 후 데이터 확인
SELECT COUNT(*) FROM page_settings;
```

### 2. 정책 업데이트
```sql
-- 기존 정책 삭제 후 새 정책 적용
DROP POLICY IF EXISTS "page_settings_admin_insert" ON page_settings;
-- 새 정책 적용 (page_settings_rls_extended.sql 참조)
```

## 📝 주의사항

### 1. 토큰 만료
- Admin.tsx의 토큰은 24시간 후 만료
- 만료된 토큰으로는 접근 불가

### 2. 서비스 키 보안
- Supabase 서비스 키는 안전하게 보관
- 클라이언트 사이드에 노출 금지

### 3. 감사 로그 크기
- 감사 로그는 시간이 지나면 크기가 커질 수 있음
- 주기적인 로그 정리 권장

## 🎯 모니터링

### 1. 접근 로그 확인
```sql
-- 최근 접근 기록
SELECT 
  page_id,
  action,
  changed_by,
  changed_at,
  client_ip
FROM page_settings_audit_log 
WHERE changed_at > NOW() - INTERVAL '24 hours'
ORDER BY changed_at DESC;
```

### 2. 통계 확인
```sql
-- 페이지 설정 통계
SELECT * FROM page_settings_stats;
```

## 🔗 관련 파일

- `page_settings_rls.sql`: 기본 RLS 정책
- `page_settings_rls_extended.sql`: Admin.tsx 호환 정책
- `api/page-settings.js`: API 엔드포인트
- `FramerComponent/Admin.tsx`: 관리자 인터페이스

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 로그 확인
2. 감사 로그 테이블 확인
3. 토큰 유효성 검사
4. 네트워크 연결 상태 