import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../colors';

interface SafeScreenProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle;
}

/**
 * 모든 화면의 최외곽 래퍼.
 * - 상단 status bar, 하단 navigation bar 자동 대응
 * - 탭 내 화면: edges={['top']}  (하단은 탭바가 처리)
 * - 탭 외 화면: edges={['top', 'bottom']}
 */
export function SafeScreen({ children, edges = ['top'], style }: SafeScreenProps) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
