import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../src/store/healthStore';

const WEARABLE_PROVIDERS = [
  { id: 'apple_health', name: 'Apple Health', icon: 'logo-apple', color: '#FFFFFF', category: 'Platform' },
  { id: 'google_fit', name: 'Google Fit', icon: 'logo-google', color: '#4285F4', category: 'Platform' },
  { id: 'samsung_health', name: 'Samsung Health', icon: 'phone-portrait', color: '#1428A0', category: 'Platform' },
  { id: 'fitbit', name: 'Fitbit', icon: 'fitness', color: '#00B0B9', category: 'Wearable' },
  { id: 'garmin', name: 'Garmin', icon: 'watch', color: '#007DC3', category: 'Wearable' },
  { id: 'whoop', name: 'WHOOP', icon: 'pulse', color: '#FFC300', category: 'Wearable' },
  { id: 'oura', name: 'Oura Ring', icon: 'ellipse', color: '#FFFFFF', category: 'Wearable' },
  { id: 'polar', name: 'Polar', icon: 'heart', color: '#D0011B', category: 'Wearable' },
  { id: 'coros', name: 'COROS', icon: 'time', color: '#FF5722', category: 'Wearable' },
  { id: 'withings', name: 'Withings', icon: 'body', color: '#00BCD4', category: 'Wearable' },
];

const CGM_PROVIDERS = [
  { id: 'dexcom', name: 'Dexcom G6/G7', icon: 'analytics', color: '#00A651', category: 'CGM' },
  { id: 'libre', name: 'FreeStyle Libre', icon: 'trending-up', color: '#FFCC00', category: 'CGM' },
  { id: 'medtronic', name: 'Medtronic', icon: 'cellular', color: '#003DA5', category: 'CGM' },
];

export default function IntegrationsScreen() {
  const router = useRouter();
  const { providers, fetchProviders } = useHealthStore();

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleConnect = (provider: any) => {
    Alert.alert(
      `Connect ${provider.name}`,
      'Terra API integration is not yet configured. Add your Terra API credentials to enable wearable connections.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Learn More', 
          onPress: () => Alert.alert(
            'Terra Integration',
            'Terra provides a unified API to connect 200+ wearables and health platforms.\n\nTo enable:\n1. Sign up at tryterra.co\n2. Get your API Key and Dev ID\n3. Add TERRA_API_KEY and TERRA_DEV_ID to your .env file'
          )
        },
      ]
    );
  };

  const renderProviderCard = (provider: any, connected: boolean = false) => (
    <TouchableOpacity
      key={provider.id}
      style={styles.providerCard}
      onPress={() => handleConnect(provider)}
    >
      <View style={[styles.providerIcon, { backgroundColor: provider.color + '20' }]}>
        <Ionicons name={provider.icon as any} size={24} color={provider.color} />
      </View>
      <View style={styles.providerInfo}>
        <Text style={styles.providerName}>{provider.name}</Text>
        <Text style={styles.providerStatus}>
          {connected ? 'Connected' : 'Tap to connect'}
        </Text>
      </View>
      <Ionicons
        name={connected ? 'checkmark-circle' : 'add-circle-outline'}
        size={24}
        color={connected ? '#10B981' : '#64748B'}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Integrations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Terra Info */}
        <View style={styles.terraCard}>
          <View style={styles.terraHeader}>
            <View style={styles.terraLogo}>
              <Ionicons name="globe" size={24} color="#10B981" />
            </View>
            <View style={styles.terraInfo}>
              <Text style={styles.terraTitle}>Powered by Terra</Text>
              <Text style={styles.terraSubtitle}>Connect 200+ wearables</Text>
            </View>
          </View>
          <Text style={styles.terraDescription}>
            Terra provides unified access to health data from wearables, CGMs, 
            and health platforms through a single API.
          </Text>
          <View style={styles.terraStatus}>
            <Ionicons name="warning" size={18} color="#F59E0B" />
            <Text style={styles.terraStatusText}>API not configured</Text>
          </View>
        </View>

        {/* Wearables Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wearables & Platforms</Text>
          <Text style={styles.sectionSubtitle}>
            Connect your fitness trackers and health platforms
          </Text>
          {WEARABLE_PROVIDERS.map((provider) => renderProviderCard(provider))}
        </View>

        {/* CGM Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continuous Glucose Monitors</Text>
          <Text style={styles.sectionSubtitle}>
            Connect your CGM for real-time glucose data
          </Text>
          {CGM_PROVIDERS.map((provider) => renderProviderCard(provider))}
        </View>

        {/* Other Aggregators */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Data Aggregators</Text>
          <View style={styles.aggregatorsList}>
            {['Thryve', 'Spike', 'GotCGM', 'Human API', 'Validic'].map((name) => (
              <View key={name} style={styles.aggregatorItem}>
                <Text style={styles.aggregatorName}>{name}</Text>
                <Text style={styles.aggregatorStatus}>Coming soon</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Manual Entry */}
        <TouchableOpacity 
          style={styles.manualEntry}
          onPress={() => router.push('/log-health')}
        >
          <Ionicons name="create-outline" size={24} color="#10B981" />
          <View style={styles.manualEntryInfo}>
            <Text style={styles.manualEntryTitle}>Manual Data Entry</Text>
            <Text style={styles.manualEntrySubtitle}>
              Log your health metrics manually
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  terraCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  terraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  terraLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#10B98120',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  terraInfo: {
    flex: 1,
  },
  terraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  terraSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  terraDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 12,
  },
  terraStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F59E0B15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  terraStatusText: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  providerStatus: {
    fontSize: 13,
    color: '#64748B',
  },
  aggregatorsList: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  aggregatorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  aggregatorName: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  aggregatorStatus: {
    fontSize: 13,
    color: '#64748B',
  },
  manualEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  manualEntryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  manualEntrySubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
});
