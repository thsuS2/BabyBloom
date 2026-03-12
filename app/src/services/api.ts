import axios from 'axios';
import { supabase } from './supabase';

// ngrok 터널링 URL (개발 중 실기기 테스트용)
const NGROK_URL = 'https://unruptured-ceremonially-mckayla.ngrok-free.dev';

const API_BASE_URL = __DEV__
  ? `${NGROK_URL}/api`
  : 'https://your-production-url.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 자동으로 토큰 첨부
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export default api;
