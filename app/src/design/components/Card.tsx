import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../colors';
import { radius, layout } from '../spacing';
import { shadows } from '../shadows';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'subtle';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return (
    <View style={[styles.card, variant === 'subtle' && styles.subtle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: layout.screenPaddingH,
    marginBottom: layout.cardMarginBottom,
    borderRadius: radius.lg,
    padding: layout.cardPadding,
    ...shadows.card,
  },
  subtle: {
    ...shadows.subtle,
  },
});
