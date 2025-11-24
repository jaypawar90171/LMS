"use client";

import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { tokenAtom } from "@/store/authStore";
import apiClient from "@/constants/api";
import type { ICategory } from "@/interface/categories.interface";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

export default function CategoryDetailsScreen() {
  const { categoryId, categoryName, categoryType } = useLocalSearchParams();
  const [subCategories, setSubCategories] = useState<ICategory[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesResponse = await apiClient.get(
          "/inventory/categories",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const allCategories = categoriesResponse.data.data;

        const subs = allCategories.filter((cat: ICategory) => {
          if (cat.categoryType !== "subcategory" || !cat.parentCategoryId) {
            return false;
          }
          if (
            typeof cat.parentCategoryId === "object" &&
            cat.parentCategoryId !== null
          ) {
            return cat.parentCategoryId._id === categoryId;
          }
          if (typeof cat.parentCategoryId === "string") {
            return cat.parentCategoryId === categoryId;
          }
          return false;
        });

        setSubCategories(subs);

        if (subs.length === 0) {
          const itemsResponse = await apiClient.get(
            `/inventory/categories/items/${categoryId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setItems(itemsResponse.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching category details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, categoryId]);

  const handleSubcategoryPress = (subcategory: ICategory) => {
    router.push({
      pathname: "/(tabs)/explore/items-list",
      params: {
        categoryId: subcategory._id,
        categoryName: subcategory.name,
      },
    });
  };

  const handleViewItems = () => {
    router.push({
      pathname: "/(tabs)/explore/items-list",
      params: {
        categoryId: categoryId as string,
        categoryName: categoryName as string,
      },
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case "horror":
        return "skull-outline";
      case "thriller":
        return "flash-outline";
      case "fiction":
        return "book-outline";
      case "non-fiction":
        return "document-text-outline";
      default:
        return "folder-outline";
    }
  };

  if (loading) {
    return (
      <View style={dynamicStyles.centered}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{categoryName}</Text>
        <Text style={dynamicStyles.subtitle}>
          {subCategories.length > 0
            ? `${subCategories.length} subcategories`
            : `${items.length} items available`}
        </Text>
        {/* Subtle accent underline for structure */}
        <View style={dynamicStyles.headerAccent} />
      </View>

      {subCategories.length > 0 ? (
        <>
          <Text style={dynamicStyles.sectionTitle}>Subcategories</Text>
          <View style={dynamicStyles.categoriesGrid}>
            {subCategories.map((subcategory) => (
              <TouchableOpacity
                key={subcategory._id}
                style={dynamicStyles.categoryCard}
                onPress={() => handleSubcategoryPress(subcategory)}
                activeOpacity={0.9}
              >
                <View style={dynamicStyles.iconRow}>
                  <View style={dynamicStyles.iconContainer}>
                    <Ionicons
                      name={getCategoryIcon(subcategory.name)}
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.textSecondary}
                  />
                </View>

                <Text style={dynamicStyles.categoryName} numberOfLines={1}>
                  {subcategory.name}
                </Text>
                {!!subcategory.description && (
                  <Text style={dynamicStyles.categoryDescription} numberOfLines={2}>
                    {subcategory.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text style={dynamicStyles.sectionTitle}>Items</Text>
          {items.length > 0 ? (
            <TouchableOpacity
              style={dynamicStyles.viewItemsButton}
              onPress={handleViewItems}
              activeOpacity={0.9}
            >
              <Ionicons name="list-outline" size={24} color={colors.primary} />
              <Text style={dynamicStyles.viewItemsText}>
                View All Items ({items.length})
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ) : (
            <View style={dynamicStyles.emptyState}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={dynamicStyles.emptyStateTitle}>No Items Available</Text>
              <Text style={dynamicStyles.emptyStateText}>
                There are no items in this category yet.
              </Text>
            </View>
          )}
        </>
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
  viewItemsText: {

  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20, 
  },
  headerAccent: {
    marginTop: 8,
    height: 3,
    width: 48,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 140, // Increased visual weight
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  viewItemsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

}