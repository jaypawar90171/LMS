import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { getColors, Theme, ColorScheme } from "@/constants/color";

interface ThemeContextType {
  isDarkMode: boolean;
  currentTheme: Theme;
  colors: ColorScheme;
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(
    systemColorScheme === "dark"
  );
  const [currentTheme, setCurrentTheme] = useState<Theme>("forest");
  const [isLoading, setIsLoading] = useState(true);

  // Load saved preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedDarkMode = await AsyncStorage.getItem("@theme_dark_mode");
        const savedTheme = await AsyncStorage.getItem("@theme_name");

        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === "true");
        }
        if (savedTheme) {
          setCurrentTheme(savedTheme as Theme);
        }
      } catch (error) {
        console.error("Error loading theme preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      await AsyncStorage.setItem(
        "@theme_dark_mode",
        newDarkMode.toString()
      );
    } catch (error) {
      console.error("Error saving dark mode preference:", error);
    }
  };

  const setTheme = async (theme: Theme) => {
    try {
      setCurrentTheme(theme);
      await AsyncStorage.setItem("@theme_name", theme);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const colors = getColors(isDarkMode, currentTheme);

  const value: ThemeContextType = {
    isDarkMode,
    currentTheme,
    colors,
    toggleDarkMode,
    setTheme,
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};