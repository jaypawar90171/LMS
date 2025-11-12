"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  type ListRenderItemInfo,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { tokenAtom } from "@/store/authStore";
import apiClient from "@/constants/api";
import type { ICategory } from "@/interface/categories.interface";
import { Ionicons } from "@expo/vector-icons";
import { RefreshControl } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import COLORS from "@/constants/color";

export default function Explore() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("")
  const [refreshing, setRefreshing] = useState(false);
  const [token] = useAtom(tokenAtom);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sortBy, setSortBy] = useState<"name" | "subcount">("name");
  const router = useRouter();

  const getCategories = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const response = await apiClient.get("/inventory/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    if (token) getCategories();
  }, [token, getCategories]);

  const parentCategories = useMemo(
    () => categories.filter((c) => c.categoryType === "parent"),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    let filtered = parentCategories.filter((cat) => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      const getSubcategoryCount = (parentCategory: ICategory) => {
        return categories.filter(
          (cat) =>
            cat.categoryType === "subcategory" &&
            (typeof cat.parentCategoryId === "object"
              ? cat.parentCategoryId?._id === parentCategory._id
              : cat.parentCategoryId === parentCategory._id)
        ).length;
      };
      if (sortBy === "subcount") return getSubcategoryCount(b) - getSubcategoryCount(a);  
      return 0;
    });
    
    return filtered;
  }, [parentCategories, searchQuery, sortBy, categories]);

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

  // Simple custom skeleton component
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonIconContainer} />
      <View style={styles.skeletonText} />
    </View>
  );

  const SkeletonSearch = () => (
    <View style={styles.searchBar}>
      <View style={{ width: 20, height: 20, borderRadius: 10, marginRight: 8, backgroundColor: COLORS.textSecondary }} />
      <View style={{ flex: 1, height: 16, borderRadius: 8, backgroundColor: COLORS.textSecondary }} />
    </View>
  );

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>Loading categories...</Text>
          {/* Optional: Add skeleton UI for better UX */}
          <View style={styles.searchContainer}>
            <SkeletonSearch />
            <View style={styles.filterButton} />
          </View>
          <FlatList
            data={Array(4).fill({})}  
            numColumns={2}
            keyExtractor={(_, i) => i.toString()}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<ICategory>) => {
    const count = getSubcategoryCount(item);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        accessibilityLabel={`Explore ${item.name} category`}
        accessibilityRole="button"
        accessibilityHint={`${count} subcategories available`}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(item.name)}
            size={40}  
            color={COLORS.primary}
          />
        </View>
  
        <Text style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>
  
        {count > 0 && (
          <View style={styles.metaRow}>
            <View style={styles.countPill}>
              <Text style={styles.countText}>{count} subcategories</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.container}>
      <Text 
        style={styles.header} 
        accessibilityRole="header"
        accessibilityLabel="Explore Library"
      >
        Explore Library
      </Text>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search categories"
            accessibilityHint="Type to filter category list"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => bottomSheetRef.current?.expand()}
          accessibilityLabel="Filter categories"
        >
          <Ionicons name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item._id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => getCategories(true)}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateTitle}>No Matching Categories</Text>
              <Text style={styles.emptyStateText}>Try adjusting your search terms.</Text>
            </View>
          ) : (
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
          )
        }
      />
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["25%", "50%"]}
        backgroundStyle={{ backgroundColor: COLORS.cardBackground }}
        handleIndicatorStyle={{ backgroundColor: COLORS.border }}
      >
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16, color: COLORS.textPrimary }}>Sort By</Text>
          <TouchableOpacity 
            style={[styles.filterOption, sortBy === "name" && styles.activeFilter]}
            onPress={() => { setSortBy("name"); bottomSheetRef.current?.close(); }}
          >
            <Text style={{ color: COLORS.textPrimary }}>Name (A-Z)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterOption, sortBy === "subcount" && styles.activeFilter]}
            onPress={() => { setSortBy("subcount"); bottomSheetRef.current?.close(); }}
          >
            <Text style={{ color: COLORS.textPrimary }}>Subcategories (Most First)</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
    </GestureHandlerRootView>
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
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  activeFilter: {
    backgroundColor: `${COLORS.primary}10`,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  loadingText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-around",
    gap: 12,
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
    flexDirection: "column",  
    justifyContent: "center",  
    alignItems: "center",     
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
    marginBottom: 12
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center", 
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  // Skeleton styles
  skeletonCard: {
    width: "48%",
    height: CARD_HEIGHT,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "column",  
    justifyContent: "center",  
    alignItems: "center",     
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  skeletonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.textSecondary,
    marginBottom: 12
  },
  skeletonText: {
    height: 16,
    width: "60%",
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
});