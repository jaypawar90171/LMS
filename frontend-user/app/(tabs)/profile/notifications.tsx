import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface Notification {
  _id: string;
  title: string;
  message: {
    content: string;
  } | string; 
  type: string;
  level: "info" | "success" | "warning" | "error" | "Info" | "Success" | "Warning" | "Error";
  read: boolean;
  createdAt: string;
  metadata?: any;
  expiresAt?: string | null;
  updatedAt?: string;
  __v?: number;
}

type FilterType = "all" | "unread" | "read";
type NotificationType =
  | "all"
  | "borrowing"
  | "fines"
  | "system"
  | "promotional";

export default function NotificationsScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [selectionMode, setSelectionMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, filter, typeFilter, searchQuery]);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const filterNotifications = () => {
    let filtered = [...notifications];

    if (filter === "unread") {
      filtered = filtered.filter((notification) => {
        const read = notification.read || false;
        return !read;
      });
    } else if (filter === "read") {
      filtered = filtered.filter((notification) => {
        const read = notification.read || false;
        return read;
      });
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((notification) => {
        const category = getNotificationCategory(notification);
        return category === typeFilter;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((notification) => {
        const title = notification.title || "";
        const messageContent =
          typeof notification.message === "object" &&
          notification.message.content
            ? notification.message.content
            : typeof notification.message === "string"
            ? notification.message
            : "";

        return (
          title.toLowerCase().includes(query) ||
          messageContent.toLowerCase().includes(query)
        );
      });
    }

    setFilteredNotifications(filtered);
  };

  const getNotificationCategory = (
    notification: Notification
  ): NotificationType => {
    const type = notification.type || "";

    if (
      type.includes("borrow") ||
      type.includes("issue") ||
      type.includes("return")
    ) {
      return "borrowing";
    } else if (type.includes("fine") || type.includes("payment")) {
      return "fines";
    } else if (type.includes("system") || type.includes("maintenance")) {
      return "system";
    } else if (type.includes("promo") || type.includes("event")) {
      return "promotional";
    }
    return "system";
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "#34C759";
      case "warning":
        return "#FF9500";
      case "error":
        return "#FF3B30";
      case "info":
      default:
        return COLORS.primary;
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "success":
        return "checkmark-circle";
      case "warning":
        return "warning";
      case "error":
        return "alert-circle";
      case "info":
      default:
        return "information-circle";
    }
  };

  const getTypeIcon = (type: string) => {
    const category = getNotificationCategory({ type } as Notification);
    switch (category) {
      case "borrowing":
        return "book";
      case "fines":
        return "receipt";
      case "system":
        return "settings";
      case "promotional":
        return "megaphone";
      default:
        return "notifications";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleMarkAsRead = async (notificationId?: string) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/mark-as-read`,
        {
          notificationId: notificationId || undefined,
          markAll: !notificationId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        if (notificationId) {
          setNotifications((prev) =>
            prev.map((notif) =>
              notif._id === notificationId ? { ...notif, read: true } : notif
            )
          );
        } else {
          setNotifications((prev) =>
            prev.map((notif) => ({ ...notif, read: true }))
          );
        }
        setSelectedNotifications([]);
        setSelectionMode(false);

        Alert.alert("Success", response.data.data.message);
      }
    } catch (error: any) {
      console.error("Failed to mark as read:", error);
      Alert.alert("Error", "Failed to mark notification as read");
    }
  };

  const handleDeleteNotification = async (notificationId?: string) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          notificationId: notificationId || undefined,
          deleteAll: !notificationId,
        },
      });

      if (response.data.success) {
        if (notificationId) {
          setNotifications((prev) =>
            prev.filter((notif) => notif._id !== notificationId)
          );
        } else {
          setNotifications([]);
        }
        setSelectedNotifications([]);
        setSelectionMode(false);

        Alert.alert("Success", response.data.data.message);
      }
    } catch (error: any) {
      console.error("Failed to delete notification:", error);
      Alert.alert("Error", "Failed to delete notification");
    }
  };

  const confirmMarkAllAsRead = () => {
    Alert.alert(
      "Mark All as Read",
      "Are you sure you want to mark all notifications as read?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Mark All", onPress: () => handleMarkAsRead() },
      ]
    );
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      "Delete All Notifications",
      "This action cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: () => handleDeleteNotification(),
        },
      ]
    );
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectionAction = (action: "read" | "delete") => {
    if (action === "read") {
      selectedNotifications.forEach((id) => handleMarkAsRead(id));
    } else {
      Alert.alert(
        "Delete Selected",
        `Delete ${selectedNotifications.length} notification(s)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              selectedNotifications.forEach((id) =>
                handleDeleteNotification(id)
              );
            },
          },
        ]
      );
    }
  };

  const getUnreadCount = () => {
    return notifications.filter((notif) => {
      const read = notif.read || false;
      return !read;
    }).length;
  };

  const renderNotificationItem = (
    notification: Notification,
    index: number
  ) => {
    const isSelected = selectedNotifications.includes(notification._id);

    const title = notification.title || "Notification";
    const message =
      typeof notification.message === "object" && notification.message.content
        ? notification.message.content
        : typeof notification.message === "string"
        ? notification.message
        : "";
    const level = notification.level || "info";
    const type = notification.type || "system";
    const read = notification.read || false;
    const createdAt = notification.createdAt || new Date().toISOString();

    return (
      <Animated.View
        key={notification._id}
        style={[
          styles.notificationCard,
          !read && styles.unreadNotification,
          isSelected && styles.selectedNotification,
          { opacity: fadeAnim },
        ]}
      >
        {selectionMode && (
          <TouchableOpacity
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            onPress={() => toggleNotificationSelection(notification._id)}
          >
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
          </TouchableOpacity>
        )}

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.titleContainer}>
              <Ionicons
                name={getLevelIcon(level)}
                size={16}
                color={getLevelColor(level)}
              />
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <View style={styles.notificationActions}>
              {!read && !selectionMode && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleMarkAsRead(notification._id)}
                >
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
              {!selectionMode && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteNotification(notification._id)}
                >
                  <Ionicons
                    name="close"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.notificationMessage} numberOfLines={3}>
            {message}
          </Text>

          <View style={styles.notificationFooter}>
            <View style={styles.typeBadge}>
              <Ionicons
                name={getTypeIcon(type)}
                size={12}
                color={COLORS.textSecondary}
              />
              <Text style={styles.typeText}>
                {getNotificationCategory(notification)}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatDate(createdAt)}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const unreadCount = getUnreadCount();

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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && !selectionMode && (
            <TouchableOpacity
              style={styles.headerAction}
              onPress={confirmMarkAllAsRead}
            >
              <Ionicons
                name="checkmark-done"
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => setSelectionMode(!selectionMode)}
            >
              <Ionicons
                name={selectionMode ? "close" : "checkbox-outline"}
                size={20}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Selection Mode Bar */}
      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedNotifications.length} selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleSelectionAction("read")}
              disabled={selectedNotifications.length === 0}
            >
              <Ionicons name="checkmark" size={18} color={COLORS.primary} />
              <Text style={styles.selectionActionText}>Mark Read</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={() => handleSelectionAction("delete")}
              disabled={selectedNotifications.length === 0}
            >
              <Ionicons name="trash" size={18} color="#FF3B30" />
              <Text style={[styles.selectionActionText, { color: "#FF3B30" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search and Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notifications..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={18} color={COLORS.primary} />
          {filter !== "all" || typeFilter !== "all" ? (
            <View style={styles.filterIndicator} />
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Quick Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
      >
        {(["all", "unread", "read"] as FilterType[]).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.quickFilter,
              filter === filterType && styles.quickFilterActive,
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text
              style={[
                styles.quickFilterText,
                filter === filterType && styles.quickFilterTextActive,
              ]}
            >
              {filterType === "all"
                ? "All"
                : filterType === "unread"
                ? `Unread (${unreadCount})`
                : "Read"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.errorTitle}>Unable to Load Notifications</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchNotifications}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              {searchQuery || filter !== "all" || typeFilter !== "all"
                ? "No matching notifications"
                : "No notifications"}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery || filter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "You're all caught up! New notifications will appear here."}
            </Text>
            {(searchQuery || filter !== "all" || typeFilter !== "all") && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSearchQuery("");
                  setFilter("all");
                  setTypeFilter("all");
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {filteredNotifications.map(renderNotificationItem)}
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Notifications</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {(["all", "unread", "read"] as FilterType[]).map((filterType) => (
                <TouchableOpacity
                  key={filterType}
                  style={styles.filterOption}
                  onPress={() => setFilter(filterType)}
                >
                  <Ionicons
                    name={
                      filter === filterType
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      filter === filterType
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.filterOptionText}>
                    {filterType === "all"
                      ? "All Notifications"
                      : filterType === "unread"
                      ? `Unread (${unreadCount})`
                      : "Read Only"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Type</Text>
              {(
                [
                  "all",
                  "borrowing",
                  "fines",
                  "system",
                  "promotional",
                ] as NotificationType[]
              ).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.filterOption}
                  onPress={() => setTypeFilter(type)}
                >
                  <Ionicons
                    name={
                      typeFilter === type
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      typeFilter === type
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.filterOptionText}>
                    {type === "all"
                      ? "All Types"
                      : type === "borrowing"
                      ? "Borrowing"
                      : type === "fines"
                      ? "Fines & Payments"
                      : type === "system"
                      ? "System"
                      : "Promotional"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setFilter("all");
                setTypeFilter("all");
              }}
            >
              <Text style={styles.secondaryButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.primaryButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerAction: {
    padding: 4,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  selectionActions: {
    flexDirection: "row",
    gap: 16,
  },
  selectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectionActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterButton: {
    padding: 8,
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  quickFilters: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  quickFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  quickFilterActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  quickFilterTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  notificationsList: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  selectedNotification: {
    backgroundColor: `${COLORS.primary}10`,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    flex: 1,
  },
  notificationActions: {
    flexDirection: "row",
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.primary,
    textTransform: "capitalize",
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  bottomSpacer: {
    height: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
