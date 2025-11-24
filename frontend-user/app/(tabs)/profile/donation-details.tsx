import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

interface DonationDetails {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
  itemType: {
    _id: string;
    name: string;
    description?: string;
  };
  title: string;
  description?: string;
  photos?: string;
  duration: number;
  donationType: "giveaway" | "duration";
  preferredContactMethod: string;
  status: "Pending" | "Accepted" | "Rejected";
  inventoryItemId: any;
  createdAt: string;
  updatedAt: string;
}

export default function DonationDetailsScreen() {
  const { donation } = useLocalSearchParams();
  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const donationData: DonationDetails = JSON.parse(donation as string);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "accepted":
        return "#34C759";
      case "pending":
        return "#FF9500";
      case "rejected":
        return "#FF3B30";
      default:
        return colors.textSecondary;
    }
  };

  const getTypeText = (type: string) => {
    return type === "giveaway" ? "Giveaway" : "Duration Based";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleWithdraw = async () => {
    if (donationData.status !== "Pending") {
      Alert.alert(
        "Cannot Withdraw",
        "Only pending donations can be withdrawn."
      );
      return;
    }

    Alert.alert(
      "Withdraw Donation",
      "Are you sure you want to withdraw this donation request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${API_BASE_URL}/items/donations/${donationData._id}/withdraw`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                Alert.alert(
                  "Success",
                  "Donation request withdrawn successfully"
                );
                router.back();
              }
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.response?.data?.message ||
                  "Failed to withdraw donation request"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Donation Details</Text>
        <View style={dynamicStyles.headerActions}>
          {donationData.status === "Pending" && (
            <TouchableOpacity onPress={handleWithdraw}>
              <Ionicons name="close" size={24} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={dynamicStyles.content}>
        {/* Image */}
        {donationData.photos ? (
          <Image
            source={{ uri: donationData.photos }}
            style={dynamicStyles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[dynamicStyles.image, dynamicStyles.placeholderImage]}>
            <Ionicons name="gift" size={64} color={colors.textSecondary} />
          </View>
        )}

        {/* Status Badge */}
        <View style={dynamicStyles.statusContainer}>
          <View
            style={[
              dynamicStyles.statusBadge,
              { backgroundColor: `${getStatusColor(donationData.status)}20` },
            ]}
          >
            <Ionicons
              name={
                donationData.status === "Accepted"
                  ? "checkmark-circle"
                  : donationData.status === "Rejected"
                  ? "close-circle"
                  : "time"
              }
              size={16}
              color={getStatusColor(donationData.status)}
            />
            <Text
              style={[
                dynamicStyles.statusText,
                { color: getStatusColor(donationData.status) },
              ]}
            >
              {donationData.status}
            </Text>
          </View>
        </View>

        {/* Basic Information */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Item Information</Text>
          <View style={dynamicStyles.infoCard}>
            <InfoRow icon="cube" label="Title" value={donationData.title} />
            {donationData.description && (
              <InfoRow
                icon="document-text"
                label="Description"
                value={donationData.description}
              />
            )}
            <InfoRow
              icon="calendar"
              label="Donation Type"
              value={getTypeText(donationData.donationType)}
            />
            {donationData.donationType === "duration" && (
              <InfoRow
                icon="time"
                label="Duration"
                value={`${donationData.duration} days`}
              />
            )}
            <InfoRow
              icon="chatbubble"
              label="Preferred Contact"
              value={donationData.preferredContactMethod}
            />
          </View>
        </View>

        {/* Timeline */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Timeline</Text>
          <View style={dynamicStyles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="Submitted"
              value={formatDate(donationData.createdAt)}
            />
            <InfoRow
              icon="refresh"
              label="Last Updated"
              value={formatDate(donationData.updatedAt)}
            />
          </View>
        </View>

        {/* Inventory Item (if accepted) */}
        {donationData.inventoryItemId && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.sectionTitle}>Inventory Item</Text>
            <View style={dynamicStyles.infoCard}>
              <InfoRow
                icon="barcode"
                label="Barcode"
                value={donationData.inventoryItemId.barcode}
              />
              <InfoRow
                icon="stats-chart"
                label="Status"
                value={donationData.inventoryItemId.status}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {donationData.status === "Pending" && (
        <View style={dynamicStyles.footer}>
          <TouchableOpacity
            style={dynamicStyles.withdrawButton}
            onPress={handleWithdraw}
          >
            <Ionicons name="close" size={20} color="#FFF" />
            <Text style={dynamicStyles.withdrawButtonText}>
              Withdraw Donation
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: `${"#bbdefb"}50`,
    }}
  >
    <View
      style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}
    >
      <Ionicons name={icon as any} size={16} color={"#1976D2"} />
      <Text style={{ fontSize: 14, color: "#1976D2", fontWeight: "500" }}>
        {label}
      </Text>
    </View>
    <Text
      style={{
        fontSize: 14,
        color: "#1976D2",
        fontWeight: "600",
        flex: 1,
        textAlign: "right",
      }}
    >
      {value}
    </Text>
  </View>
);

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    headerActions: {
      flexDirection: "row",
      gap: 8,
    },
    content: {
      flex: 1,
    },
    image: {
      width: "100%",
      height: 200,
    },
    placeholderImage: {
      backgroundColor: `${colors.primary}20`,
      justifyContent: "center",
      alignItems: "center",
    },
    statusContainer: {
      padding: 16,
      alignItems: "center",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 12,
    },
    infoCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: `${colors.border}50`,
    },
    infoLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    infoLabelText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "600",
      flex: 1,
      textAlign: "right",
    },
    footer: {
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    withdrawButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: "#FF3B30",
      padding: 16,
      borderRadius: 12,
    },
    withdrawButtonText: {
      color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
