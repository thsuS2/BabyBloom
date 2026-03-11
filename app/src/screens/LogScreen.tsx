import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';

interface LogType {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  data_type: string;
  options: string[] | null;
}

export default function LogScreen() {
  const user = useAuthStore((s) => s.user);
  const [logTypes, setLogTypes] = useState<LogType[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [isOnPeriod, setIsOnPeriod] = useState(false);
  const [latestCycle, setLatestCycle] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadLogTypes();
    loadTodayEntries();
    loadLatestCycle();
  }, []);

  const loadLogTypes = async () => {
    const { data } = await supabase
      .from('log_types')
      .select('*')
      .order('display_order');
    setLogTypes(data ?? []);
  };

  const loadTodayEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('log_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    if (data) {
      const existing: Record<string, string> = {};
      data.forEach((e: any) => { existing[e.log_type_id] = e.value; });
      setValues(existing);
    }
  };

  const loadLatestCycle = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('cycle_start_date', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLatestCycle(data);
      setIsOnPeriod(!data.cycle_end_date);
    }
  };

  const handlePeriodToggle = async (value: boolean) => {
    if (!user) return;
    setIsOnPeriod(value);

    if (value) {
      const { error } = await supabase
        .from('cycle_logs')
        .insert({ user_id: user.id, cycle_start_date: today });
      if (error) return Alert.alert('오류', error.message);
      loadLatestCycle();
    } else if (latestCycle && !latestCycle.cycle_end_date) {
      const { error } = await supabase
        .from('cycle_logs')
        .update({ cycle_end_date: today })
        .eq('id', latestCycle.id);
      if (error) return Alert.alert('오류', error.message);
      loadLatestCycle();
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const entries = Object.entries(values)
      .filter(([_, v]) => v.trim() !== '')
      .map(([logTypeId, value]) => ({
        user_id: user.id,
        log_type_id: logTypeId,
        date: today,
        value,
      }));

    if (entries.length === 0) {
      setSaving(false);
      return Alert.alert('알림', '기록할 내용을 입력해주세요');
    }

    const { error } = await supabase
      .from('log_entries')
      .upsert(entries, { onConflict: 'user_id,log_type_id,date' });

    setSaving(false);
    if (error) return Alert.alert('오류', error.message);
    Alert.alert('완료', '오늘의 기록이 저장되었습니다!');
  };

  const renderInput = (lt: LogType) => {
    if (lt.data_type === 'select' && lt.options) {
      const opts = typeof lt.options === 'string' ? JSON.parse(lt.options) : lt.options;
      return (
        <View style={styles.selectRow}>
          {opts.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={[styles.selectBtn, values[lt.id] === opt && styles.selectBtnActive]}
              onPress={() => setValues({ ...values, [lt.id]: opt })}
            >
              <Text style={[styles.selectText, values[lt.id] === opt && styles.selectTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return (
      <TextInput
        style={[styles.input, lt.data_type === 'text' && lt.name.includes('메모') && { height: 80, textAlignVertical: 'top' }]}
        placeholder={`${lt.name} 입력${lt.unit ? ` (${lt.unit})` : ''}`}
        value={values[lt.id] ?? ''}
        onChangeText={(v) => setValues({ ...values, [lt.id]: v })}
        keyboardType={lt.data_type === 'number' ? 'numeric' : 'default'}
        multiline={lt.data_type === 'text' && lt.name.includes('메모')}
      />
    );
  };

  const dailyTypes = logTypes.filter((t) => t.category === 'daily');
  const fitnessTypes = logTypes.filter((t) => t.category === 'fitness');
  const relationTypes = logTypes.filter((t) => t.category === 'relation');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 기록</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* 생리 토글 */}
      <View style={styles.card}>
        <View style={styles.periodRow}>
          <Text style={styles.periodLabel}>🔴 생리 중</Text>
          <Switch
            value={isOnPeriod}
            onValueChange={handlePeriodToggle}
            trackColor={{ false: '#ddd', true: '#FFCDD2' }}
            thumbColor={isOnPeriod ? '#E91E63' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* 일일 기록 */}
      <Text style={styles.sectionTitle}>일일 기록</Text>
      {dailyTypes.map((lt) => (
        <View key={lt.id} style={styles.card}>
          <Text style={styles.label}>{lt.name}{lt.unit ? ` (${lt.unit})` : ''}</Text>
          {renderInput(lt)}
        </View>
      ))}

      {/* 운동 기록 */}
      <Text style={styles.sectionTitle}>운동 기록</Text>
      {fitnessTypes.map((lt) => (
        <View key={lt.id} style={styles.card}>
          <Text style={styles.label}>{lt.name}{lt.unit ? ` (${lt.unit})` : ''}</Text>
          {renderInput(lt)}
        </View>
      ))}

      {/* 기타 */}
      {relationTypes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>기타</Text>
          {relationTypes.map((lt) => (
            <View key={lt.id} style={styles.card}>
              <Text style={styles.label}>{lt.name}</Text>
              {renderInput(lt)}
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '저장하기'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F5' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 14, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#999', marginLeft: 20, marginTop: 16, marginBottom: 8 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#E91E63', marginBottom: 8 },
  input: {
    backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 16,
    borderWidth: 1, borderColor: '#F0E0E0',
  },
  selectRow: { flexDirection: 'row', gap: 8 },
  selectBtn: {
    flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: '#F0E0E0', alignItems: 'center',
  },
  selectBtnActive: { backgroundColor: '#E91E63', borderColor: '#E91E63' },
  selectText: { color: '#666', fontSize: 13 },
  selectTextActive: { color: '#fff', fontWeight: 'bold' },
  periodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  saveBtn: {
    backgroundColor: '#E91E63', marginHorizontal: 16, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 16,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
