import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHealthStore } from '../src/store/healthStore';

interface FormData {
  date: string;
  sleep_duration_hours: string;
  sleep_quality: string;
  deep_sleep_hours: string;
  resting_heart_rate: string;
  hrv: string;
  steps: string;
  active_calories: string;
  glucose_reading: string;
  stress_level: string;
  recovery_score: string;
  readiness_score: string;
  weight_kg: string;
  body_fat_percent: string;
  hydration_ml: string;
}

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'numeric',
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: any;
  unit?: string;
  icon: string;
  color: string;
}) => (
  <View style={styles.inputContainer}>
    <View style={styles.inputLabelRow}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={styles.inputLabel}>{label}</Text>
    </View>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || '0'}
        placeholderTextColor="#64748B"
        keyboardType={keyboardType}
      />
      {unit && <Text style={styles.inputUnit}>{unit}</Text>}
    </View>
  </View>
);

export default function LogHealthScreen() {
  const router = useRouter();
  const { logHealthData } = useHealthStore();
  const [activeTab, setActiveTab] = useState<'sleep' | 'heart' | 'activity' | 'glucose' | 'body'>('sleep');
  const [form, setForm] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    sleep_duration_hours: '',
    sleep_quality: '',
    deep_sleep_hours: '',
    resting_heart_rate: '',
    hrv: '',
    steps: '',
    active_calories: '',
    glucose_reading: '',
    stress_level: '',
    recovery_score: '',
    readiness_score: '',
    weight_kg: '',
    body_fat_percent: '',
    hydration_ml: '',
  });

  const updateForm = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const data: any = { date: form.date };
    
    if (form.sleep_duration_hours) data.sleep_duration_hours = parseFloat(form.sleep_duration_hours);
    if (form.sleep_quality) data.sleep_quality = parseInt(form.sleep_quality);
    if (form.deep_sleep_hours) data.deep_sleep_hours = parseFloat(form.deep_sleep_hours);
    if (form.resting_heart_rate) data.resting_heart_rate = parseInt(form.resting_heart_rate);
    if (form.hrv) data.hrv = parseFloat(form.hrv);
    if (form.steps) data.steps = parseInt(form.steps);
    if (form.active_calories) data.active_calories = parseFloat(form.active_calories);
    if (form.glucose_reading) data.glucose_reading = parseFloat(form.glucose_reading);
    if (form.stress_level) data.stress_level = parseInt(form.stress_level);
    if (form.recovery_score) data.recovery_score = parseInt(form.recovery_score);
    if (form.readiness_score) data.readiness_score = parseInt(form.readiness_score);
    if (form.weight_kg) data.weight_kg = parseFloat(form.weight_kg);
    if (form.body_fat_percent) data.body_fat_percent = parseFloat(form.body_fat_percent);
    if (form.hydration_ml) data.hydration_ml = parseInt(form.hydration_ml);

    const success = await logHealthData(data);
    if (success) {
      Alert.alert('Success', 'Health data logged successfully!');
      router.back();
    } else {
      Alert.alert('Error', 'Failed to log health data');
    }
  };

  const tabs = [
    { key: 'sleep', label: 'Sleep', icon: 'moon', color: '#8B5CF6' },
    { key: 'heart', label: 'Heart', icon: 'heart', color: '#EF4444' },
    { key: 'activity', label: 'Activity', icon: 'walk', color: '#F59E0B' },
    { key: 'glucose', label: 'Glucose', icon: 'analytics', color: '#10B981' },
    { key: 'body', label: 'Body', icon: 'body', color: '#06B6D4' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'sleep':
        return (
          <>
            <InputField
              icon="time"
              color="#8B5CF6"
              label="Sleep Duration"
              value={form.sleep_duration_hours}
              onChangeText={(v) => updateForm('sleep_duration_hours', v)}
              placeholder="7.5"
              unit="hours"
            />
            <InputField
              icon="star"
              color="#8B5CF6"
              label="Sleep Quality"
              value={form.sleep_quality}
              onChangeText={(v) => updateForm('sleep_quality', v)}
              placeholder="85"
              unit="%"
            />
            <InputField
              icon="cloudy-night"
              color="#6366F1"
              label="Deep Sleep"
              value={form.deep_sleep_hours}
              onChangeText={(v) => updateForm('deep_sleep_hours', v)}
              placeholder="1.5"
              unit="hours"
            />
          </>
        );
      case 'heart':
        return (
          <>
            <InputField
              icon="heart"
              color="#EF4444"
              label="Resting Heart Rate"
              value={form.resting_heart_rate}
              onChangeText={(v) => updateForm('resting_heart_rate', v)}
              placeholder="65"
              unit="bpm"
            />
            <InputField
              icon="pulse"
              color="#F97316"
              label="HRV"
              value={form.hrv}
              onChangeText={(v) => updateForm('hrv', v)}
              placeholder="45"
              unit="ms"
            />
            <InputField
              icon="happy"
              color="#10B981"
              label="Recovery Score"
              value={form.recovery_score}
              onChangeText={(v) => updateForm('recovery_score', v)}
              placeholder="75"
              unit="%"
            />
            <InputField
              icon="fitness"
              color="#3B82F6"
              label="Readiness Score"
              value={form.readiness_score}
              onChangeText={(v) => updateForm('readiness_score', v)}
              placeholder="80"
              unit="%"
            />
            <InputField
              icon="thunderstorm"
              color="#F59E0B"
              label="Stress Level"
              value={form.stress_level}
              onChangeText={(v) => updateForm('stress_level', v)}
              placeholder="30"
              unit="%"
            />
          </>
        );
      case 'activity':
        return (
          <>
            <InputField
              icon="footsteps"
              color="#F59E0B"
              label="Steps"
              value={form.steps}
              onChangeText={(v) => updateForm('steps', v)}
              placeholder="10000"
            />
            <InputField
              icon="flame"
              color="#EF4444"
              label="Active Calories"
              value={form.active_calories}
              onChangeText={(v) => updateForm('active_calories', v)}
              placeholder="350"
              unit="kcal"
            />
          </>
        );
      case 'glucose':
        return (
          <>
            <InputField
              icon="analytics"
              color="#10B981"
              label="Glucose Reading"
              value={form.glucose_reading}
              onChangeText={(v) => updateForm('glucose_reading', v)}
              placeholder="95"
              unit="mg/dL"
            />
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#64748B" />
              <Text style={styles.infoText}>
                For continuous glucose data, connect a CGM device through integrations.
              </Text>
            </View>
          </>
        );
      case 'body':
        return (
          <>
            <InputField
              icon="scale"
              color="#06B6D4"
              label="Weight"
              value={form.weight_kg}
              onChangeText={(v) => updateForm('weight_kg', v)}
              placeholder="70"
              unit="kg"
            />
            <InputField
              icon="body"
              color="#8B5CF6"
              label="Body Fat"
              value={form.body_fat_percent}
              onChangeText={(v) => updateForm('body_fat_percent', v)}
              placeholder="20"
              unit="%"
            />
            <InputField
              icon="water"
              color="#3B82F6"
              label="Water Intake"
              value={form.hydration_ml}
              onChangeText={(v) => updateForm('hydration_ml', v)}
              placeholder="2000"
              unit="ml"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Log Health Data</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && { backgroundColor: tab.color + '20', borderColor: tab.color },
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? tab.color : '#64748B'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && { color: tab.color },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {renderContent()}
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Health Data</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 6,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2D3748',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    gap: 16,
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputUnit: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
