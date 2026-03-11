import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api'
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
