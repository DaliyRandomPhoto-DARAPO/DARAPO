# 🚀 DARAPO 프로젝트 세팅 가이드

DARAPO (Daily Random Photo) 프로젝트가 성공적으로 세팅되었습니다!

## 📁 프로젝트 구조

```
DARAPO/
├── backend/                 # NestJS 백엔드 서버
│   ├── src/
│   │   ├── auth/           # 인증 모듈 (카카오 로그인)
│   │   ├── mission/        # 미션 모듈 (오늘의 미션)
│   │   ├── photo/          # 사진 모듈 (업로드/관리)
│   │   ├── user/           # 사용자 모듈
│   │   └── main.ts
│   ├── .env               # 환경 변수
│   └── package.json
├── frontend/               # React Native (Expo) 프론트엔드
│   ├── src/
│   │   ├── screens/       # 화면 컴포넌트들
│   │   ├── services/      # API 서비스
│   │   └── types/         # TypeScript 타입 정의
│   ├── App.tsx
│   ├── app.json          # Expo 설정
│   └── package.json
└── README.md
```

## 🛠️ 기술 스택

### 백엔드
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT + 카카오 소셜 로그인
- **File Upload**: Multer
- **API Documentation**: Swagger
- **Validation**: class-validator, class-transformer

### 프론트엔드
- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios
- **Storage**: AsyncStorage
- **Camera**: expo-camera
- **Image Picker**: expo-image-picker

## 🚀 시작하기

### 전제 조건
- Node.js 18+ 설치
- MongoDB 설치 및 실행
- Expo CLI 설치: `npm install -g @expo/cli`

### 1. 백엔드 실행

```bash
cd backend

# 환경 변수 설정 (.env 파일 확인)
# MongoDB URI, JWT 시크릿 등 설정

# 개발 서버 실행
npm run start:dev
```

백엔드 서버가 http://localhost:3000 에서 실행됩니다.
- API 문서: http://localhost:3000/api

### 2. 프론트엔드 실행

```bash
cd frontend

# Metro 번들러 실행
npm start

# 또는 특정 플랫폼에서 실행
npm run ios        # iOS 시뮬레이터
npm run android    # Android 에뮬레이터
npm run web        # 웹 브라우저
```

## 📱 주요 기능

### 구현된 기능
✅ **기본 프로젝트 세팅**
- NestJS 백엔드 서버 구조
- React Native Expo 앱 구조
- MongoDB 스키마 설계 (User, Mission, Photo)
- JWT 인증 준비
- 기본 네비게이션 (홈 → 카메라 → 업로드)

✅ **화면 구성**
- 홈 화면 (오늘의 미션 표시)
- 카메라 화면 (사진 촬영)
- 사진 업로드 화면 (코멘트 작성, SNS 공유)

### 다음 단계 구현 예정
🔄 **백엔드 API 구현**
- 카카오 로그인 API
- 오늘의 미션 API
- 사진 업로드 API
- MongoDB 연결 및 데이터 관리

🔄 **프론트엔드 기능 완성**
- 실제 API 연동
- 카카오 로그인 구현
- 실시간 미션 데이터 연결
- 파일 업로드 기능
- SNS 공유 기능

## 🔧 환경 설정

### 백엔드 환경 변수 (.env)
```
MONGODB_URI=mongodb://localhost:27017/darapo
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=3000
```

### 카카오 로그인 설정 (추후)
1. 카카오 개발자 센터에서 앱 등록
2. 클라이언트 ID, 시크릿 발급
3. 환경 변수에 설정

## 📊 데이터베이스 스키마

### User (사용자)
- kakaoId: 카카오 사용자 ID
- nickname: 닉네임
- profileImage: 프로필 이미지
- email: 이메일

### Mission (미션)
- title: 미션 제목
- description: 미션 설명
- date: 미션 날짜
- isActive: 활성화 여부

### Photo (사진)
- userId: 사용자 ID (참조)
- missionId: 미션 ID (참조)
- imageUrl: 이미지 URL
- comment: 코멘트
- isPublic: 공개 여부

## 🐛 문제 해결

### MongoDB 연결 문제
```bash
# MongoDB 실행 확인
brew services start mongodb-community
# 또는
mongod
```

### Metro 번들러 문제
```bash
cd frontend
npx expo start --clear
```

### 패키지 설치 문제
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules
npm install
```

## 📞 지원

프로젝트 구조가 준비되었습니다! 다음 단계로 실제 기능 구현을 진행할 수 있습니다.

---

**Happy Coding! 🎉**
