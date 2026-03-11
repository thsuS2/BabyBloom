-- ============================================
-- 이메일 인증 코드 테이블 (회원가입 인증용)
-- ============================================
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires ON public.email_verification_codes(expires_at);

-- RLS: 이 테이블은 백엔드 서버만 사용 (service role). 앱에서 직접 접근하지 않음.
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- 인증된 요청만 허용하지 않고, 백엔드가 service_role로 접근하므로 정책 없이 두거나 deny all from anon
CREATE POLICY "email_verification_backend_only" ON public.email_verification_codes
  FOR ALL USING (false);

COMMENT ON TABLE public.email_verification_codes IS '회원가입 시 이메일 인증용 6자리 코드. 만료 후 삭제 또는 백엔드에서 expires_at으로 필터.';
