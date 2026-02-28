import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

const DashboardIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="pie-chart" size={size} color={color} />
);

const DiaryIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="book" size={size} color={color} />
);

const FastingIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="timer" size={size} color={color} />
);

const HealthIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="heart" size={size} color={color} />
);

const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <Ionicons name="person" size={size} color={color} />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1F2937',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: DiaryIcon,
        }}
      />
      <Tabs.Screen
        name="fasting"
        options={{
          title: 'Fasting',
          tabBarIcon: FastingIcon,
          tabBarActiveTintColor: '#F59E0B',
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: HealthIcon,
          tabBarActiveTintColor: '#EF4444',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          href: null, // Hide from tab bar but still accessible
        }}
      />
      <Tabs.Screen
        name="suggestions"
        options={{
          href: null, // Hide from tab bar but still accessible
        }}
      />
    </Tabs>
  );
}
