// colors.ts
import { useColorScheme } from "react-native";

export type Theme = "forest" | "retro" | "ocean" | "blossom";

export interface ColorScheme {
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textDark: string;
  placeholderText: string;
  background: string;
  cardBackground: string;
  inputBackground: string;
  border: string;
  white: string;
  black: string;
}

// LIGHT THEMES
const LIGHT_THEMES: Record<Theme, ColorScheme> = {
  forest: {
    primary: "#4CAF50",
    textPrimary: "#2e5a2e",
    textSecondary: "#688f68",
    textDark: "#1b361b",
    placeholderText: "#767676",
    background: "#e8f5e9",
    cardBackground: "#f1f8f2",
    inputBackground: "#f4faf5",
    border: "#c8e6c9",
    white: "#ffffff",
    black: "#000000",
  },
  retro: {
    primary: "#e17055",
    textPrimary: "#784e2d",
    textSecondary: "#a58e7c",
    textDark: "#50372a",
    placeholderText: "#767676",
    background: "#ede1d1",
    cardBackground: "#faf5eb",
    inputBackground: "#f7f2ea",
    border: "#e2d6c1",
    white: "#ffffff",
    black: "#000000",
  },
  ocean: {
    primary: "#1976D2",
    textPrimary: "#1a4971",
    textSecondary: "#6d93b8",
    textDark: "#0d2b43",
    placeholderText: "#767676",
    background: "#e3f2fd",
    cardBackground: "#f5f9ff",
    inputBackground: "#f0f8ff",
    border: "#bbdefb",
    white: "#ffffff",
    black: "#000000",
  },
  blossom: {
    primary: "#EC407A",
    textPrimary: "#7d2150",
    textSecondary: "#b06a8f",
    textDark: "#5a1836",
    placeholderText: "#767676",
    background: "#fce4ec",
    cardBackground: "#fff5f8",
    inputBackground: "#fef8fa",
    border: "#f8bbd0",
    white: "#ffffff",
    black: "#000000",
  },
};

// DARK THEMES
const DARK_THEMES: Record<Theme, ColorScheme> = {
  forest: {
    primary: "#66BB6A",
    textPrimary: "#A8D5A8",
    textSecondary: "#81C784",
    textDark: "#E8F5E9",
    placeholderText: "#999999",
    background: "#0D2E0D",
    cardBackground: "#1B4620",
    inputBackground: "#1E5A1E",
    border: "#2E6E2E",
    white: "#ffffff",
    black: "#000000",
  },
  retro: {
    primary: "#FF8A65",
    textPrimary: "#FFCCCC",
    textSecondary: "#D7A495",
    textDark: "#FFE8DB",
    placeholderText: "#999999",
    background: "#3E2723",
    cardBackground: "#4E342E",
    inputBackground: "#5D4037",
    border: "#6D4C41",
    white: "#ffffff",
    black: "#000000",
  },
  ocean: {
    primary: "#42A5F5",
    textPrimary: "#B3E5FC",
    textSecondary: "#81D4FA",
    textDark: "#E1F5FE",
    placeholderText: "#999999",
    background: "#0D1B2A",
    cardBackground: "#1A2F4A",
    inputBackground: "#234070",
    border: "#2C5282",
    white: "#ffffff",
    black: "#000000",
  },
  blossom: {
    primary: "#EC407A",
    textPrimary: "#F8BBD0",
    textSecondary: "#F48FB1",
    textDark: "#FCE4EC",
    placeholderText: "#999999",
    background: "#3E1F2F",
    cardBackground: "#5A2F42",
    inputBackground: "#6B3A52",
    border: "#7B4463",
    white: "#ffffff",
    black: "#000000",
  },
};

export const getColors = (
  isDarkMode: boolean,
  theme: Theme
): ColorScheme => {
  return isDarkMode ? DARK_THEMES[theme] : LIGHT_THEMES[theme];
};

// Default colors for backward compatibility
const COLORS = LIGHT_THEMES.forest;
export default COLORS;