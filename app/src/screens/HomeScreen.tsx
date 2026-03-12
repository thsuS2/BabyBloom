import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, layout, shadows, radius } from '../design';
import { Card } from '../design/components';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
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
      if (daysUntil > 0) return { text: `다음 예상일까지 D-${daysUntil}`, color: colors.success };
      return { text: '예상일이 지났어요', color: colors.warning };
    }

    return { text: `생리 ${diffDays + 1}일차`, color: colors.primary };
  };

  const cycleDay = getCycleDayInfo();

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* 헤더 + 일러스트 */}
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.greeting}>안녕하세요,</Text>
          <Text style={s.nickname}>{profile?.nickname ?? '회원'}님</Text>
          <Text style={s.date}>{today}</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.settingsBtn}
            onPress={() => navigation.navigate('Settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={s.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <Image
            source={require('../../assets/BabyBloom.png')}
            style={s.headerImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* 생리주기 D-day */}
      {cycleDay && (
        <Card style={{ borderLeftWidth: 4, borderLeftColor: cycleDay.color }}>
          <Text style={[s.cycleText, { color: cycleDay.color }]}>{cycleDay.text}</Text>
        </Card>
      )}

      {/* 오늘의 기록 */}
      <Card>
        <Text style={s.cardTitle}>오늘의 기록</Text>
        {todayLogs.length === 0 ? (
          <Text style={s.empty}>아직 오늘 기록이 없어요</Text>
        ) : (
          todayLogs.map((log) => (
            <View key={log.id} style={s.logRow}>
              <Text style={s.logLabel}>{log.log_type?.name}</Text>
              <Text style={s.logValue}>
                {log.value}{log.log_type?.unit ? ` ${log.log_type.unit}` : ''}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* 주간 인사이트 */}
      <Card>
        <Text style={s.cardTitle}>이번 주 인사이트</Text>
        <View style={s.insightRow}>
          <View style={s.insightItem}>
            <Text style={s.insightNumber}>{weeklyFitness}</Text>
            <Text style={s.insightLabel}>운동 기록</Text>
          </View>
          <View style={s.insightItem}>
            <Text style={s.insightNumber}>{todayLogs.length}</Text>
            <Text style={s.insightLabel}>오늘 기록</Text>
          </View>
        </View>
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xxl,
    paddingTop: layout.screenPaddingTop,
  },
  headerText: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  settingsBtn: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  settingsIcon: {
    fontSize: 22,
  },
  greeting: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  nickname: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  date: {
    ...typography.body2,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  headerImage: {
    width: 200,
    height: 200,
    marginLeft: spacing.md,
    marginTop: -spacing.lg,
  },
  cardTitle: {
    ...typography.subtitle1,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  cycleText: {
    ...typography.h3,
    textAlign: 'center',
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
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  insightItem: {
    alignItems: 'center',
  },
  insightNumber: {
    ...typography.number,
    color: colors.primary,
  },
  insightLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
