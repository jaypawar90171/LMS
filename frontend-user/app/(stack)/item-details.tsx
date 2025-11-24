import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

interface ItemDetails {
  _id: string;
  title: string;
  authorOrCreator?: string;
  description?: string;
  mediaUrl?: string;
  status: string;
  categoryId?: {
    _id: string;
    name: string;
  };
  availableCopies?: number;
  quantity?: number;
  dueDate?: string;
  daysRemaining?: number;
  daysOverdue?: number;
  isOverdue?: boolean;
  position?: number;
  estimatedWaitTime?: string;
  totalQueueLength?: number;
}

export default function ItemDetailsScreen() {
  const { itemId, itemType, queueId } = useLocalSearchParams();
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState(false);
  const router = useRouter();

  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  console.log("itemdetails" + itemDetails?.status);
  useEffect(() => {
    fetchItemDetails();
  }, [itemId, itemType, queueId]);

  const fetchItemDetails = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      let endpoint = "";
      let response;

      if (
        itemType === "issued" ||
        itemType === "overdue" ||
        itemType === "new"
      ) {
        endpoint = `${API_BASE_URL}/inventory/categories/${itemId}`;
        response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItemDetails(response.data.data);
      } else if (itemType === "queued") {
        endpoint = `${API_BASE_URL}/items/queues/${queueId}`;
        response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const queueData = response.data.data;
        const currentUserMemberInfo = queueData.queueMembers.find(
          (member: any) => member.userId._id === user.id
        );

        const normalizedData = {
          ...queueData.itemId,
          ...queueData,
          position: currentUserMemberInfo?.position,
          totalQueueLength: queueData.queueMembers.length,
          status: currentUserMemberInfo.status,
        };
        setItemDetails(normalizedData);
        console.log("queue data" + JSON.stringify(normalizedData));
      }
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to fetch item details. Server responded with:",
          error.response.data
        );
        const errorMessage =
          error.response.data.message || "Failed to load item details";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        console.error(
          "Failed to fetch item details. No response from server:",
          error.request
        );
        Alert.alert("Network Error", "Could not connect to the server.");
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExtendPeriod = async () => {
    if (!token || !itemId) return;

    try {
      Alert.alert(
        "Extend Period",
        `Would you like to request an extension for "${itemDetails?.title}"? The admin will review your request.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Request Extension",
            style: "default",
            onPress: async () => {
              try {
                setExtending(true);
                const response = await axios.get(
                  `${API_BASE_URL}/items/${itemId}/extend-period`,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );

                Alert.alert(
                  "Extension Request Sent",
                  "Your request to extend the period has been submitted successfully. The admin will review it shortly.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        fetchItemDetails();
                      },
                    },
                  ]
                );
              } catch (error: any) {
                console.error("Failed to extend period:", error);

                if (error.response) {
                  const errorMessage =
                    error.response.data.message ||
                    error.response.data.error ||
                    "Failed to request extension";

                  Alert.alert("Error", errorMessage);
                } else if (error.request) {
                  Alert.alert(
                    "Network Error",
                    "Could not connect to the server. Please check your internet connection."
                  );
                } else {
                  Alert.alert("Error", "An unexpected error occurred.");
                }
              } finally {
                setExtending(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error showing confirmation:", error);
    }
  };

  const handleWithdrawFromQueue = async () => {
    if (!token || !queueId) return;

    try {
      Alert.alert(
        "Leave Queue",
        `Are you sure you want to leave the queue for "${itemDetails?.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Leave Queue",
            style: "destructive",
            onPress: async () => {
              try {
                await axios.delete(`${API_BASE_URL}/items/queues/${queueId}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                Alert.alert("Success", "You have been removed from the queue");
                router.back();
              } catch (error) {
                console.error("Failed to withdraw from queue:", error);
                Alert.alert(
                  "Error",
                  "Failed to leave queue. Please try again."
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to withdraw from queue. Server responded with:",
          error.response.data
        );

        const errorMessage =
          error.response.data.message || "Failed to withdraw from queue";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        console.error(
          "Failed to withdraw from queue.. No response from server:",
          error.request
        );
        Alert.alert("Network Error", "Could not connect to the server.");
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };

  const handleRequestItem = async () => {
    console.log("click on the requets item");
    if (!token || !user?.id || !itemId) return;
    try {
      const response = await axios.post(
        `${API_BASE_URL}/${itemId}/request-item`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        "Success",
        `Your request for "${itemDetails?.title}" has been submitted`
      );
      router.back();
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to request an item. Server responded with:",
          error.response.data
        );

        const errorMessage =
          error.response.data.message || "Failed to requets an item";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        console.error(
          "Failed to request an item. No response from server:",
          error.request
        );
        Alert.alert("Network Error", "Could not connect to the server.");
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "#34C759";
      case "Issued":
        return colors.primary;
      case "Overdue":
        return "#FF3B30";
      case "Queued":
        return "#FF9500";
      default:
        return colors.textSecondary;
    }
  };

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

      {/* Item Details Card */}
      <View style={dynamicStyles.detailsCard}>
        <Text style={dynamicStyles.title}>{itemDetails.title}</Text>

        {itemDetails.authorOrCreator && (
          <Text style={dynamicStyles.subtitle}>By {itemDetails.authorOrCreator}</Text>
        )}

        {/* Status Badge */}
        <View style={dynamicStyles.statusRow}>
          <View
            style={[
              dynamicStyles.statusBadge,
              {
                backgroundColor: `${getStatusColor(
                  itemDetails.status || "No-status"
                )}15`,
              },
            ]}
          >
            <Text
              style={[
                dynamicStyles.statusText,
                { color: getStatusColor(itemDetails.status) },
              ]}
            >
              {itemDetails.status}
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

        {/* Availability */}
        {itemDetails.availableCopies !== undefined &&
          itemDetails.quantity !== undefined && (
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>Availability</Text>
              <Text style={dynamicStyles.sectionContent}>
                {itemDetails.availableCopies} of {itemDetails.quantity} copies
                available
              </Text>
            </View>
          )}

        {/* Issued Item Specific Info */}
        {(itemType === "issued" || itemType === "overdue") && itemDetails && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Due Date</Text>
            <Text style={dynamicStyles.sectionContent}>
              {itemDetails.dueDate
                ? new Date(itemDetails.dueDate).toLocaleDateString()
                : "N/A"}
            </Text>
            {itemDetails.daysRemaining !== undefined &&
              !itemDetails.isOverdue && (
                <Text
                  style={[dynamicStyles.sectionContent, { color: colors.primary }]}
                >
                  {itemDetails.daysRemaining} days remaining
                </Text>
              )}
            {itemDetails.isOverdue && itemDetails.daysOverdue !== undefined && (
              <Text style={[dynamicStyles.sectionContent, { color: "#FF3B30" }]}>
                Overdue by {itemDetails.daysOverdue} days
              </Text>
            )}
          </View>
        )}

        {/* Queue Item Specific Info */}
        {itemType === "queued" && itemDetails && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Queue Information</Text>
            {itemDetails.position !== undefined && (
              <Text style={dynamicStyles.sectionContent}>
                Your position: {itemDetails.position}
              </Text>
            )}
            {itemDetails.estimatedWaitTime && (
              <Text style={dynamicStyles.sectionContent}>
                Estimated wait: {itemDetails.estimatedWaitTime}
              </Text>
            )}
            {itemDetails.totalQueueLength !== undefined && (
              <Text style={dynamicStyles.sectionContent}>
                Total in queue: {itemDetails.totalQueueLength}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={dynamicStyles.actionsContainer}>
        {itemType === "queued" && (
          <TouchableOpacity
            style={[dynamicStyles.actionButton, dynamicStyles.dangerButton]}
            onPress={handleWithdrawFromQueue}
          >
            <Ionicons name="exit-outline" size={20} color="#FFF" />
            <Text style={dynamicStyles.actionButtonText}>Leave Queue</Text>
          </TouchableOpacity>
        )}

        {(itemType === "issued" || itemType === "overdue") && (
          <>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.secondaryButton]}
              onPress={handleExtendPeriod}
              disabled={extending}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFF" />
              <Text style={dynamicStyles.actionButtonText}>
                {extending ? "Requesting..." : "Extend Period"}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.primaryButton]}
              onPress={handleReturnItem}
            >
              <Ionicons name="return-up-back-outline" size={20} color="#FFF" />
              <Text style={dynamicStyles.actionButtonText}>Return Item</Text>
            </TouchableOpacity> */}
          </>
        )}

        {itemType === "new" && (
          <TouchableOpacity
            style={[dynamicStyles.actionButton, dynamicStyles.primaryButton]}
            onPress={handleRequestItem}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={dynamicStyles.actionButtonText}>
              {itemDetails.status === "Available"
                ? "Request Item"
                : "Join Queue"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
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
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    backgroundColor: "#FF9500",
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

}