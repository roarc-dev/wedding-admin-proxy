# page_settings RLS 정책 적용 가이드

## 🚀 빠른 시작

### 1. Supabase SQL Editor에서 실행
```sql
-- page_settings_rls_complete.sql 파일의 전체 내용을 복사하여
-- Supabase SQL Editor에 붙여넣고 실행하세요
```

### 2. 실행 확인
실행 후 다음 메시지가 나타나면 성공입니다:
```
NOTICE: page_settings RLS 정책이 성공적으로 적용되었습니다!
NOTICE: Admin.tsx와 완벽 호환되는 보안 정책이 활성화되었습니다.
NOTICE: 감사 로그와 통계 뷰가 생성되었습니다.
```

## 🔐 보안 정책 요약

### ✅ 공개 읽기
- 모든 사용자가 `page_id`로 설정 조회 가능
- Admin.tsx의 프론트엔드 컴포넌트들이 정상 작동

### ✅ 관리자 쓰기
- 인증된 관리자만 INSERT/UPDATE/DELETE 가능
- Admin.tsx의 로그인 기능과 완벽 호환

### ✅ 서비스 역할
- API 서버는 모든 권한을 가짐
- Vercel 프록시 서버가 정상 작동

## 📊 생성된 뷰들

### 1. 공개 읽기용 뷰
```sql
SELECT * FROM page_settings_public WHERE page_id = 'your_page_id';
```

### 2. 관리자용 뷰
```sql
SELECT * FROM page_settings_admin WHERE page_id = 'your_page_id';
```

### 3. 통계 뷰
```sql
SELECT * FROM page_settings_stats;
```

## 🔍 감사 로그 확인

### 최근 변경사항 확인
```sql
SELECT 
  page_id,
  action,
  changed_by,
  changed_at,
  client_ip
FROM page_settings_audit_log 
ORDER BY changed_at DESC 
LIMIT 10;
```

## 🛠️ 문제 해결

### 1. 권한 오류 발생 시
```sql
-- 현재 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'page_settings';
```

### 2. 토큰 검증 테스트
```sql
-- Admin.tsx 토큰 검증 테스트
SELECT validate_admin_token('your_base64_token');
```

### 3. 관리자 권한 확인
```sql
-- 현재 사용자의 관리자 권한 확인
SELECT is_admin();
```

## 📋 Admin.tsx 호환성

### ✅ 완벽 호환 기능
- 로그인/로그아웃
- 페이지 설정 저장/수정
- 기본 정보 관리
- 포토섹션 설정
- 하이라이트 설정
- 갤러리 타입 설정

### ✅ 보안 강화
- 모든 변경사항 자동 로깅
- 클라이언트 IP 추적
- 토큰 만료 시간 검증
- 데이터 무결성 검증

## 🎯 주요 특징

1. **원클릭 적용**: 하나의 SQL 파일로 모든 설정 완료
2. **완벽 호환**: Admin.tsx 기능 그대로 유지
3. **보안 강화**: 다층 보안 구조
4. **성능 최적화**: 자동 인덱스 생성
5. **모니터링**: 감사 로그와 통계 뷰 제공

## 📞 지원

문제가 발생하면:
1. Supabase 로그 확인
2. 감사 로그 테이블 확인
3. 토큰 유효성 검사
4. 네트워크 연결 상태 확인

---

**🎉 이제 page_settings 테이블이 완전한 보안과 Admin.tsx 호환성을 갖추었습니다!** 