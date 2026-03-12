import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, layout } from '../design';
import { Card } from '../design/components';

export default function CommunityScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>커뮤니티</Text>
      </View>

      <Card>
        <Text style={s.emoji}>💬</Text>
        <Text style={s.comingSoon}>곧 만나요!</Text>
        <Text style={s.desc}>QnA, 나의 꿀팁, 수다방 등{'\n'}다양한 커뮤니티가 준비 중이에요</Text>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xxl,
    paddingTop: layout.screenPaddingTop,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  emoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  comingSoon: {
    ...typography.h3,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  desc: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
