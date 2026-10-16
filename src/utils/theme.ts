/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorTokens {
  background: string;
  surface: string;
  input: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  onAccent: string;
  selectedSoft: string;
  separator: string;
  warning: string;
  error: string;
}

export const TOKENS = {
  light: {
    background: '#F6F7F3',
    surface: '#FFFFFF',
    input: '#F0F3EF',
    textPrimary: '#24332F',
    textSecondary: '#5B6A63',
    accent: '#2F665E',
    onAccent: '#FFFFFF',
    selectedSoft: '#E7EFEB',
    separator: '#DEE4DE',
    warning: '#8A591E',
    error: '#9F2E2B',
  },
  dark: {
    background: '#141D1B',
    surface: '#1D2A26',
    input: '#26362F',
    textPrimary: '#EDF2EE',
    textSecondary: '#B0BEB5',
    accent: '#9CC8BA',
    onAccent: '#17382F',
    selectedSoft: '#2B4036',
    separator: '#3A4B43',
    warning: '#D69E2E',
    error: '#E57373',
  },
} as const;

export const getThemeTokens = (isDarkMode: boolean): ColorTokens => {
  return isDarkMode ? TOKENS.dark : TOKENS.light;
};
