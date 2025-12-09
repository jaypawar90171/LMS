import React from "react";
import {
  View,
  Switch,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { Theme } from "@/constants/color";

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode, currentTheme, setTheme, colors } =
    useTheme();
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);

  const themes: Theme[] = ["forest", "retro", "ocean", "blossom"];

  const getThemeLabel = (theme: Theme): string => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
    >
      {/* Dark Mode Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.labelContainer}>
          <Ionicons
            name={isDarkMode ? "moon" : "sunny"}
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.label, { color: colors.textPrimary }]}>
            {isDarkMode ? "Dark Mode" : "Light Mode"}
          </Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.white}
        />
      </View>

      {/* Theme Selector */}
      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setShowThemeSelector(true)}
      >
        <View style={styles.labelContainer}>
          <Ionicons name="filter" size={20} color={colors.primary} />
          <View>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              Theme
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {getThemeLabel(currentTheme)}
            </Text>
          </View>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={[styles.modalHeader, { borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select Theme
              </Text>
              <Pressable onPress={() => setShowThemeSelector(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </Pressable>
            </View>

            <ScrollView style={styles.themeGrid}>
              {themes.map((theme) => (
                <Pressable
                  key={theme}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor:
                        currentTheme === theme ? colors.primary : colors.border,
                      borderWidth: currentTheme === theme ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    setTheme(theme);
                    setShowThemeSelector(false);
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={
                      currentTheme === theme ? colors.primary : colors.border
                    }
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {getThemeLabel(theme)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  themeGrid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderRadius: 12,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ThemeToggle;
