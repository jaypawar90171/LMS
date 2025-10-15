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
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

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

  useEffect(() => {
    fetchItemDetails();
  }, [itemId]);

  const fetchItemDetails = async () => {
    if (!token || !itemId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/inventory/categories/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

  const handleReturnItem = async () => {
    if (!token || !itemId) return;

    try {
      Alert.alert(
        "Return Item",
        `Are you sure you want to return "${itemDetails?.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Return",
            onPress: async () => {
              try {
                await axios.post(
                  `${API_BASE_URL}/items/${itemId}/return-item`,
                  {},
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                Alert.alert("Success", "Item returned successfully");
                router.back();
              } catch (error: any) {
                console.error("Failed to return item:", error);
                Alert.alert("Error", "Failed to return item");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error showing confirmation:", error);
    }
  };

  const calculateFineAmount = (daysOverdue: number): number => {
    return daysOverdue * 5; // $5 per day
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading item details...</Text>
      </View>
    );
  }

  if (!itemDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load item details</Text>
      </View>
    );
  }

  // Parse the additional overdue data passed from requests screen
  const overdueData = itemData ? JSON.parse(itemData as string) : {};
  const daysOverdue = overdueData.daysOverdue || 0;
  const fineAmount = overdueData.fineAmount || calculateFineAmount(daysOverdue);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Item Image */}
      {itemDetails.mediaUrl && (
        <Image
          source={{ uri: itemDetails.mediaUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Overdue Warning Banner */}
      <View style={styles.overdueBanner}>
        <Ionicons name="warning" size={24} color="#FFF" />
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Item Overdue</Text>
          <Text style={styles.bannerSubtitle}>
            {daysOverdue} days overdue - Fine: ${fineAmount}
          </Text>
        </View>
      </View>

      {/* Item Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.title}>{itemDetails.title}</Text>

        {itemDetails.authorOrCreator && (
          <Text style={styles.subtitle}>By {itemDetails.authorOrCreator}</Text>
        )}

        {/* Status Badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: "#FF3B3015" }]}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={[styles.statusText, { color: "#FF3B30" }]}>
              Overdue
            </Text>
          </View>
        </View>

        {/* Description */}
        {itemDetails.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>{itemDetails.description}</Text>
          </View>
        )}

        {/* Category */}
        {itemDetails.categoryId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <Text style={styles.sectionContent}>
              {itemDetails.categoryId.name}
            </Text>
          </View>
        )}

        {/* Overdue Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overdue Information</Text>
          <View style={styles.overdueGrid}>
            <View style={styles.overdueItem}>
              <Ionicons name="calendar-outline" size={16} color="#FF3B30" />
              <Text style={styles.overdueLabel}>Days Overdue</Text>
              <Text style={styles.overdueValue}>{daysOverdue} days</Text>
            </View>
            <View style={styles.overdueItem}>
              <Ionicons name="cash-outline" size={16} color="#FF3B30" />
              <Text style={styles.overdueLabel}>Current Fine</Text>
              <Text style={styles.overdueValue}>${fineAmount}</Text>
            </View>
          </View>
        </View>

        {/* Item Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Item Information</Text>
          {itemDetails.isbnOrIdentifier && (
            <Text style={styles.sectionContent}>
              ISBN: {itemDetails.isbnOrIdentifier}
            </Text>
          )}
          {itemDetails.publisherOrManufacturer && (
            <Text style={styles.sectionContent}>
              Publisher: {itemDetails.publisherOrManufacturer}
            </Text>
          )}
          {itemDetails.availableCopies !== undefined && (
            <Text style={styles.sectionContent}>
              Available: {itemDetails.availableCopies} of {itemDetails.quantity} copies
            </Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleReturnItem}
        >
          <Ionicons name="return-up-back-outline" size={20} color="#FFF" />
          <Text style={styles.actionButtonText}>Return Item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => Alert.alert("Pay Fine", "Fine payment functionality")}
        >
          <Ionicons name="card-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
            Pay Fine
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
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
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});