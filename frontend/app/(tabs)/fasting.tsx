import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, G } from 'react-native-svg';
import { useFastingStore } from '../../src/store/fastingStore';

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function FastingScreen() {
  const {
    protocols,
    currentFast,
    history,
    stats,
    isLoading,
    fetchProtocols,
    fetchCurrentFast,
    startFast,
    endFast,
    fetchHistory,
    fetchStats,
    requestNotificationPermissions,
  } = useFastingStore();

  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customHours, setCustomHours] = useState(16);

  useEffect(() => {
    fetchProtocols();
    fetchCurrentFast();
    fetchHistory();
    fetchStats();
    requestNotificationPermissions();
  }, []);

  const handleStartFast = async (protocolId: string, hours?: number) => {
    setShowProtocolModal(false);
    const success = await startFast(protocolId, hours);
    if (success) {
      Alert.alert('Fast Started', 'Your fasting timer has begun. Stay strong!');
    }
  };

  const handleEndFast = () => {
    const isComplete = currentFast?.is_complete || false;
    const message = isComplete
      ? 'Congratulations on completing your fast!'
      : 'Are you sure you want to end your fast early?';

    Alert.alert(
      isComplete ? 'Fast Complete!' : 'End Fast Early?',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isComplete ? 'Finish' : 'End Fast',
          style: isComplete ? 'default' : 'destructive',
          onPress: async () => {
            const success = await endFast();
            if (success) {
              Alert.alert(
                'Fast Ended',
                isComplete
                  ? 'Great job! Your fast has been recorded.'
                  : 'Your fast has been ended and recorded.'
              );
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    fetchCurrentFast();
    fetchHistory();
    fetchStats();
  };

  const renderTimer = () => {
    if (!currentFast?.active) return null;

    const size = 280;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = currentFast.progress_percent || 0;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    const isComplete = currentFast.is_complete;

    return (
      <View style={styles.timerContainer}>
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
              stroke={isComplete ? '#10B981' : '#F59E0B'}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        <View style={styles.timerContent}>
          <Text style={styles.timerLabel}>
            {isComplete ? 'COMPLETE!' : 'ELAPSED'}
          </Text>
          <Text style={styles.timerValue}>
            {formatTime(currentFast.elapsed_seconds)}
          </Text>
          <Text style={styles.timerProtocol}>
            {currentFast.session?.protocol_name}
          </Text>
          {!isComplete && (
            <Text style={styles.timerRemaining}>
              {formatTime(currentFast.remaining_seconds)} remaining
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderIdleState = () => (
    <View style={styles.idleContainer}>
      <View style={styles.idleCircle}>
        <Ionicons name="timer-outline" size={80} color="#64748B" />
      </View>
      <Text style={styles.idleTitle}>Ready to Fast?</Text>
      <Text style={styles.idleSubtitle}>
        Choose a fasting protocol to begin your intermittent fasting journey
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => setShowProtocolModal(true)}
      >
        <Ionicons name="play" size={24} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Start Fasting</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor="#F59E0B"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="timer" size={32} color="#F59E0B" />
          <Text style={styles.title}>Intermittent Fasting</Text>
        </View>

        {/* Timer or Idle State */}
        {currentFast?.active ? renderTimer() : renderIdleState()}

        {/* Active Fast Controls */}
        {currentFast?.active && (
          <TouchableOpacity
            style={[
              styles.endButton,
              currentFast.is_complete && styles.endButtonComplete,
            ]}
            onPress={handleEndFast}
          >
            <Ionicons
              name={currentFast.is_complete ? 'checkmark-circle' : 'stop-circle'}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.endButtonText}>
              {currentFast.is_complete ? 'Complete Fast' : 'End Fast'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Fasting Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.total_fasts}</Text>
                <Text style={styles.statLabel}>Total Fasts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.completed_fasts}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.current_streak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatHours(stats.longest_fast)}</Text>
                <Text style={styles.statLabel}>Longest Fast</Text>
              </View>
            </View>
            <View style={styles.totalHours}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={styles.totalHoursText}>
                {formatHours(stats.total_hours_fasted)} total fasting time
              </Text>
            </View>
          </View>
        )}

        {/* History Button */}
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => setShowHistoryModal(true)}
        >
          <Ionicons name="time-outline" size={20} color="#F59E0B" />
          <Text style={styles.historyButtonText}>View Fasting History</Text>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Fasting Benefits</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="flash" size={18} color="#10B981" />
            <Text style={styles.benefitText}>Enhanced ketosis and fat burning</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="heart" size={18} color="#EF4444" />
            <Text style={styles.benefitText}>Improved metabolic health</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="brain" size={18} color="#8B5CF6" />
            <Text style={styles.benefitText}>Better mental clarity and focus</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="cellular" size={18} color="#3B82F6" />
            <Text style={styles.benefitText}>Cellular repair (autophagy)</Text>
          </View>
        </View>
      </ScrollView>

      {/* Protocol Selection Modal */}
      <Modal
        visible={showProtocolModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProtocolModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Fasting Protocol</Text>
              <TouchableOpacity onPress={() => setShowProtocolModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.protocolList}>
              {protocols.map((protocol) => (
                <TouchableOpacity
                  key={protocol.protocol_id}
                  style={styles.protocolItem}
                  onPress={() => {
                    if (protocol.protocol_id === 'custom') {
                      // For now, use 16 hours as default custom
                      handleStartFast('custom', 16);
                    } else {
                      handleStartFast(protocol.protocol_id);
                    }
                  }}
                >
                  <View style={styles.protocolInfo}>
                    <Text style={styles.protocolName}>{protocol.name}</Text>
                    <Text style={styles.protocolDesc}>{protocol.description}</Text>
                  </View>
                  <View style={styles.protocolHours}>
                    <Text style={styles.protocolHoursText}>
                      {protocol.fasting_hours}h
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fasting History</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.historyList}>
              {history.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="calendar-outline" size={48} color="#64748B" />
                  <Text style={styles.emptyHistoryText}>No fasting history yet</Text>
                </View>
              ) : (
                history.map((session) => (
                  <View key={session.session_id} style={styles.historyItem}>
                    <View style={styles.historyItemLeft}>
                      <Ionicons
                        name={session.completed ? 'checkmark-circle' : 'close-circle'}
                        size={24}
                        color={session.completed ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle}>
                        {session.protocol_name}
                      </Text>
                      <Text style={styles.historyItemDate}>
                        {new Date(session.start_time).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.historyItemRight}>
                      <Text style={styles.historyItemDuration}>
                        {formatHours(session.actual_hours || 0)}
                      </Text>
                      <Text style={styles.historyItemTarget}>
                        / {session.target_hours}h
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 2,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    marginVertical: 8,
  },
  timerProtocol: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
  },
  timerRemaining: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  idleContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  idleCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  idleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  idleSubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  endButtonComplete: {
    backgroundColor: '#10B981',
  },
  endButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  totalHours: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D3748',
  },
  totalHoursText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  historyButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  benefitsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  protocolList: {
    padding: 16,
  },
  protocolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  protocolInfo: {
    flex: 1,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  protocolDesc: {
    fontSize: 13,
    color: '#64748B',
  },
  protocolHours: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  protocolHoursText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  historyList: {
    padding: 16,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  historyItemLeft: {
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  historyItemDate: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyItemDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  historyItemTarget: {
    fontSize: 12,
    color: '#64748B',
  },
});
