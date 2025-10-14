"use client";

import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  type ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { tokenAtom } from "@/store/authStore";
import apiClient from "@/constants/api";
import type { ICategory } from "@/interface/categories.interface";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";

export default function Explore() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await apiClient.get("/inventory/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };
    if (token) getCategories();
  }, [token]);

  const parentCategories = useMemo(
    () => categories.filter((c) => c.categoryType === "parent"),
    [categories]
  );

  const handleCategoryPress = (category: ICategory) => {
    router.push({
      pathname: "/(tabs)/explore/category-details",
      params: {
        categoryId: category._id,
        categoryName: category.name,
        categoryType: category.categoryType,
      },
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "books":
        return "library-outline";
      case "electronics":
        return "hardware-chip-outline";
      case "tools":
        return "construct-outline";
      case "kitchen accessories":
        return "restaurant-outline";
      case "sports equipment":
        return "basketball-outline";
      case "toys":
        return "game-controller-outline";
      case "furniture":
        return "bed-outline";
      case "clothes":
        return "shirt-outline";
      default:
        return "grid-outline";
    }
  };

  const getSubcategoryCount = (parentCategory: ICategory) => {
    return categories.filter(
      (cat) =>
        cat.categoryType === "subcategory" &&
        (typeof cat.parentCategoryId === "object"
          ? cat.parentCategoryId?._id === parentCategory._id
          : cat.parentCategoryId === parentCategory._id)
    ).length;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading categories...</Text>
      </View>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<ICategory>) => {
    const count = getSubcategoryCount(item);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(item.name)}
            size={32}
            color={COLORS.primary}
          />
        </View>

        <Text style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.countPill}>
            <Ionicons
              name="albums-outline"
              size={14}
              color={COLORS.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.countText}>{count} categories</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore Library</Text>

      <FlatList
        data={parentCategories}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="grid-outline"
              size={48}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyStateTitle}>No Categories Available</Text>
            <Text style={styles.emptyStateText}>
              Categories will appear here once they are added to the system.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const CARD_HEIGHT = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  categoryCard: {
    width: "48%",
    height: CARD_HEIGHT,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "space-between",
    // subtle depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}12`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}26`,
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 24,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
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
