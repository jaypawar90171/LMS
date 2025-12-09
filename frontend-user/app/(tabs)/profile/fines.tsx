import { fineService } from "@/services"; 
import { tokenAtom, userAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";


interface FineItem {
  _id: string;
  title: string; 
}

interface Fine {
  _id: string;
  userId: string;
  itemId?: FineItem; 
  transactionId?: string;
  amount: number; 
  reason: "Overdue" | "Damaged" | "Lost" | "Manual";
  status: "Outstanding" | "Paid" | "Partial Paid" | "Waived"; 
  dueDate: string;
  notes?: string;
  createdAt: string;
  
  paidAmount: number;
  remainingAmount: number; 
}

interface FinesSummary {
  
  totalAmount: number;
  paidAmount: number;
  waivedAmount: number;
  outstandingAmount: number; 
}

interface FinesResponse {
  success: boolean;
  count: number;
  total: number; 
  totalPages: number;
  currentPage: number;
  summary: FinesSummary;
  data: Fine[];
}


const getFineStatusText = (status: Fine["status"]): string => {
  switch (status) {
    case "Outstanding":
      return "Outstanding";
    case "Paid":
      return "Paid";
    case "Partial Paid":
      return "Partial Paid";
    case "Waived":
      return "Waived";
    default:
      return status;
  }
};

export default function FinesScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [fines, setFines] = useState<Fine[]>([]);
  const [totalFinesCount, setTotalFinesCount] = useState(0); 
  const [summary, setSummary] = useState<FinesSummary>({
    totalAmount: 0,
    paidAmount: 0,
    waivedAmount: 0,
    outstandingAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setError(null);
      const response = await fineService.getFines();
      
      if (response.data.success) {
        setFines(response.data.data || []);
        setSummary(response.data.summary || {});
        setTotalFinesCount(response.data.total || 0); 
      }
    } catch (error: any) {
      console.error("Failed to fetch fines:", error);
      setError("Failed to load fines. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFines();
  };

  const getStatusColor = (status: Fine["status"]) => {
    switch (status) {
      case "Paid":
        return "#34C759"; 
      case "Partial Paid":
        return "#FF9500"; 
      case "Outstanding":
        return "#FF3B30"; 
      case "Waived":
        return "#8E8E93"; 
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: Fine["status"]) => {
    switch (status) {
      case "Paid":
        return "checkmark-circle";
      case "Partial Paid":
        return "time";
      case "Outstanding":
        return "warning";
      case "Waived":
        return "heart";
      default:
        return "help-circle";
    }
  };

  
  const getItemTitle = (fine: Fine) => {
    const itemTitle = fine.itemId && fine.itemId.title;
    if (itemTitle) {
      return `${fine.reason} fine for "${itemTitle}"`;
    }
    return fine.reason; 
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
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading your fines...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={dynamicStyles.errorContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={dynamicStyles.errorTitle}>Unable to Load Fines</Text>
        <Text style={dynamicStyles.errorText}>{error}</Text>
        <TouchableOpacity style={dynamicStyles.retryButton} onPress={fetchFines}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasOutstandingFines = summary.outstandingAmount > 0;

  return (
    <ScrollView
      style={dynamicStyles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.navigate("/(tabs)/profile")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Fines</Text>
        <View style={dynamicStyles.placeholder} />
      </View>

      {/* Summary Card */}
      <View style={dynamicStyles.summaryCard}>
        <View style={dynamicStyles.summaryHeader}>
          <Ionicons
            name={
              hasOutstandingFines
                ? "warning-outline"
                : "checkmark-circle-outline"
            }
            size={24}
            color={hasOutstandingFines ? "#FF9500" : "#34C759"}
          />
          <Text style={dynamicStyles.summaryTitle}>
            {hasOutstandingFines ? "Total Outstanding Balance" : "No Outstanding Fines"}
          </Text>
        </View>

        <Text style={dynamicStyles.totalAmount}>
          {formatCurrency(summary.outstandingAmount)}
        </Text>

        {hasOutstandingFines && (
          <TouchableOpacity style={dynamicStyles.payAllButton} onPress={() => Alert.alert("Payment", "Initiating payment process...")}>
            <Ionicons name="card-outline" size={20} color="#FFF" />
            <Text style={dynamicStyles.payAllButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}

        <View style={dynamicStyles.summaryDetails}>
          <View style={dynamicStyles.summaryItem}>
            <Text style={dynamicStyles.summaryLabel}>Total Charged</Text>
            <Text style={dynamicStyles.summaryValue}>{formatCurrency(summary.totalAmount)}</Text>
          </View>
          <View style={dynamicStyles.summaryItem}>
            <Text style={dynamicStyles.summaryLabel}>Total Paid</Text>
            <Text style={[dynamicStyles.summaryValue, { color: '#34C759' }]}>
              {formatCurrency(summary.paidAmount)}
            </Text>
          </View>
          <View style={dynamicStyles.summaryItem}>
            <Text style={dynamicStyles.summaryLabel}>Total Waived</Text>
            <Text style={dynamicStyles.summaryValue}>
              {formatCurrency(summary.waivedAmount)}
            </Text>
          </View>
        </View>
      </View>

      {/* Fines List */}
      <View style={dynamicStyles.finesSection}>
        <View style={dynamicStyles.sectionHeader}>
          <Text style={dynamicStyles.sectionTitle}>Fine History</Text>
          <Text style={dynamicStyles.sectionSubtitle}>
            {/* FIX: Use totalFinesCount */}
            {totalFinesCount} total fine{totalFinesCount !== 1 ? "s" : ""}
          </Text>
        </View>

        {fines.length === 0 ? (
          <View style={dynamicStyles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.emptyTitle}>No Fines Found</Text>
            <Text style={dynamicStyles.emptyText}>
              You don't have any fines that match the current filter.
            </Text>
          </View>
        ) : (
          <View style={dynamicStyles.finesList}>
            {fines.map((fine, index) => (
              <View
                key={fine._id}
                style={[
                  dynamicStyles.fineCard,
                  index === fines.length - 1 && dynamicStyles.lastFineCard,
                ]}
              >
                {/* Status Indicator */}
                <View
                  style={[
                    dynamicStyles.statusIndicator,
                    { backgroundColor: getStatusColor(fine.status) },
                  ]}
                />

                <View style={dynamicStyles.fineContent}>
                  {/* Header */}
                  <View style={dynamicStyles.fineHeader}>
                    <Text style={dynamicStyles.fineReason} numberOfLines={2}>
                      {getItemTitle(fine)}
                    </Text>
                    <View style={[
                      dynamicStyles.statusBadge,
                      { backgroundColor: getStatusColor(fine.status) }
                    ]}>
                      <Ionicons
                        name={getStatusIcon(fine.status)}
                        size={12}
                        color="#FFF"
                      />
                      <Text style={dynamicStyles.statusBadgeText}>
                        {getFineStatusText(fine.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Amount Information */}
                  <View style={dynamicStyles.amountContainer}>
                    <View style={dynamicStyles.amountRow}>
                      <Text style={dynamicStyles.amountLabel}>Total Fee:</Text>
                      <Text style={dynamicStyles.amountValue}>
                        {formatCurrency(fine.amount)}
                      </Text>
                    </View>
                    {(fine.status === "Outstanding" ||
                      fine.status === "Partial Paid") && (
                        <View style={dynamicStyles.amountRow}>
                          <Text style={dynamicStyles.outstandingLabel}>
                            Remaining Balance:
                          </Text>
                          <Text style={dynamicStyles.outstandingValue}>
                            {/* Using the virtual remainingAmount from the backend */}
                            {formatCurrency(fine.remainingAmount)}
                          </Text>
                        </View>
                      )}
                    {(fine.paidAmount > 0 && fine.status !== "Paid") && (
                      <View style={dynamicStyles.amountRow}>
                        <Text style={dynamicStyles.paidLabel}>
                          Paid Amount:
                        </Text>
                        <Text style={dynamicStyles.paidValue}>
                          {formatCurrency(fine.paidAmount)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Date */}
                  <View style={dynamicStyles.dateContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.dateText}>
                      Due Date {formatDate(fine.dueDate)}
                    </Text>
                  </View>

                  {/* Pay button for outstanding/partial fines */}
                  {fine.remainingAmount > 0 && fine.status !== 'Waived' && (
                    <TouchableOpacity
                      style={dynamicStyles.payButton}
                      onPress={() => Alert.alert("Payment", `Pay ${formatCurrency(fine.remainingAmount)} for this fine?`)}
                    >
                      <Ionicons name="wallet-outline" size={16} color="#FFF" />
                      <Text style={dynamicStyles.payButtonText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Help Section */}
      <View style={dynamicStyles.helpSection}>
        <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
        <View style={dynamicStyles.helpContent}>
          <Text style={dynamicStyles.helpTitle}>Need Help with Fines?</Text>
          <Text style={dynamicStyles.helpText}>
            • Fines are typically issued for late returns, lost items, or
            damages{"\n"}• Payment can be made at the library desk or through
            online methods{"\n"}• Contact support if you believe a fine was
            issued in error
          </Text>
          <TouchableOpacity
            style={dynamicStyles.helpButton}
            onPress={handleContactSupport}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={colors.primary}
            />
            <Text style={dynamicStyles.helpButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={dynamicStyles.bottomSpacer} />
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
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
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
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  summaryCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  summaryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  payAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  payAllButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  finesSection: {
    marginHorizontal: 16,
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
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  finesList: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    overflow: "hidden",
  },
  fineCard: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.border,
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
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  outstandingLabel: {
    fontSize: 14,
    color: "#FF3B30",
    fontWeight: '500',
  },
  outstandingValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF3B30",
  },
  paidLabel: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  paidValue: {
    fontSize: 16,
    fontWeight: "600",
    color: '#34C759',
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
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
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});
}