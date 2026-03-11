import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class PartnerService {
  constructor(private supabase: SupabaseService) {}

  // 6자리 랜덤 초대코드 생성
  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // 초대코드 발급
  async createInviteCode(userId: string) {
    // 기존 미사용 코드 만료 처리
    await this.supabase
      .getClient()
      .from('invite_codes')
      .delete()
      .eq('user_id', userId)
      .eq('is_used', false);

    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24시간

    const { data, error } = await this.supabase
      .getClient()
      .from('invite_codes')
      .insert({ user_id: userId, code, expires_at: expiresAt })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 초대코드로 파트너 연결
  async connectByCode(userId: string, code: string) {
    // 코드 조회
    const { data: invite, error } = await this.supabase
      .getClient()
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_used', false)
      .single();

    if (error || !invite) throw new NotFoundException('유효하지 않은 초대코드입니다');

    // 만료 확인
    if (new Date(invite.expires_at) < new Date()) {
      throw new BadRequestException('만료된 초대코드입니다');
    }

    // 자기 자신 연결 방지
    if (invite.user_id === userId) {
      throw new BadRequestException('본인의 초대코드는 사용할 수 없습니다');
    }

    // 이미 연결된 파트너가 있는지 확인
    const { data: existing } = await this.supabase
      .getClient()
      .from('partner_links')
      .select('*')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
      .limit(1);

    if (existing && existing.length > 0) {
      throw new BadRequestException('이미 연결된 파트너가 있습니다');
    }

    // 파트너 연결 생성
    const { data: link, error: linkError } = await this.supabase
      .getClient()
      .from('partner_links')
      .insert({
        requester_id: invite.user_id,
        partner_id: userId,
        status: 'accepted',
      })
      .select()
      .single();

    if (linkError) throw new Error(linkError.message);

    // 코드 사용 처리
    await this.supabase
      .getClient()
      .from('invite_codes')
      .update({ is_used: true })
      .eq('id', invite.id);

    return link;
  }

  // 파트너 정보 조회
  async getPartner(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('partner_links')
      .select('*, requester:users!requester_id(*), partner:users!partner_id(*)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  // 공유 카테고리 설정
  async updateSharedCategories(userId: string, categories: string[]) {
    const { data, error } = await this.supabase
      .getClient()
      .from('partner_links')
      .update({ shared_categories: categories })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 파트너 연결 해제
  async disconnect(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('partner_links')
      .update({ status: 'disconnected', disconnected_at: new Date().toISOString() })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
