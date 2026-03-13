import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../colors';
import { typography } from '../typography';
import { spacing } from '../spacing';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  onBack,
  rightIcon,
  onRightPress,
  rightElement,
  children,
  style,
}: ScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <Text style={styles.title} numberOfLines={1}>{title}</Text>

        {rightElement ? (
          rightElement
        ) : rightIcon && onRightPress ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.rightIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 22,
    color: colors.primary,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  rightBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightIcon: {
    fontSize: 22,
  },
  placeholder: {
    width: 36,
  },
});
