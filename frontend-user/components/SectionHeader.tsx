import type React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";

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
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {typeof count === "number" && (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {showAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionText} for ${title}`}
        >
          <Text style={styles.actionText}>{actionText}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: COLORS.textPrimary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
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
    backgroundColor: `${COLORS.textSecondary}15`,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
});

export default SectionHeader;
