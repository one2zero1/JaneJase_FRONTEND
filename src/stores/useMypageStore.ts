import { create } from 'zustand';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

interface Session {
  pose_id: string;
  created_at: string;
  warning_count: number;
  total_unfocus_time: number;
}

interface MypageState {
  history: Session[];
  isLoading: boolean;
  error: string | null;
  fetchHistory: (userId: string) => Promise<void>;
  deleteHistory: (poseId: string) => Promise<void>;
}

export const useMypageStore = create<MypageState>(set => ({
  history: [],
  isLoading: false,
  error: null,
  fetchHistory: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/mypage/history/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch history');

      const data = await response.json();

      if (Array.isArray(data)) {
        set({ history: data, isLoading: false });
      } else {
        console.error('Data is not an array:', data);
        set({ history: [], isLoading: false, error: 'Invalid data format' });
      }
    } catch (e: any) {
      console.error('History fetch failed:', e);
      set({
        history: [],
        isLoading: false,
        error: e.message || 'Error fetching history',
      });
    }
  },
  deleteHistory: async (poseId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/mypage/history/${poseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // 성공 시 로컬 상태 업데이트 (다시 fetch 안함)
        set(state => ({
          history: state.history.filter(item => item.pose_id !== poseId),
        }));
      } else {
        console.error('Failed to delete history');
      }
    } catch (e: any) {
      console.error('Delete failed:', e);
    }
  },
}));

export default useMypageStore;
