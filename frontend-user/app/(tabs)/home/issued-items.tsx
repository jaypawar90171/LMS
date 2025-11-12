import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

export default function IssuedItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();

  const parsedItems = JSON.parse(items as string);

  const handleItemPress = (item: any) => {
    router.push({
      pathname: "/(stack)/item-details",
      params: {
        itemId: item.itemId?._id,
        itemType: "issued",
      },
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader
        title="All Issued Items"
        count={parsedItems.length}
        showAction={false}
      />

      {parsedItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyStateTitle}>No Issued Items</Text>
          <Text style={styles.emptyStateText}>
            You don't have any items issued at the moment
          </Text>
        </View>
      ) : (
        parsedItems.map((item: any) => (
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
            onPress={() => handleItemPress(item)}
          />
        ))
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
  emptyState: {
    backgroundColor: COLORS.cardBackground,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  emptyStateTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
