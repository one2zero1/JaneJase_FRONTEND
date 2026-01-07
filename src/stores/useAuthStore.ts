import { create } from 'zustand';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

// 스토어에서 사용할 상태와 액션(함수)의 타입을 정의
interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션들
  gLogin: () => void; // 구글 로그인 페이지로 이동
  gLogout: () => void;
  setToken: (token: string) => void; // URL에서 토큰을 추출했을 때 저장용
  fetchUser: () => Promise<void>; // /auth/me 호출하여 사용자 정보 가져오기
}

// 2. 스토어 생성
const useGoogleStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('accessToken'), // 새로고침 해도 토큰 유지 (초기값)
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  // 1. 로그인: 구글 OAuth 페이지로 리디렉션
  gLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/login/google`;
  },

  // 2. 토큰 저장 (로그인 성공 후 호출됨)
  setToken: (token: string) => {
    localStorage.setItem('accessToken', token);
    set({ token, isAuthenticated: true });
  },

  // 3. 사용자 정보 가져오기 (GET /auth/me)
  fetchUser: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`, // 헤더에 토큰 실어서 보냄
        },
      });

      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, isAuthenticated: true });
      } else {
        // 토큰이 만료되었거나 유효하지 않으면 로그아웃 처리
        get().gLogout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      get().gLogout();
    } finally {
      set({ isLoading: false });
    }
  },

  // 4. 로그아웃
  gLogout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null, token: null, isAuthenticated: false });
    // 필요하다면 메인 페이지로 이동: window.location.href = '/';
  },
}));

export default useGoogleStore;
