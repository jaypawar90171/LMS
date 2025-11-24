import { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

export default function IssuedItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();

  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

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
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <SectionHeader
        title="All Issued Items"
        count={parsedItems.length}
        showAction={false}
      />

      {parsedItems.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateTitle}>No Issued Items</Text>
          <Text style={dynamicStyles.emptyStateText}>
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
            statusColor={item.isOverdue ? "#FF3B30" : colors.primary}
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

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  emptyState: {
    backgroundColor: colors.cardBackground,
    padding: 40,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyStateTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

}