# Baby Bloom - 실행 방법

## 1. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. **SQL Editor**에서 `SUPABASE_TABLES.md` 참고해 테이블 생성 (profiles, cycles, periods, intercourse_logs, weights, vitamins, partners)
3. **Authentication** → 이메일/비밀번호 활성화
4. **Settings** → API에서 `Project URL`, `anon key`, `service_role key` 복사

---

## 2. Backend 실행

```bash
cd Backend
cp .env.example .env
# .env 편집: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install   # 이미 했다면 생략
npm run start:dev
```

- API: `http://localhost:3000`
- 회원가입 시 Supabase Auth + `profiles` 행 자동 생성

---

## 3. App 실행

```bash
cd APP
npm install   # 이미 했다면 생략
npm start
```

- 터미널에서 `i` (iOS 시뮬레이터) 또는 `a` (Android 에뮬레이터) 또는 QR로 실제 기기 연결
- **실기기에서 테스트 시**: `APP/src/services/api.ts`의 `API_BASE`를 PC IP로 변경 (예: `http://192.168.0.10:3000`)

---

## 4. 동작 확인 순서

1. Backend `npm run start:dev` 실행
2. App `npm start` 후 시뮬레이터/기기에서 실행
3. 앱에서 **회원가입** → 로그인 후 **홈** 진입
4. **주기** 탭에서 생리 시작일 추가 → **홈**에서 가임기/배란일 확인
5. **건강** 탭에서 체중·영양제 기록
6. **파트너** 탭에서 파트너 이메일로 초대 (동일 Supabase에 가입된 사용자 이메일)
