import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/store/authStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { user, isLoading, isAuthenticated, checkAuth } = useAuthStore();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const doCheck = async () => {
      await checkAuth();
      setInitialCheckDone(true);
    };
    doCheck();
  }, []);

  useEffect(() => {
    if (!navigationState?.key || !initialCheckDone) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'auth-callback';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, navigationState?.key, initialCheckDone]);

  if (isLoading || !initialCheckDone) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="auth-callback" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="add-food" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Add Food',
            headerStyle: { backgroundColor: '#111827' },
            headerTintColor: '#FFFFFF',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="camera" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Scan Food',
            headerStyle: { backgroundColor: '#111827' },
            headerTintColor: '#FFFFFF',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="food-result" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Food Analysis',
            headerStyle: { backgroundColor: '#111827' },
            headerTintColor: '#FFFFFF',
            presentation: 'modal'
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
