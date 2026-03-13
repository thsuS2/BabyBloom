import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class LogsService {
  constructor(private supabase: SupabaseService) {}

  // 기록 항목 마스터 목록
  async getLogTypes() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('log_types')
      .select('*')
      .order('display_order');

    if (error) throw new Error(error.message);
    return data;
  }

  // 유저의 활성화된 기록 항목
  async getUserLogSettings(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('user_log_settings')
      .select('*, log_type:log_types(*)')
      .eq('user_id', userId)
      .order('display_order');

    if (error) throw new Error(error.message);
    return data;
  }

  // 기록 항목 활성화/비활성화
  async toggleLogSetting(userId: string, logTypeId: string, isActive: boolean) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('user_log_settings')
      .upsert(
        { user_id: userId, log_type_id: logTypeId, is_active: isActive },
        { onConflict: 'user_id,log_type_id' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 기록 저장 (upsert: 같은 날 같은 항목이면 업데이트)
  async saveEntry(userId: string, logTypeId: string, date: string, value: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('log_entries')
      .upsert(
        { user_id: userId, log_type_id: logTypeId, date, value },
        { onConflict: 'user_id,log_type_id,date' },
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // 여러 기록 한번에 저장 (하루치)
  async saveBulkEntries(userId: string, date: string, entries: { logTypeId: string; value: string }[]) {
    const rows = entries.map((e) => ({
      user_id: userId,
      log_type_id: e.logTypeId,
      date,
      value: e.value,
    }));

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('log_entries')
      .upsert(rows, { onConflict: 'user_id,log_type_id,date' })
      .select();

    if (error) throw new Error(error.message);
    return data;
  }

  // 특정 날짜 기록 조회
  async getEntriesByDate(userId: string, date: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('log_entries')
      .select('*, log_type:log_types(*)')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw new Error(error.message);
    return data;
  }

  // 기간별 기록 조회
  async getEntriesByRange(userId: string, startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('log_entries')
      .select('*, log_type:log_types(*)')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw new Error(error.message);
    return data;
  }

  // 기록 삭제
  async deleteEntry(userId: string, entryId: string) {
    const { error } = await this.supabase
      .getAdminClient()
      .from('log_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
