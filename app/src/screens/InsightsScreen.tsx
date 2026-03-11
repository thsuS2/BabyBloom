import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function InsightsScreen() {
  const user = useAuthStore((s) => s.user);
  const [weightData, setWeightData] = useState<{ date: string; value: string }[]>([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [fitnessCount, setFitnessCount] = useState(0);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    if (!user) return;

    // 최근 30일 체중 데이터
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: weightLogs } = await supabase
      .from('log_entries')
      .select('date, value, log_type:log_types!inner(name)')
      .eq('user_id', user.id)
      .eq('log_types.name', '체중')
      .gte('date', thirtyDaysAgo)
      .order('date');

    setWeightData(weightLogs ?? []);

    // 주기 횟수
    const { count: cycles } = await supabase
      .from('cycle_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setCycleCount(cycles ?? 0);

    // 이번 달 운동 횟수
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    const monthStart = firstOfMonth.toISOString().split('T')[0];

    const { count: fitness } = await supabase
      .from('log_entries')
      .select('*, log_type:log_types!inner(category)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('log_types.category', 'fitness')
      .gte('date', monthStart);

    setFitnessCount(fitness ?? 0);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>인사이트</Text>
        <Text style={styles.subtitle}>최근 30일 데이터 요약</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cycleCount}</Text>
          <Text style={styles.statLabel}>기록된 주기</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{fitnessCount}</Text>
          <Text style={styles.statLabel}>이번 달 운동</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{weightData.length}</Text>
          <Text style={styles.statLabel}>체중 기록</Text>
        </View>
      </View>

      {weightData.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>체중 변화</Text>
          {weightData.map((w, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.rowDate}>{w.date}</Text>
              <Text style={styles.rowValue}>{w.value} kg</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#E91E63' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#E91E63', marginBottom: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  rowDate: { fontSize: 14, color: '#888' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#333' },
});
