import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [weeklyFitness, setWeeklyFitness] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!user) return;

    const { data: p } = await supabase.from('users').select('*').eq('id', user.id).single();
    setProfile(p);

    const { data: logs } = await supabase
      .from('log_entries')
      .select('*, log_type:log_types(*)')
      .eq('user_id', user.id)
      .eq('date', today);
    setTodayLogs(logs ?? []);

    const { data: cycle } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('cycle_start_date', { ascending: false })
      .limit(1)
      .single();
    setCycleInfo(cycle);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { count } = await supabase
      .from('log_entries')
      .select('*, log_type:log_types!inner(category)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('log_types.category', 'fitness')
      .gte('date', weekAgo);
    setWeeklyFitness(count ?? 0);
  }, [user, today]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCycleDayInfo = () => {
    if (!cycleInfo?.cycle_start_date) return null;
    const start = new Date(cycleInfo.cycle_start_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (cycleInfo.cycle_end_date) {
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + 28);
      const daysUntil = Math.floor((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil > 0) return { text: `다음 예상일까지 D-${daysUntil}`, color: '#4CAF50' };
      return { text: '예상일이 지났어요', color: '#FF9800' };
    }

    return { text: `생리 ${diffDays + 1}일차`, color: '#E91E63' };
  };

  const cycleDay = getCycleDayInfo();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E91E63" />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>안녕하세요, {profile?.nickname ?? '회원'}님</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {cycleDay && (
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: cycleDay.color }]}>
          <Text style={[styles.cycleText, { color: cycleDay.color }]}>{cycleDay.text}</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 기록</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.empty}>아직 오늘 기록이 없어요</Text>
        ) : (
          todayLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logLabel}>{log.log_type?.name}</Text>
              <Text style={styles.logValue}>
                {log.value}{log.log_type?.unit ? ` ${log.log_type.unit}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>이번 주 인사이트</Text>
        <View style={styles.insightRow}>
          <View style={styles.insightItem}>
            <Text style={styles.insightNumber}>{weeklyFitness}</Text>
            <Text style={styles.insightLabel}>운동 기록</Text>
          </View>
          <View style={styles.insightItem}>
            <Text style={styles.insightNumber}>{todayLogs.length}</Text>
            <Text style={styles.insightLabel}>오늘 기록</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#E91E63', marginBottom: 12 },
  cycleText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  empty: { color: '#aaa', textAlign: 'center', paddingVertical: 16 },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  logLabel: { fontSize: 15, color: '#555' },
  logValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  insightRow: { flexDirection: 'row', justifyContent: 'space-around' },
  insightItem: { alignItems: 'center' },
  insightNumber: { fontSize: 28, fontWeight: 'bold', color: '#E91E63' },
  insightLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});
