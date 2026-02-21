import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FoodLogItemProps {
  foodName: string;
  servings: number;
  servingSize: number;
  servingUnit: string;
  calories: number;
  netCarbs: number;
  protein: number;
  fat: number;
  onDelete?: () => void;
}

export const FoodLogItem: React.FC<FoodLogItemProps> = ({
  foodName,
  servings,
  servingSize,
  servingUnit,
  calories,
  netCarbs,
  protein,
  fat,
  onDelete,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.foodName} numberOfLines={1}>
          {foodName}
        </Text>
        <Text style={styles.serving}>
          {servings} x {servingSize}{servingUnit}
        </Text>
        <View style={styles.macrosRow}>
          <Text style={styles.macro}>{(calories * servings).toFixed(0)} cal</Text>
          <Text style={[styles.macro, styles.carbsText]}>
            {(netCarbs * servings).toFixed(1)}g carbs
          </Text>
          <Text style={styles.macro}>{(protein * servings).toFixed(1)}g P</Text>
          <Text style={styles.macro}>{(fat * servings).toFixed(1)}g F</Text>
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A202C',
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  serving: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macro: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  carbsText: {
    color: '#10B981',
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
});
