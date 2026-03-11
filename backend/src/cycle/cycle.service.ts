import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CycleService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, startDate: string, endDate?: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cycle_logs')
      .insert({ user_id: userId, cycle_start_date: startDate, cycle_end_date: endDate })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(userId: string, id: string, endDate: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cycle_logs')
      .update({ cycle_end_date: endDate })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async getAll(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cycle_logs')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_start_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async getLatest(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('cycle_logs')
      .select('*')
      .eq('user_id', userId)
      .order('cycle_start_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  }

  async delete(userId: string, id: string) {
    const { error } = await this.supabase
      .getClient()
      .from('cycle_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true };
  }
}
