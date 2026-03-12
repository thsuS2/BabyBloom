import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../colors';
import { typography } from '../typography';
import { radius } from '../spacing';

interface BadgeProps {
  text: string;
  variant?: 'filled' | 'recorded' | 'empty';
}

export function Badge({ text, variant = 'filled' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles]]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start' as const,
  },
  filled: {
    backgroundColor: colors.primaryLight,
  },
  recorded: {
    backgroundColor: colors.secondaryLight,
  },
  empty: {
    backgroundColor: colors.surfaceSecondary,
  },
  text: {
    ...typography.caption,
  },
  filledText: {
    color: colors.primary,
  },
  recordedText: {
    color: colors.secondaryDark,
  },
  emptyText: {
    color: colors.textTertiary,
  },
});
