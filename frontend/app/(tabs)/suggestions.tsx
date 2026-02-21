import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '../../src/store/nutritionStore';

export default function SuggestionsScreen() {
  const {
    suggestions,
    remainingCarbs,
    goals,
    dailyNutrition,
    isLoading,
    fetchSuggestions,
    fetchGoals,
  } = useNutritionStore();

  useEffect(() => {
    fetchGoals();
    fetchSuggestions();
  }, []);

  const handleRefresh = () => {
    fetchGoals();
    fetchSuggestions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bulb" size={32} color="#10B981" />
          <Text style={styles.title}>Meal Suggestions</Text>
        </View>

        {/* Carb Budget Card */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Remaining Carb Budget</Text>
          <Text style={styles.budgetValue}>{remainingCarbs.toFixed(0)}g</Text>
          <Text style={styles.budgetSubtext}>
            of {goals?.daily_net_carbs || 25}g daily goal
          </Text>
        </View>

        {/* Suggestions List */}
        <Text style={styles.sectionTitle}>Keto-Friendly Options</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your remaining carb budget
        </Text>

        {suggestions.map((suggestion, index) => (
          <View key={index} style={styles.suggestionCard}>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionName}>{suggestion.name}</Text>
              <Text style={styles.suggestionDescription}>
                {suggestion.description}
              </Text>
              <View style={styles.suggestionMacros}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{suggestion.net_carbs}g</Text>
                  <Text style={styles.macroLabel}>Net Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{suggestion.calories}</Text>
                  <Text style={styles.macroLabel}>Calories</Text>
                </View>
              </View>
            </View>
            <View
              style={[
                styles.carbIndicator,
                {
                  backgroundColor:
                    suggestion.net_carbs <= 2
                      ? '#10B981'
                      : suggestion.net_carbs <= 5
                      ? '#F59E0B'
                      : '#EF4444',
                },
              ]}
            />
          </View>
        ))}

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>
            <Ionicons name="information-circle" size={18} color="#10B981" /> Keto Tips
          </Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Stay under 20-50g net carbs daily for ketosis
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Net carbs = Total carbs - Fiber - Sugar alcohols
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Focus on healthy fats, moderate protein
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipText}>
              • Drink plenty of water and electrolytes
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  budgetCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  budgetLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  budgetSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  suggestionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 12,
  },
  suggestionMacros: {
    flexDirection: 'row',
    gap: 24,
  },
  macroItem: {
    alignItems: 'flex-start',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  macroLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  carbIndicator: {
    width: 4,
    marginLeft: 12,
    borderRadius: 2,
  },
  tipsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tipItem: {
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
});
