import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius, layout, shadows } from '../design';
import { Card, Button, Badge, BottomSheet, Toggle, SafeScreen, ScreenHeader } from '../design/components';
import {
  IconSmile, IconScale, IconMoon, IconMood, IconActivity, IconStopwatch,
  IconCapsule, IconPill, IconMemo, IconHeartFill, IconHeart, IconPin,
  IconBaby, IconShield,
} from '../components/Icons';

interface LogType {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  data_type: string;
  options: string[] | null;
}

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
  '관계': IconHeart,
};

const CATEGORY_COLORS: Record<string, string> = {
  'health': colors.coral,
  'fitness': colors.secondary,
  'supplement': colors.softBlue,
  'mood': colors.roseGold,
  'intimate': colors.primaryDark,
  'memo': colors.textSecondary,
};

const TODAY = new Date().toISOString().split('T')[0];

const formatDateLabel = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const weekday = weekdays[d.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
};

const shiftDate = (dateStr: string, days: number) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export default function LogScreen() {
  const user = useAuthStore((s) => s.user);
  const [logTypes, setLogTypes] = useState<LogType[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isOnPeriod, setIsOnPeriod] = useState(false);
  const [latestCycle, setLatestCycle] = useState<any>(null);
  const [activeSheet, setActiveSheet] = useState<LogType | null>(null);
  const [sheetValue, setSheetValue] = useState('');
  const [selectedDate, setSelectedDate] = useState(TODAY);

  const isToday = selectedDate === TODAY;
  const isTomorrow = shiftDate(selectedDate, 1) > TODAY;

  useEffect(() => {
    loadLogTypes();
  }, []);

  useEffect(() => {
    loadEntries();
    loadLatestCycle();
    setSavedIds(new Set());
  }, [selectedDate]);

  const goToPrev = () => setSelectedDate(shiftDate(selectedDate, -1));
  const goToNext = () => {
    if (!isTomorrow) setSelectedDate(shiftDate(selectedDate, 1));
  };
  const goToToday = () => setSelectedDate(TODAY);

  const loadLogTypes = async () => {
    try {
      const { data } = await api.get('/logs/types');
      setLogTypes(data ?? []);
    } catch {}
  };

  const loadEntries = async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/logs/date/${selectedDate}`);
      if (data) {
        const existing: Record<string, string> = {};
        data.forEach((e: any) => { existing[e.log_type_id] = e.value; });
        setValues(existing);
      } else {
        setValues({});
      }
    } catch {
      setValues({});
    }
  };

  const loadLatestCycle = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/cycle/latest');
      if (data) {
        setLatestCycle(data);
        setIsOnPeriod(!data.cycle_end_date);
      }
    } catch {}
  };

  const handlePeriodToggle = async (value: boolean) => {
    if (!user) return;
    setIsOnPeriod(value);

    try {
      if (value) {
        await api.post('/cycle', { startDate: selectedDate });
        loadLatestCycle();
      } else if (latestCycle && !latestCycle.cycle_end_date) {
        await api.patch(`/cycle/${latestCycle.id}`, { endDate: selectedDate });
        loadLatestCycle();
      }
    } catch (err: any) {
      Alert.alert('오류', err.response?.data?.message ?? err.message);
      setIsOnPeriod(!value);
    }
  };

  const openSheet = (lt: LogType) => {
    if (lt.name === '관계') return; // 관계는 하트 토글로 처리
    setActiveSheet(lt);
    setSheetValue(values[lt.id] ?? '');
  };

  // 관계 카드 하트 토글 — 즉시 저장/해제
  const handleIntimateToggle = async (lt: LogType, heartValue: string) => {
    if (!user) return;
    const currentVal = values[lt.id];
    const isDeselect = currentVal === heartValue;

    setSavingId(lt.id);
    try {
      if (isDeselect) {
        // 해제: 기존 엔트리 삭제
        const { data: entries } = await api.get(`/logs/date/${selectedDate}`);
        const entry = entries?.find((e: any) => e.log_type_id === lt.id);
        if (entry) await api.delete(`/logs/${entry.id}`);

        setValues((prev) => {
          const next = { ...prev };
          delete next[lt.id];
          return next;
        });
      } else {
        // 저장
        await api.post('/logs/entry', {
          logTypeId: lt.id,
          date: selectedDate,
          value: heartValue,
        });
        setValues((prev) => ({ ...prev, [lt.id]: heartValue }));
        setSavedIds((prev) => new Set(prev).add(lt.id));
        setTimeout(() => {
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(lt.id);
            return next;
          });
        }, 2000);
      }
    } catch (err: any) {
      Alert.alert('오류', err.response?.data?.message ?? err.message);
    } finally {
      setSavingId(null);
    }
  };

  const confirmSheet = async () => {
    if (!activeSheet || !user) return;
    const id = activeSheet.id;
    const val = sheetValue.trim();

    setSavingId(id);

    if (val) {
      try {
        await api.post('/logs/entry', {
          logTypeId: id,
          date: selectedDate,
          value: val,
        });

        setValues((prev) => ({ ...prev, [id]: val }));
        setSavedIds((prev) => new Set(prev).add(id));
      } catch (err: any) {
        setSavingId(null);
        return Alert.alert('저장 실패', err.response?.data?.message ?? err.message);
      }
    } else {
      try {
        const { data: entries } = await api.get(`/logs/date/${selectedDate}`);
        const entry = entries?.find((e: any) => e.log_type_id === id);
        if (entry) {
          await api.delete(`/logs/${entry.id}`);
        }
      } catch {}

      setValues((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    setSavingId(null);
    setActiveSheet(null);

    if (val) {
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 2000);
    }
  };

  const getIconComponent = (lt: LogType) => ICON_MAP[lt.name] ?? IconPin;
  const getCategoryColor = (lt: LogType) => CATEGORY_COLORS[lt.category] ?? colors.textSecondary;

  const getDisplayValue = (lt: LogType) => {
    const val = values[lt.id];
    if (!val) return null;
    return lt.unit ? `${val} ${lt.unit}` : val;
  };

  const recordedCount = Object.keys(values).length;
  const totalCount = logTypes.length;

  // 관계 타입은 Masonry에서 제외, 별도 렌더링
  const normalTypes = logTypes.filter((lt) => lt.name !== '관계');
  const intimateType = logTypes.find((lt) => lt.name === '관계');

  // Masonry: 홀수/짝수 인덱스로 좌/우 컬럼 분리
  const leftColumn = normalTypes.filter((_, i) => i % 2 === 0);
  const rightColumn = normalTypes.filter((_, i) => i % 2 === 1);

  const renderCard = (lt: LogType) => {
    const val = getDisplayValue(lt);
    const hasValue = !!val;
    const justSaved = savedIds.has(lt.id);
    const catColor = getCategoryColor(lt);
    const isMemo = lt.data_type === 'text' && lt.name.includes('메모');
    const IconComp = getIconComponent(lt);

    return (
      <TouchableOpacity
        key={lt.id}
        style={[
          s.masonryCard,
          hasValue && { borderColor: catColor, borderWidth: 1.5 },
          justSaved && { borderColor: colors.secondary, backgroundColor: colors.secondaryLight + '20' },
        ]}
        onPress={() => openSheet(lt)}
        activeOpacity={0.7}
      >
        {justSaved && <Text style={s.savedCheck}>✓</Text>}
        <View style={[s.iconCircle, { backgroundColor: catColor + '18' }]}>
          <IconComp size={22} color={catColor} />
        </View>
        <Text style={s.gridName} numberOfLines={1}>{lt.name}</Text>
        {hasValue ? (
          <Text
            style={[s.gridValue, { color: catColor }]}
            numberOfLines={isMemo ? 2 : 1}
          >
            {val}
          </Text>
        ) : (
          <Text style={s.gridEmpty}>탭하여 기록</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderIntimateCard = () => {
    if (!intimateType) return null;
    const currentVal = values[intimateType.id];
    const justSaved = savedIds.has(intimateType.id);
    const isSaving = savingId === intimateType.id;

    return (
      <Card style={[
        s.intimateCard,
        justSaved && { borderColor: colors.secondary, borderWidth: 1.5 },
      ]}>
        {justSaved && <Text style={s.savedCheck}>✓</Text>}
        <Text style={s.intimateTitle}>관계</Text>
        <View style={s.heartRow}>
          <TouchableOpacity
            style={s.heartItem}
            onPress={() => handleIntimateToggle(intimateType, '아기를 기다려요')}
            disabled={isSaving}
            activeOpacity={0.6}
          >
            <View style={[
              s.heartCircle,
              currentVal === '아기를 기다려요' && { backgroundColor: colors.primaryLight },
            ]}>
              {currentVal === '아기를 기다려요'
                ? <IconHeartFill size={28} color={colors.primary} />
                : <IconBaby size={28} color={colors.textTertiary} />
              }
            </View>
            <Text style={[
              s.heartLabel,
              currentVal === '아기를 기다려요' && { color: colors.primary, fontWeight: '600' },
            ]}>
              아기를{'\n'}기다려요
            </Text>
          </TouchableOpacity>

          <View style={s.heartDivider} />

          <TouchableOpacity
            style={s.heartItem}
            onPress={() => handleIntimateToggle(intimateType, '피임 했어요')}
            disabled={isSaving}
            activeOpacity={0.6}
          >
            <View style={[
              s.heartCircle,
              currentVal === '피임 했어요' && { backgroundColor: colors.softBlueLight },
            ]}>
              {currentVal === '피임 했어요'
                ? <IconHeartFill size={28} color={colors.softBlue} />
                : <IconShield size={28} color={colors.textTertiary} />
              }
            </View>
            <Text style={[
              s.heartLabel,
              currentVal === '피임 했어요' && { color: colors.softBlue, fontWeight: '600' },
            ]}>
              피임{'\n'}했어요
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderSheetContent = () => {
    if (!activeSheet) return null;

    if (activeSheet.data_type === 'select' && activeSheet.options) {
      const opts = typeof activeSheet.options === 'string'
        ? JSON.parse(activeSheet.options)
        : activeSheet.options;
      return (
        <View style={s.sheetOptions}>
          {opts.map((opt: string) => (
            <TouchableOpacity
              key={opt}
              style={[s.sheetOptionBtn, sheetValue === opt && s.sheetOptionActive]}
              onPress={() => setSheetValue(opt)}
            >
              <Text style={[s.sheetOptionText, sheetValue === opt && s.sheetOptionTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (activeSheet.data_type === 'boolean') {
      return (
        <View style={s.sheetOptions}>
          {['예', '아니오'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[s.sheetOptionBtn, sheetValue === opt && s.sheetOptionActive]}
              onPress={() => setSheetValue(opt)}
            >
              <Text style={[s.sheetOptionText, sheetValue === opt && s.sheetOptionTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    const isMultiline = activeSheet.data_type === 'text' && activeSheet.name.includes('메모');

    return (
      <TextInput
        style={[s.sheetInput, isMultiline && s.sheetInputMultiline]}
        placeholder={`${activeSheet.name} 입력${activeSheet.unit ? ` (${activeSheet.unit})` : ''}`}
        placeholderTextColor={colors.textTertiary}
        value={sheetValue}
        onChangeText={setSheetValue}
        keyboardType={activeSheet.data_type === 'number' ? 'numeric' : 'default'}
        multiline={isMultiline}
        autoFocus
      />
    );
  };

  // BottomSheet 타이틀에 아이콘 이름 표시
  const getSheetTitle = () => {
    if (!activeSheet) return '';
    return activeSheet.name;
  };

  return (
    <SafeScreen>
      <ScreenHeader
        title={isToday ? '오늘의 기록' : '과거 기록'}
        rightElement={
          <Badge
            text={`${recordedCount}/${totalCount}`}
            variant={recordedCount > 0 ? 'recorded' : 'empty'}
          />
        }
      >
        {/* 날짜 네비게이션 */}
        <View style={s.dateNav}>
          <TouchableOpacity onPress={goToPrev} style={s.dateArrow}>
            <Text style={s.dateArrowText}>◀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToToday}>
            <Text style={[s.dateLabel, isToday && s.dateLabelToday]}>
              {formatDateLabel(selectedDate)}
              {isToday && '  · 오늘'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNext} style={s.dateArrow} disabled={isTomorrow}>
            <Text style={[s.dateArrowText, isTomorrow && s.dateArrowDisabled]}>▶</Text>
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      <ScrollView style={s.scrollBody} showsVerticalScrollIndicator={false}>
        {/* 생리 토글 */}
        <Card>
          <Toggle
            label="생리 중"
            icon="🔴"
            value={isOnPeriod}
            onValueChange={handlePeriodToggle}
            activeColor={colors.period}
          />
        </Card>

        {/* 관계 하트 카드 */}
        {renderIntimateCard()}

        {/* Masonry 2-column Grid */}
        <View style={s.masonry}>
          <View style={s.masonryColumn}>
            {leftColumn.map(renderCard)}
          </View>
          <View style={s.masonryColumn}>
            {rightColumn.map(renderCard)}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 바텀시트 */}
      <BottomSheet
        visible={!!activeSheet}
        onClose={() => setActiveSheet(null)}
        title={getSheetTitle()}
      >
        {renderSheetContent()}
        <View style={s.sheetActions}>
          <TouchableOpacity style={s.sheetClearBtn} onPress={() => setSheetValue('')}>
            <Text style={s.sheetClearText}>초기화</Text>
          </TouchableOpacity>
          <Button
            title={savingId ? '저장 중...' : '저장'}
            onPress={confirmSheet}
            disabled={!!savingId}
            style={{ flex: 1 }}
          />
        </View>
      </BottomSheet>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
  scrollBody: {
    flex: 1,
  },

  // 날짜 네비게이션
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  dateArrow: {
    padding: spacing.sm,
  },
  dateArrowText: {
    fontSize: 18,
    color: colors.primary,
  },
  dateArrowDisabled: {
    color: colors.border,
  },
  dateLabel: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
  dateLabelToday: {
    color: colors.primary,
    fontWeight: 'bold',
  },

  // 관계 하트 카드
  intimateCard: {
    overflow: 'hidden',
  },
  intimateTitle: {
    ...typography.label,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heartRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: spacing.xxxl,
  },
  heartItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  heartCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  heartDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },

  // Masonry Grid
  masonry: {
    flexDirection: 'row',
    paddingHorizontal: layout.screenPaddingH,
    gap: layout.gridGap,
  },
  masonryColumn: {
    flex: 1,
    gap: layout.gridGap,
  },
  masonryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  savedCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  gridValue: {
    ...typography.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridEmpty: {
    ...typography.caption,
    color: colors.textTertiary,
  },

  // BottomSheet content
  sheetInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 18,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  sheetInputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  sheetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sheetOptionBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sheetOptionText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  sheetOptionTextActive: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  sheetClearBtn: {
    padding: spacing.md,
  },
  sheetClearText: {
    ...typography.body2,
    color: colors.textTertiary,
  },
});
