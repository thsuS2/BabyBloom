import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../supabase/supabase.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private supabase: SupabaseService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) {}

  // ─── 토큰 발급 헬퍼 ───

  private generateAccessToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const db = this.supabase.getAdminClient();
    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000,
    ).toISOString(); // 90일

    const { error } = await db.from('refresh_tokens').insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    });

    if (error) throw new BadRequestException('Refresh token 생성 실패');
    return token;
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = await this.generateRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  // ─── 인증 코드 발송 ───

  async sendSignUpCode(email: string) {
    const db = this.supabase.getAdminClient();

    await db.from('email_verification_codes').delete().eq('email', email);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await db
      .from('email_verification_codes')
      .insert({ email, code, expires_at: expiresAt });

    if (error)
      throw new BadRequestException('인증 코드 저장 실패: ' + error.message);

    await this.mailService.sendVerificationCode(email, code);

    return { message: '인증 코드가 이메일로 발송되었습니다' };
  }

  // ─── 회원가입 ───

  async signUp(
    email: string,
    password: string,
    code: string,
    nickname?: string,
  ) {
    const db = this.supabase.getAdminClient();

    // 1. 코드 검증
    const { data: codeRow, error: codeError } = await db
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !codeRow) {
      throw new BadRequestException(
        '인증 코드가 올바르지 않거나 만료되었습니다',
      );
    }

    // 2. 이메일 중복 확인
    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new BadRequestException('이미 등록된 이메일입니다');
    }

    // 3. 비밀번호 해시
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. 유저 생성
    const userId = randomUUID();
    const { error: insertError } = await db.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      nickname,
    });

    if (insertError) {
      throw new BadRequestException('회원가입 실패: ' + insertError.message);
    }

    // 5. 인증 코드 삭제
    await db.from('email_verification_codes').delete().eq('email', email);

    // 6. 토큰 발급
    const tokens = await this.issueTokens(userId, email);

    return {
      user: { id: userId, email, nickname },
      ...tokens,
    };
  }

  // ─── 로그인 ───

  async signIn(email: string, password: string) {
    const db = this.supabase.getAdminClient();

    const { data: user, error } = await db
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    if (!user.password_hash) {
      throw new UnauthorizedException(
        '비밀번호가 설정되지 않은 계정입니다. 고객센터에 문의해주세요.',
      );
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다',
      );
    }

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, nickname: user.nickname },
      ...tokens,
    };
  }

  // ─── 토큰 갱신 ───

  async refresh(refreshToken: string) {
    const db = this.supabase.getAdminClient();

    const { data: tokenRow, error } = await db
      .from('refresh_tokens')
      .select('*')
      .eq('token', refreshToken)
      .is('revoked_at', null)
      .single();

    if (error || !tokenRow) {
      throw new UnauthorizedException('유효하지 않은 refresh token입니다');
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      await db
        .from('refresh_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', tokenRow.id);
      throw new UnauthorizedException('Refresh token이 만료되었습니다');
    }

    // 기존 refresh token 폐기 (rotation)
    await db
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', tokenRow.id);

    const { data: user } = await db
      .from('users')
      .select('id, email, nickname')
      .eq('id', tokenRow.user_id)
      .single();

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    const tokens = await this.issueTokens(user.id, user.email);

    return {
      user: { id: user.id, email: user.email, nickname: user.nickname },
      ...tokens,
    };
  }

  // ─── 토큰 검증 (AuthGuard에서 사용) ───

  verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다');
    }
  }

  // ─── 내 정보 조회 ───

  async getMe(userId: string) {
    const db = this.supabase.getAdminClient();

    const { data: user, error } = await db
      .from('users')
      .select('id, email, nickname, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    return user;
  }

  // ─── 비밀번호 재설정 ───

  async resetPassword(email: string, code: string, newPassword: string) {
    const db = this.supabase.getAdminClient();

    // 1. 코드 검증
    const { data: codeRow, error: codeError } = await db
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (codeError || !codeRow) {
      throw new BadRequestException(
        '인증 코드가 올바르지 않거나 만료되었습니다',
      );
    }

    // 2. 유저 존재 확인
    const { data: user } = await db
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (!user) {
      throw new BadRequestException('등록되지 않은 이메일입니다');
    }

    // 3. 비밀번호 해시 업데이트
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await db
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      throw new BadRequestException('비밀번호 변경 실패: ' + updateError.message);
    }

    // 4. 인증 코드 삭제
    await db.from('email_verification_codes').delete().eq('email', email);

    // 5. 기존 refresh token 전부 폐기 (보안)
    await db
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user.id);

    return { message: '비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.' };
  }

  // ─── 로그아웃 (refresh token 폐기) ───

  async signOut(refreshToken: string) {
    const db = this.supabase.getAdminClient();

    await db
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token', refreshToken);

    return { message: '로그아웃 되었습니다' };
  }
}
