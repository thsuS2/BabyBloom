import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function CalendarScreen() {
  const user = useAuthStore((s) => s.user);
  const [cycles, setCycles] = useState<any[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayLogs, setDayLogs] = useState<any[]>([]);

  useEffect(() => {
    loadCycles();
  }, []);

  useEffect(() => {
    loadDayLogs(selectedDate);
  }, [selectedDate]);

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

  const loadDayLogs = async (date: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('log_entries')
      .select('*, log_type:log_types(*)')
      .eq('user_id', user.id)
      .eq('date', date);
    setDayLogs(data ?? []);
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>캘린더</Text>
      </View>

      <Calendar
        markingType="period"
        markedDates={{
          ...markedDates,
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: '#E91E63',
          },
        }}
        onDayPress={handleDayPress}
        theme={{
          todayTextColor: '#E91E63',
          arrowColor: '#E91E63',
        }}
        style={styles.calendar}
      />

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: '#FFCDD2' }]} />
        <Text style={styles.legendText}>생리 기간</Text>
        <View style={[styles.legendDot, { backgroundColor: '#E91E63', marginLeft: 16 }]} />
        <Text style={styles.legendText}>선택된 날짜</Text>
      </View>

      {/* 선택된 날짜의 기록 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{selectedDate} 기록</Text>
        {dayLogs.length === 0 ? (
          <Text style={styles.empty}>이 날의 기록이 없어요</Text>
        ) : (
          dayLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logLabel}>{log.log_type?.name}</Text>
              <Text style={styles.logValue}>
                {log.value}{log.log_type?.unit ? ` ${log.log_type.unit}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  calendar: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden' },
  legendRow: { flexDirection: 'row', alignItems: 'center', padding: 16, marginLeft: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 13, color: '#666' },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#E91E63', marginBottom: 12 },
  empty: { color: '#aaa', textAlign: 'center', paddingVertical: 16 },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  logLabel: { fontSize: 15, color: '#555' },
  logValue: { fontSize: 15, fontWeight: '600', color: '#333' },
});
