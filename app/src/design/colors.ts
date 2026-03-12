/**
 * BabyBloom 컬러 팔레트
 * 모든 색상은 여기서만 정의하고, 컴포넌트에서는 이 이름으로만 사용
 */

export const colors = {
  // ── Primary (핑크 계열) ──
  primary: '#E91E63',
  primaryLight: '#FCE4EC',
  primaryDark: '#C2185B',
  primarySurface: '#FFF5F5',

  // ── Secondary (민트 그린) ──
  secondary: '#69C9A2',
  secondaryLight: '#B2DFDB',
  secondaryDark: '#3DA87A',

  // ── Accent: 소프트 코랄 ──
  coral: '#FF8A80',
  coralLight: '#FFD0CC',

  // ── Accent: 로즈 골드 ──
  roseGold: '#D4A0A0',
  roseGoldLight: '#F0D4D4',

  // ── Accent: 소프트 블루 ──
  softBlue: '#81B4D8',
  softBlueLight: '#C8E0F0',

  // ── Background & Surface ──
  background: '#FFF5F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#FAFAFA',

  // ── Text ──
  textPrimary: '#1A1A2E',
  textSecondary: '#8E8E9A',
  textTertiary: '#BBBBCC',
  textOnPrimary: '#FFFFFF',

  // ── Status ──
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',

  // ── Border & Divider ──
  border: '#F0E0E0',
  divider: '#F5F5F5',

  // ── Period (생리 관련) ──
  period: '#E91E63',
  periodLight: '#FFCDD2',
  periodDark: '#C62828',

  // ── Misc ──
  disabled: '#E0E0E0',
  overlay: 'rgba(0, 0, 0, 0.4)',
  transparent: 'transparent',
} as const;

export type ColorName = keyof typeof colors;
