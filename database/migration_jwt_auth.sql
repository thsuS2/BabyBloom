-- ============================================
-- BabyBloom: Supabase Auth → 자체 JWT 인증 전환
-- ============================================

-- 1. users 테이블에 password_hash 컬럼 추가
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. refresh_tokens 테이블 생성
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON public.refresh_tokens(token);

-- 3. users 테이블의 id를 auth.users FK에서 분리 (자체 UUID 생성)
-- 기존: id UUID REFERENCES auth.users(id)
-- 변경: id UUID DEFAULT gen_random_uuid() (독립)
-- 주의: 기존 데이터가 있으면 FK 제거 필요
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- FK가 있다면 제거 (auth.users 의존 해제)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
  END IF;
END $$;

-- 4. RLS 정책 업데이트 (auth.uid() → 서비스 롤 키 기반)
-- 백엔드에서 service_role_key로 접근하므로 RLS를 간소화
-- 기존 정책 제거 후 재설정

-- refresh_tokens RLS
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on refresh_tokens"
  ON public.refresh_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
