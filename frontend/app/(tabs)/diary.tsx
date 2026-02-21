import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '../../src/store/nutritionStore';
import { FoodLogItem } from '../../src/components/FoodLogItem';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function DiaryScreen() {
  const router = useRouter();
  const {
    selectedDate,
    foodLogs,
    isLoading,
    setSelectedDate,
    fetchFoodLogs,
    deleteFoodLog,
  } = useNutritionStore();

  useEffect(() => {
    fetchFoodLogs(selectedDate);
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const getLogsForMeal = (mealType: string) => {
    return foodLogs.filter((log) => log.meal_type === mealType);
  };

  const getMealIcon = (mealType: string): any => {
    switch (mealType) {
      case 'breakfast': return 'sunny';
      case 'lunch': return 'partly-sunny';
      case 'dinner': return 'moon';
      case 'snack': return 'cafe';
      default: return 'restaurant';
    }
  };

  const getMealTotal = (mealType: string) => {
    const logs = getLogsForMeal(mealType);
    return logs.reduce((sum, log) => sum + (log.net_carbs * log.servings), 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.dateText}>
          {new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
        </Text>
        <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => fetchFoodLogs(selectedDate)}
            tintColor="#10B981"
          />
        }
      >
        {MEAL_TYPES.map((mealType) => {
          const logs = getLogsForMeal(mealType);
          const mealTotal = getMealTotal(mealType);

          return (
            <View key={mealType} style={styles.mealSection}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <Ionicons name={getMealIcon(mealType)} size={20} color="#10B981" />
                  <Text style={styles.mealTitle}>
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                  </Text>
                </View>
                <Text style={styles.mealCarbs}>{mealTotal.toFixed(1)}g net carbs</Text>
              </View>

              {logs.length > 0 ? (
                logs.map((log) => (
                  <FoodLogItem
                    key={log.log_id}
                    foodName={log.food_name}
                    servings={log.servings}
                    servingSize={log.serving_size}
                    servingUnit={log.serving_unit}
                    calories={log.calories}
                    netCarbs={log.net_carbs}
                    protein={log.protein}
                    fat={log.fat}
                    onDelete={() => deleteFoodLog(log.log_id)}
                  />
                ))
              ) : (
                <View style={styles.emptyMeal}>
                  <Text style={styles.emptyText}>No foods logged</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push({ pathname: '/add-food', params: { mealType } })}
              >
                <Ionicons name="add" size={20} color="#10B981" />
                <Text style={styles.addButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  mealSection: {
    marginBottom: 24,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealCarbs: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  emptyMeal: {
    backgroundColor: '#1A202C',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
});
