import { create } from 'zustand';
import api from '../services/api';
import { tokenStorage } from '../services/tokenStorage';

interface User {
  id: string;
  email: string;
  nickname?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  sendSignUpCode: (email: string) => Promise<void>;
  signUp: (email: string, password: string, code: string, nickname?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        set({ user: null, loading: false });
        return;
      }

      // access token으로 내 정보 조회
      const { data: user } = await api.get('/auth/me');
      set({ user, loading: false });
    } catch {
      // 토큰 무효 → 정리 (api 인터셉터가 refresh 시도 후 실패한 경우)
      await tokenStorage.clearTokens();
      set({ user: null, loading: false });
    }
  },

  sendSignUpCode: async (email) => {
    await api.post('/auth/send-signup-code', { email });
  },

  signUp: async (email, password, code, nickname) => {
    const { data } = await api.post('/auth/signup', {
      email,
      password,
      code,
      nickname,
    });

    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
  },

  signIn: async (email, password) => {
    const { data } = await api.post('/auth/signin', { email, password });

    await tokenStorage.setTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
  },

  signOut: async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/signout', { refreshToken });
      }
    } catch {
      // 서버 에러 무시
    }

    await tokenStorage.clearTokens();
    set({ user: null });
  },
}));
