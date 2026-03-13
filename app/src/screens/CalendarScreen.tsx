import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius, layout, shadows } from '../design';
import { Card, SafeScreen, ScreenHeader } from '../design/components';

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
    try {
      const { data } = await api.get('/cycle');
      setCycles(data ?? []);
      buildMarkedDates(data ?? []);
    } catch {}
  };

  const buildMarkedDates = (data: any[]) => {
    const marks: any = {};
    data.forEach((cycle) => {
      const start = new Date(cycle.cycle_start_date);
      const end = cycle.cycle_end_date ? new Date(cycle.cycle_end_date) : start;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        marks[key] = {
          color: colors.periodLight,
          textColor: colors.periodDark,
          startingDay: key === cycle.cycle_start_date,
          endingDay: key === (cycle.cycle_end_date ?? cycle.cycle_start_date),
        };
      }
    });
    setMarkedDates(marks);
  };

  const loadDayLogs = async (date: string) => {
    if (!user) return;
    try {
      const { data } = await api.get(`/logs/date/${date}`);
      setDayLogs(data ?? []);
    } catch {
      setDayLogs([]);
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  return (
    <SafeScreen>
      <ScreenHeader title="캘린더" />
      <ScrollView style={s.scrollBody} showsVerticalScrollIndicator={false}>
        <Calendar
          markingType="period"
          markedDates={{
            ...markedDates,
            [selectedDate]: {
              ...markedDates[selectedDate],
              selected: true,
              selectedColor: colors.primary,
            },
          }}
          onDayPress={handleDayPress}
          theme={{
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            calendarBackground: colors.surface,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textMonthFontWeight: '600',
          }}
          style={s.calendar}
        />

        <View style={s.legendRow}>
          <View style={[s.legendDot, { backgroundColor: colors.periodLight }]} />
          <Text style={s.legendText}>생리 기간</Text>
          <View style={[s.legendDot, { backgroundColor: colors.primary, marginLeft: spacing.lg }]} />
          <Text style={s.legendText}>선택된 날짜</Text>
        </View>

        <Card>
          <Text style={s.cardTitle}>{selectedDate} 기록</Text>
          {dayLogs.length === 0 ? (
            <Text style={s.empty}>이 날의 기록이 없어요</Text>
          ) : (
            dayLogs.map((log) => (
              <View key={log.id} style={s.logRow}>
                <Text style={s.logLabel}>{log.log_type?.name}</Text>
                <Text style={s.logValue}>
                  {log.value}{log.log_type?.unit ? ` ${log.log_type.unit}` : ''}
                </Text>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  scrollBody: {
    flex: 1,
  },
  calendar: {
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginLeft: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  legendText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cardTitle: {
    ...typography.subtitle2,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.body2,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  logLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  logValue: {
    ...typography.subtitle2,
    color: colors.textPrimary,
  },
});
