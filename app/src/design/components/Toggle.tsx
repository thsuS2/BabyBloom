import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors } from '../colors';
import { typography } from '../typography';
import { radius } from '../spacing';

interface ToggleProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: string;
  activeColor?: string;
}

export function Toggle({ label, value, onValueChange, icon, activeColor = colors.primary }: ToggleProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{icon ? `${icon} ` : ''}{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.disabled, true: `${activeColor}40` }}
        thumbColor={value ? activeColor : colors.surfaceSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.subtitle1,
    color: colors.textPrimary,
  },
});
