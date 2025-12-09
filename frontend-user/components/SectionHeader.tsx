import type React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface SectionHeaderProps {
  title: string;
  showAction?: boolean;
  actionText?: string;
  onActionPress?: () => void;
  count?: number; // new
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  showAction = true,
  actionText = "View All",
  onActionPress,
  count, // new
}) => {
    const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.titleRow}>
        <Text style={dynamicStyles.title}>{title}</Text>
        {typeof count === "number" && (
          <View style={dynamicStyles.countPill}>
            <Text style={dynamicStyles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {showAction && (
        <TouchableOpacity
          style={dynamicStyles.actionButton}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} for ${title}`}
        >
          <Text style={dynamicStyles.actionText}>{actionText}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginRight: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countPill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: `${colors.textSecondary}15`,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});

}
export default SectionHeader;