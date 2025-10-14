import type React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";

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
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Open details for ${title}`}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {/* Item Image */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons
              name="book-outline"
              size={32}
              color={COLORS.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Item Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {/* Status badge just below title when available */}
        {!!status && (
          <View
            style={[
              styles.statusChip,
              !!statusColor && {
                backgroundColor: `${statusColor}22`,
                borderColor: statusColor,
              },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                !!statusColor && { color: statusColor },
              ]}
              numberOfLines={1}
            >
              {status}
            </Text>
          </View>
        )}

        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {/* Status/Due Info */}
        <View style={styles.infoContainer}>
          {dueInfo && (
            <View
              style={[styles.statusBadge, showOverdue && styles.overdueBadge]}
            >
              <Text
                style={[styles.statusText, showOverdue && styles.overdueText]}
              >
                {dueInfo}
              </Text>
            </View>
          )}

          {positionInfo && (
            <View style={styles.positionBadge}>
              <Text style={styles.positionText}>{positionInfo}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 60,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 60,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  overdueBadge: {
    backgroundColor: "#FFE6E6",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  overdueText: {
    color: "#FF3B30",
  },
  positionBadge: {
    backgroundColor: `${COLORS.textSecondary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  statusChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

export default ItemCard;
