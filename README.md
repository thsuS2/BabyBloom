# BabyBloom

여성 라이프로그 & 웰니스 기록 앱

## Tech Stack

- **Frontend**: React Native (Expo SDK 54)
- **Backend**: Nest.js
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Gmail SMTP
- **AI**: Gemini Flash (콘텐츠 생성)

## Project Structure

```
BabyBloom/
├── app/                 # React Native (Expo)
├── backend/             # Nest.js API Server
├── database/            # SQL 스키마 및 마이그레이션
└── .github/workflows/   # CI/CD (GitHub Actions)
```

## Setup Guide

### 1. 사전 준비

- Node.js v20+
- npm
- Expo Go 앱 (모바일 기기)
- Supabase 프로젝트

### 2. Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `database/schema.sql` 실행
3. SQL Editor에서 `database/migration_v3_partner.sql` 실행
4. Authentication → URL Configuration → Site URL 설정
5. Authentication → SMTP Settings → Gmail SMTP 설정 (아래 참고)

#### Gmail SMTP 설정

1. [Google 계정 보안](https://myaccount.google.com/security) → 2단계 인증 활성화
2. 앱 비밀번호 생성 (앱 이름: BabyBloom)
3. Supabase SMTP Settings:
   - Host: `smtp.gmail.com`
   - Port: `465`
   - Username: Gmail 주소
   - Password: 앱 비밀번호 (16자리)
   - Sender email: Gmail 주소
   - Sender name: `BabyBloom`

### 3. Backend 실행

```bash
cd backend

# 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase URL, Key, Gmail SMTP 정보 입력

# 의존성 설치
npm install

# 개발 서버 실행 (포트 3001)
npm run start:dev
```

### 4. App 실행

```bash
cd app

# 의존성 설치
npm install

# 개발 서버 실행
npx expo start

# 실기기 테스트 (와이파이 없이도 가능)
npx expo start --tunnel
```

Expo Go 앱에서 QR 코드 스캔하여 실행

### 5. 환경 이동 시

1. 레포 클론: `git clone git@github.com:thsuS2/BabyBloom.git`
2. `backend/.env` 파일 생성 (`.env.example` 참고)
3. `cd backend && npm install`
4. `cd app && npm install`
5. 실행

## API Endpoints

### Auth
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/signin` - 로그인
- `GET /api/auth/me` - 내 정보

### Users
- `GET /api/users/profile` - 프로필 조회
- `PATCH /api/users/profile` - 프로필 수정

### Logs
- `GET /api/logs/types` - 기록 항목 목록
- `GET /api/logs/settings` - 내 기록 설정
- `POST /api/logs/settings` - 기록 항목 활성화/비활성화
- `POST /api/logs/entry` - 기록 저장
- `POST /api/logs/bulk` - 하루치 일괄 저장
- `GET /api/logs/date/:date` - 날짜별 기록 조회
- `GET /api/logs/range?start=&end=` - 기간별 조회
- `DELETE /api/logs/:id` - 기록 삭제

### Cycle
- `POST /api/cycle` - 생리주기 시작
- `PATCH /api/cycle/:id` - 종료일 기록
- `GET /api/cycle` - 전체 주기
- `GET /api/cycle/latest` - 최근 주기
- `DELETE /api/cycle/:id` - 삭제

### Partner
- `POST /api/partner/invite` - 초대코드 생성
- `POST /api/partner/connect` - 코드로 연결
- `GET /api/partner` - 파트너 정보
- `PATCH /api/partner/categories` - 공유 카테고리 설정
- `DELETE /api/partner` - 연결 해제

## Database

7개 테이블 (Schema v3):
- `users` - 유저 (Supabase Auth 연동)
- `log_types` - 기록 항목 마스터
- `user_log_settings` - 유저별 활성화 항목
- `log_entries` - 실제 기록 데이터
- `cycle_logs` - 생리주기
- `invite_codes` - 초대코드
- `partner_links` - 파트너 연결
