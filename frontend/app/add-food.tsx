import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '../src/store/nutritionStore';

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

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = (params.mealType as string) || 'snack';
  const { selectedDate, addFoodLog, searchFoods } = useNutritionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState('1');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchFoods(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setServings('1');
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    const servingsNum = parseFloat(servings) || 1;

    await addFoodLog({
      food_id: selectedFood.food_id,
      food_name: selectedFood.name,
      meal_type: mealType,
      servings: servingsNum,
      serving_size: selectedFood.serving_size,
      serving_unit: selectedFood.serving_unit,
      calories: selectedFood.calories,
      total_carbs: selectedFood.total_carbs,
      fiber: selectedFood.fiber,
      sugar_alcohols: selectedFood.sugar_alcohols,
      net_carbs: selectedFood.net_carbs,
      protein: selectedFood.protein,
      fat: selectedFood.fat,
      log_date: selectedDate,
    });

    router.back();
  };

  if (selectedFood) {
    const servingsNum = parseFloat(servings) || 1;
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedFood(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            <Text style={styles.backText}>Back to Search</Text>
          </TouchableOpacity>

          {/* Food Details */}
          <View style={styles.foodDetailCard}>
            <Text style={styles.foodDetailName}>{selectedFood.name}</Text>
            {selectedFood.brand && (
              <Text style={styles.foodDetailBrand}>{selectedFood.brand}</Text>
            )}
            <Text style={styles.servingInfo}>
              Per {selectedFood.serving_size}{selectedFood.serving_unit}
            </Text>
          </View>

          {/* Servings Input */}
          <View style={styles.servingsSection}>
            <Text style={styles.servingsLabel}>Number of Servings</Text>
            <View style={styles.servingsInputRow}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => setServings((prev) => String(Math.max(0.5, parseFloat(prev) - 0.5)))}
              >
                <Ionicons name="remove" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TextInput
                style={styles.servingsInput}
                value={servings}
                onChangeText={setServings}
                keyboardType="decimal-pad"
                textAlign="center"
              />
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => setServings((prev) => String(parseFloat(prev) + 0.5))}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nutrition Summary */}
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition Summary</Text>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Calories</Text>
              <Text style={styles.nutritionValue}>
                {(selectedFood.calories * servingsNum).toFixed(0)}
              </Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Total Carbs</Text>
              <Text style={styles.nutritionValue}>
                {(selectedFood.total_carbs * servingsNum).toFixed(1)}g
              </Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fiber</Text>
              <Text style={styles.nutritionValue}>
                -{(selectedFood.fiber * servingsNum).toFixed(1)}g
              </Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Sugar Alcohols</Text>
              <Text style={styles.nutritionValue}>
                -{(selectedFood.sugar_alcohols * servingsNum).toFixed(1)}g
              </Text>
            </View>
            
            <View style={[styles.nutritionRow, styles.netCarbsRow]}>
              <Text style={styles.netCarbsLabel}>Net Carbs</Text>
              <Text style={styles.netCarbsValue}>
                {(selectedFood.net_carbs * servingsNum).toFixed(1)}g
              </Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Protein</Text>
              <Text style={styles.nutritionValue}>
                {(selectedFood.protein * servingsNum).toFixed(1)}g
              </Text>
            </View>
            
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fat</Text>
              <Text style={styles.nutritionValue}>
                {(selectedFood.fat * servingsNum).toFixed(1)}g
              </Text>
            </View>
          </View>

          {/* Add Button */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.addButtonText}>
              Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera" size={20} color="#10B981" />
            <Text style={styles.quickActionText}>Scan Food</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        <ScrollView style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            searchResults.map((food) => (
              <TouchableOpacity
                key={food.food_id}
                style={styles.foodItem}
                onPress={() => handleSelectFood(food)}
              >
                <View style={styles.foodItemContent}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {food.name}
                  </Text>
                  {food.brand && (
                    <Text style={styles.foodBrand}>{food.brand}</Text>
                  )}
                  <View style={styles.foodMacros}>
                    <Text style={styles.foodMacroText}>
                      {food.calories.toFixed(0)} cal
                    </Text>
                    <Text style={[styles.foodMacroText, styles.carbsHighlight]}>
                      {food.net_carbs.toFixed(1)}g net carbs
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
              </TouchableOpacity>
            ))
          ) : searchQuery ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#64748B" />
              <Text style={styles.emptyStateText}>
                No results found for "{searchQuery}"
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Try a different search term or scan your food
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant" size={48} color="#64748B" />
              <Text style={styles.emptyStateText}>Search for foods</Text>
              <Text style={styles.emptyStateSubtext}>
                Search our database or scan food with your camera
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  quickActionText: {
    color: '#10B981',
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 48,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  foodItemContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  foodBrand: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 6,
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  foodMacroText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  carbsHighlight: {
    color: '#10B981',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  foodDetailCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  foodDetailName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  foodDetailBrand: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  servingInfo: {
    fontSize: 14,
    color: '#94A3B8',
  },
  servingsSection: {
    marginBottom: 20,
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  servingsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  servingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nutritionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  nutritionLabel: {
    fontSize: 15,
    color: '#94A3B8',
  },
  nutritionValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  netCarbsRow: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    marginVertical: 8,
    borderRadius: 8,
  },
  netCarbsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  netCarbsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
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
  addButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
