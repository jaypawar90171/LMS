"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { useRouter } from "expo-router";
import SectionHeader from "@/components/SectionHeader";
import ItemCard from "@/components/ItemCard";
import QuickActionButton from "@/components/QuickActionButton";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface DashboardData {
  user?: {
    fullName: string;
    roles: string[];
  };
  issuedItems?: {
    current: any[];
    overdue: any[];
  };
  queuedItems?: any[];
  newArrivals?: any[];
}

export default function HomeScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();

  const fetchDashboardData = async () => {
    if (!user?.id || !token) {
      console.log("Missing user ID or token");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data.data);

      const notifResponse = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (notifResponse.data.success) {
        const notifications = notifResponse.data.data.notifications || [];
        const unread = notifications.filter((notif: any) => !notif.read).length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to fetch dashboard. Server responded with:",
          error.response.data
        );
        const errorMessage =
          error.response.data.message || "Failed to load dashboard data";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        console.error(
          "Failed to fetch dashboard. No response from server:",
          error.request
        );
        Alert.alert("Network Error", "Could not connect to the server.");
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!token) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const notifications = response.data.data.notifications || [];
          const unread = notifications.filter(
            (notif: any) => !notif.read
          ).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
      }
    };

    if (token) {
      fetchUnreadCount();
    }
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleViewAllIssued = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      const issuedItems = [
        ...(dashboardData?.issuedItems?.current || []),
        ...(dashboardData?.issuedItems?.overdue || []),
      ];

      const response = await axios.get(`${API_BASE_URL}/items/issued`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push({
        pathname: "/(tabs)/home/issued-items",
        params: { items: JSON.stringify(issuedItems) },
      });
    } catch (error: any) {
      console.error("Error navigating to issued items:", error);
      Alert.alert("Error", "Could not load issued items.");
    }
  };

  const handleViewAllQueued = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/items/queues/queued`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push({
        pathname: "/(tabs)/home/queued-items",
        params: { items: JSON.stringify(dashboardData?.queuedItems || []) },
      });
    } catch (error: any) {
      console.error("Error navigating to queued items:", error);
      Alert.alert("Error", "Could not load queued items.");
    }
  };

  const handleViewAllNewArrivals = async () => {
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/items/new-arrivals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      router.push({
        pathname: "/(tabs)/home/new-arrivals",
        params: { items: JSON.stringify(response.data.items || []) },
      });
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to fetch new arrivals. Server responded with:",
          error.response.data
        );
        const errorMessage =
          error.response.data.message || "Failed to load new arrivals";
        Alert.alert("Error", errorMessage);
      } else if (error.request) {
        console.error(
          "Failed to fetch new arrivals. No response from server:",
          error.request
        );
        Alert.alert("Network Error", "Could not connect to the server.");
      } else {
        console.error("Error setting up the request:", error.message);
        Alert.alert("Error", "An unexpected error occurred.");
      }
    }
  };

  const handleItemPress = (
    item: any,
    type: "issued" | "queued" | "new" | "overdue"
  ) => {
    router.push({
      pathname: "/(tabs)/home/item-details",
      params: {
        itemId: item.itemId?._id || item._id,
        itemType: type,
        queueId: type === "queued" ? item._id : undefined,
      },
    });
  };

  const handleRequestBook = () => {
    router.push({
      pathname: "/(tabs)/home/request-new-item",
    });
  };

  const handleDonate = () => {
    router.push({
      pathname: "/(tabs)/home/donate-item",
    });
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { height: 90 }]} />
        <View style={[styles.card, { height: 40 }]} />
        <View style={[styles.card, { height: 280 }]} />
        <View style={[styles.card, { height: 280 }]} />
      </ScrollView>
    );
  }

  const OverviewCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: any;
    label: string;
    value: number;
    color: string;
  }) => (
    <View
      style={[
        styles.overviewCard,
        { borderColor: color, backgroundColor: `${color}10` },
      ]}
    >
      <View style={[styles.iconBadge, { backgroundColor: `${color}25` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );

  const RoleChip = ({ text }: { text: string }) => (
    <View style={styles.roleChip}>
      <Ionicons
        name="shield-checkmark-outline"
        size={12}
        color={COLORS.textSecondary}
      />
      <Text style={styles.roleChipText}>{text}</Text>
    </View>
  );

  const displayName = dashboardData?.user?.fullName || user?.fullName || "User";
  const roles = dashboardData?.user?.roles || [];

  const getCurrentIssuedItems = () => dashboardData?.issuedItems?.current || [];
  const getOverdueItems = () => dashboardData?.issuedItems?.overdue || [];
  const getQueuedItems = () => dashboardData?.queuedItems || [];
  const getNewArrivals = () => dashboardData?.newArrivals || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeText}>Welcome, {displayName} 👋</Text>
          <Text style={styles.subtitle}>
            Manage your library items efficiently
          </Text>
          {roles.length > 0 && (
            <View style={styles.rolesRow}>
              {roles.slice(0, 3).map((r) => (
                <RoleChip key={r} text={r} />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.notificationIconContainer}
          onPress={() => router.push("/(tabs)/profile/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={COLORS.primary}
          />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.overviewGrid}>
        <OverviewCard
          icon="document-text-outline"
          label="Issued"
          value={getCurrentIssuedItems().length}
          color={COLORS.primary}
        />
        <OverviewCard
          icon="alert-circle-outline"
          label="Overdue"
          value={getOverdueItems().length}
          color={"#FF3B30"}
        />
        <OverviewCard
          icon="time-outline"
          label="Queued"
          value={getQueuedItems().length}
          color={"#FF9500"}
        />
        <OverviewCard
          icon="sparkles-outline"
          label="New"
          value={getNewArrivals().length}
          color={"#34C759"}
        />
      </View>

      {/* Currently Issued Items */}
      <SectionHeader
        title="Currently Issued"
        count={getCurrentIssuedItems().length}
        showAction={getCurrentIssuedItems().length > 0}
        actionText={`View All (${getCurrentIssuedItems().length})`}
        onActionPress={handleViewAllIssued}
      />

      {getCurrentIssuedItems().length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No currently issued items</Text>
        </View>
      ) : (
        <>
          {/* Show only the first item */}
          <ItemCard
            key={getCurrentIssuedItems()[0]._id}
            title={getCurrentIssuedItems()[0].itemId?.title || "Unknown Title"}
            subtitle={getCurrentIssuedItems()[0].itemId?.authorOrCreator}
            imageUrl={getCurrentIssuedItems()[0].itemId?.mediaUrl}
            status={getCurrentIssuedItems()[0].status || "Issued"}
            statusColor={
              getCurrentIssuedItems()[0].isOverdue ? "#FF3B30" : COLORS.primary
            }
            dueInfo={
              getCurrentIssuedItems()[0].isOverdue
                ? `Overdue by ${getCurrentIssuedItems()[0].daysOverdue} days`
                : `Due in ${getCurrentIssuedItems()[0].daysRemaining} days`
            }
            showOverdue={!!getCurrentIssuedItems()[0].isOverdue}
            onPress={() =>
              handleItemPress(getCurrentIssuedItems()[0], "issued")
            }
          />
        </>
      )}

      {/* Overdue Items */}
      {getOverdueItems().length > 0 && (
        <>
          <SectionHeader
            title="Overdue Items"
            count={getOverdueItems().length}
            showAction={true}
            actionText={`View All (${getOverdueItems().length})`}
            onActionPress={handleViewAllIssued}
          />
          {getOverdueItems().map((item: any) => (
            <ItemCard
              key={item._id}
              title={item.itemId?.title || "Unknown Title"}
              subtitle={item.itemId?.authorOrCreator}
              imageUrl={item.itemId?.mediaUrl}
              status="Overdue"
              statusColor="#FF3B30"
              dueInfo={`Overdue by ${item.daysOverdue} days`}
              showOverdue={true}
              onPress={() => handleItemPress(item, "overdue")}
            />
          ))}
        </>
      )}

      {/* Queued Items */}
      <SectionHeader
        title="Currently Queued"
        count={getQueuedItems().length}
        showAction={getQueuedItems().length > 0}
        actionText={`View All (${getQueuedItems().length})`}
        onActionPress={handleViewAllQueued}
      />

      {getQueuedItems().length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="time-outline"
            size={32}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No items in queue</Text>
        </View>
      ) : (
        <>
          {/* Show only the first queued item */}
          {(() => {
            const firstItem = getQueuedItems()[0];
            const pos =
              typeof firstItem.position === "number"
                ? `Position ${firstItem.position}`
                : undefined;
            const wait = firstItem.estimatedWaitTime
              ? ` • ${firstItem.estimatedWaitTime}`
              : "";
            return (
              <ItemCard
                key={firstItem._id}
                title={firstItem.itemId?.title || "Unknown Title"}
                subtitle={firstItem.itemId?.authorOrCreator}
                imageUrl={firstItem.itemId?.mediaUrl}
                positionInfo={`${pos || "In queue"}${wait}`}
                status={`Queue Size: ${firstItem.totalQueueLength ?? "-"}`}
                statusColor={"#FF9500"}
                onPress={() => handleItemPress(firstItem, "queued")}
              />
            );
          })()}
        </>
      )}

      {/* New Arrivals */}
      <SectionHeader
        title="New Arrivals"
        count={getNewArrivals().length}
        showAction={getNewArrivals().length > 0}
        actionText={`Explore (${getNewArrivals().length})`}
        onActionPress={handleViewAllNewArrivals}
      />

      {getNewArrivals().length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="sparkles-outline"
            size={32}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No new arrivals</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.horizontalScroll}>
            {getNewArrivals().map((item: any) => (
              <View key={item._id} style={styles.newArrivalCard}>
                <ItemCard
                  title={item.title}
                  subtitle={item.authorOrCreator}
                  imageUrl={item.mediaUrl}
                  status={item.status}
                  statusColor={
                    item.status === "Available" ? "#34C759" : "#FF9500"
                  }
                  onPress={() => handleItemPress(item, "new")}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" showAction={false} />
      <View style={styles.quickActionsContainer}>
        {/* <QuickActionButton
          icon="scan-outline"
          title="Scan to Issue/Return"
          onPress={handleScan}
        /> */}
        <QuickActionButton
          icon="add-circle-outline"
          title="Request New Item"
          onPress={handleRequestBook}
        />
        <QuickActionButton
          icon="heart-outline"
          title="Donate Item"
          onPress={handleDonate}
        />
        {roles.some((r) => ["Admin", "Librarian", "Manager"].includes(r)) && (
          <QuickActionButton
            icon="construct-outline"
            title="Manage Inventory"
            onPress={() => Alert.alert("Admin", "Open inventory management")}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  welcomeCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  moreItemsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    gap: 8,
  },
  moreItemsText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  rolesRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: COLORS.inputBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    width: "48%",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  overviewLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  notificationIconContainer: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyState: {
    backgroundColor: COLORS.cardBackground,
    padding: 32,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 20,
    gap: 12,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
  },
  horizontalScroll: {
    flexDirection: "row",
    paddingVertical: 8,
    gap: 12,
  },
  newArrivalCard: {
    width: 300,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
    marginBottom: 32,
    gap: 12,
  },
});
