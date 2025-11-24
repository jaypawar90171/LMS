import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

interface BorrowedItem {
  id: string;
  title: string;
  author: string;
  issueDate: string;
  dueDate: string;
  status: "Issued" | "Overdue" | "Returned";
  fine?: number | null;
}

interface ReturnedItem {
  id: string;
  title: string;
  author: string;
  issueDate: string;
  returnDate: string;
  status: "Returned" | "Late Return";
  fine?: number | null;
}

interface FineItem {
  id: string;
  reason: string;
  amount: number;
  outstanding: number;
  status: "Outstanding" | "Paid" | "Waived";
  dateIncurred: string;
}

interface HistoryData {
  recentlyBorrowed: BorrowedItem[];
  returnedItems: ReturnedItem[];
  fines: FineItem[];
}

type TabType = "borrowed" | "returned" | "fines";

export default function HistoryScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [activeTab, setActiveTab] = useState<TabType>("borrowed");
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setHistoryData(response.data.data);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error: any) {
      console.error("Failed to fetch history:", error);
      setError("Failed to load history. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "issued":
        return "#007AFF";
      case "overdue":
        return "#FF3B30";
      case "returned":
        return "#34C759";
      case "late return":
        return "#FF9500";
      case "outstanding":
        return "#FF3B30";
      case "paid":
        return "#34C759";
      case "waived":
        return "#8E8E93";
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "issued":
        return "time-outline";
      case "overdue":
        return "warning-outline";
      case "returned":
        return "checkmark-circle-outline";
      case "late return":
        return "time-outline";
      case "outstanding":
        return "alert-circle-outline";
      case "paid":
        return "checkmark-done-outline";
      case "waived":
        return "heart-outline";
      default:
        return "help-circle-outline";
    }
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderBorrowedItems = () => {
    if (!historyData?.recentlyBorrowed.length) {
      return (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="book-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyTitle}>No Active Borrows</Text>
          <Text style={dynamicStyles.emptyText}>
            You don't have any currently borrowed items.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {historyData.recentlyBorrowed.map((item, index) => {
          const daysRemaining = getDaysRemaining(item.dueDate);
          const isOverdue = daysRemaining < 0;

          return (
            <View
              key={item.id}
              style={[
                dynamicStyles.itemCard,
                index === historyData.recentlyBorrowed.length - 1 &&
                  dynamicStyles.lastItemCard,
              ]}
            >
              <View style={dynamicStyles.itemHeader}>
                <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View
                  style={[
                    dynamicStyles.statusBadge,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(item.status)}
                    size={12}
                    color="#FFF"
                  />
                  <Text style={dynamicStyles.statusBadgeText}>
                    {isOverdue ? "Overdue" : item.status}
                  </Text>
                </View>
              </View>

              <Text style={dynamicStyles.itemAuthor}>by {item.author}</Text>

              <View style={dynamicStyles.datesContainer}>
                <View style={dynamicStyles.dateRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={dynamicStyles.dateLabel}>Issued: </Text>
                  <Text style={dynamicStyles.dateValue}>
                    {formatDate(item.issueDate)}
                  </Text>
                </View>
                <View style={dynamicStyles.dateRow}>
                  <Ionicons
                    name="flag-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={dynamicStyles.dateLabel}>Due: </Text>
                  <Text
                    style={[dynamicStyles.dateValue, isOverdue && dynamicStyles.overdueText]}
                  >
                    {formatDate(item.dueDate)}
                  </Text>
                </View>
              </View>

              <View style={dynamicStyles.footer}>
                <View style={dynamicStyles.daysContainer}>
                  <Text
                    style={[
                      dynamicStyles.daysText,
                      isOverdue ? dynamicStyles.overdueText : dynamicStyles.daysRemainingText,
                    ]}
                  >
                    {isOverdue
                      ? `${Math.abs(daysRemaining)} days overdue`
                      : `${daysRemaining} days remaining`}
                  </Text>
                </View>
                {item.fine && item.fine > 0 && (
                  <View style={dynamicStyles.fineBadge}>
                    <Text style={dynamicStyles.fineBadgeText}>
                      {formatCurrency(item.fine)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </Animated.View>
    );
  };

  const renderReturnedItems = () => {
    if (!historyData?.returnedItems.length) {
      return (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="archive-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyTitle}>No Return History</Text>
          <Text style={dynamicStyles.emptyText}>
            You haven't returned any items yet.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {historyData.returnedItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              dynamicStyles.itemCard,
              index === historyData.returnedItems.length - 1 &&
                dynamicStyles.lastItemCard,
            ]}
          >
            <View style={dynamicStyles.itemHeader}>
              <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View
                style={[
                  dynamicStyles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={12}
                  color="#FFF"
                />
                <Text style={dynamicStyles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>

            <Text style={dynamicStyles.itemAuthor}>by {item.author}</Text>

            <View style={dynamicStyles.datesContainer}>
              <View style={dynamicStyles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.dateLabel}>Issued: </Text>
                <Text style={dynamicStyles.dateValue}>
                  {formatDate(item.issueDate)}
                </Text>
              </View>
              <View style={dynamicStyles.dateRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.dateLabel}>Returned: </Text>
                <Text style={dynamicStyles.dateValue}>
                  {formatDate(item.returnDate)}
                </Text>
              </View>
            </View>

            {item.fine && item.fine > 0 && (
              <View style={dynamicStyles.fineNotice}>
                <Ionicons name="warning-outline" size={16} color="#FF9500" />
                <Text style={dynamicStyles.fineNoticeText}>
                  Fine incurred: {formatCurrency(item.fine)}
                </Text>
              </View>
            )}
          </View>
        ))}
      </Animated.View>
    );
  };

  const renderFines = () => {
    if (!historyData?.fines.length) {
      return (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="receipt-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyTitle}>No Fine History</Text>
          <Text style={dynamicStyles.emptyText}>
            You don't have any fines at the moment.
          </Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {historyData.fines.map((fine, index) => (
          <View
            key={fine.id}
            style={[
              dynamicStyles.itemCard,
              index === historyData.fines.length - 1 && dynamicStyles.lastItemCard,
            ]}
          >
            <View style={dynamicStyles.itemHeader}>
              <Text style={dynamicStyles.fineReason} numberOfLines={2}>
                {fine.reason}
              </Text>
              <View
                style={[
                  dynamicStyles.statusBadge,
                  { backgroundColor: getStatusColor(fine.status) },
                ]}
              >
                <Ionicons
                  name={getStatusIcon(fine.status)}
                  size={12}
                  color="#FFF"
                />
                <Text style={dynamicStyles.statusBadgeText}>{fine.status}</Text>
              </View>
            </View>

            <View style={dynamicStyles.fineAmounts}>
              <View style={dynamicStyles.amountRow}>
                <Text style={dynamicStyles.amountLabel}>Total Amount:</Text>
                <Text style={dynamicStyles.amountValue}>
                  {formatCurrency(fine.amount)}
                </Text>
              </View>
              {fine.outstanding > 0 && (
                <View style={dynamicStyles.amountRow}>
                  <Text style={dynamicStyles.outstandingLabel}>Outstanding:</Text>
                  <Text style={dynamicStyles.outstandingValue}>
                    {formatCurrency(fine.outstanding)}
                  </Text>
                </View>
              )}
            </View>

            <View style={dynamicStyles.fineDate}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={dynamicStyles.fineDateText}>
                Incurred on {formatDate(fine.dateIncurred)}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const getTabContent = () => {
    switch (activeTab) {
      case "borrowed":
        return renderBorrowedItems();
      case "returned":
        return renderReturnedItems();
      case "fines":
        return renderFines();
      default:
        return null;
    }
  };

  const getTabCount = (tab: TabType) => {
    if (!historyData) return 0;

    switch (tab) {
      case "borrowed":
        return historyData.recentlyBorrowed.length;
      case "returned":
        return historyData.returnedItems.length;
      case "fines":
        return historyData.fines.length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading your history...</Text>
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
        <Text style={dynamicStyles.errorTitle}>Unable to Load History</Text>
        <Text style={dynamicStyles.errorText}>{error}</Text>
        <TouchableOpacity style={dynamicStyles.retryButton} onPress={fetchHistory}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        <Text style={dynamicStyles.headerTitle}>History</Text>
        <View style={dynamicStyles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={dynamicStyles.tabsContainer}>
        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === "borrowed" && dynamicStyles.activeTab]}
          onPress={() => setActiveTab("borrowed")}
        >
          <Ionicons
            name="book-outline"
            size={20}
            color={
              activeTab === "borrowed" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "borrowed" && dynamicStyles.activeTabText,
            ]}
          >
            Borrowed ({getTabCount("borrowed")})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === "returned" && dynamicStyles.activeTab]}
          onPress={() => setActiveTab("returned")}
        >
          <Ionicons
            name="checkmark-done-outline"
            size={20}
            color={
              activeTab === "returned" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "returned" && dynamicStyles.activeTabText,
            ]}
          >
            Returned ({getTabCount("returned")})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dynamicStyles.tab, activeTab === "fines" && dynamicStyles.activeTab]}
          onPress={() => setActiveTab("fines")}
        >
          <Ionicons
            name="receipt-outline"
            size={20}
            color={
              activeTab === "fines" ? colors.primary : colors.textSecondary
            }
          />
          <Text
            style={[
              dynamicStyles.tabText,
              activeTab === "fines" && dynamicStyles.activeTabText,
            ]}
          >
            Fines ({getTabCount("fines")})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={dynamicStyles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={dynamicStyles.contentContainer}>{getTabContent()}</View>

        {/* Bottom Spacer */}
        <View style={dynamicStyles.bottomSpacer} />
      </ScrollView>
    </View>
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  itemCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lastItemCard: {
    marginBottom: 0,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginRight: 12,
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
  itemAuthor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  datesContainer: {
    gap: 6,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  daysContainer: {
    flex: 1,
  },
  daysText: {
    fontSize: 14,
    fontWeight: "600",
  },
  daysRemainingText: {
    color: "#007AFF",
  },
  overdueText: {
    color: "#FF3B30",
  },
  fineBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fineBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  fineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  fineNoticeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#E65100",
  },
  fineAmounts: {
    gap: 4,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  outstandingLabel: {
    fontSize: 14,
    color: "#FF3B30",
  },
  outstandingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF3B30",
  },
  fineDate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  fineDateText: {
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
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  payButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomSpacer: {
    height: 20,
  },
});
}
