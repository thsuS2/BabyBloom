/**
 * BabyBloom 타이포그래피
 * 폰트 스타일은 여기서만 정의하고, 컴포넌트에서는 이 이름으로만 사용
 */

import { TextStyle } from 'react-native';

export const typography = {
  // ── Heading ──
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
    letterSpacing: -0.3,
  } as TextStyle,

  h3: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  } as TextStyle,

  // ── Subtitle ──
  subtitle1: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  subtitle2: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,

  // ── Body ──
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } as TextStyle,

  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,

  // ── Caption & Label ──
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  } as TextStyle,

  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  } as TextStyle,

  // ── Button ──
  buttonLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  } as TextStyle,

  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  } as TextStyle,

  // ── Special ──
  number: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
  } as TextStyle,

  numberSmall: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  } as TextStyle,

  code: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    letterSpacing: 4,
  } as TextStyle,
} as const;

export type TypographyName = keyof typeof typography;
