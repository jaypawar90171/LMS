import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { queueService } from "@/services/queueService";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useAtom } from "jotai";
import { userAtom } from "@/store/authStore";

export default function QueuedItemDetails() {
  const { queueId } = useLocalSearchParams();
  const [user] = useAtom(userAtom);

  const router = useRouter();
  const { colors } = useTheme();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const fetchDetails = async () => {
    try {
      const res = await queueService.getQueueDetails(queueId as string);
      setData(res.data.data);
    } catch {
      Alert.alert("Error", "Failed to load queue details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleWithdraw = async () => {
    Alert.alert("Confirm Withdrawal", "Are you sure you want to leave the queue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Withdraw",
        style: "destructive",
        onPress: async () => {
          try {
            await queueService.withdraw(queueId as string);
            Alert.alert("Success", "You have been removed from the queue.");
            router.back();
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to withdraw.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={dynamicStyles.loading}>
        <Text style={{ color: colors.textPrimary }}>No data found.</Text>
      </View>
    );
  }

  const item = data.itemId;

  const userEntry = data.queueMembers.find(
    (m: any) => m.userId?._id === user.id
  );
  const position = userEntry?.position;

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      
      {/* 🔹 Header Row: Back Button + Title */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
        </TouchableOpacity>

        <Text style={[dynamicStyles.headerTitle, { flexShrink: 1 }]}>
          Queue Details
        </Text>
      </View>

      {/* 🔹 Item Main Title */}
      <Text style={dynamicStyles.mainTitle}>{item?.title}</Text>

      {/* SECTION: Description */}
      {item?.description && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Description</Text>
          <Text style={dynamicStyles.value}>{item.description}</Text>
        </View>
      )}

      {/* SECTION: Category */}
      {item?.categoryId && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Category</Text>
          <Text style={dynamicStyles.value}>{item.categoryId.name}</Text>
        </View>
      )}

      {/* SECTION: Queue Info */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>Your Queue Position</Text>
        <Text style={dynamicStyles.value}>{position ?? "Not found"}</Text>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>Total People in Queue</Text>
        <Text style={dynamicStyles.value}>{data.queueMembers.length}</Text>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>Your Status</Text>
        <Text style={dynamicStyles.value}>{userEntry?.status ?? "N/A"}</Text>
      </View>

      {/* 🔹 Queue Members */}
      <Text style={dynamicStyles.subHeader}>Queue Members</Text>

      {data.queueMembers.map((m: any, index: number) => (
        <View key={index} style={dynamicStyles.memberCard}>
          <Text style={dynamicStyles.memberText}>
            Position {m.position} — {m.userId ? m.userId.fullName : "Empty Slot"}
          </Text>

          <Text style={dynamicStyles.memberSubText}>
            Status: {m.status}
          </Text>

          <Text style={dynamicStyles.memberSubText}>
            Joined: {new Date(m.dateJoined).toLocaleString()}
          </Text>
        </View>
      ))}

      {/* SECTION: Metadata */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>Created At</Text>
        <Text style={dynamicStyles.value}>
          {new Date(data.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.label}>Updated At</Text>
        <Text style={dynamicStyles.value}>
          {new Date(data.updatedAt).toLocaleString()}
        </Text>
      </View>

      {/* 🔴 Withdraw Button */}
      <TouchableOpacity style={dynamicStyles.withdrawBtn} onPress={handleWithdraw}>
        <Ionicons name="close-circle-outline" size={22} color="#fff" />
        <Text style={dynamicStyles.withdrawText}>Withdraw</Text>
      </TouchableOpacity>
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

    loading: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },

    /** 🔹 Header Row */
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      gap: 12,
    },
    backButton: {
      padding: 6,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },

    /** 🔹 Main Title */
    mainTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 10,
    },

    /** 🔹 Section Styling */
    section: {
      marginTop: 14,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 4,
    },
    value: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },

    /** 🔹 Subheader */
    subHeader: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 24,
      marginBottom: 10,
    },

    /** 🔹 Queue Member Cards */
    memberCard: {
      backgroundColor: colors.cardBackground,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    memberText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 4,
    },
    memberSubText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    withdrawBtn: {
      width: "100%",
      marginTop: 30,
      backgroundColor: "#FF3B30",
      padding: 14,
      borderRadius: 12,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginBottom: 24,
    },
    withdrawText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#fff",
    },
  });
}
