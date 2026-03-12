import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';
import api from '../services/api';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendSignUpCode: (email: string) => Promise<void>;
  signUp: (email: string, password: string, code: string, nickname?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null, loading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
    });
  },

  sendSignUpCode: async (email) => {
    const { data } = await api.post('/auth/send-signup-code', { email });
    return data;
  },

  signUp: async (email, password, code, nickname) => {
    const { data } = await api.post('/auth/signup', { email, password, code, nickname });

    // 백엔드가 Supabase session을 반환하므로, 앱에서도 세션 동기화
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    set({ session: data.session, user: data.user });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ session: data.session, user: data.user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
