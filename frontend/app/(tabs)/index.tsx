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
import { useAuthStore } from '../../src/store/authStore';
import { NetCarbsCircle } from '../../src/components/NetCarbsCircle';
import { MacroBar } from '../../src/components/MacroBar';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    goals,
    dailyNutrition,
    selectedDate,
    isLoading,
    fetchGoals,
    fetchDailyNutrition,
    fetchSuggestions,
  } = useNutritionStore();

  useEffect(() => {
    fetchGoals();
    fetchDailyNutrition(selectedDate);
    fetchSuggestions();
  }, []);

  const handleRefresh = () => {
    fetchGoals();
    fetchDailyNutrition(selectedDate);
    fetchSuggestions();
  };

  const netCarbs = dailyNutrition?.total_net_carbs || 0;
  const goalCarbs = goals?.daily_net_carbs || 25;

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
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name?.split(' ')[0] || 'there'}!
            </Text>
            <Text style={styles.date}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="camera" size={24} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Net Carbs Circle */}
        <View style={styles.circleContainer}>
          <NetCarbsCircle consumed={netCarbs} goal={goalCarbs} size={220} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/add-food')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Log Food</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="scan" size={24} color="#FFFFFF" />
            <Text style={styles.actionText}>Scan Food</Text>
          </TouchableOpacity>
        </View>

        {/* Macros Summary */}
        <View style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>Today's Macros</Text>
          <MacroBar
            label="Calories"
            value={dailyNutrition?.total_calories || 0}
            goal={goals?.daily_calories || 2000}
            unit=""
            color="#F59E0B"
          />
          <MacroBar
            label="Protein"
            value={dailyNutrition?.total_protein || 0}
            goal={goals?.daily_protein || 100}
            color="#EF4444"
          />
          <MacroBar
            label="Fat"
            value={dailyNutrition?.total_fat || 0}
            goal={goals?.daily_fat || 150}
            color="#8B5CF6"
          />
          <MacroBar
            label="Net Carbs"
            value={dailyNutrition?.total_net_carbs || 0}
            goal={goals?.daily_net_carbs || 25}
            color="#10B981"
          />
        </View>

        {/* Keto Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={netCarbs <= goalCarbs ? 'checkmark-circle' : 'warning'}
              size={24}
              color={netCarbs <= goalCarbs ? '#10B981' : '#F59E0B'}
            />
            <Text style={styles.statusTitle}>
              {netCarbs <= goalCarbs ? 'On Track!' : 'Watch Your Carbs'}
            </Text>
          </View>
          <Text style={styles.statusText}>
            {netCarbs <= goalCarbs
              ? `You have ${(goalCarbs - netCarbs).toFixed(0)}g of net carbs remaining today. Keep up the great work!`
              : `You've exceeded your daily carb goal by ${(netCarbs - goalCarbs).toFixed(0)}g. Consider lower-carb options for your next meal.`}
          </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#94A3B8',
  },
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  macrosCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusText: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
  },
});
