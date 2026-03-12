/**
 * BabyBloom 그림자 스타일
 * 2026 트렌드: 소프트하고 확산된 그림자 (floating card 느낌)
 */

import { ViewStyle } from 'react-native';

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  } as ViewStyle,

  cardHover: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  } as ViewStyle,

  bottomSheet: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  } as ViewStyle,

  subtle: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  } as ViewStyle,
} as const;
