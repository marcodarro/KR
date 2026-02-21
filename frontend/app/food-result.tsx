import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '../src/store/nutritionStore';

interface AnalyzedFood {
  name: string;
  estimated_weight_g: number;
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

interface AnalysisResult {
  foods: AnalyzedFood[];
  total_estimated: {
    calories: number;
    net_carbs: number;
    protein: number;
    fat: number;
  };
  keto_friendly: boolean;
  keto_notes: string;
}

export default function FoodResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { selectedDate, addFoodLog } = useNutritionStore();
  const [selectedFoods, setSelectedFoods] = useState<Set<number>>(new Set());
  const [mealType, setMealType] = useState('snack');

  let result: AnalysisResult | null = null;
  try {
    if (params.result) {
      result = JSON.parse(params.result as string);
    }
  } catch (e) {
    console.error('Failed to parse result:', e);
  }

  if (!result || !result.foods || result.foods.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>No Food Detected</Text>
          <Text style={styles.errorText}>
            We couldn't identify any food in the image. Please try again with a
            clearer photo.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleFood = (index: number) => {
    const newSelected = new Set(selectedFoods);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFoods(newSelected);
  };

  const handleAddSelected = async () => {
    if (selectedFoods.size === 0) {
      Alert.alert('Select Foods', 'Please select at least one food to add.');
      return;
    }

    const selectedFoodsList = result!.foods.filter((_, index) =>
      selectedFoods.has(index)
    );

    for (const food of selectedFoodsList) {
      await addFoodLog({
        food_id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        food_name: food.name,
        meal_type: mealType,
        servings: 1,
        serving_size: food.estimated_weight_g,
        serving_unit: 'g',
        calories: food.calories,
        total_carbs: food.total_carbs,
        fiber: food.fiber,
        sugar_alcohols: food.sugar_alcohols,
        net_carbs: food.net_carbs,
        protein: food.protein,
        fat: food.fat,
        log_date: selectedDate,
      });
    }

    Alert.alert('Success', `Added ${selectedFoods.size} food(s) to your diary!`);
    router.replace('/(tabs)/diary');
  };

  const MEAL_OPTIONS = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Keto Status */}
        <View
          style={[
            styles.ketoStatusCard,
            { backgroundColor: result.keto_friendly ? '#10B981' : '#F59E0B' },
          ]}
        >
          <Ionicons
            name={result.keto_friendly ? 'checkmark-circle' : 'warning'}
            size={32}
            color="#FFFFFF"
          />
          <View style={styles.ketoStatusContent}>
            <Text style={styles.ketoStatusTitle}>
              {result.keto_friendly ? 'Keto Friendly!' : 'Watch Your Carbs'}
            </Text>
            <Text style={styles.ketoStatusText}>{result.keto_notes}</Text>
          </View>
        </View>

        {/* Total Summary */}
        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Total Estimated Nutrients</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>
                {result.total_estimated?.calories?.toFixed(0) || 0}
              </Text>
              <Text style={styles.totalLabel}>Calories</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={[styles.totalValue, styles.carbsValue]}>
                {result.total_estimated?.net_carbs?.toFixed(1) || 0}g
              </Text>
              <Text style={styles.totalLabel}>Net Carbs</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>
                {result.total_estimated?.protein?.toFixed(1) || 0}g
              </Text>
              <Text style={styles.totalLabel}>Protein</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalValue}>
                {result.total_estimated?.fat?.toFixed(1) || 0}g
              </Text>
              <Text style={styles.totalLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Meal Type Selector */}
        <Text style={styles.sectionTitle}>Add to</Text>
        <View style={styles.mealTypeRow}>
          {MEAL_OPTIONS.map((meal) => (
            <TouchableOpacity
              key={meal}
              style={[
                styles.mealTypeButton,
                mealType === meal && styles.mealTypeButtonActive,
              ]}
              onPress={() => setMealType(meal)}
            >
              <Text
                style={[
                  styles.mealTypeText,
                  mealType === meal && styles.mealTypeTextActive,
                ]}
              >
                {meal.charAt(0).toUpperCase() + meal.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Foods List */}
        <Text style={styles.sectionTitle}>
          Detected Foods ({result.foods.length})
        </Text>
        <Text style={styles.sectionSubtitle}>
          Tap to select foods you want to add
        </Text>

        {result.foods.map((food, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.foodCard,
              selectedFoods.has(index) && styles.foodCardSelected,
            ]}
            onPress={() => toggleFood(index)}
          >
            <View style={styles.foodCardHeader}>
              <View style={styles.checkboxContainer}>
                {selectedFoods.has(index) ? (
                  <Ionicons name="checkbox" size={24} color="#10B981" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#64748B" />
                )}
              </View>
              <View style={styles.foodCardContent}>
                <Text style={styles.foodName}>{food.name}</Text>
                <Text style={styles.foodPortion}>
                  Est. {food.estimated_weight_g}g
                </Text>
              </View>
            </View>
            <View style={styles.foodMacros}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.calories.toFixed(0)}</Text>
                <Text style={styles.macroLabel}>cal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={[styles.macroValue, styles.carbsText]}>
                  {food.net_carbs.toFixed(1)}g
                </Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.protein.toFixed(1)}g</Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{food.fat.toFixed(1)}g</Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.addButton,
            selectedFoods.size === 0 && styles.addButtonDisabled,
          ]}
          onPress={handleAddSelected}
          disabled={selectedFoods.size === 0}
        >
          <Ionicons name="add-circle" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            Add {selectedFoods.size} Food{selectedFoods.size !== 1 ? 's' : ''} to
            Diary
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ketoStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  ketoStatusContent: {
    flex: 1,
  },
  ketoStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  ketoStatusText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  totalCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  totalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  carbsValue: {
    color: '#10B981',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealTypeButtonActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  mealTypeText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  mealTypeTextActive: {
    color: '#10B981',
  },
  foodCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  foodCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  foodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  foodCardContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  foodPortion: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  foodMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  carbsText: {
    color: '#10B981',
  },
  macroLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#374151',
  },
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
