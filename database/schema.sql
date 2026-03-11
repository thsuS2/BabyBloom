-- ============================================
-- BabyBloom Database Schema v3
-- ============================================
-- 기존 테이블 전체 삭제 후 재생성
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- STEP 1: 기존 테이블 삭제 (순서 중요: FK 의존성)
-- ============================================
DROP POLICY IF EXISTS "relation_own" ON public.relation_logs;
DROP POLICY IF EXISTS "fitness_own" ON public.fitness_logs;
DROP POLICY IF EXISTS "daily_own" ON public.daily_logs;
DROP POLICY IF EXISTS "cycle_own" ON public.cycle_logs;
DROP POLICY IF EXISTS "users_own" ON public.users;

DROP TABLE IF EXISTS public.relation_logs CASCADE;
DROP TABLE IF EXISTS public.fitness_logs CASCADE;
DROP TABLE IF EXISTS public.daily_logs CASCADE;
DROP TABLE IF EXISTS public.cycle_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================
-- STEP 2: 새 테이블 생성
-- ============================================

-- 1. users (Supabase Auth 연동)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. log_types (기록 항목 마스터)
--    체중, 수면, 컨디션, 메모, 운동, 관계 등 자유롭게 확장
CREATE TABLE public.log_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,         -- 'daily', 'fitness', 'relation' 등
  unit TEXT,                      -- 'kg', '시간', '분', null 등
  data_type TEXT NOT NULL DEFAULT 'text',  -- 'number', 'text', 'select'
  options JSONB,                  -- select 타입일 때 선택지 (예: ["low","medium","high"])
  display_order INT DEFAULT 0,
  is_default BOOLEAN DEFAULT TRUE -- 기본 제공 항목 여부
);

-- 3. user_log_settings (유저별 활성화된 기록 항목)
CREATE TABLE public.user_log_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_type_id UUID NOT NULL REFERENCES public.log_types(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_type_id)
);

-- 4. log_entries (실제 기록 데이터)
CREATE TABLE public.log_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_type_id UUID NOT NULL REFERENCES public.log_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value TEXT NOT NULL,            -- 모든 값을 text로 저장, 앱에서 data_type 기반 변환
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_type_id, date)
);

-- 5. cycle_logs (생리주기 - 시작/종료 구조라 별도 유지)
CREATE TABLE public.cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. invite_codes (초대코드)
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,       -- 6자리 초대코드
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL, -- 만료시간 (24시간)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. partner_links (파트너 연결)
CREATE TABLE public.partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'disconnected')),
  shared_categories JSONB DEFAULT '["cycle","daily"]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  UNIQUE(requester_id, partner_id)
);

-- ============================================
-- STEP 3: 기본 기록 항목 시드 데이터
-- ============================================
INSERT INTO public.log_types (name, category, unit, data_type, options, display_order) VALUES
  ('체중',     'daily',    'kg',  'number',  NULL, 1),
  ('수면',     'daily',    '시간', 'number',  NULL, 2),
  ('컨디션',   'daily',    NULL,  'select',  '["좋음","보통","나쁨"]', 3),
  ('메모',     'daily',    NULL,  'text',    NULL, 4),
  ('운동종류', 'fitness',  NULL,  'text',    NULL, 5),
  ('운동시간', 'fitness',  '분',  'number',  NULL, 6),
  ('운동강도', 'fitness',  NULL,  'select',  '["low","medium","high"]', 7),
  ('관계메모', 'relation', NULL,  'text',    NULL, 8);

-- ============================================
-- STEP 4: 인덱스
-- ============================================
CREATE INDEX idx_log_entries_user_date ON public.log_entries(user_id, date);
CREATE INDEX idx_log_entries_type ON public.log_entries(log_type_id);
CREATE INDEX idx_user_log_settings_user ON public.user_log_settings(user_id);
CREATE INDEX idx_cycle_logs_user ON public.cycle_logs(user_id);

-- ============================================
-- STEP 5: RLS 활성화
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_log_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: RLS 정책
-- ============================================
-- users: 본인만
CREATE POLICY "users_own" ON public.users FOR ALL USING (auth.uid() = id);

-- log_types: 모든 인증 유저가 읽기 가능 (마스터 데이터)
CREATE POLICY "log_types_read" ON public.log_types FOR SELECT USING (auth.role() = 'authenticated');

-- user_log_settings: 본인만
CREATE POLICY "settings_own" ON public.user_log_settings FOR ALL USING (auth.uid() = user_id);

-- log_entries: 본인만
CREATE POLICY "entries_own" ON public.log_entries FOR ALL USING (auth.uid() = user_id);

-- cycle_logs: 본인만
CREATE POLICY "cycle_own" ON public.cycle_logs FOR ALL USING (auth.uid() = user_id);
