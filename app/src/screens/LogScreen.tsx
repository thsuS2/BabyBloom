import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
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

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadLogTypes();
    loadTodayEntries();
  }, []);

  const loadLogTypes = async () => {
    const { data } = await supabase
      .from('log_types')
      .select('*')
      .in('category', ['daily', 'fitness'])
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
        style={styles.input}
        placeholder={`${lt.name} 입력${lt.unit ? ` (${lt.unit})` : ''}`}
        value={values[lt.id] ?? ''}
        onChangeText={(v) => setValues({ ...values, [lt.id]: v })}
        keyboardType={lt.data_type === 'number' ? 'numeric' : 'default'}
        multiline={lt.name === '메모'}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘의 기록</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {logTypes.map((lt) => (
        <View key={lt.id} style={styles.card}>
          <Text style={styles.label}>
            {lt.name} {lt.unit ? `(${lt.unit})` : ''}
          </Text>
          {renderInput(lt)}
        </View>
      ))}

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
  card: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#E91E63', marginBottom: 8 },
  input: {
    backgroundColor: '#FAFAFA', borderRadius: 8, padding: 12, fontSize: 16,
    borderWidth: 1, borderColor: '#F0E0E0',
  },
  selectRow: { flexDirection: 'row', gap: 8 },
  selectBtn: {
    flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: '#F0E0E0', alignItems: 'center',
  },
  selectBtnActive: { backgroundColor: '#E91E63', borderColor: '#E91E63' },
  selectText: { color: '#666', fontSize: 14 },
  selectTextActive: { color: '#fff', fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: '#E91E63', marginHorizontal: 16, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
