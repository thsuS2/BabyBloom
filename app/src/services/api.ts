import axios from 'axios';
import { tokenStorage } from './tokenStorage';

// ngrok 터널링 URL (개발 중 실기기 테스트용)
const NGROK_URL = 'https://unruptured-ceremonially-mckayla.ngrok-free.dev';

const API_BASE_URL = __DEV__
  ? `${NGROK_URL}/api`
  : 'https://your-production-url.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 인터셉터: access token 자동 첨부
api.interceptors.request.use(async (config) => {
  const accessToken = await tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 refresh token으로 재발급 시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401이고 아직 재시도 안 한 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          await tokenStorage.clearTokens();
          return Promise.reject(error);
        }

        // refresh 엔드포인트 호출 (인터셉터 우회를 위해 axios 직접 사용)
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // 새 토큰 저장
        await tokenStorage.setTokens(data.accessToken, data.refreshToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        // refresh도 실패 → 토큰 삭제 (로그아웃 상태)
        await tokenStorage.clearTokens();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
