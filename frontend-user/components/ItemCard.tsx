import type React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface ItemCardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  status?: string;
  statusColor?: string;
  dueInfo?: string;
  positionInfo?: string;
  onPress?: () => void;
  showOverdue?: boolean;
  showAction?: boolean;
  actionText?: string;
  actionColor?: string;
  onActionPress?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  title,
  subtitle,
  imageUrl,
  status,
  statusColor,
  dueInfo,
  positionInfo,
  onPress,
  showOverdue = false,
}) => {
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  
  return (
    <TouchableOpacity
      style={dynamicStyles.container}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${title}`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Image Container */}
      <View style={dynamicStyles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={dynamicStyles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={dynamicStyles.placeholderImage}>
            <Ionicons
              name="book-outline"
              size={48}
              color={colors.textSecondary}
            />
          </View>
        )}

        {/* Status Badge - Positioned on image */}
        {status && (
          <View
            style={[
              dynamicStyles.statusBadgeOverlay,
              statusColor && { backgroundColor: statusColor },
            ]}
          >
            <Text style={dynamicStyles.statusBadgeText} numberOfLines={1}>
              {status}
            </Text>
          </View>
        )}

        {/* Overdue Indicator */}
        {showOverdue && (
          <View style={dynamicStyles.overdueIndicator}>
            <Ionicons name="alert-circle" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Content Container */}
      <View style={dynamicStyles.contentContainer}>
        {/* Title */}
        <Text style={dynamicStyles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Subtitle/Author */}
        {subtitle && (
          <Text style={dynamicStyles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {/* Info Row */}
        <View style={dynamicStyles.infoRow}>
          {dueInfo && (
            <View
              style={[dynamicStyles.infoBadge, showOverdue && dynamicStyles.infoBadgeOverdue]}
            >
              <Ionicons
                name={showOverdue ? "alert-circle" : "calendar"}
                size={14}
                color={showOverdue ? "#FF3B30" : colors.primary}
              />
              <Text
                style={[
                  dynamicStyles.infoBadgeText,
                  showOverdue && dynamicStyles.infoBadgeTextOverdue,
                ]}
                numberOfLines={1}
              >
                {dueInfo}
              </Text>
            </View>
          )}

          {positionInfo && (
            <View style={dynamicStyles.infoBadge}>
              <Ionicons name="time" size={14} color={colors.primary} />
              <Text style={dynamicStyles.infoBadgeText} numberOfLines={1}>
                {positionInfo}
              </Text>
            </View>
          )}
        </View>

        {/* Action Indicator */}
        <View style={dynamicStyles.actionIndicator}>
          <Text style={dynamicStyles.actionText}>Tap to view details</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: colors.inputBackground,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadgeOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  overdueIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FF3B30",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  contentContainer: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  infoBadgeOverdue: {
    backgroundColor: "#FFE6E6",
    borderColor: "#FF3B30",
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  infoBadgeTextOverdue: {
    color: "#FF3B30",
  },
  actionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
});

}
export default ItemCard;
