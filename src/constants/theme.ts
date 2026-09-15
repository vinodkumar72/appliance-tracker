/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#101828',
    background: '#F6F7F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EEF1F5',
    textSecondary: '#5D6673',
    tint: '#2F6FED',
    onTint: '#ffffff',
    tintSoft: '#E9EFFC',
    danger: '#D64545',
    warning: '#B7791F',
    success: '#2F855A',
    border: '#E5E8ED',
  },
  dark: {
    text: '#F2F4F7',
    background: '#0E1116',
    backgroundElement: '#171C24',
    backgroundSelected: '#232A36',
    textSecondary: '#98A2B3',
    tint: '#6B96FF',
    onTint: '#0B1220',
    tintSoft: '#1B2A47',
    danger: '#F97066',
    warning: '#F0B34E',
    success: '#5FD3A2',
    border: '#28303D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
