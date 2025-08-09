# DARAPO TODO (2025-08-10)

프로젝트 현황을 반영한 실행 중심 체크리스트입니다. 우선순위 높은 항목부터 처리하세요. [ ] 미완료 / [x] 완료.

## 최우선 Hotfix (오늘)
- [x] API 경로 불일치 수정: Nest 전역 prefix가 `api`이므로 프론트 요청 경로를 `/api`로 일치
  - 적용: `frontend/src/services/api.ts`에서 `RAW_API_BASE_URL`에 `/api` 자동 부착
  - 참고: 환경변수로 `EXPO_PUBLIC_API_URL`에 `/api`가 없어도 안전
- [x] Kakao OAuth Redirect URI 일치: 백엔드 콜백이 `/api/auth/kakao/callback` 이므로 기본값 수정
  - 적용: `backend/src/auth/auth.service.ts`의 기본 `KAKAO_REDIRECT_URI`를 `/api/...`로 변경
  - 주의: 카카오 개발자 콘솔 Redirect URI도 동일 경로로 등록 필요(수동 작업)
- [ ] 딥링크 검증: 카카오 인증 성공 시 서버가 `darapo://auth/callback?...`으로 리다이렉트 되는지 실제 기기/시뮬레이터에서 확인
  - 방법 A: 실제 카카오 플로우로 로그인 테스트(권장)
  - 방법 B(개발 편의): `ENABLE_DEBUG_ENDPOINTS=true`로 서버 실행 후
    - 브라우저에서 `http://<host>:3000/api/auth/debug/deeplink?token=TEST&Tuser=%7B%22id%22%3A%221%22%2C%22nickname%22%3A%22Test%22%7D` 접속해 앱으로 전환되는지 확인
    - iOS 시뮬레이터/안드로이드 에뮬레이터 모두 확인 권장

## 인증(Backend) 정합성 개선
- [ ] Refresh 토큰 전략 도입(권장) 또는 현행 전략 정비 중 택1
  - 권장안: Redis 기반 Refresh 토큰(JTI) 발급/회전/철회
    - [ ] `/auth/refresh`는 Access Guard 없이 동작, Refresh 검증 후 Access 재발급
    - [ ] `/auth/logout`은 전달받은 Refresh 무효화(JTI 삭제)
    - [ ] Throttler로 `/auth/*` 속도 제한(예: 5req/10s)
    - [ ] 서버: ioredis 연동, 키 설계(rt:<userId>:<jti>) 및 TTL 설정(예: 14d)
    - [ ] 프론트: RN은 `expo-secure-store`로 refresh 보관, 웹뷰는 HttpOnly 쿠키 사용(옵션)
  - 대안안(임시): Access 토큰 유효기간 연장(예: 7d→14d) + `/auth/refresh`에 Guard 제거 또는 별도 세션 방식 도입
- [ ] DTO/Validation 정리: Auth 관련 DTO에 class-validator 적용 및 ValidationPipe로 화이트리스트 유지
- [x] Jwt Strategy/Guard 구성 존재 확인(현행 유지) 

## 사진 업로드/조회 보호 강화
- [ ] `@UseGuards(JwtAuthGuard)`를 `photo` 작성/수정/삭제/내 목록 API에 적용
- [ ] `userId`를 쿼리/바디로 받지 말고 토큰의 `sub`에서 주입하여 강제 일치
- [ ] DTO 추가(업로드, 수정) 및 유효성 검사: `missionId` 필수, 파일 타입/크기 서버/클라이언트 양측 검증
- [ ] 소유자 검증: 수정/삭제 시 사진의 `userId`와 요청자 `sub` 일치 확인
- [ ] 정적 파일 서빙: Nest에서 `/uploads` 정적 제공 설정(예: express static) 및 Swagger 예시에 반영
- [x] Multer 설정(용량/확장자 제한) 존재 확인

## 미션
- [x] 오늘의 미션 자동 생성 로직 존재(getTodayMission 내 lazy 생성)
- [ ] 필요 시 스케줄러(Cron)로 자정 생성(운영 트래픽 감소 목적) 

## 보안/운영
- [ ] CORS 허용 범위 제한(개발: Expo LAN/로컬, 운영: 도메인/웹뷰만)
- [ ] Helmet 적용 및 CSP 설정(운영 빌드 시)
- [ ] 로그 민감정보 마스킹: 토큰/PII는 로그 금지
- [ ] Swagger 운영 비활성화(개발에서만 노출)
- [ ] 환경변수 정리 및 샘플 제공: `.env.example` 추가
  - Backend: PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, KAKAO_REDIRECT_URI, REDIS_URL
  - Frontend: EXPO_PUBLIC_API_URL(운영/개발 분리)

## 프론트엔드
- [ ] API Base 경로 수정(`/api` 반영) 및 카카오 로그인 플로우 점검
- [ ] Auth 토큰 보관소 개선: Access→AsyncStorage, Refresh→SecureStore(도입 시)
- [ ] axios 인터셉터: 401 시 `/auth/refresh` 호출 로직을 서버 전략에 맞게 조정(쿠키/헤더/바디)
- [ ] 사진 업로드 FormData에 필수 필드 포함 및 실패/재시도 UX 보강
- [ ] 탭/화면: 오늘의 미션/피드/프로필에서 실제 백엔드 연동 및 로딩/에러 처리 일관화

## 테스트
- [ ] E2E: 인증(성공/401/만료/회전), 사진 업로드(권한/유효성), 미션 API 커버
- [ ] 단위: AuthService(토큰 발급/검증/회전), PhotoService(소유자 검증), MissionService(생성 로직)
- [ ] 프론트: 인증 컨텍스트/인터셉터/업로드 훅 스모크 테스트

## CI/CD & 품질
- [ ] GitHub Actions: 백엔드 Lint/Build/Test, 프론트 Lint/Typecheck 워크플로 추가
- [ ] 린트/포맷 일관화(Eslint/Prettier) 및 pre-commit 훅(optional)

## 문서
- [ ] README 보강: 아키텍처, 인증 플로우, 환경변수, 실행 방법(iOS/Android/서버)
- [ ] API 문서: Swagger 그룹/예시 최신화(업로드/인증/미션)

---

## 현재 구현 상태 스냅샷(요약)
- Backend
  - [x] Nest 전역 prefix `api` 적용, Swagger 설정(개발 노출)
  - [x] Kakao OAuth 서버측 처리 엔드포인트 보유(`/auth/kakao`, `/auth/kakao/callback` → 실제 경로는 `/api/...`)
  - [x] JWT Strategy/Guard (Bearer) 구성, Access 토큰 발급
  - [x] Mongoose User/Photo/Mission 스키마 및 서비스 구현
  - [x] Multer(이미지 확장자/10MB 제한) 설정 및 업로드 엔드포인트 존재(`/photo/upload`)
  - [ ] `/uploads` 정적 서빙 미구현 가능성(확인 필요)
  - [ ] `/auth/refresh`가 Guard를 요구하여 만료 토큰 갱신 플로우와 충돌 가능성
- Frontend (Expo React Native)
  - [x] 딥링크 스킴 `darapo://` 구성, 백엔드 완전처리 방식의 OAuth 플로우 사용
  - [x] AuthContext로 토큰/유저 보관(AsyncStorage)
  - [x] axios 인터셉터(401→/auth/refresh 시도)
  - [ ] API 경로가 `/api` prefix 미반영(핵심 Hotfix)

## 참고 메모
- 카카오 Redirect URI는 백엔드 콜백(`/api/auth/kakao/callback`)로 등록 후, 서버가 앱 스킴(`darapo://auth/callback`)으로 재리다이렉트하는 구조 유지
- RN 환경에서 Refresh 토큰은 `expo-secure-store` 사용 권장(추후 도입 시 마이그레이션 계획 포함)