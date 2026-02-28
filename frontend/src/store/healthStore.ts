import { create } from 'zustand';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SleepData {
  duration_hours: number;
  sleep_quality: number;
  deep_sleep_hours: number;
  light_sleep_hours: number;
  rem_sleep_hours: number;
  awake_hours: number;
}

interface HeartData {
  resting_heart_rate: number;
  hrv: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  min_heart_rate: number;
}

interface ActivityData {
  steps: number;
  active_calories: number;
  total_calories: number;
  distance_km: number;
  active_minutes: number;
}

interface GlucoseData {
  avg_glucose: number;
  min_glucose: number;
  max_glucose: number;
  time_in_range_percent: number;
  spike_count: number;
  readings: Array<{ time: string; value: number }>;
}

interface StressRecoveryData {
  stress_level: number;
  recovery_score: number;
  readiness_score: number;
  body_battery: number;
}

interface BodyData {
  weight_kg: number;
  body_fat_percent: number;
  hydration_ml: number;
}

interface NutritionData {
  total_calories: number;
  total_net_carbs: number;
  total_protein: number;
  total_fat: number;
}

interface HealthDashboard {
  date: string;
  sleep: SleepData;
  heart: HeartData;
  activity: ActivityData;
  glucose: GlucoseData;
  stress_recovery: StressRecoveryData;
  body: BodyData;
  nutrition: NutritionData;
  data_source: string;
}

interface WeeklyDataPoint {
  date: string;
  sleep_hours: number;
  sleep_quality: number;
  steps: number;
  rhr: number;
  hrv: number;
  avg_glucose: number;
  readiness: number;
}

interface Insight {
  title: string;
  insight: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface ChatMessage {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Provider {
  id: string;
  name: string;
  icon: string;
  status: string;
}

interface HealthState {
  dashboard: HealthDashboard | null;
  weeklyData: WeeklyDataPoint[];
  insights: Insight[];
  chatMessages: ChatMessage[];
  providers: Provider[];
  isLoading: boolean;
  isChatLoading: boolean;
  selectedDate: string;
  
  setSelectedDate: (date: string) => void;
  fetchDashboard: (date?: string) => Promise<void>;
  fetchWeeklyData: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchChatHistory: () => Promise<void>;
  sendChatMessage: (message: string) => Promise<string | null>;
  clearChatHistory: () => Promise<void>;
  logHealthData: (data: any) => Promise<boolean>;
  fetchProviders: () => Promise<void>;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useHealthStore = create<HealthState>((set, get) => ({
  dashboard: null,
  weeklyData: [],
  insights: [],
  chatMessages: [],
  providers: [],
  isLoading: false,
  isChatLoading: false,
  selectedDate: getTodayDate(),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchDashboard(date);
  },

  fetchDashboard: async (date?: string) => {
    try {
      set({ isLoading: true });
      const targetDate = date || get().selectedDate;
      const response = await fetch(
        `${BACKEND_URL}/api/health/dashboard?date=${targetDate}`,
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        set({ dashboard: data });
      }
    } catch (error) {
      console.error('Fetch dashboard error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchWeeklyData: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health/weekly`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        set({ weeklyData: data });
      }
    } catch (error) {
      console.error('Fetch weekly data error:', error);
    }
  },

  fetchInsights: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${BACKEND_URL}/api/health/insights`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        set({ insights: data.insights || [] });
      }
    } catch (error) {
      console.error('Fetch insights error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchChatHistory: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health/chat/history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const messages = await response.json();
        set({ chatMessages: messages });
      }
    } catch (error) {
      console.error('Fetch chat history error:', error);
    }
  },

  sendChatMessage: async (message: string) => {
    try {
      set({ isChatLoading: true });
      
      // Add user message optimistically
      const userMsg: ChatMessage = {
        message_id: `temp_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      };
      set((state) => ({ chatMessages: [...state.chatMessages, userMsg] }));
      
      const response = await fetch(`${BACKEND_URL}/api/health/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, include_health_context: true }),
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMsg: ChatMessage = {
          message_id: data.message_id,
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ chatMessages: [...state.chatMessages, assistantMsg] }));
        return data.response;
      }
    } catch (error) {
      console.error('Send chat message error:', error);
    } finally {
      set({ isChatLoading: false });
    }
    return null;
  },

  clearChatHistory: async () => {
    try {
      await fetch(`${BACKEND_URL}/api/health/chat/history`, {
        method: 'DELETE',
        credentials: 'include',
      });
      set({ chatMessages: [] });
    } catch (error) {
      console.error('Clear chat history error:', error);
    }
  },

  logHealthData: async (data: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (response.ok) {
        await get().fetchDashboard();
        return true;
      }
    } catch (error) {
      console.error('Log health data error:', error);
    }
    return false;
  },

  fetchProviders: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/integrations/terra/providers`, {
        credentials: 'include',
      });
      if (response.ok) {
        const providers = await response.json();
        set({ providers });
      }
    } catch (error) {
      console.error('Fetch providers error:', error);
    }
  },
}));
