import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G, Line, Polyline } from 'react-native-svg';
import { useHealthStore } from '../../src/store/healthStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MetricCard = ({ 
  icon, 
  label, 
  value, 
  unit, 
  color, 
  subtext 
}: { 
  icon: string; 
  label: string; 
  value: string | number; 
  unit?: string; 
  color: string;
  subtext?: string;
}) => (
  <View style={[styles.metricCard, { borderLeftColor: color }]}>
    <View style={styles.metricHeader}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
    <View style={styles.metricValueRow}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {unit && <Text style={styles.metricUnit}>{unit}</Text>}
    </View>
    {subtext && <Text style={styles.metricSubtext}>{subtext}</Text>}
  </View>
);

const ScoreCircle = ({ 
  score, 
  label, 
  color,
  size = 80 
}: { 
  score: number; 
  label: string; 
  color: string;
  size?: number;
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <View style={styles.scoreCircleContainer}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size/2}, ${size/2}`}>
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke="#2D3748"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size/2}
            cy={size/2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.scoreCircleContent}>
        <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      </View>
      <Text style={styles.scoreLabel}>{label}</Text>
    </View>
  );
};

const GlucoseChart = ({ readings }: { readings: Array<{ time: string; value: number }> }) => {
  if (!readings || readings.length === 0) return null;

  const chartWidth = SCREEN_WIDTH - 80;
  const chartHeight = 100;
  const padding = 10;
  
  const values = readings.map(r => r.value);
  const minVal = Math.min(...values) - 10;
  const maxVal = Math.max(...values) + 10;
  
  const points = readings.map((r, i) => {
    const x = padding + (i / (readings.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - ((r.value - minVal) / (maxVal - minVal)) * (chartHeight - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.glucoseChart}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Target range band (70-180) */}
        <Line x1={padding} y1={chartHeight - padding - ((180 - minVal) / (maxVal - minVal)) * (chartHeight - 2 * padding)} 
              x2={chartWidth - padding} y2={chartHeight - padding - ((180 - minVal) / (maxVal - minVal)) * (chartHeight - 2 * padding)}
              stroke="#F59E0B33" strokeWidth={1} strokeDasharray="4,4" />
        <Line x1={padding} y1={chartHeight - padding - ((70 - minVal) / (maxVal - minVal)) * (chartHeight - 2 * padding)} 
              x2={chartWidth - padding} y2={chartHeight - padding - ((70 - minVal) / (maxVal - minVal)) * (chartHeight - 2 * padding)}
              stroke="#EF444433" strokeWidth={1} strokeDasharray="4,4" />
        {/* Line chart */}
        <Polyline
          points={points}
          fill="none"
          stroke="#10B981"
          strokeWidth={2}
        />
      </Svg>
      <View style={styles.glucoseLabels}>
        <Text style={styles.glucoseTime}>{readings[0]?.time}</Text>
        <Text style={styles.glucoseTime}>{readings[readings.length - 1]?.time}</Text>
      </View>
    </View>
  );
};

export default function HealthScreen() {
  const router = useRouter();
  const {
    dashboard,
    insights,
    isLoading,
    fetchDashboard,
    fetchWeeklyData,
    fetchInsights,
  } = useHealthStore();

  useEffect(() => {
    fetchDashboard();
    fetchWeeklyData();
    fetchInsights();
  }, []);

  const handleRefresh = () => {
    fetchDashboard();
    fetchWeeklyData();
    fetchInsights();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sleep': return 'moon';
      case 'heart': return 'heart';
      case 'glucose': return 'analytics';
      case 'activity': return 'walk';
      case 'stress': return 'pulse';
      case 'nutrition': return 'nutrition';
      default: return 'bulb';
    }
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
          <View>
            <Text style={styles.title}>Health Dashboard</Text>
            <Text style={styles.subtitle}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/health-chat')}
            >
              <Ionicons name="chatbubbles" size={22} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.push('/integrations')}
            >
              <Ionicons name="link" size={22} color="#8B5CF6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Readiness Scores */}
        <View style={styles.scoresSection}>
          <ScoreCircle 
            score={dashboard?.stress_recovery?.readiness_score || 0} 
            label="Readiness" 
            color="#10B981" 
          />
          <ScoreCircle 
            score={dashboard?.stress_recovery?.recovery_score || 0} 
            label="Recovery" 
            color="#3B82F6" 
          />
          <ScoreCircle 
            score={100 - (dashboard?.stress_recovery?.stress_level || 0)} 
            label="Calm" 
            color="#8B5CF6" 
          />
        </View>

        {/* Sleep Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="moon" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Sleep</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="time"
              label="Duration"
              value={dashboard?.sleep?.duration_hours?.toFixed(1) || '0'}
              unit="hrs"
              color="#8B5CF6"
              subtext={`Quality: ${dashboard?.sleep?.sleep_quality || 0}%`}
            />
            <MetricCard
              icon="cloudy-night"
              label="Deep Sleep"
              value={dashboard?.sleep?.deep_sleep_hours?.toFixed(1) || '0'}
              unit="hrs"
              color="#6366F1"
            />
          </View>
        </View>

        {/* Heart Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="heart" size={20} color="#EF4444" />
              <Text style={styles.sectionTitle}>Heart</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="heart"
              label="Resting HR"
              value={dashboard?.heart?.resting_heart_rate || 0}
              unit="bpm"
              color="#EF4444"
            />
            <MetricCard
              icon="pulse"
              label="HRV"
              value={dashboard?.heart?.hrv?.toFixed(0) || 0}
              unit="ms"
              color="#F97316"
              subtext="Heart Rate Variability"
            />
          </View>
        </View>

        {/* Glucose Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="analytics" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Glucose</Text>
            </View>
            <View style={styles.glucoseStats}>
              <Text style={styles.glucoseAvg}>
                Avg: {dashboard?.glucose?.avg_glucose?.toFixed(0) || 0} mg/dL
              </Text>
            </View>
          </View>
          <GlucoseChart readings={dashboard?.glucose?.readings || []} />
          <View style={styles.metricsRow}>
            <MetricCard
              icon="trending-down"
              label="Min"
              value={dashboard?.glucose?.min_glucose?.toFixed(0) || 0}
              unit="mg/dL"
              color="#3B82F6"
            />
            <MetricCard
              icon="trending-up"
              label="Max"
              value={dashboard?.glucose?.max_glucose?.toFixed(0) || 0}
              unit="mg/dL"
              color="#F59E0B"
            />
          </View>
          <View style={styles.glucoseInfo}>
            <View style={styles.glucoseInfoItem}>
              <Text style={styles.glucoseInfoValue}>
                {dashboard?.glucose?.time_in_range_percent?.toFixed(0) || 0}%
              </Text>
              <Text style={styles.glucoseInfoLabel}>Time in Range</Text>
            </View>
            <View style={styles.glucoseInfoItem}>
              <Text style={[styles.glucoseInfoValue, { color: '#F59E0B' }]}>
                {dashboard?.glucose?.spike_count || 0}
              </Text>
              <Text style={styles.glucoseInfoLabel}>Spikes</Text>
            </View>
          </View>
        </View>

        {/* Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="walk" size={20} color="#F59E0B" />
              <Text style={styles.sectionTitle}>Activity</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="footsteps"
              label="Steps"
              value={dashboard?.activity?.steps?.toLocaleString() || 0}
              color="#F59E0B"
            />
            <MetricCard
              icon="flame"
              label="Active Cal"
              value={dashboard?.activity?.active_calories || 0}
              unit="kcal"
              color="#EF4444"
            />
          </View>
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="body" size={20} color="#06B6D4" />
              <Text style={styles.sectionTitle}>Body</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="scale"
              label="Weight"
              value={dashboard?.body?.weight_kg?.toFixed(1) || 0}
              unit="kg"
              color="#06B6D4"
            />
            <MetricCard
              icon="water"
              label="Hydration"
              value={((dashboard?.body?.hydration_ml || 0) / 1000).toFixed(1)}
              unit="L"
              color="#3B82F6"
            />
          </View>
        </View>

        {/* AI Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>AI Insights</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/health-chat')}>
                <Text style={styles.seeAllText}>Ask AI</Text>
              </TouchableOpacity>
            </View>
            {insights.slice(0, 3).map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Ionicons 
                    name={getCategoryIcon(insight.category) as any} 
                    size={18} 
                    color={getPriorityColor(insight.priority)} 
                  />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(insight.priority) }]}>
                      {insight.priority}
                    </Text>
                  </View>
                </View>
                <Text style={styles.insightText}>{insight.insight}</Text>
                <Text style={styles.recommendationText}>{insight.recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/log-health')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Log Data</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => router.push('/health-chat')}
          >
            <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Health AI Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Data Source */}
        <View style={styles.dataSource}>
          <Ionicons name="information-circle" size={16} color="#64748B" />
          <Text style={styles.dataSourceText}>
            Data: {dashboard?.data_source === 'mock' ? 'Demo data (connect wearables for real data)' : 'Connected devices'}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  scoreCircleContainer: {
    alignItems: 'center',
  },
  scoreCircleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  seeAllText: {
    fontSize: 14,
    color: '#10B981',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 14,
    color: '#64748B',
  },
  metricSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  glucoseStats: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  glucoseAvg: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '500',
  },
  glucoseChart: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  glucoseLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  glucoseTime: {
    fontSize: 11,
    color: '#64748B',
  },
  glucoseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  glucoseInfoItem: {
    alignItems: 'center',
  },
  glucoseInfoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  glucoseInfoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  insightCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  insightText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 13,
    color: '#10B981',
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dataSource: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dataSourceText: {
    fontSize: 12,
    color: '#64748B',
  },
});
