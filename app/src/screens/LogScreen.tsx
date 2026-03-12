import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius, layout, shadows } from '../design';
import { Card, Button, Badge, BottomSheet, Toggle } from '../design/components';

interface LogType {
  id: string;
  name: string;
  category: string;
  unit: string | null;
  data_type: string;
  options: string[] | null;
}

const LOG_ICONS: Record<string, string> = {
  '컨디션': '😊',
  '체중': '⚖️',
  '수면시간': '😴',
  '기분': '🎭',
  '운동': '🏃',
  '운동시간': '⏱️',
  '영양제': '💊',
  '피임약': '💊',
  '메모': '📝',
  '관계': '💕',
  '임신시도': '🤰',
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
    const { data } = await supabase
      .from('log_types')
      .select('*')
      .order('display_order');
    setLogTypes(data ?? []);
  };

  const loadEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('log_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', selectedDate);

    if (data) {
      const existing: Record<string, string> = {};
      data.forEach((e: any) => { existing[e.log_type_id] = e.value; });
      setValues(existing);
    } else {
      setValues({});
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
        .insert({ user_id: user.id, cycle_start_date: selectedDate });
      if (error) return Alert.alert('오류', error.message);
      loadLatestCycle();
    } else if (latestCycle && !latestCycle.cycle_end_date) {
      const { error } = await supabase
        .from('cycle_logs')
        .update({ cycle_end_date: selectedDate })
        .eq('id', latestCycle.id);
      if (error) return Alert.alert('오류', error.message);
      loadLatestCycle();
    }
  };

  const openSheet = (lt: LogType) => {
    setActiveSheet(lt);
    setSheetValue(values[lt.id] ?? '');
  };

  const confirmSheet = async () => {
    if (!activeSheet || !user) return;
    const id = activeSheet.id;
    const val = sheetValue.trim();

    setSavingId(id);

    if (val) {
      // 값이 있으면 즉시 저장
      const { error } = await supabase
        .from('log_entries')
        .upsert(
          { user_id: user.id, log_type_id: id, date: selectedDate, value: val },
          { onConflict: 'user_id,log_type_id,date' },
        );

      if (error) {
        setSavingId(null);
        return Alert.alert('저장 실패', error.message);
      }

      setValues((prev) => ({ ...prev, [id]: val }));
      setSavedIds((prev) => new Set(prev).add(id));
    } else {
      // 값이 비면 삭제
      await supabase
        .from('log_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('log_type_id', id)
        .eq('date', selectedDate);

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

    // 저장 피드백: 2초 후 체크 표시 제거
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

  const getIcon = (lt: LogType) => LOG_ICONS[lt.name] ?? '📌';

  const getDisplayValue = (lt: LogType) => {
    const val = values[lt.id];
    if (!val) return null;
    return lt.unit ? `${val} ${lt.unit}` : val;
  };

  const recordedCount = Object.keys(values).length;
  const totalCount = logTypes.length;

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

  return (
    <ScrollView style={s.container}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>{isToday ? '오늘의 기록' : '과거 기록'}</Text>
        <Badge
          text={`${recordedCount}/${totalCount}`}
          variant={recordedCount > 0 ? 'recorded' : 'empty'}
        />
      </View>

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

      {/* 그리드 카드 */}
      <View style={s.grid}>
        {logTypes.map((lt) => {
          const val = getDisplayValue(lt);
          const hasValue = !!val;
          const justSaved = savedIds.has(lt.id);
          return (
            <TouchableOpacity
              key={lt.id}
              style={[s.gridCard, hasValue && s.gridCardRecorded, justSaved && s.gridCardJustSaved]}
              onPress={() => openSheet(lt)}
              activeOpacity={0.7}
            >
              {justSaved && <Text style={s.savedCheck}>✓</Text>}
              <Text style={s.gridIcon}>{getIcon(lt)}</Text>
              <Text style={s.gridName} numberOfLines={1}>{lt.name}</Text>
              {hasValue ? (
                <Text style={s.gridValue} numberOfLines={1}>{val}</Text>
              ) : (
                <Text style={s.gridEmpty}>미입력</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 40 }} />

      {/* 바텀시트 */}
      <BottomSheet
        visible={!!activeSheet}
        onClose={() => setActiveSheet(null)}
        title={activeSheet ? `${getIcon(activeSheet)} ${activeSheet.name}` : ''}
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
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: layout.screenPaddingTop,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
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

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: layout.screenPaddingH,
    gap: layout.gridGap,
  },
  gridCard: {
    width: '47%' as any,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  gridCardRecorded: {
    borderWidth: 1.5,
    borderColor: colors.secondaryLight,
  },
  gridCardJustSaved: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight + '20',
  },
  savedCheck: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  gridIcon: {
    fontSize: 28,
  },
  gridName: {
    ...typography.label,
    color: colors.textPrimary,
  },
  gridValue: {
    ...typography.body2,
    color: colors.secondary,
    fontWeight: '600',
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
