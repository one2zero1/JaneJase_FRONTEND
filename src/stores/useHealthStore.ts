import { create } from 'zustand';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

// 1. 스토어에서 사용할 상태와 액션(함수)의 타입을 정의합니다.
interface HealthState {
  healthStatus: 'idle' | 'loading' | 'success' | 'error'; // 상태를 명확한 문자열로 제한
  healthMessage: string;
  checkServerHealth: () => Promise<void>; // 비동기 함수 타입 정의
}

// 2. 스토어 생성
const useHealthStore = create<HealthState>(set => ({
  healthStatus: 'idle',
  healthMessage: '',

  checkServerHealth: async () => {
    // 로딩 시작
    set({ healthStatus: 'loading', healthMessage: '서버 확인 중...' });

    try {
      // API 호출
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();

      // 성공 조건 체크
      if (response.ok && data.message === 'ok') {
        set({
          healthStatus: 'success',
          healthMessage: '백엔드 서버가 정상 작동 중입니다.',
        });
      } else {
        set({
          healthStatus: 'error',
          healthMessage: '서버 응답이 올바르지 않습니다.',
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      set({
        healthStatus: 'error',
        healthMessage: '서버에 연결할 수 없습니다.',
      });
    }
  },
}));

export default useHealthStore;
