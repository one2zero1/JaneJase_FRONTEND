import { create } from 'zustand';
import type { MeasurementData } from '@/types/poseTypes';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8010';

interface StandardData {
  user_id: string;
  ended_at: string | null;
  measurement: MeasurementData;
}

interface ViewWarning {
  pose_id: string;
  timestamp: string;
  duration: number;
  status: any;
  averages?: any;
}

interface PoseState {
  currentPoseId: string | null;
  saveWarning: (data: ViewWarning) => Promise<any>;
  saveStandardData: (data: StandardData) => Promise<string | null>;
  endCorrection: (data: StandardData) => Promise<void>;
}

export const usePoseStore = create<PoseState>((set, get) => ({
  currentPoseId: null,
  saveStandardData: async (data: StandardData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/pose/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ currentPoseId: result.id });
      return result.id;
    } catch (e) {
      console.error('DB 저장 실패:', e);
      return null;
    }
  },
  saveWarning: async (data: ViewWarning) => {
    console.log('data : ', data);
    try {
      const response = await fetch(`${API_BASE_URL}/pose/warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      return result;
    } catch (e) {
      console.error('DB 저장 실패:', e);
      return null;
    }
  },
  endCorrection: async (data: StandardData) => {
    const { currentPoseId } = get();
    if (!currentPoseId) {
      console.error('No active pose session to end');
      return;
    }
    try {
      await fetch(`${API_BASE_URL}/pose/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pose_id: currentPoseId,
          ended_at: data.ended_at,
        }),
      });
      set({ currentPoseId: null });
    } catch (error) {
      console.error('DB 저장 실패:', error);
    }
  },
}));

export default usePoseStore;
