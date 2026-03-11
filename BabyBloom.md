# BabyBloom
### 여성 라이프로그 & 웰니스 기록 앱

**BabyBloom**은 여성의 일상적인 몸 상태와 생활 습관을 기록하는 **웰니스 라이프로그 앱**입니다.

생리주기, 체중, 컨디션, 운동, 수면 등의 데이터를 기록하여
사용자가 자신의 몸 상태와 패턴을 이해하도록 돕습니다.

초대코드를 통해 파트너와 1:1로 연결하여, 생리주기와 컨디션 등 선택한 데이터를 공유할 수 있습니다.

임신을 계획하는 시기에도 생활 습관과 컨디션을 기록하는 도구로 활용할 수 있습니다.

> ⚠️ 본 앱은 의료 서비스나 의학적 진단을 제공하지 않습니다.

---

# 1. Project Overview

BabyBloom은 여성의 일상 데이터를 기록하는 **라이프로그 기반 웰니스 앱**입니다.

기록 가능한 데이터

- 생리 주기
- 체중
- 컨디션
- 수면
- 운동
- 일상 메모

핵심 기능

- **파트너 공유**: 초대코드 기반 1:1 파트너 연결, 공유 카테고리 선택 가능

이 데이터를 통해 사용자는 자신의 생활 패턴을 확인할 수 있습니다.

---

# 2. Tech Stack

## Backend
- **Nest.js**
- REST API
- 사용자 인증 (Supabase Auth)
- 데이터 관리

## Mobile App
- **React Native (Expo)**

주요 역할

- 모바일 UI
- 데이터 입력
- 캘린더
- 라이프로그 기록

## Database
- **Supabase (PostgreSQL)**

주요 역할

- 사용자 데이터 저장
- 라이프로그 관리
- 주기 데이터 저장
- Supabase Auth (인증)
- RLS (Row Level Security)

## AI
- **Gemini Flash**

AI 사용 목적

- 앱 내부 **웰니스 콘텐츠 생성**
- 여성 라이프스타일 관련 컬럼 생성

> 챗봇 기능은 제공하지 않습니다.

## Infrastructure
- **모노레포 구조** (app/ + backend/)
- **GitHub Actions** (path filter 기반 독립 CI/CD)

---

# 3. System Architecture

```
React Native App (Expo)
↓
Nest.js API Server
↓
Supabase (PostgreSQL + Auth)

AI Content Generation
↓
Gemini Flash API
```

---

# 4. Project Directory Structure

```
BabyBloom/
├── .github/
│   └── workflows/
│       ├── app-ci.yml          # app 변경 시만 실행
│       └── backend-ci.yml      # backend 변경 시만 실행
│
├── app/                        # React Native (Expo)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen
│   │   │   ├── CycleScreen
│   │   │   ├── LogScreen
│   │   │   ├── FitnessScreen
│   │   │   ├── InsightsScreen
│   │   │   └── PartnerScreen
│   │   ├── components/
│   │   │   ├── Calendar
│   │   │   ├── LogCard
│   │   │   └── InviteCode
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── store/
│   │       └── state.ts
│   └── App.tsx
│
├── backend/                    # Nest.js
│   └── src/
│       ├── supabase/
│       ├── auth/
│       ├── users/
│       ├── logs/
│       ├── cycle/
│       ├── partner/
│       ├── ai/
│       └── main.ts
│
└── database/
    ├── schema.sql              # 전체 스키마 (v3)
    └── migration_v3_partner.sql
```

---

# 5. Database ERD (v3)

## users (Supabase Auth 연동)

| column | type |
|------|------|
| id | uuid (FK → auth.users) |
| email | text |
| nickname | text |
| created_at | timestamptz |

---

## log_types (기록 항목 마스터)

| column | type | 설명 |
|------|------|------|
| id | uuid | |
| name | text | 체중, 수면, 컨디션 등 |
| category | text | daily, fitness, relation |
| unit | text | kg, 시간, 분 등 |
| data_type | text | number, text, select |
| options | jsonb | select 타입의 선택지 |
| display_order | int | 표시 순서 |
| is_default | boolean | 기본 제공 여부 |

---

## user_log_settings (유저별 활성화 항목)

| column | type |
|------|------|
| id | uuid |
| user_id | uuid (FK) |
| log_type_id | uuid (FK) |
| is_active | boolean |
| display_order | int |
| created_at | timestamptz |

---

## log_entries (실제 기록 데이터)

| column | type |
|------|------|
| id | uuid |
| user_id | uuid (FK) |
| log_type_id | uuid (FK) |
| date | date |
| value | text |
| created_at | timestamptz |

UNIQUE(user_id, log_type_id, date)

---

## cycle_logs (생리주기)

| column | type |
|------|------|
| id | uuid |
| user_id | uuid (FK) |
| cycle_start_date | date |
| cycle_end_date | date |
| created_at | timestamptz |

---

## invite_codes (초대코드)

| column | type |
|------|------|
| id | uuid |
| user_id | uuid (FK) |
| code | text (6자리) |
| is_used | boolean |
| expires_at | timestamptz (24시간) |
| created_at | timestamptz |

---

## partner_links (파트너 연결)

| column | type |
|------|------|
| id | uuid |
| requester_id | uuid (FK) |
| partner_id | uuid (FK) |
| status | text (accepted / disconnected) |
| shared_categories | jsonb (["cycle","daily"] 등) |
| created_at | timestamptz |
| disconnected_at | timestamptz |

---

## 파트너 공유 흐름

```
1. A가 "초대코드 생성" → 6자리 코드 발급 (24시간 유효)
2. A가 코드를 파트너 B에게 공유 (카톡, 문자 등)
3. B가 앱에서 코드 입력 → partner_links 생성 (1:1 연결)
4. A가 shared_categories 설정 → B는 해당 카테고리만 조회 가능
5. 연결 해제 시 status = 'disconnected'
```

---

# 6. App Screen Design

## Main Tabs

- Home
- Cycle
- Log
- Fitness
- Insights

---

## Home

- 오늘 기록 요약
- 체중
- 컨디션
- 최근 기록
- 파트너 공유 데이터 (연결 시)

---

## Cycle

- 생리 주기 캘린더
- 시작일 기록
- 과거 기록 조회

---

## Log

하루 라이프로그 기록 (log_types 마스터 기반 동적 렌더링)

- 체중
- 수면
- 컨디션
- 메모
- (유저가 활성화한 항목)

---

## Fitness

운동 기록

- 운동 종류
- 운동 시간
- 강도

---

## Insights

데이터 기반 요약

- 체중 변화
- 주기 패턴
- 운동 빈도

---

# 7. AI Usage

AI는 사용자 데이터 분석이 아니라
**콘텐츠 생성 목적**으로 사용됩니다.

예시

- 여성 웰니스 콘텐츠
- 생활 습관 가이드
- 건강한 라이프스타일 컬럼

사용 모델

- **Gemini Flash**

선택 이유

- 매우 저렴한 토큰 비용
- 빠른 응답 속도

---

# 8. MVP Goal

초기 MVP 목표

- 라이프로그 기록 (마스터 기반 동적 항목)
- 생리주기 기록
- 운동 기록
- 파트너 초대코드 연결 & 데이터 공유
- 기본 통계

향후 확장

- 데이터 그래프
- 습관 트래킹
- 개인 패턴 인사이트
