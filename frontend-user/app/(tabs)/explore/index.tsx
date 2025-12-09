// file: index.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  type ListRenderItemInfo,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { tokenAtom } from '@/store/authStore';
import apiClient from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from "@/context/ThemeContext";

export interface IMobileCategory {
  _id: string;
  name: string;
  description?: string;
  parentCategoryId: string | null;
  itemCount: number;
  availableCount: number;
  defaultReturnPeriod?: number;
}

export default function Explore() {
  const [categories, setCategories] = useState<IMobileCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [token] = useAtom(tokenAtom);
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [sortBy, setSortBy] = useState<'name' | 'subcount' | 'items'>('name');
  const router = useRouter();

  const getCategories = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const response = await apiClient.get('/api/mobile/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data: IMobileCategory[] = response.data?.data || [];
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (token) getCategories();
  }, [token, getCategories]);

  const parentCategories = useMemo(
    () => categories.filter((c) => !c.parentCategoryId),
    [categories]
  );

  const getSubcategoryCount = useCallback(
    (parentCategory: IMobileCategory) =>
      categories.filter(
        (cat) => cat.parentCategoryId === parentCategory._id
      ).length,
    [categories]
  );

  const filteredCategories = useMemo(() => {
    let filtered = parentCategories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);

      if (sortBy === 'subcount') {
        const subA = getSubcategoryCount(a);
        const subB = getSubcategoryCount(b);
        return subB - subA;
      }

      if (sortBy === 'items') {
        return (b.itemCount || 0) - (a.itemCount || 0);
      }

      return 0;
    });

    return filtered;
  }, [parentCategories, searchQuery, sortBy, getSubcategoryCount]);

  const handleCategoryPress = (category: IMobileCategory) => {
    router.push({
      pathname: '/(tabs)/explore/category-details',
      params: {
        categoryId: category._id,
        categoryName: category.name,
      },
    });
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName.toLowerCase()) {
      case 'books':
      case 'books & literature':
        return 'library-outline';
      case 'electronics':
        return 'hardware-chip-outline';
      case 'tools':
        return 'construct-outline';
      case 'kitchen accessories':
        return 'restaurant-outline';
      case 'sports equipment':
        return 'basketball-outline';
      case 'toys':
        return 'game-controller-outline';
      case 'furniture':
        return 'bed-outline';
      case 'clothes':
        return 'shirt-outline';
      default:
        return 'grid-outline';
    }
  };

  const SkeletonCard = () => (
    <View style={dynamicStyles.skeletonCard}>
      <View style={dynamicStyles.skeletonIconContainer} />
      <View style={dynamicStyles.skeletonText} />
    </View>
  );

  const SkeletonSearch = () => (
    <View style={dynamicStyles.searchBar}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          marginRight: 8,
          backgroundColor: colors.textSecondary,
        }}
      />
      <View
        style={{
          flex: 1,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.textSecondary,
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={dynamicStyles.container}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 20 }}
          />
          <Text style={dynamicStyles.loadingText}>Loading categories...</Text>

          <View style={dynamicStyles.searchContainer}>
            <SkeletonSearch />
            <View style={dynamicStyles.filterButton} />
          </View>

          <FlatList
            data={Array(4).fill({})}
            numColumns={2}
            keyExtractor={(_, i) => i.toString()}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={dynamicStyles.listContent}
            columnWrapperStyle={dynamicStyles.columnWrapper}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  const renderItem = ({ item }: ListRenderItemInfo<IMobileCategory>) => {
    const subCount = getSubcategoryCount(item);
    const { itemCount, availableCount } = item;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={dynamicStyles.categoryCard}
        onPress={() => handleCategoryPress(item)}
        accessibilityLabel={`Explore ${item.name} category`}
        accessibilityRole="button"
        accessibilityHint={`${subCount} subcategories, ${itemCount} items`}
      >
        <View style={dynamicStyles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(item.name) as any}
            size={40}
            color={colors.primary}
          />
        </View>

        <Text style={dynamicStyles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={dynamicStyles.metaRow}>
          {subCount > 0 && (
            <View style={dynamicStyles.countPill}>
              <Text style={dynamicStyles.countText}>{subCount} subcategories</Text>
            </View>
          )}
        </View>

        <View style={[dynamicStyles.metaRow, { marginTop: 6 }]}>
          <View style={dynamicStyles.chip}>
            <Ionicons
              name="cube-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.chipText}>{itemCount} items</Text>
          </View>
          <View style={dynamicStyles.chip}>
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.chipText}>{availableCount} available</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={dynamicStyles.container}>
        <Text
          style={dynamicStyles.header}
          accessibilityRole="header"
          accessibilityLabel="Explore Library"
        >
          Explore Library
        </Text>

        <View style={dynamicStyles.searchContainer}>
          <View style={dynamicStyles.searchBar}>
            <Ionicons
              name="search"
              size={20}
              color={colors.textSecondary}
              style={dynamicStyles.searchIcon}
            />
            <TextInput
              style={dynamicStyles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search categories"
              accessibilityHint="Type to filter category list"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Clear search"
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={dynamicStyles.filterButton}
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
          contentContainerStyle={dynamicStyles.listContent}
          columnWrapperStyle={dynamicStyles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => getCategories(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            searchQuery.length > 0 ? (
              <View style={dynamicStyles.emptyState}>
                <Ionicons
                  name="search"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.emptyStateTitle}>No Matching Categories</Text>
                <Text style={dynamicStyles.emptyStateText}>
                  Try adjusting your search terms.
                </Text>
              </View>
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Ionicons
                  name="grid-outline"
                  size={48}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.emptyStateTitle}>
                  No Categories Available
                </Text>
                <Text style={dynamicStyles.emptyStateText}>
                  Categories will appear here once they are added to the system.
                </Text>
              </View>
            )
          }
        />

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={['25%', '45%']}
          backgroundStyle={{ backgroundColor: colors.cardBackground }}
          handleIndicatorStyle={{ backgroundColor: colors.border }}
        >
          <View style={{ padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 16,
                color: colors.textPrimary,
              }}
            >
              Sort By
            </Text>

            <TouchableOpacity
              style={[
                dynamicStyles.filterOption,
                sortBy === 'name' && dynamicStyles.activeFilter,
              ]}
              onPress={() => {
                setSortBy('name');
                bottomSheetRef.current?.close();
              }}
            >
              <Text style={{ color: colors.textPrimary }}>Name (A-Z)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.filterOption,
                sortBy === 'subcount' && dynamicStyles.activeFilter,
              ]}
              onPress={() => {
                setSortBy('subcount');
                bottomSheetRef.current?.close();
              }}
            >
              <Text style={{ color: colors.textPrimary }}>
                Subcategories (Most First)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.filterOption,
                sortBy === 'items' && dynamicStyles.activeFilter,
              ]}
              onPress={() => {
                setSortBy('items');
                bottomSheetRef.current?.close();
              }}
            >
              <Text style={{ color: colors.textPrimary }}>
                Items (Most First)
              </Text>
            </TouchableOpacity>
          </View>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}


const CARD_HEIGHT = 170;
const windowWidth = Dimensions.get('window').width;
const PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (windowWidth - PADDING * 2 - GAP) / 2;


function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activeFilter: {
    backgroundColor: `${colors.primary}10`,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: 20,
    gap: 12,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
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
    color: colors.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.inputBackground,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 24,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  skeletonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.textSecondary,
    marginBottom: 12,
  },
  skeletonText: {
    height: 16,
    width: '60%',
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
});
}