## Vercel 배포용 (Vite SPA)

이 폴더는 `deploy/r2-upload/FramerComponent/Admin/Final_v1`를 **Vercel에 바로 배포 가능**하도록 복제한 버전입니다.

### Vercel 설정
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

SPA 라우팅을 위해 `vercel.json`에 모든 경로를 `/index.html`로 rewrite 하도록 설정되어 있습니다.

### `my.roarc.kr`로 배포 준비(권장 절차)
- **Vercel New Project** 생성 → Git 저장소 연결
- **Root Directory**를 `deploy/vercel-admin-final_v1`로 설정
- Build/Output은 `vercel.json`에 이미 포함되어 있으므로 기본값 그대로 진행해도 됩니다.
- 배포 후 Vercel 대시보드에서 **Domains**에 `my.roarc.kr` 추가
- DNS는 아래 중 하나로 연결합니다(둘 중 1개):
  - **CNAME(권장)**: `my.roarc.kr` → Vercel이 안내하는 CNAME 타겟
  - **A 레코드**: Vercel이 안내하는 IP

### 네이버 OAuth(오픈API) 준비 체크리스트
Admin은 “로그인 사용자만” 쓰는 편집 페이지이므로, **OAuth는 프론트만으로 완결되지 않고 서버리스 API가 필요**합니다.

- **네이버 개발자센터**
  - 애플리케이션 생성 후 **Client ID / Client Secret** 발급
  - 로그인 **Callback URL** 등록: (배포 후 확정) `https://my.roarc.kr/api/auth/callback/naver`
- **Vercel Environment Variables**(추후 추가 예정)
  - `NAVER_CLIENT_ID`
  - `NAVER_CLIENT_SECRET`
  - `AUTH_BASE_URL` (예: `https://my.roarc.kr`)
  - `AUTH_COOKIE_SECRET` (세션/쿠키 서명용 랜덤 문자열)

### 로컬 실행

```bash
npm install
npm run dev
```

### 로컬 빌드

```bash
npm run build
npm run preview
```


