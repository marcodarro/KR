import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MacroBarProps {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  color: string;
}

export const MacroBar: React.FC<MacroBarProps> = ({
  label,
  value,
  goal,
  unit = 'g',
  color,
}) => {
  const percentage = Math.min((value / goal) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value.toFixed(0)}{unit} / {goal}{unit}
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.barFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  value: {
    fontSize: 14,
    color: '#A0AEC0',
  },
  barBackground: {
    height: 8,
    backgroundColor: '#2D3748',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
