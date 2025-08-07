# 🔐 DARAPO 보안 설정 가이드

## 📋 환경변수 설정 체크리스트

### 1. Frontend 보안 설정

#### 🔑 필요한 환경변수
```bash
# frontend/.env.local (절대 커밋하지 마세요!)
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=실제_카카오_네이티브_앱키
```

#### ✅ 확인사항
- [ ] `frontend/.env.example` 파일이 템플릿으로 존재하는가?
- [ ] `frontend/.env.local` 파일에 실제 키 값이 설정되어 있는가?
- [ ] `.gitignore`에 `.env.local`이 포함되어 있는가?
- [ ] `app.config.js`가 환경변수를 제대로 읽고 있는가?

### 2. Backend 보안 설정

#### 🔑 필요한 환경변수
```bash
# backend/.env (절대 커밋하지 마세요!)
KAKAO_REST_API_KEY=실제_카카오_REST_API_키
JWT_SECRET=강력한_JWT_시크릿_키
MONGO_URI=mongodb://localhost:27017/darapo
```

#### ✅ 확인사항
- [ ] `backend/.env.example` 파일이 템플릿으로 존재하는가?
- [ ] `backend/.env` 파일에 실제 키 값이 설정되어 있는가?
- [ ] `.gitignore`에 `.env`가 포함되어 있는가?
- [ ] JWT_SECRET이 충분히 복잡한가? (최소 32자리 권장)

### 3. Git 보안 체크

#### 🚫 절대 커밋하면 안 되는 파일들
```
frontend/.env.local
backend/.env
*.keystore
*.p8
*.p12
```

#### ✅ Git 안전성 확인
```bash
# 현재 Git 상태 확인
git status

# .env 파일이 untracked 상태인지 확인
git ls-files --others --ignored --exclude-standard | grep -E "\.env$|\.env\.local$"
```

### 4. 카카오 개발자 콘솔 설정

#### 📱 앱 설정 확인사항
- [ ] **Bundle ID**: `com.darapo.app` (정확히 일치해야 함)
- [ ] **URL Scheme**: `kakao1183143132568dc32e5d8ddce39e9ee1`
- [ ] **플랫폼**: iOS, Android 모두 등록
- [ ] **Redirect URI**: `kakao1183143132568dc32e5d8ddce39e9ee1://oauth`

### 5. 보안 베스트 프랙티스

#### 🔒 환경변수 네이밍 규칙
- 공개되어도 되는 값: `EXPO_PUBLIC_` 접두사 사용
- 비공개 값: 접두사 없이 사용 (백엔드에서만)

#### 🛡️ 추가 보안 조치
```bash
# 강력한 JWT Secret 생성 (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 OpenSSL 사용
openssl rand -hex 32
```

### 6. 개발/배포 환경 분리

#### 🔧 개발 환경
```bash
# frontend/.env.local
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=개발용_앱키
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

#### 🚀 운영 환경
```bash
# 배포 시 환경변수 설정
EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY=운영용_앱키
EXPO_PUBLIC_API_URL=https://api.darapo.com
```

## ⚠️ 문제 해결

### 로그인 시 다른 앱으로 이동하는 경우
1. 카카오 개발자 콘솔에서 Bundle ID 확인
2. `app.config.js`의 `identifier` 값 확인
3. 환경변수의 앱 키 값 확인

### 환경변수가 읽히지 않는 경우
1. `.env.local` 파일명 확인 (`.env`가 아님)
2. `EXPO_PUBLIC_` 접두사 확인
3. Expo 개발 서버 재시작: `npx expo start --clear`

---

**🚨 보안 주의사항**: 실제 API 키나 시크릿 값은 절대로 코드에 하드코딩하지 말고, 반드시 환경변수를 사용하세요!
