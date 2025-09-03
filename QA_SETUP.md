# QA 환경 구축 가이드

## 1. 새로운 GitHub 계정 연결

### QA용 리모트 추가
```bash
# 새로운 GitHub 계정의 레포지토리 URL로 변경하세요
git remote add qa https://github.com/YOUR_QA_USERNAME/wedding-admin-proxy.git
```

### 리모트 확인
```bash
git remote -v
```

## 2. QA 브랜치 관리

### QA 브랜치 생성 및 전환
```bash
git checkout -b qa
```

### QA 브랜치에 변경사항 적용
```bash
git add .
git commit -m "feat: QA 환경 설정 및 초기화"
```

## 3. QA 환경 설정

### 환경 변수 설정 (.env.qa 파일 생성)
```bash
# .env.qa 파일을 생성하고 다음 내용을 입력하세요
NODE_ENV=development
SUPABASE_URL=https://your-qa-project.supabase.co
SUPABASE_SERVICE_KEY=your-qa-service-key
SUPABASE_ANON_KEY=your-qa-anon-key
VERCEL_URL=https://wedding-admin-proxy-qa.vercel.app
DEBUG=true
LOG_LEVEL=debug
```

### Vercel QA 설정
- `vercel.qa.json` 파일이 이미 생성되어 있습니다
- QA 환경에 맞는 설정들이 포함되어 있습니다

## 4. QA 배포

### 로컬 QA 환경 실행
```bash
npm run dev:qa
```

### QA 환경 배포
```bash
npm run deploy:qa
```

## 5. QA 브랜치 푸시

### QA 브랜치를 QA 리모트에 푸시
```bash
git push qa qa
```

## 6. 브랜치 간 전환

### 메인 브랜치로 돌아가기
```bash
git checkout main
```

### QA 브랜치로 전환
```bash
git checkout qa
```

## 7. QA 환경 확인사항

- [ ] QA용 Supabase 프로젝트 생성
- [ ] QA용 데이터베이스 설정
- [ ] QA용 환경 변수 설정
- [ ] QA용 Vercel 프로젝트 생성
- [ ] QA용 도메인 설정 (선택사항)

## 8. 유용한 명령어들

### 브랜치 상태 확인
```bash
git branch -a
git status
```

### 변경사항 병합 (필요시)
```bash
# QA 브랜치에서 메인 브랜치 병합
git checkout qa
git merge main

# 또는 메인 브랜치에서 QA 브랜치 병합
git checkout main
git merge qa
```

### 충돌 해결 (필요시)
```bash
git status
git add <충돌_해결된_파일>
git commit
```

## 9. QA 테스트 체크리스트

- [ ] 로컬 QA 환경 실행 확인
- [ ] QA 데이터베이스 연결 확인
- [ ] QA API 엔드포인트 작동 확인
- [ ] QA 환경 배포 확인
- [ ] QA 환경에서 모든 기능 테스트

## 📞 지원

QA 환경 구축 중 문제가 발생하면 다음 정보를 확인하세요:
- GitHub 계정 권한
- Supabase 프로젝트 설정
- Vercel 배포 설정
- 환경 변수 설정
