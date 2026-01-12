import { create } from 'zustand';
import type { MeasurementData } from '@/types/poseTypes';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

interface ViewWarning {
  timestamp: string;
  duration: number;
  status: any;
  averages?: any;
}

interface StandardData {
  user_id: string;
  ended_at: string | null;
  measurement: MeasurementData;
}

interface PoseState {
  saveWarning: (data: ViewWarning) => Promise<void>;
}

interface StandardDataState {
  saveStandardData: (data: StandardData) => Promise<string | null>;
}

export const usePoseDetactStore = create<PoseState>(() => ({
  saveWarning: async (data: ViewWarning) => {
    try {
      await fetch(`${API_BASE_URL}/pose/warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (e) {
      console.error('DB 저장 실패:', e);
    }
  },
}));

export const usePoseStore = create<StandardDataState>(() => ({
  saveStandardData: async (data: StandardData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pose/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result.id;
    } catch (e) {
      console.error('DB 저장 실패:', e);
      return null;
    }
  },
}));

export default usePoseStore;
