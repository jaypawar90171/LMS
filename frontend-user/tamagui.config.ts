// tamagui.config.ts
import { createAnimations } from "@tamagui/animations-react-native";
import { createTamagui, createFont } from "tamagui";
import { themes, tokens } from "@tamagui/themes";

// Simple animations configuration
const animations = createAnimations({
  fast: {
    type: "spring",
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: "spring",
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  slow: {
    type: "spring",
    damping: 20,
    stiffness: 60,
  },
});

// Font configuration
const headingFont = createFont({
  family: "System",
  size: {
    1: 12,
    2: 14,
    3: 15,
  },
  lineHeight: {
    1: 12,
    2: 14,
    3: 15,
  },
  weight: {
    4: "300",
    6: "600",
  },
});

const bodyFont = createFont({
  family: "System",
  size: {
    1: 13,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
  },
  lineHeight: {
    1: 13,
    2: 14,
    3: 15,
    4: 16,
    5: 18,
  },
  weight: {
    4: "300",
    6: "600",
  },
});

// Main configuration
const config = createTamagui({
  animations,
  defaultTheme: "light",
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes,
  tokens,
  media: {
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
  },
});

export type AppConfig = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
