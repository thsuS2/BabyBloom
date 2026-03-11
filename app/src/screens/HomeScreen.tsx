import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    const { data: logs } = await supabase
      .from('log_entries')
      .select('*, log_type:log_types(*)')
      .eq('user_id', user.id)
      .eq('date', today);
    setTodayLogs(logs ?? []);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          안녕하세요, {profile?.nickname ?? '회원'}님
        </Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>오늘의 기록</Text>
        {todayLogs.length === 0 ? (
          <Text style={styles.empty}>아직 오늘 기록이 없어요</Text>
        ) : (
          todayLogs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <Text style={styles.logLabel}>{log.log_type?.name}</Text>
              <Text style={styles.logValue}>
                {log.value} {log.log_type?.unit ?? ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#888', marginTop: 4 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#E91E63', marginBottom: 16 },
  empty: { color: '#aaa', textAlign: 'center', paddingVertical: 20 },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  logLabel: { fontSize: 16, color: '#555' },
  logValue: { fontSize: 16, fontWeight: '600', color: '#333' },
});
