import ItemCard from "@/components/ItemCard";
import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function QueuedItemsList() {
  const { items } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  let queuedItems: any[] = [];
  try {
    queuedItems = JSON.parse(items as string);
  } catch (e) {
    console.log("Error parsing queued items:", e);
  }

  const handlePress = (queue: any) => {
    router.push({
      pathname: "/home/queued-item-details",
      params: { queueId: queue._id },
    });
  };

  if (!queuedItems?.length) {
    return (
      <View style={dynamicStyles.emptyContainer}>
        <Text style={dynamicStyles.emptyText}>No queued items found.</Text>
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

      <Text style={[dynamicStyles.header, { flexShrink: 1 }]}>
        Queued Items
      </Text>
    </View>


      {queuedItems.map((queue: any) => (
        <View key={queue._id} style={dynamicStyles.itemWrapper}>
          <ItemCard
            title={queue.itemId?.title}
            subtitle={queue.itemId?.typeSpecificFields?.author || queue.itemId?.itemType}
            imageUrl={queue.itemId?.typeSpecificFields?.image}
            status="Queued"
            statusColor={colors.primary}
            onPress={() => handlePress(queue)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    itemWrapper: {
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backButton: {
      padding: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 20,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: "600",
    },
  });
}
