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
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return '#007AFF';
      case 'overdue':
        return '#FF3B30';
      case 'returned':
        return '#34C759';
      case 'late return':
        return '#FF9500';
      case 'outstanding':
        return '#FF3B30';
      case 'paid':
        return '#34C759';
      case 'waived':
        return '#8E8E93';
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'issued':
        return 'time-outline';
      case 'overdue':
        return 'warning-outline';
      case 'returned':
        return 'checkmark-circle-outline';
      case 'late return':
        return 'time-outline';
      case 'outstanding':
        return 'alert-circle-outline';
      case 'paid':
        return 'checkmark-done-outline';
      case 'waived':
        return 'heart-outline';
      default:
        return 'help-circle-outline';
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
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Active Borrows</Text>
          <Text style={styles.emptyText}>
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
                styles.itemCard,
                index === historyData.recentlyBorrowed.length - 1 && styles.lastItemCard,
              ]}
            >
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Ionicons
                    name={getStatusIcon(item.status)}
                    size={12}
                    color="#FFF"
                  />
                  <Text style={styles.statusBadgeText}>
                    {isOverdue ? 'Overdue' : item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemAuthor}>by {item.author}</Text>

              <View style={styles.datesContainer}>
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.dateLabel}>Issued: </Text>
                  <Text style={styles.dateValue}>{formatDate(item.issueDate)}</Text>
                </View>
                <View style={styles.dateRow}>
                  <Ionicons name="flag-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.dateLabel}>Due: </Text>
                  <Text style={[
                    styles.dateValue,
                    isOverdue && styles.overdueText
                  ]}>
                    {formatDate(item.dueDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={styles.daysContainer}>
                  <Text style={[
                    styles.daysText,
                    isOverdue ? styles.overdueText : styles.daysRemainingText
                  ]}>
                    {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                  </Text>
                </View>
                {item.fine && item.fine > 0 && (
                  <View style={styles.fineBadge}>
                    <Text style={styles.fineBadgeText}>
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
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Return History</Text>
          <Text style={styles.emptyText}>
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
              styles.itemCard,
              index === historyData.returnedItems.length - 1 && styles.lastItemCard,
            ]}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Ionicons
                  name={getStatusIcon(item.status)}
                  size={12}
                  color="#FFF"
                />
                <Text style={styles.statusBadgeText}>{item.status}</Text>
              </View>
            </View>

            <Text style={styles.itemAuthor}>by {item.author}</Text>

            <View style={styles.datesContainer}>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.dateLabel}>Issued: </Text>
                <Text style={styles.dateValue}>{formatDate(item.issueDate)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.dateLabel}>Returned: </Text>
                <Text style={styles.dateValue}>{formatDate(item.returnDate)}</Text>
              </View>
            </View>

            {item.fine && item.fine > 0 && (
              <View style={styles.fineNotice}>
                <Ionicons name="warning-outline" size={16} color="#FF9500" />
                <Text style={styles.fineNoticeText}>
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
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No Fine History</Text>
          <Text style={styles.emptyText}>
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
              styles.itemCard,
              index === historyData.fines.length - 1 && styles.lastItemCard,
            ]}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.fineReason} numberOfLines={2}>
                {fine.reason}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(fine.status) }]}>
                <Ionicons
                  name={getStatusIcon(fine.status)}
                  size={12}
                  color="#FFF"
                />
                <Text style={styles.statusBadgeText}>{fine.status}</Text>
              </View>
            </View>

            <View style={styles.fineAmounts}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Amount:</Text>
                <Text style={styles.amountValue}>{formatCurrency(fine.amount)}</Text>
              </View>
              {fine.outstanding > 0 && (
                <View style={styles.amountRow}>
                  <Text style={styles.outstandingLabel}>Outstanding:</Text>
                  <Text style={styles.outstandingValue}>
                    {formatCurrency(fine.outstanding)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.fineDate}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.fineDateText}>
                Incurred on {formatDate(fine.dateIncurred)}
              </Text>
            </View>

            {fine.outstanding > 0 && (
              <TouchableOpacity style={styles.payButton}>
                <Ionicons name="card-outline" size={16} color="#FFF" />
                <Text style={styles.payButtonText}>
                  Pay {formatCurrency(fine.outstanding)}
                </Text>
              </TouchableOpacity>
            )}
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.errorTitle}>Unable to Load History</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
          <Ionicons name="refresh" size={20} color="#FFF" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "borrowed" && styles.activeTab]}
          onPress={() => setActiveTab("borrowed")}
        >
          <Ionicons 
            name="book-outline" 
            size={20} 
            color={activeTab === "borrowed" ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "borrowed" && styles.activeTabText
          ]}>
            Borrowed ({getTabCount("borrowed")})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "returned" && styles.activeTab]}
          onPress={() => setActiveTab("returned")}
        >
          <Ionicons 
            name="checkmark-done-outline" 
            size={20} 
            color={activeTab === "returned" ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "returned" && styles.activeTabText
          ]}>
            Returned ({getTabCount("returned")})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "fines" && styles.activeTab]}
          onPress={() => setActiveTab("fines")}
        >
          <Ionicons 
            name="receipt-outline" 
            size={20} 
            color={activeTab === "fines" ? COLORS.primary : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "fines" && styles.activeTabText
          ]}>
            Fines ({getTabCount("fines")})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.contentContainer}>
          {getTabContent()}
        </View>
        
        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
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
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
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
  itemCard: {
    backgroundColor: COLORS.cardBackground,
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
    color: COLORS.textPrimary,
    marginRight: 12,
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
    color: COLORS.textSecondary,
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
    color: COLORS.textSecondary,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textPrimary,
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
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
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
  bottomSpacer: {
    height: 20,
  },
});