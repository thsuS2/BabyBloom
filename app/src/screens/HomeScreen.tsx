import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, layout, shadows, radius } from '../design';
import { Card, SafeScreen } from '../design/components';
import {
  IconGear, IconDroplet, IconSmile, IconScale, IconMoon, IconMood,
  IconActivity, IconStopwatch, IconCapsule, IconPill, IconMemo,
  IconHeartFill, IconPencil, IconGraphUp, IconChevronRight, IconPin,
} from '../components/Icons';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string }>> = {
  '컨디션': IconSmile,
  '체중': IconScale,
  '수면시간': IconMoon,
  '기분': IconMood,
  '운동': IconActivity,
  '운동시간': IconStopwatch,
  '영양제': IconCapsule,
  '피임약': IconPill,
  '메모': IconMemo,
  '관계': IconHeartFill,
};

const CATEGORY_COLORS: Record<string, string> = {
  'health': colors.coral,
  'fitness': colors.secondary,
  'supplement': colors.softBlue,
  'mood': colors.roseGold,
  'intimate': colors.primaryDark,
  'memo': colors.textSecondary,
};

const formatDateKR = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${month}월 ${day}일 ${weekdays[d.getDay()]}`;
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [todayLogs, setTodayLogs] = useState<any[]>([]);
  const [cycleInfo, setCycleInfo] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<{
    fitness: number;
    totalLogs: number;
    avgSleep: string | null;
    avgCondition: string | null;
  }>({ fitness: 0, totalLogs: 0, avgSleep: null, avgCondition: null });
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!user) return;

    try {
      const [profileRes, logsRes, cycleRes] = await Promise.all([
        api.get('/users/profile'),
        api.get(`/logs/date/${today}`),
        api.get('/cycle/latest'),
      ]);

      setProfile(profileRes.data);
      setTodayLogs(logsRes.data ?? []);
      setCycleInfo(cycleRes.data);

      // 주간 통계
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const rangeRes = await api.get(`/logs/range?start=${weekAgo}&end=${today}`);
      const weekData = rangeRes.data ?? [];

      const fitnessCount = weekData.filter(
        (e: any) => e.log_type?.category === 'fitness',
      ).length;

      // 수면 평균
      const sleepEntries = weekData.filter(
        (e: any) => e.log_type?.name === '수면시간' && e.value,
      );
      const avgSleep = sleepEntries.length > 0
        ? (sleepEntries.reduce((sum: number, e: any) => sum + parseFloat(e.value), 0) / sleepEntries.length).toFixed(1)
        : null;

      // 컨디션 평균 (select 타입이므로 빈도 기반)
      const conditionEntries = weekData.filter(
        (e: any) => e.log_type?.name === '컨디션' && e.value,
      );
      const avgCondition = conditionEntries.length > 0
        ? conditionEntries[conditionEntries.length - 1].value
        : null;

      setWeeklyStats({
        fitness: fitnessCount,
        totalLogs: weekData.length,
        avgSleep,
        avgCondition,
      });
    } catch {
      // 에러 시 무시
    }
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
      const periodLength = Math.floor(
        (new Date(cycleInfo.cycle_end_date).getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + 28);
      const daysUntil = Math.floor((nextStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // 배란 예상일 (주기 14일 전)
      const ovulationDate = new Date(nextStart);
      ovulationDate.setDate(ovulationDate.getDate() - 14);
      const daysUntilOvulation = Math.floor((ovulationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        status: 'waiting' as const,
        daysUntil: Math.max(daysUntil, 0),
        periodLength,
        cycleDay: diffDays + 1,
        totalCycle: 28,
        progress: Math.min(((diffDays + 1) / 28) * 100, 100),
        ovulationDays: daysUntilOvulation > 0 ? daysUntilOvulation : null,
      };
    }

    return {
      status: 'period' as const,
      currentDay: diffDays + 1,
      cycleDay: diffDays + 1,
      totalCycle: 28,
      progress: Math.min(((diffDays + 1) / 28) * 100, 100),
      daysUntil: 0,
      periodLength: diffDays + 1,
      ovulationDays: null,
    };
  };

  const cycleDay = getCycleDayInfo();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '늦은 밤이에요';
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '좋은 오후에요';
    return '좋은 저녁이에요';
  };

  const getIconComponent = (name: string) => ICON_MAP[name] ?? IconPin;
  const getCategoryColor = (category: string) => CATEGORY_COLORS[category] ?? colors.textSecondary;

  return (
    <SafeScreen>
      <ScrollView
        style={s.scrollBody}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* 헤더 */}
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.nickname}>{profile?.nickname ?? '회원'}님</Text>
            <Text style={s.date}>{formatDateKR(today)}</Text>
          </View>
          <View style={s.headerRight}>
            <TouchableOpacity
              style={s.settingsBtn}
              onPress={() => navigation.navigate('Settings')}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <IconGear size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Image
              source={require('../../assets/BabyBloom.png')}
              style={s.headerImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* 생리주기 카드 */}
        {cycleDay && (
          <Card style={s.cycleCard}>
            <View style={s.cycleHeader}>
              <View style={[s.cycleIconCircle, {
                backgroundColor: cycleDay.status === 'period' ? colors.periodLight : colors.primaryLight,
              }]}>
                <IconDroplet
                  size={20}
                  color={cycleDay.status === 'period' ? colors.periodDark : colors.primary}
                />
              </View>
              <View style={s.cycleTextWrap}>
                <Text style={[s.cycleStatus, {
                  color: cycleDay.status === 'period' ? colors.periodDark : colors.primary,
                }]}>
                  {cycleDay.status === 'period'
                    ? `생리 ${cycleDay.currentDay}일차`
                    : `다음 예상일까지 D-${cycleDay.daysUntil}`
                  }
                </Text>
                {cycleDay.ovulationDays && (
                  <Text style={s.cycleSubInfo}>
                    배란 예상일 D-{cycleDay.ovulationDays}
                  </Text>
                )}
              </View>
            </View>
            {/* 프로그레스 바 */}
            <View style={s.progressBg}>
              <View style={[s.progressFill, {
                width: `${cycleDay.progress}%`,
                backgroundColor: cycleDay.status === 'period' ? colors.period : colors.primary,
              }]} />
            </View>
            <View style={s.progressLabels}>
              <Text style={s.progressLabel}>{cycleDay.cycleDay}일차</Text>
              <Text style={s.progressLabel}>{cycleDay.totalCycle}일 주기</Text>
            </View>
          </Card>
        )}

        {/* 오늘의 기록 */}
        <Card>
          <View style={s.sectionHeader}>
            <Text style={s.cardTitle}>오늘의 기록</Text>
            <TouchableOpacity
              style={s.goBtn}
              onPress={() => navigation.navigate('Log')}
              activeOpacity={0.7}
            >
              <Text style={s.goBtnText}>기록하기</Text>
              <IconChevronRight size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {todayLogs.length === 0 ? (
            <TouchableOpacity
              style={s.emptyState}
              onPress={() => navigation.navigate('Log')}
              activeOpacity={0.7}
            >
              <View style={s.emptyIconCircle}>
                <IconPencil size={24} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>아직 오늘 기록이 없어요</Text>
              <Text style={s.emptySubtitle}>탭하여 기록을 시작해 보세요</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.logGrid}>
              {todayLogs.slice(0, 6).map((log) => {
                const name = log.log_type?.name ?? '';
                const category = log.log_type?.category ?? '';
                const catColor = getCategoryColor(category);
                const IconComp = getIconComponent(name);
                const unit = log.log_type?.unit;
                const displayVal = unit ? `${log.value} ${unit}` : log.value;

                return (
                  <View key={log.id} style={s.logItem}>
                    <View style={[s.logIconCircle, { backgroundColor: catColor + '18' }]}>
                      <IconComp size={18} color={catColor} />
                    </View>
                    <Text style={s.logItemName} numberOfLines={1}>{name}</Text>
                    <Text style={[s.logItemValue, { color: catColor }]} numberOfLines={1}>
                      {displayVal}
                    </Text>
                  </View>
                );
              })}
              {todayLogs.length > 6 && (
                <TouchableOpacity
                  style={s.logItemMore}
                  onPress={() => navigation.navigate('Log')}
                >
                  <Text style={s.logMoreText}>+{todayLogs.length - 6}개 더보기</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Card>

        {/* 주간 인사이트 */}
        <Card>
          <View style={s.sectionHeader}>
            <Text style={s.cardTitle}>이번 주 인사이트</Text>
            <View style={s.insightBadge}>
              <IconGraphUp size={12} color={colors.primary} />
              <Text style={s.insightBadgeText}>7일</Text>
            </View>
          </View>

          <View style={s.statsGrid}>
            <View style={s.statCard}>
              <View style={[s.statIconCircle, { backgroundColor: colors.secondaryLight + '60' }]}>
                <IconActivity size={18} color={colors.secondary} />
              </View>
              <Text style={[s.statNumber, { color: colors.secondary }]}>
                {weeklyStats.fitness}
              </Text>
              <Text style={s.statLabel}>운동 기록</Text>
            </View>

            <View style={s.statCard}>
              <View style={[s.statIconCircle, { backgroundColor: colors.primaryLight }]}>
                <IconPencil size={18} color={colors.primary} />
              </View>
              <Text style={[s.statNumber, { color: colors.primary }]}>
                {todayLogs.length}
              </Text>
              <Text style={s.statLabel}>오늘 기록</Text>
            </View>

            <View style={s.statCard}>
              <View style={[s.statIconCircle, { backgroundColor: colors.softBlueLight + '60' }]}>
                <IconMoon size={18} color={colors.softBlue} />
              </View>
              <Text style={[s.statNumber, { color: colors.softBlue }]}>
                {weeklyStats.avgSleep ?? '-'}
              </Text>
              <Text style={s.statLabel}>평균 수면</Text>
            </View>

            <View style={s.statCard}>
              <View style={[s.statIconCircle, { backgroundColor: colors.coralLight + '60' }]}>
                <IconSmile size={18} color={colors.coral} />
              </View>
              <Text style={[s.statNumber, { color: colors.coral }]} numberOfLines={1}>
                {weeklyStats.avgCondition ?? '-'}
              </Text>
              <Text style={s.statLabel}>최근 컨디션</Text>
            </View>
          </View>
        </Card>

        {/* 빠른 기록 */}
        <Card>
          <Text style={s.cardTitle}>빠른 기록</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.quickScroll}
          >
            {[
              { name: '컨디션', icon: IconSmile, color: colors.coral },
              { name: '체중', icon: IconScale, color: colors.coral },
              { name: '수면시간', icon: IconMoon, color: colors.coral },
              { name: '기분', icon: IconMood, color: colors.roseGold },
              { name: '운동', icon: IconActivity, color: colors.secondary },
              { name: '영양제', icon: IconCapsule, color: colors.softBlue },
            ].map((item) => {
              const isRecorded = todayLogs.some((l) => l.log_type?.name === item.name);
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[s.quickItem, isRecorded && s.quickItemRecorded]}
                  onPress={() => navigation.navigate('Log')}
                  activeOpacity={0.7}
                >
                  <View style={[s.quickIcon, {
                    backgroundColor: isRecorded ? item.color + '18' : colors.surfaceSecondary,
                  }]}>
                    <item.icon size={20} color={isRecorded ? item.color : colors.textTertiary} />
                  </View>
                  <Text style={[s.quickLabel, isRecorded && { color: item.color }]}>
                    {item.name}
                  </Text>
                  {isRecorded && <Text style={s.quickCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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

  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xxl,
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
  greeting: {
    ...typography.body2,
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

  // 섹션 헤더
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  goBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // 생리주기 카드
  cycleCard: {
    overflow: 'hidden',
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cycleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleTextWrap: {
    flex: 1,
  },
  cycleStatus: {
    ...typography.subtitle1,
    fontWeight: 'bold',
  },
  cycleSubInfo: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // 오늘의 기록 — 빈 상태
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // 오늘의 기록 — 그리드
  logGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  logItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  logIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logItemName: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  logItemValue: {
    ...typography.label,
    textAlign: 'center',
  },
  logItemMore: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  logMoreText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },

  // 주간 인사이트
  insightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  insightBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    ...typography.numberSmall,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // 빠른 기록
  quickScroll: {
    marginTop: spacing.xs,
  },
  quickItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  quickItemRecorded: {
    opacity: 1,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quickCheck: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: 'bold',
    position: 'absolute',
    top: 0,
    right: -4,
  },
});
