import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

export default function QueuedItemsScreen() {
  const { items } = useLocalSearchParams();
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  const [queuedItems, setQueuedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items) {
      setQueuedItems(JSON.parse(items as string));
      setLoading(false);
    } else {
      fetchQueuedItems();
    }
  }, [items]);

  const fetchQueuedItems = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/items/queues/queued`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueuedItems(response.data.data || []);
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
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item: any) => {
    router.push({
      pathname: "/(stack)/item-details",
      params: {
        itemId: item.itemId?._id || item._id,
        itemType: "queued",
        queueId: item._id,
      },
    });
  };

  const handleWithdrawFromQueue = async (
    queueId: string,
    itemTitle: string
  ) => {
    if (!token) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      Alert.alert(
        "Leave Queue",
        `Are you sure you want to leave the queue for "${itemTitle}"?`,
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

                // Remove item from local state
                setQueuedItems((prev: any[]) =>
                  prev.filter((item: any) => item._id !== queueId)
                );

                Alert.alert("Success", "You have been removed from the queue");
              } catch (error: any) {
                if (error.response) {
                  console.error(
                    "Failed to fetch new arrivals. Server responded with:",
                    error.response.data
                  );

                  const errorMessage =
                    error.response.data.message ||
                    "Failed to load new arrivals";
                  Alert.alert("Error", errorMessage);
                } else if (error.request) {
                  console.error(
                    "Failed to fetch new arrivals. No response from server:",
                    error.request
                  );
                  Alert.alert(
                    "Network Error",
                    "Could not connect to the server."
                  );
                } else {
                  console.error("Error setting up the request:", error.message);
                  Alert.alert("Error", "An unexpected error occurred.");
                }
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error showing confirmation:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading queued items...</Text>
      </View>
    );
  }

  console.log(queuedItems);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader
        title="Queued Items"
        count={queuedItems.length}
        showAction={false}
      />

      {queuedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="time-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateTitle}>No Items in Queue</Text>
          <Text style={styles.emptyStateText}>
            You are not waiting for any items
          </Text>
        </View>
      ) : (
        queuedItems.map((item: any) => {
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
              showAction={true}
              actionText="Leave Queue"
              actionColor="#FF3B30"
              onPress={() => handleItemPress(item)}
              onActionPress={() =>
                handleWithdrawFromQueue(
                  item._id,
                  item.itemId?.title || "this item"
                )
              }
            />
          );
        })
      )}
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
  emptyState: {
    backgroundColor: COLORS.cardBackground,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
