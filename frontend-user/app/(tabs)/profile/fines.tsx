import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface Fine {
  id: string;
  reason: string;
  amount: number;
  outstanding: number;
  status: "Paid" | "Pending" | "Overdue" | "Waived" | "Outstanding";
  dateIncurred: string;
}

interface FinesResponse {
  success: boolean;
  message: string;
  data: {
    fines: Fine[];
  };
}

export default function FinesScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setError(null);
      const response = await axios.get<FinesResponse>(
        `${API_BASE_URL}/account/fines`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Fines response:", response.data.data);
      if (response.data.success) {
        setFines(response.data.data.fines);
      }
    } catch (error: any) {
      console.error("Failed to fetch fines:", error);
      setError("Failed to load fines. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  console.log("oustanding amount", fines);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFines();
  };

  const getStatusColor = (status: Fine["status"]) => {
    switch (status) {
      case "Paid":
        return "#34C759";
      case "Pending":
        return "#FF9500";
      case "Overdue":
        return "#FF3B30";
      case "Outstanding":
        return "#FF3B30";
      case "Waived":
        return "#8E8E93";
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: Fine["status"]) => {
    switch (status) {
      case "Paid":
        return "checkmark-circle";
      case "Pending":
        return "time";
      case "Overdue":
        return "warning";
      case "Outstanding":
        return "warning";
      case "Waived":
        return "heart";
      default:
        return "help-circle";
    }
  };

  const getStatusText = (status: Fine["status"]) => {
    switch (status) {
      case "Paid":
        return "Paid";
      case "Pending":
        return "Pending";
      case "Overdue":
        return "Overdue";
      case "Outstanding":
        return "Outstanding";
      case "Waived":
        return "Waived";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalOutstanding = () => {
    return fines
      .filter(
        (fine) =>
          fine.status === "Pending" ||
          fine.status === "Overdue" ||
          fine.status === "Outstanding"
      )
      .reduce((total, fine) => total + fine.outstanding, 0);
  };


  const handleContactSupport = () => {
    Alert.alert(
      "Contact Support",
      "For questions about fines or payment options, please contact our support team.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Contact Support", style: "default" },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your fines...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={COLORS.textSecondary}
        />
        <Text style={styles.errorTitle}>Unable to Load Fines</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFines}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalOutstanding = getTotalOutstanding();
  const hasOutstandingFines = totalOutstanding > 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.navigate("/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fines and Services</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Ionicons
            name={
              hasOutstandingFines
                ? "warning-outline"
                : "checkmark-circle-outline"
            }
            size={24}
            color={hasOutstandingFines ? "#FF9500" : "#34C759"}
          />
          <Text style={styles.summaryTitle}>
            {hasOutstandingFines ? "Outstanding Balance" : "All Clear!"}
          </Text>
        </View>

        <Text style={styles.totalAmount}>
          {formatCurrency(totalOutstanding)}
        </Text>

        <View style={styles.summaryDetails}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Fines</Text>
            <Text style={styles.summaryValue}>{fines.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: hasOutstandingFines ? "#FF3B30" : "#34C759" },
              ]}
            >
              {
                fines.filter(
                  (f) => f.status === "Pending" || f.status === "Overdue" || f.status === "Outstanding"
                ).length
              }
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>
              {fines.filter((f) => f.status === "Paid").length}
            </Text>
          </View>
        </View>
      </View>

      {/* Fines List */}
      <View style={styles.finesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fine History</Text>
          <Text style={styles.sectionSubtitle}>
            {fines.length} fine{fines.length !== 1 ? "s" : ""} total
          </Text>
        </View>

        {fines.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>No Fines Found</Text>
            <Text style={styles.emptyText}>
              You don't have any fines at the moment. Keep up the good work!
            </Text>
          </View>
        ) : (
          <View style={styles.finesList}>
            {fines.map((fine, index) => (
              <View
                key={fine.id}
                style={[
                  styles.fineCard,
                  index === fines.length - 1 && styles.lastFineCard,
                ]}
              >
                {/* Status Indicator */}
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: getStatusColor(fine.status) },
                  ]}
                />

                <View style={styles.fineContent}>
                  {/* Header */}
                  <View style={styles.fineHeader}>
                    <Text style={styles.fineReason} numberOfLines={2}>
                      {fine.reason}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={getStatusIcon(fine.status)}
                        size={12}
                        color="#FFF"
                      />
                      <Text style={styles.statusBadgeText}>
                        {getStatusText(fine.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Information */}
                  <View style={styles.amountContainer}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Amount:</Text>
                      <Text style={styles.amountValue}>
                        {formatCurrency(fine.amount)}
                      </Text>
                    </View>
                    {(fine.status === "Pending" ||
                      fine.status === "Overdue") && (
                      <View style={styles.amountRow}>
                        <Text style={styles.outstandingLabel}>
                          Outstanding:
                        </Text>
                        <Text style={styles.outstandingValue}>
                          {formatCurrency(fine.outstanding)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Date */}
                  <View style={styles.dateContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.dateText}>
                      Incurred on {formatDate(fine.dateIncurred)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
        <View style={styles.helpContent}>
          <Text style={styles.helpTitle}>Need Help with Fines?</Text>
          <Text style={styles.helpText}>
            • Fines are typically issued for late returns, lost items, or
            damages{"\n"}• Payment can be made at the library desk or through
            online methods{"\n"}• Contact support if you believe a fine was
            issued in error
          </Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={handleContactSupport}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  summaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  payAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
  },
  payAllButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  finesSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  finesList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    overflow: "hidden",
  },
  fineCard: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastFineCard: {
    borderBottomWidth: 0,
  },
  statusIndicator: {
    width: 4,
  },
  fineContent: {
    flex: 1,
    padding: 16,
  },
  fineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  fineReason: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFF",
    textTransform: "uppercase",
  },
  amountContainer: {
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  outstandingLabel: {
    fontSize: 14,
    color: "#FF3B30",
  },
  outstandingValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  helpButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});
