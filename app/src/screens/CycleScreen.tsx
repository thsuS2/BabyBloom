import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function CycleScreen() {
  const user = useAuthStore((s) => s.user);
  const [cycles, setCycles] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('cycle_start_date', { ascending: false });

    setCycles(data ?? []);
    buildMarkedDates(data ?? []);
  };

  const buildMarkedDates = (data: any[]) => {
    const marks: any = {};
    data.forEach((cycle) => {
      const start = new Date(cycle.cycle_start_date);
      const end = cycle.cycle_end_date ? new Date(cycle.cycle_end_date) : start;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        marks[key] = {
          color: '#FFCDD2',
          textColor: '#C62828',
          startingDay: key === cycle.cycle_start_date,
          endingDay: key === (cycle.cycle_end_date ?? cycle.cycle_start_date),
        };
      }
    });
    setMarkedDates(marks);
  };

  const handleDayPress = (day: any) => {
    Alert.alert(
      '생리 기록',
      `${day.dateString}을 생리 시작일로 기록할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시작일 기록',
          onPress: () => createCycle(day.dateString),
        },
        {
          text: '종료일 기록',
          onPress: () => updateLatestEnd(day.dateString),
        },
      ],
    );
  };

  const createCycle = async (startDate: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('cycle_logs')
      .insert({ user_id: user.id, cycle_start_date: startDate });

    if (error) return Alert.alert('오류', error.message);
    loadCycles();
  };

  const updateLatestEnd = async (endDate: string) => {
    if (!user || cycles.length === 0) return Alert.alert('알림', '먼저 시작일을 기록해주세요');

    const latest = cycles[0];
    const { error } = await supabase
      .from('cycle_logs')
      .update({ cycle_end_date: endDate })
      .eq('id', latest.id);

    if (error) return Alert.alert('오류', error.message);
    loadCycles();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>생리 주기</Text>
      </View>

      <Calendar
        markingType="period"
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          todayTextColor: '#E91E63',
          arrowColor: '#E91E63',
          selectedDayBackgroundColor: '#E91E63',
        }}
        style={styles.calendar}
      />

      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: '#FFCDD2' }]} />
        <Text style={styles.legendText}>생리 기간</Text>
      </View>

      {cycles.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>최근 기록</Text>
          <Text style={styles.infoText}>
            시작: {cycles[0].cycle_start_date}
            {cycles[0].cycle_end_date ? ` ~ 종료: ${cycles[0].cycle_end_date}` : ' (진행 중)'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  calendar: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  legend: { flexDirection: 'row', alignItems: 'center', padding: 16, marginLeft: 16 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { fontSize: 14, color: '#666' },
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#E91E63', marginBottom: 8 },
  infoText: { fontSize: 16, color: '#333' },
});
