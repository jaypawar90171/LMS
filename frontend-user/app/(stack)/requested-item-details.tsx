import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface RequestedItemDetails {
  _id: string;
  name: string;
  description?: string;
  category: string;
  reason?: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  createdAt: string;
  updatedAt: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
}

export default function RequestedItemDetailsScreen() {
  const { itemId } = useLocalSearchParams();
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [itemDetails, setItemDetails] = useState<RequestedItemDetails | null>(null);
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
        `${API_BASE_URL}/items/requested-item/${itemId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setItemDetails(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch requested item details:", error);
      Alert.alert("Error", "Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9500";
      case "approved":
        return "#34C759";
      case "rejected":
        return "#FF3B30";
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "approved":
        return "checkmark-circle-outline";
      case "rejected":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  const handleCancelRequest = async () => {
    if (!token || !itemId) return;

    try {
      Alert.alert(
        "Cancel Request",
        `Are you sure you want to cancel your request for "${itemDetails?.name}"?`,
        [
          { text: "Keep Request", style: "cancel" },
          {
            text: "Cancel Request",
            style: "destructive",
            onPress: async () => {
              try {
                await axios.delete(
                  `${API_BASE_URL}/items/requested-item/${itemId}`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                Alert.alert("Success", "Request cancelled successfully");
                router.back();
              } catch (error) {
                console.error("Failed to cancel request:", error);
                Alert.alert("Error", "Failed to cancel request");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error showing confirmation:", error);
    }
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{itemDetails.name}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: `${getStatusColor(itemDetails.status)}15`,
                },
              ]}
            >
              <Ionicons
                name={getStatusIcon(itemDetails.status)}
                size={16}
                color={getStatusColor(itemDetails.status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(itemDetails.status) },
                ]}
              >
                {itemDetails.status.charAt(0).toUpperCase() + itemDetails.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Requested on {new Date(itemDetails.requestedAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Text style={styles.sectionContent}>{itemDetails.category}</Text>
        </View>

        {/* Quantity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity Requested</Text>
          <Text style={styles.sectionContent}>{itemDetails.quantity}</Text>
        </View>

        {/* Description */}
        {itemDetails.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.sectionContent}>{itemDetails.description}</Text>
          </View>
        )}

        {/* Reason */}
        {itemDetails.reason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Request</Text>
            <Text style={styles.sectionContent}>{itemDetails.reason}</Text>
          </View>
        )}

        {/* Request Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Requested Date</Text>
              <Text style={styles.infoValue}>
                {new Date(itemDetails.requestedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(itemDetails.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      {itemDetails.status === "pending" && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleCancelRequest}
          >
            <Ionicons name="close-circle-outline" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  statusRow: {
    alignItems: "flex-end",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailsCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
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
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  actionsContainer: {
    padding: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  dangerButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});