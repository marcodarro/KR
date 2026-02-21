import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface NetCarbsCircleProps {
  consumed: number;
  goal: number;
  size?: number;
}

export const NetCarbsCircle: React.FC<NetCarbsCircleProps> = ({
  consumed,
  goal,
  size = 200,
}) => {
  const strokeWidth = 15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((consumed / goal) * 100, 100);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const remaining = Math.max(goal - consumed, 0);

  const getColor = () => {
    if (percentage >= 100) return '#EF4444'; // Red - over limit
    if (percentage >= 80) return '#F59E0B'; // Orange - warning
    return '#10B981'; // Green - good
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#2D3748"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.remainingValue}>{remaining.toFixed(0)}</Text>
        <Text style={styles.remainingLabel}>Net Carbs Left</Text>
        <Text style={styles.goalText}>
          {consumed.toFixed(0)}g / {goal}g
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  remainingValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  remainingLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 4,
  },
  goalText: {
    fontSize: 12,
    color: '#718096',
    marginTop: 8,
  },
});
