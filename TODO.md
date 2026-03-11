## BabyBloom TODO

### Auth & 계정
- [x] 이메일 인증 코드 기반 회원가입 플로우 도입
  - [x] `email_verification_codes` 테이블 추가 (`database/migration_email_verification.sql`)
  - [x] `POST /api/auth/send-signup-code` 구현 (이메일로 6자리 코드 발송)
  - [x] `POST /api/auth/signup`에서 코드 검증 후 Supabase Auth + `users` 프로필 생성
- [x] JWT 기반 인증 토큰 도입
  - [x] access token (유효시간 1시간), refresh token (유효시간 90일)
  - [x] `POST /api/auth/signin` → `{ user, accessToken, refreshToken }` 응답
  - [x] `POST /api/auth/refresh` → refresh token으로 access/refresh 재발급
  - [x] `GET /api/auth/me` → access token 검증 후 유저 정보 반환
- [x] 앱에서 JWT 저장/사용
  - [x] AsyncStorage(`tokenStorage`)에 access/refresh token 저장
  - [x] Axios 인터셉터에서 access token 자동 첨부
  - [x] 401 발생 시 refresh 시도 → 실패 시 토큰 삭제 + 강제 로그아웃
  - [x] 앱 초기화 시 `/auth/me` 호출로 로그인 상태 복구

### 기록(Logs) & 홈(Home)
- [ ] 기록 화면 개선
  - [ ] 컨디션, 체중, 운동, 영양제, 임신시도, 피임약 등 **카드 UI** 형태의 기록 항목 노출
  - [ ] 각 카드 클릭 시 세부 입력란/선택 UI 표시
  - [ ] 하루치 기록을 한 번에 저장하는 UX 정리 (`/api/logs/bulk` 활용)
- [ ] 홈 화면
  - [ ] 최근 1주일(월~일) 기준으로 생리/운동/컨디션 등 핵심 지표 요약
  - [ ] 오늘 기록 요약과 주간 인사이트(예: 운동 횟수, 기록 수 등) 시각화

### 캘린더(Calendar)
- [ ] 내 데이터 + 파트너 데이터 동시 표시
  - [ ] 내 생리주기/기록과 파트너 데이터를 **색상으로 구분**하여 마킹
  - [ ] 범례(legend)에 “나 / 파트너 / 선택일 / 오늘” 색상 명시
- [ ] 날짜 마킹 UX 개선
  - [ ] 오늘 날짜는 항상 눈에 잘 보이는 색(예: 진한 빨간색 점/테두리)
  - [ ] 선택한 날짜는 배경 원(circle)으로 강조해 흰색으로 사라지지 않도록 수정

### 설정(Settings) & 내비게이션
- [ ] 설정 화면 구조 정리
  - [ ] 현재 “기록 항목” 섹션 역할/콘텐츠 재설계
  - [ ] 홈 화면에서 설정으로 진입할 수 있는 버튼/아이콘 추가
- [ ] 하단 탭 내비게이션 재정의
  - [ ] `설정` 탭 대신 `커뮤니티` 탭을 배치
  - [ ] 설정은 별도 아이콘(예: 홈 상단 우측 톱니바퀴)으로 진입

### 커뮤니티(게시글/댓글)
- [ ] DB 스키마 설계
  - [ ] 카테고리 마스터 테이블 (예: `community_categories`)
    - QnA / 나의 꿀팁 / 수다방
  - [ ] 게시글 테이블 (예: `community_posts`)
    - 카테고리, 작성자, 제목, 내용, created_at, updated_at, is_deleted(논리 삭제)
  - [ ] 댓글 테이블 (예: `community_comments`)
    - 게시글, 작성자, 내용, created_at, is_deleted
- [ ] 게시글/댓글 제약 조건
  - [ ] 한 계정당 **하루 게시글 10개** 제한
  - [ ] 한 계정당 **하루 댓글 20개** 제한 (도배 방지)
- [ ] 백엔드 API
  - [ ] 카테고리 목록 조회
  - [ ] 게시글 목록/상세 조회 (카테고리별, 페이징)
  - [ ] 게시글 생성/수정/논리 삭제
  - [ ] 댓글 조회/생성/수정/논리 삭제
- [ ] 프론트엔드 UI
  - [ ] 커뮤니티 탭 + 카테고리 탭 UI
  - [ ] 게시글 리스트 / 상세 / 작성/수정 화면
  - [ ] 댓글 리스트 / 작성/수정 UI
  - [ ] 일일 작성 제한 도달 시 안내 메시지 처리

### 기타 기술적인 TODO
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 실제 값으로 교체 (Supabase 대시보드 → service_role 키)
- [ ] CI에서 backend/app 각각 lint + 타입체크 + 테스트 추가

### 지금까지 완료된 주요 작업 메모
- Supabase 기반 단순 이메일·비밀번호 회원가입 → **이메일 인증 코드 + JWT 기반 인증 구조**로 변경
- Supabase 세션 대신 백엔드 JWT(access/refresh) + `AuthGuard`로 모든 API 보호
- 앱에서 Supabase 클라이언트 직접 접근을 제거하고, **백엔드 API를 단일 진입점**으로 사용하도록 정리
- 개발/실기기 환경에서 `localhost` 문제를 피하기 위해 Expo의 host 기준으로 API base URL 계산

