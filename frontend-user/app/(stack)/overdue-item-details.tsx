import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { itemService } from "@/services";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface OverdueItemDetails {
  _id: string;
  title: string;
  authorOrCreator?: string;
  description?: string;
  mediaUrl?: string;
  status: string;
  categoryId?: {
    _id: string;
    name: string;
    description?: string;
  };
  availableCopies?: number;
  quantity?: number;
  isbnOrIdentifier?: string;
  publisherOrManufacturer?: string;
  price?: {
    $numberDecimal: string;
  };
  barcode?: string;
  defaultReturnPeriod?: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  daysOverdue?: number;
  fineAmount?: number;
}

export default function OverdueItemDetailsScreen() {
  const { itemId, itemData } = useLocalSearchParams();
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [itemDetails, setItemDetails] = useState<OverdueItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    if (!token || !itemId) {
      setLoading(false);
      return;
    }

    try {
      const response = await itemService.getItemDetails(itemId as string);

      if (response.data.success) {
        setItemDetails(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch overdue item details:", error);
      Alert.alert("Error", "Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  const calculateFineAmount = (daysOverdue: number): number => {
    return daysOverdue * 5; // $5 per day
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (!itemDetails) {
    return (
      <View style={dynamicStyles.errorContainer}>
        <Text>Failed to load item details</Text>
      </View>
    );
  }

  
  const overdueData = itemData ? JSON.parse(itemData as string) : {};
  const daysOverdue = overdueData.daysOverdue || 0;
  const fineAmount = overdueData.fineAmount || calculateFineAmount(daysOverdue);

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      {/* Item Image */}
      {itemDetails.mediaUrl && (
        <Image
          source={{ uri: itemDetails.mediaUrl }}
          style={dynamicStyles.image}
          resizeMode="cover"
        />
      )}

      {/* Overdue Warning Banner */}
      <View style={dynamicStyles.overdueBanner}>
        <Ionicons name="warning" size={24} color="#FFF" />
        <View style={dynamicStyles.bannerText}>
          <Text style={dynamicStyles.bannerTitle}>Item Overdue</Text>
          <Text style={dynamicStyles.bannerSubtitle}>
            {daysOverdue} days overdue - Fine: ${fineAmount}
          </Text>
        </View>
      </View>

      {/* Item Details Card */}
      <View style={dynamicStyles.detailsCard}>
        <Text style={dynamicStyles.title}>{itemDetails.title}</Text>

        {itemDetails.authorOrCreator && (
          <Text style={dynamicStyles.subtitle}>By {itemDetails.authorOrCreator}</Text>
        )}

        {/* Status Badge */}
        <View style={dynamicStyles.statusRow}>
          <View style={[dynamicStyles.statusBadge, { backgroundColor: "#FF3B3015" }]}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={[dynamicStyles.statusText, { color: "#FF3B30" }]}>
              Overdue
            </Text>
          </View>
        </View>

        {/* Description */}
        {itemDetails.description && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Description</Text>
            <Text style={dynamicStyles.sectionContent}>{itemDetails.description}</Text>
          </View>
        )}

        {/* Category */}
        {itemDetails.categoryId && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Category</Text>
            <Text style={dynamicStyles.sectionContent}>
              {itemDetails.categoryId.name}
            </Text>
          </View>
        )}

        {/* Overdue Details */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Overdue Information</Text>
          <View style={dynamicStyles.overdueGrid}>
            <View style={dynamicStyles.overdueItem}>
              <Ionicons name="calendar-outline" size={16} color="#FF3B30" />
              <Text style={dynamicStyles.overdueLabel}>Days Overdue</Text>
              <Text style={dynamicStyles.overdueValue}>{daysOverdue} days</Text>
            </View>
            <View style={dynamicStyles.overdueItem}>
              <Ionicons name="cash-outline" size={16} color="#FF3B30" />
              <Text style={dynamicStyles.overdueLabel}>Current Fine</Text>
              <Text style={dynamicStyles.overdueValue}>${fineAmount}</Text>
            </View>
          </View>
        </View>

        {/* Item Information */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Item Information</Text>
          {itemDetails.isbnOrIdentifier && (
            <Text style={dynamicStyles.sectionContent}>
              ISBN: {itemDetails.isbnOrIdentifier}
            </Text>
          )}
          {itemDetails.publisherOrManufacturer && (
            <Text style={dynamicStyles.sectionContent}>
              Publisher: {itemDetails.publisherOrManufacturer}
            </Text>
          )}
          {itemDetails.availableCopies !== undefined && (
            <Text style={dynamicStyles.sectionContent}>
              Available: {itemDetails.availableCopies} of {itemDetails.quantity} copies
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      {/* <View style={dynamicStyles.actionsContainer}>
        <TouchableOpacity
          style={[dynamicStyles.actionButton, dynamicStyles.primaryButton]}
          onPress={handleReturnItem}
        >
          <Ionicons name="return-up-back-outline" size={20} color="#FFF" />
          <Text style={dynamicStyles.actionButtonText}>Return Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynamicStyles.actionButton, dynamicStyles.secondaryButton]}
          onPress={() => Alert.alert("Pay Fine", "Fine payment functionality")}
        >
          <Ionicons name="card-outline" size={20} color={colors.primary} />
          <Text style={[dynamicStyles.actionButtonText, { color: colors.primary }]}>
            Pay Fine
          </Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  image: {
    width: "100%",
    height: 250,
  },
  overdueBanner: {
    backgroundColor: "#FF3B30",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
  },
  detailsCard: {
    backgroundColor: colors.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  statusRow: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  overdueGrid: {
    flexDirection: "row",
    gap: 16,
  },
  overdueItem: {
    flex: 1,
    backgroundColor: "#FF3B3010",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  overdueLabel: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
    marginBottom: 2,
  },
  overdueValue: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
  actionsContainer: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
}