import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface FastingProtocol {
  protocol_id: string;
  name: string;
  fasting_hours: number;
  eating_hours: number;
  description: string;
}

interface FastingSession {
  session_id: string;
  protocol_id: string;
  protocol_name: string;
  target_hours: number;
  start_time: string;
  end_time?: string;
  target_end_time: string;
  is_active: boolean;
  completed: boolean;
  actual_hours?: number;
  notes?: string;
}

interface CurrentFastResponse {
  active: boolean;
  session: FastingSession | null;
  elapsed_seconds: number;
  elapsed_hours: number;
  remaining_seconds: number;
  progress_percent: number;
  is_complete: boolean;
}

interface FastingStats {
  total_fasts: number;
  completed_fasts: number;
  total_hours_fasted: number;
  average_fast_duration: number;
  longest_fast: number;
  current_streak: number;
  best_streak: number;
}

interface FastingState {
  protocols: FastingProtocol[];
  currentFast: CurrentFastResponse | null;
  history: FastingSession[];
  stats: FastingStats | null;
  isLoading: boolean;
  timerInterval: ReturnType<typeof setInterval> | null;
  notificationId: string | null;
  
  fetchProtocols: () => Promise<void>;
  fetchCurrentFast: () => Promise<void>;
  startFast: (protocolId: string, customHours?: number) => Promise<boolean>;
  endFast: (notes?: string) => Promise<boolean>;
  fetchHistory: () => Promise<void>;
  fetchStats: () => Promise<void>;
  startTimer: () => void;
  stopTimer: () => void;
  scheduleNotification: (targetEndTime: string, protocolName: string) => Promise<void>;
  cancelNotification: () => Promise<void>;
  requestNotificationPermissions: () => Promise<boolean>;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useFastingStore = create<FastingState>((set, get) => ({
  protocols: [],
  currentFast: null,
  history: [],
  stats: null,
  isLoading: false,
  timerInterval: null,
  notificationId: null,

  requestNotificationPermissions: async () => {
    if (Platform.OS === 'web') return true;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  fetchProtocols: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fasting/protocols`);
      if (response.ok) {
        const protocols = await response.json();
        set({ protocols });
      }
    } catch (error) {
      console.error('Fetch protocols error:', error);
    }
  },

  fetchCurrentFast: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fasting/current`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        set({ currentFast: data });
        
        // Start timer if there's an active fast
        if (data.active) {
          get().startTimer();
        }
      }
    } catch (error) {
      console.error('Fetch current fast error:', error);
    }
  },

  startFast: async (protocolId: string, customHours?: number) => {
    try {
      set({ isLoading: true });
      const body: any = { protocol_id: protocolId };
      if (customHours) {
        body.custom_hours = customHours;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/fasting/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      
      if (response.ok) {
        const session = await response.json();
        await get().fetchCurrentFast();
        get().startTimer();
        
        // Schedule notification
        const protocol = get().protocols.find(p => p.protocol_id === protocolId);
        await get().scheduleNotification(
          session.target_end_time,
          protocol?.name || `${customHours}h Fast`
        );
        
        return true;
      }
    } catch (error) {
      console.error('Start fast error:', error);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  endFast: async (notes?: string) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${BACKEND_URL}/api/fasting/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
        credentials: 'include',
      });
      
      if (response.ok) {
        get().stopTimer();
        await get().cancelNotification();
        set({ currentFast: { active: false, session: null, elapsed_seconds: 0, elapsed_hours: 0, remaining_seconds: 0, progress_percent: 0, is_complete: false } });
        await get().fetchHistory();
        await get().fetchStats();
        return true;
      }
    } catch (error) {
      console.error('End fast error:', error);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },

  fetchHistory: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fasting/history`, {
        credentials: 'include',
      });
      if (response.ok) {
        const history = await response.json();
        set({ history });
      }
    } catch (error) {
      console.error('Fetch history error:', error);
    }
  },

  fetchStats: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/fasting/stats`, {
        credentials: 'include',
      });
      if (response.ok) {
        const stats = await response.json();
        set({ stats });
      }
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  startTimer: () => {
    const existing = get().timerInterval;
    if (existing) {
      clearInterval(existing);
    }
    
    const interval = setInterval(() => {
      get().fetchCurrentFast();
    }, 1000);
    
    set({ timerInterval: interval });
  },

  stopTimer: () => {
    const interval = get().timerInterval;
    if (interval) {
      clearInterval(interval);
      set({ timerInterval: null });
    }
  },

  scheduleNotification: async (targetEndTime: string, protocolName: string) => {
    if (Platform.OS === 'web') return;
    
    try {
      await get().cancelNotification();
      
      const hasPermission = await get().requestNotificationPermissions();
      if (!hasPermission) return;
      
      const targetDate = new Date(targetEndTime);
      const now = new Date();
      const secondsUntilEnd = Math.max(0, (targetDate.getTime() - now.getTime()) / 1000);
      
      if (secondsUntilEnd > 0) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🎉 Fast Complete!',
            body: `Congratulations! You've completed your ${protocolName} fast.`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor(secondsUntilEnd),
          },
        });
        
        set({ notificationId });
      }
    } catch (error) {
      console.error('Schedule notification error:', error);
    }
  },

  cancelNotification: async () => {
    const notificationId = get().notificationId;
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch (error) {
        console.error('Cancel notification error:', error);
      }
      set({ notificationId: null });
    }
  },
}));
