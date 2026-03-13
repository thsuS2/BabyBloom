import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../design';
import { Card, SafeScreen, ScreenHeader } from '../design/components';

export default function CommunityScreen() {
  return (
    <SafeScreen>
      <ScreenHeader title="커뮤니티" />
      <Card>
        <Text style={s.emoji}>💬</Text>
        <Text style={s.comingSoon}>곧 만나요!</Text>
        <Text style={s.desc}>QnA, 나의 꿀팁, 수다방 등{'\n'}다양한 커뮤니티가 준비 중이에요</Text>
      </Card>
    </SafeScreen>
  );
}

const s = StyleSheet.create({
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
