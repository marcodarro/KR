import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNutritionStore } from '../../src/store/nutritionStore';

const CARB_PRESETS = [20, 25, 30, 50];

export default function GoalsScreen() {
  const { goals, fetchGoals, updateGoals, isLoading } = useNutritionStore();
  const [editMode, setEditMode] = useState(false);
  const [localGoals, setLocalGoals] = useState({
    daily_net_carbs: 25,
    daily_calories: 2000,
    daily_protein: 100,
    daily_fat: 150,
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (goals) {
      setLocalGoals({
        daily_net_carbs: goals.daily_net_carbs,
        daily_calories: goals.daily_calories,
        daily_protein: goals.daily_protein,
        daily_fat: goals.daily_fat,
      });
    }
  }, [goals]);

  const handleSave = async () => {
    await updateGoals(localGoals);
    setEditMode(false);
    Alert.alert('Success', 'Your goals have been updated!');
  };

  const selectCarbPreset = (value: number) => {
    setLocalGoals({ ...localGoals, daily_net_carbs: value });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="flag" size={32} color="#10B981" />
          <Text style={styles.title}>Keto Goals</Text>
        </View>

        {/* Net Carbs Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Net Carbs Target</Text>
          <Text style={styles.sectionSubtitle}>
            For ketosis, stay between 20-50g
          </Text>

          <View style={styles.presetsRow}>
            {CARB_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[
                  styles.presetButton,
                  localGoals.daily_net_carbs === preset && styles.presetButtonActive,
                ]}
                onPress={() => selectCarbPreset(preset)}
              >
                <Text
                  style={[
                    styles.presetText,
                    localGoals.daily_net_carbs === preset && styles.presetTextActive,
                  ]}
                >
                  {preset}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Custom:</Text>
            <TextInput
              style={styles.input}
              value={localGoals.daily_net_carbs.toString()}
              onChangeText={(text) =>
                setLocalGoals({
                  ...localGoals,
                  daily_net_carbs: parseInt(text) || 0,
                })
              }
              keyboardType="number-pad"
              placeholder="25"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.inputUnit}>g</Text>
          </View>
        </View>

        {/* Other Macros */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Macro Targets</Text>

          <View style={styles.macroInputCard}>
            <View style={styles.macroInputRow}>
              <Text style={styles.macroLabel}>Calories</Text>
              <View style={styles.macroInputWrapper}>
                <TextInput
                  style={styles.macroInput}
                  value={localGoals.daily_calories.toString()}
                  onChangeText={(text) =>
                    setLocalGoals({
                      ...localGoals,
                      daily_calories: parseInt(text) || 0,
                    })
                  }
                  keyboardType="number-pad"
                />
                <Text style={styles.macroUnit}>kcal</Text>
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroInputWrapper}>
                <TextInput
                  style={styles.macroInput}
                  value={localGoals.daily_protein.toString()}
                  onChangeText={(text) =>
                    setLocalGoals({
                      ...localGoals,
                      daily_protein: parseInt(text) || 0,
                    })
                  }
                  keyboardType="number-pad"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroInputWrapper}>
                <TextInput
                  style={styles.macroInput}
                  value={localGoals.daily_fat.toString()}
                  onChangeText={(text) =>
                    setLocalGoals({
                      ...localGoals,
                      daily_fat: parseInt(text) || 0,
                    })
                  }
                  keyboardType="number-pad"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Keto Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>Keto Macro Guide</Text>
          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.guideText}>
              <Text style={styles.guideBold}>Net Carbs (5-10%):</Text> Keep under 50g
            </Text>
          </View>
          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.guideText}>
              <Text style={styles.guideBold}>Protein (20-25%):</Text> 0.8-1g per lb body weight
            </Text>
          </View>
          <View style={styles.guideItem}>
            <View style={[styles.guideDot, { backgroundColor: '#8B5CF6' }]} />
            <Text style={styles.guideText}>
              <Text style={styles.guideBold}>Fat (70-75%):</Text> Fill remaining calories
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Goals</Text>
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
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetButtonActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  presetTextActive: {
    color: '#10B981',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  input: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 16,
    color: '#94A3B8',
  },
  macroInputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  macroLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  macroInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroInput: {
    width: 80,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: 14,
    color: '#64748B',
    width: 30,
  },
  guideCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  guideText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  guideBold: {
    color: '#FFFFFF',
    fontWeight: '600',
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
