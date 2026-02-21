import { create } from 'zustand';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface UserGoals {
  daily_net_carbs: number;
  daily_calories: number;
  daily_protein: number;
  daily_fat: number;
}

interface DailyNutrition {
  total_calories: number;
  total_carbs: number;
  total_fiber: number;
  total_sugar_alcohols: number;
  total_net_carbs: number;
  total_protein: number;
  total_fat: number;
}

interface FoodLog {
  log_id: string;
  food_id: string;
  food_name: string;
  meal_type: string;
  servings: number;
  serving_size: number;
  serving_unit: string;
  calories: number;
  total_carbs: number;
  fiber: number;
  sugar_alcohols: number;
  net_carbs: number;
  protein: number;
  fat: number;
  log_date: string;
}

interface FoodItem {
  food_id: string;
  name: string;
  brand?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  total_carbs: number;
  fiber: number;
  sugar_alcohols: number;
  net_carbs: number;
  protein: number;
  fat: number;
}

interface MealSuggestion {
  name: string;
  net_carbs: number;
  calories: number;
  description: string;
}

interface NutritionState {
  goals: UserGoals | null;
  dailyNutrition: DailyNutrition | null;
  foodLogs: FoodLog[];
  weeklyData: any[];
  suggestions: MealSuggestion[];
  remainingCarbs: number;
  isLoading: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  fetchGoals: () => Promise<void>;
  updateGoals: (goals: Partial<UserGoals>) => Promise<void>;
  fetchDailyNutrition: (date: string) => Promise<void>;
  fetchFoodLogs: (date: string) => Promise<void>;
  addFoodLog: (log: Omit<FoodLog, 'log_id' | 'user_id'>) => Promise<void>;
  deleteFoodLog: (logId: string) => Promise<void>;
  searchFoods: (query: string) => Promise<FoodItem[]>;
  fetchSuggestions: () => Promise<void>;
  fetchWeeklyData: () => Promise<void>;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useNutritionStore = create<NutritionState>((set, get) => ({
  goals: null,
  dailyNutrition: null,
  foodLogs: [],
  weeklyData: [],
  suggestions: [],
  remainingCarbs: 25,
  isLoading: false,
  selectedDate: getTodayDate(),

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().fetchDailyNutrition(date);
    get().fetchFoodLogs(date);
  },

  fetchGoals: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/goals`, {
        credentials: 'include',
      });
      if (response.ok) {
        const goals = await response.json();
        set({ goals });
      }
    } catch (error) {
      console.error('Fetch goals error:', error);
    }
  },

  updateGoals: async (goalsUpdate) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/goals`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalsUpdate),
        credentials: 'include',
      });
      if (response.ok) {
        const goals = await response.json();
        set({ goals });
      }
    } catch (error) {
      console.error('Update goals error:', error);
    }
  },

  fetchDailyNutrition: async (date) => {
    try {
      set({ isLoading: true });
      const response = await fetch(`${BACKEND_URL}/api/nutrition/daily?date=${date}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const nutrition = await response.json();
        const goals = get().goals;
        const remaining = goals ? goals.daily_net_carbs - (nutrition.total_net_carbs || 0) : 25;
        set({ dailyNutrition: nutrition, remainingCarbs: Math.max(0, remaining) });
      }
    } catch (error) {
      console.error('Fetch nutrition error:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFoodLogs: async (date) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/food-logs?date=${date}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const logs = await response.json();
        set({ foodLogs: logs });
      }
    } catch (error) {
      console.error('Fetch food logs error:', error);
    }
  },

  addFoodLog: async (log) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/food-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
        credentials: 'include',
      });
      if (response.ok) {
        const { selectedDate } = get();
        await get().fetchFoodLogs(selectedDate);
        await get().fetchDailyNutrition(selectedDate);
        await get().fetchSuggestions();
      }
    } catch (error) {
      console.error('Add food log error:', error);
    }
  },

  deleteFoodLog: async (logId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/food-logs/${logId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        const { selectedDate } = get();
        await get().fetchFoodLogs(selectedDate);
        await get().fetchDailyNutrition(selectedDate);
        await get().fetchSuggestions();
      }
    } catch (error) {
      console.error('Delete food log error:', error);
    }
  },

  searchFoods: async (query) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/foods/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Search foods error:', error);
    }
    return [];
  },

  fetchSuggestions: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/suggestions`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        set({
          suggestions: data.suggestions,
          remainingCarbs: data.remaining_carbs,
        });
      }
    } catch (error) {
      console.error('Fetch suggestions error:', error);
    }
  },

  fetchWeeklyData: async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/nutrition/weekly`, {
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
}));
