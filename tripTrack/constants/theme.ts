/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    // --- BASIC ---
    text: '#11181C',
    background: '#fff',          // Standard white background
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,

    // --- UI STRUCTURE ---
    screenBackground: '#F2F2F7', // Slightly darker (iOS Settings Gray) for grouped views
    cardBackground: '#FFFFFF',   // Cards start white on light mode
    separator: '#F0F0F0',        // Divider lines
    
    // --- INPUTS & FORMS ---
    primary: '#00C853',          // Your Transit Green
    inputBackground: '#f5f5f5',
    inputBorder: '#eeeeee',
    placeholder: '#687076',

    // --- STATUS ---
    error: '#FF3B30',            // Red (Logout / Errors)
    warning: '#FFD700',          // Gold (Star icon)
    success: '#00C853',
    
    // --- SPECIFIC ---
    guestCardBackground: '#333333', // Guest card is always dark
    inverseText: '#FFFFFF',         // Text on top of primary buttons/guest cards
  },
  dark: {
    // --- BASIC ---
    text: '#ECEDEE',
    background: '#151718',       // Standard dark background
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,

    // --- UI STRUCTURE ---
    screenBackground: '#000000', // Deep black for OLED screens
    cardBackground: '#1C1C1E',   // Slightly lighter dark for cards
    separator: '#2C2C2E',        // Darker dividers
    
    // --- INPUTS & FORMS ---
    primary: '#00C853',          // Keep brand color consistent
    inputBackground: '#2C2C2E',  // Darker gray for inputs
    inputBorder: '#3A3A3C',
    placeholder: '#555555',

    // --- STATUS ---
    error: '#FF453A',            // Slightly lighter red for dark mode visibility
    warning: '#FFD700',          // Gold
    success: '#00C853',

    // --- SPECIFIC ---
    guestCardBackground: '#2C2C2E', 
    inverseText: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});