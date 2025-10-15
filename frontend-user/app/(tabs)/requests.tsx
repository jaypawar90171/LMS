import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from "react-native";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { useRouter } from "expo-router";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface RequestedItem {
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

interface IssuedItem {
  _id: string;
  itemId: {
    _id: string;
    title: string;
    description?: string;
  };
  userId: {
    _id: string;
    fullName: string;
    email: string;
  };
  issuedDate: string;
  dueDate: string;
  status: string;
  extensionCount: number;
  maxExtensionAllowed: number;
  isOverdue?: boolean;
  daysOverdue?: number;
  daysRemaining?: number;
}

export default function RequestsScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [activeTab, setActiveTab] = useState<"requested" | "overdue">(
    "requested"
  );
  const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchRequestedItems = async () => {
    if (!user?.id || !token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/items/requested-items`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setRequestedItems(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch requested items:", error);
      Alert.alert("Error", "Failed to load requested items");
    }
  };

  const fetchIssuedItems = async () => {
    if (!user?.id || !token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/items/issued`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const items = response.data.data || [];
        setIssuedItems(items);

        // Calculate overdue items
        const overdueItems = items.filter((item: IssuedItem) => {
          const dueDate = new Date(item.dueDate);
          const today = new Date();
          const isOverdue = dueDate < today;

          if (isOverdue) {
            const daysOverdue = Math.floor(
              (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            item.isOverdue = true;
            item.daysOverdue = daysOverdue;
          } else {
            const daysRemaining = Math.floor(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            item.daysRemaining = daysRemaining;
          }

          return isOverdue;
        });

        // Set the items with calculated overdue status
        setIssuedItems(
          items.map((item: IssuedItem) => ({
            ...item,
            isOverdue: new Date(item.dueDate) < new Date(),
            daysOverdue:
              new Date(item.dueDate) < new Date()
                ? Math.floor(
                    (new Date().getTime() - new Date(item.dueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : undefined,
            daysRemaining:
              new Date(item.dueDate) >= new Date()
                ? Math.floor(
                    (new Date(item.dueDate).getTime() - new Date().getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch issued items:", error);
      Alert.alert("Error", "Failed to load issued items");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchRequestedItems(), fetchIssuedItems()]);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleItemPress = (
  item: RequestedItem | IssuedItem,
  type: "requested" | "overdue"
) => {
  if (type === "requested") {
    const requestedItem = item as RequestedItem;
    router.push({
      pathname: "/(tabs)/home/requested-item-details",
      params: {
        itemId: requestedItem._id,
      },
    });
  } else {
    const issuedItem = item as IssuedItem;
    router.push({
      pathname: "/(tabs)/home/overdue-item-details",
      params: {
        itemId: issuedItem.itemId._id, 
        itemData: JSON.stringify({
          dueDate: issuedItem.dueDate,
          daysOverdue: issuedItem.daysOverdue,
        }),
      },
    });
  }
};

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
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

  const getOverdueItems = () => {
    return issuedItems.filter((item) => item.isOverdue);
  };

  const calculateFineAmount = (daysOverdue: number): number => {
    // Simple fine calculation: $5 per day overdue
    return daysOverdue * 5;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const overdueItems = getOverdueItems();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Requests</Text>
        <Text style={styles.headerSubtitle}>
          Manage your item requests and overdue items
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requested" && styles.activeTab]}
          onPress={() => setActiveTab("requested")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requested" && styles.activeTabText,
            ]}
          >
            Requested Items ({requestedItems.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "overdue" && styles.activeTab]}
          onPress={() => setActiveTab("overdue")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "overdue" && styles.activeTabText,
            ]}
          >
            Overdue Items ({overdueItems.length})
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
        {activeTab === "requested" ? (
          <View style={styles.section}>
            {requestedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyStateTitle}>No Requested Items</Text>
                <Text style={styles.emptyStateText}>
                  You haven't requested any items yet. Start by exploring our
                  collection!
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => router.push("/(tabs)/explore")}
                >
                  <Text style={styles.exploreButtonText}>Explore Items</Text>
                </TouchableOpacity>
              </View>
            ) : (
              requestedItems.map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.itemCard}
                  onPress={() => handleItemPress(item, "requested")}
                >
                  <View style={styles.itemContent}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      <Text style={styles.itemSubtitle}>
                        Category: {item.category}
                      </Text>
                      {item.description && (
                        <Text style={styles.itemDescription} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}
                      <Text style={styles.itemDate}>
                        Requested on{" "}
                        {new Date(item.requestedAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${getStatusColor(item.status)}15`,
                          },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(item.status)}
                          size={16}
                          color={getStatusColor(item.status)}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) },
                          ]}
                        >
                          {item.status.charAt(0).toUpperCase() +
                            item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            {overdueItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-done-circle-outline"
                  size={64}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyStateTitle}>No Overdue Items</Text>
                <Text style={styles.emptyStateText}>
                  Great! You don't have any overdue items. Keep up the good
                  work!
                </Text>
              </View>
            ) : (
              overdueItems.map((item) => {
                const fineAmount = item.daysOverdue
                  ? calculateFineAmount(item.daysOverdue)
                  : 0;

                return (
                  <TouchableOpacity
                    key={item._id}
                    style={[styles.itemCard, styles.overdueCard]}
                    onPress={() => handleItemPress(item, "overdue")}
                  >
                    <View style={styles.overdueIndicator} />

                    <View style={styles.itemContent}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemTitle}>
                          {item.itemId.title}
                        </Text>
                        {item.itemId.description && (
                          <Text style={styles.itemSubtitle}>
                            {item.itemId.description}
                          </Text>
                        )}

                        <View style={styles.overdueDetails}>
                          <View style={styles.detailRow}>
                            <Ionicons
                              name="calendar-outline"
                              size={14}
                              color="#FF3B30"
                            />
                            <Text style={styles.overdueText}>
                              Due: {new Date(item.dueDate).toLocaleDateString()}
                            </Text>
                          </View>

                          <View style={styles.detailRow}>
                            <Ionicons
                              name="warning-outline"
                              size={14}
                              color="#FF3B30"
                            />
                            <Text style={styles.overdueText}>
                              {item.daysOverdue} days overdue
                            </Text>
                          </View>

                          {fineAmount > 0 && (
                            <View style={styles.detailRow}>
                              <Ionicons
                                name="cash-outline"
                                size={14}
                                color="#FF3B30"
                              />
                              <Text style={styles.overdueText}>
                                Fine: ${fineAmount}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.urgentBadge}>
                        <Ionicons
                          name="alert-circle"
                          size={20}
                          color="#FF3B30"
                        />
                        <Text style={styles.urgentText}>Urgent</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
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
  },
  header: {
    padding: 15,
    backgroundColor: COLORS.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.backgroundColor,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
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
  section: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B30",
  },
  overdueIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#FF3B30",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  itemDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusContainer: {
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
  overdueDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  overdueText: {
    fontSize: 12,
    color: "#FF3B30",
    fontWeight: "500",
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B3015",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 12,
    color: "#FF3B30",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
