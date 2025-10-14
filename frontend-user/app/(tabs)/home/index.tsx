"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Alert,
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

  // Quick Actions Handlers
  const handleScan = () => {
    Alert.alert("Scan", "Scan functionality coming soon!");
  };

  const handleRequestBook = () => {
    Alert.alert("Request Book", "Book request functionality coming soon!");
  };

  const handleDonate = () => {
    Alert.alert("Donate", "Donation functionality coming soon!");
  };

  if (loading) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { height: 90 }]} />
        <View style={[styles.card, { height: 40 }]} />
        <View style={[styles.card, { height: 140 }]} />
        <View style={[styles.card, { height: 140 }]} />
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
        { borderColor: color, backgroundColor: `${color}15` },
      ]}
    >
      <View style={styles.overviewTop}>
        <View style={[styles.iconBadge, { backgroundColor: `${color}22` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      </View>
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
      {/* Welcome Header */}
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
        <Ionicons name="library-outline" size={28} color={COLORS.primary} />
      </View>

      {/* Overview */}
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
            size={24}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No currently issued items</Text>
        </View>
      ) : (
        getCurrentIssuedItems().map((item: any) => (
          <ItemCard
            key={item._id}
            title={item.itemId?.title || "Unknown Title"}
            subtitle={item.itemId?.authorOrCreator}
            imageUrl={item.itemId?.mediaUrl}
            status={item.status || "Issued"}
            statusColor={item.isOverdue ? "#FF3B30" : COLORS.primary}
            dueInfo={
              item.isOverdue
                ? `Overdue by ${item.daysOverdue} days`
                : `Due in ${item.daysRemaining} days`
            }
            showOverdue={!!item.isOverdue}
            onPress={() => handleItemPress(item, "issued")}
          />
        ))
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
            size={24}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateText}>No items in queue</Text>
        </View>
      ) : (
        getQueuedItems().map((item: any) => {
          const pos =
            typeof item.position === "number"
              ? `Position ${item.position}`
              : undefined;
          const wait = item.estimatedWaitTime
            ? ` • ${item.estimatedWaitTime}`
            : "";
          return (
            <ItemCard
              key={item._id}
              title={item.itemId?.title || "Unknown Title"}
              subtitle={item.itemId?.authorOrCreator}
              imageUrl={item.itemId?.mediaUrl}
              positionInfo={`${pos || "In queue"}${wait}`}
              status={`Queue Size: ${item.totalQueueLength ?? "-"}`}
              statusColor={"#FF9500"}
              onPress={() => handleItemPress(item, "queued")}
            />
          );
        })
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
            size={24}
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
        <QuickActionButton
          icon="scan-outline"
          title="Scan to Issue/Return"
          onPress={handleScan}
        />
        <QuickActionButton
          icon="add-circle-outline"
          title="Request a Book"
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
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
    marginTop: 12,
    marginBottom: 8,
  },
  overviewCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  overviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  overviewLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  emptyState: {
    backgroundColor: COLORS.cardBackground,
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 8,
    gap: 8,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
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
    paddingVertical: 16,
    marginHorizontal: -4,
  },
  newArrivalCard: {
    width: 280,
    marginRight: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 32,
  },
});
