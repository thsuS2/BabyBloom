-- ============================================
-- BabyBloom Migration v3: 파트너 연결 기능
-- ============================================
-- Supabase SQL Editor에서 실행하세요

-- 1. invite_codes (초대코드)
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,       -- 6자리 초대코드
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL, -- 만료시간 (24시간)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. partner_links (파트너 연결)
CREATE TABLE public.partner_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'disconnected')),
  shared_categories JSONB DEFAULT '["cycle","daily"]',  -- 공유할 카테고리
  created_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  UNIQUE(requester_id, partner_id)
);

-- 인덱스
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_user ON public.invite_codes(user_id);
CREATE INDEX idx_partner_links_requester ON public.partner_links(requester_id);
CREATE INDEX idx_partner_links_partner ON public.partner_links(partner_id);

-- RLS 활성화
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- invite_codes: 본인이 생성한 코드만 관리, 누구나 코드로 조회 가능
CREATE POLICY "invite_codes_own" ON public.invite_codes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "invite_codes_lookup" ON public.invite_codes
  FOR SELECT USING (auth.role() = 'authenticated');

-- partner_links: 본인이 연결된 관계만 조회/수정
CREATE POLICY "partner_links_own" ON public.partner_links
  FOR ALL USING (auth.uid() = requester_id OR auth.uid() = partner_id);

-- ============================================
-- 기존 테이블 RLS 업데이트: 파트너도 조회 가능하도록
-- ============================================

-- log_entries: 파트너가 공유된 카테고리의 기록 조회 가능
DROP POLICY IF EXISTS "entries_own" ON public.log_entries;

CREATE POLICY "entries_own" ON public.log_entries
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.partner_links pl
      JOIN public.log_types lt ON lt.id = log_type_id
      WHERE pl.status = 'accepted'
        AND ((pl.requester_id = auth.uid() AND pl.partner_id = user_id)
          OR (pl.partner_id = auth.uid() AND pl.requester_id = user_id))
        AND pl.shared_categories ? lt.category
    )
  );

-- cycle_logs: 파트너가 cycle 공유 시 조회 가능
DROP POLICY IF EXISTS "cycle_own" ON public.cycle_logs;

CREATE POLICY "cycle_own" ON public.cycle_logs
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.partner_links pl
      WHERE pl.status = 'accepted'
        AND ((pl.requester_id = auth.uid() AND pl.partner_id = user_id)
          OR (pl.partner_id = auth.uid() AND pl.requester_id = user_id))
        AND pl.shared_categories ? 'cycle'
    )
  );
