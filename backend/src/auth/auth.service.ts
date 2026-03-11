import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async signUp(email: string, password: string, nickname?: string) {
    const client = this.supabase.getClient();

    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) throw new UnauthorizedException(authError?.message ?? 'Sign up failed');

    // users 테이블에 프로필 생성
    const { error: profileError } = await client
      .from('users')
      .insert({ id: authData.user.id, email, nickname });

    if (profileError) throw new Error(profileError.message);

    return { user: authData.user, session: authData.session };
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
