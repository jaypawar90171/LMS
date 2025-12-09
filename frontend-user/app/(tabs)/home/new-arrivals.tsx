import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { TouchableOpacity } from "react-native";

export default function NewArrivalsScreen() {
  const { items } = useLocalSearchParams();
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    if (items) {
      try {
        setNewArrivals(JSON.parse(items as string));
      } catch (error) {
        console.error("Failed to parse items data");
        setNewArrivals([]);
      }
      setLoading(false);
    } else {
      fetchNewArrivals();
    }
  }, [items]);

  const fetchNewArrivals = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/items/new-arrivals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewArrivals(response.data.items || []);
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
        itemId: item._id,
        itemType: "new",
      },
    });
  };

  const handleRequestItem = async (item: any) => {
    if (!token || !user?.id) {
      Alert.alert("Error", "Authentication required");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/issue-requests`,
        {
          itemId: item._id,
          userId: user.id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert(
        "Success",
        `Your request for "${item.title}" has been submitted`
      );
    } catch (error: any) {
      if (error.response) {
        console.error(
          "Failed to submit item request. Server responded with error"
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

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <Text>Loading new arrivals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.headerRow}>
      <TouchableOpacity
        style={dynamicStyles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>

      <View style={{ flexShrink: 1 }}>
        <SectionHeader
          title="New Arrivals"
          count={newArrivals.length}
          showAction={false}
        />
      </View>
    </View>


      {newArrivals.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="sparkles-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateTitle}>No New Arrivals</Text>
          <Text style={dynamicStyles.emptyStateText}>
            Check back later for new items
          </Text>
        </View>
      ) : (
        newArrivals.map((item: any) => (
          <ItemCard
            key={item._id}
            title={item.title}
            subtitle={item.authorOrCreator}
            imageUrl={item.mediaUrl}
            status={item.status}
            statusColor={item.status === "Available" ? "#34C759" : "#FF9500"}
            showAction={true}
            actionText={item.status === "Available" ? "Request" : "Join Queue"}
            actionColor={colors.primary}
            onPress={() => handleItemPress(item)}
            onActionPress={() => handleRequestItem(item)}
          />
        ))
      )}
    </ScrollView>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  emptyState: {
    backgroundColor: colors.cardBackground,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
}
