import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private mailService: MailService,
  ) {}

  /** 6자리 인증 코드 생성 및 이메일 발송 */
  async sendSignUpCode(email: string) {
    const admin = this.supabase.getAdminClient();

    // 기존 코드 삭제 (같은 이메일)
    await admin.from('email_verification_codes').delete().eq('email', email);

    // 6자리 랜덤 코드
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 5분 뒤 만료
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await admin.from('email_verification_codes').insert({
      email,
      code,
      expires_at: expiresAt,
    });

    if (error) throw new BadRequestException('인증 코드 저장 실패: ' + error.message);

    // 이메일 발송
    await this.mailService.sendVerificationCode(email, code);

    return { message: '인증 코드가 이메일로 발송되었습니다' };
  }

  /** 인증 코드 검증 후 회원가입 */
  async signUp(email: string, password: string, code: string, nickname?: string) {
    const admin = this.supabase.getAdminClient();

    // 1. 코드 검증
    const { data: codeRow, error: codeError } = await admin
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !codeRow) {
      throw new BadRequestException('인증 코드가 올바르지 않거나 만료되었습니다');
    }

    // 2. 좀비 유저 정리 (auth에는 있지만 public.users에는 없는 경우)
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existingAuthUser = (existingUsers?.users as any[])?.find((u) => u.email === email);

    if (existingAuthUser) {
      const { data: profileRow } = await admin
        .from('users')
        .select('id')
        .eq('id', existingAuthUser.id)
        .single();

      if (profileRow) {
        throw new BadRequestException('이미 등록된 이메일입니다');
      }

      // 좀비 유저 삭제 (auth에만 있고 public.users에 없음)
      await admin.auth.admin.deleteUser(existingAuthUser.id);
    }

    // 3. Auth 유저 생성
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException(authError?.message ?? '회원가입 실패');
    }

    // 4. 프로필 생성 (실패 시 auth 유저 롤백)
    const { error: profileError } = await admin
      .from('users')
      .insert({ id: authData.user.id, email, nickname });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw new BadRequestException('프로필 생성 실패: ' + profileError.message);
    }

    // 5. 인증 코드 삭제
    await admin.from('email_verification_codes').delete().eq('email', email);

    // 6. 세션 생성
    const client = this.supabase.getClient();
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      throw new UnauthorizedException('회원가입 완료되었으나 자동 로그인 실패: ' + signInError.message);
    }

    return { user: authData.user, session: signInData.session };
  }

  async signIn(email: string, password: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new UnauthorizedException(error.message);

    return { user: data.user, session: data.session };
  }

  async getUser(token: string) {
    const client = this.supabase.getClient();

    const { data, error } = await client.auth.getUser(token);

    if (error) throw new UnauthorizedException(error.message);

    return data.user;
  }
}
