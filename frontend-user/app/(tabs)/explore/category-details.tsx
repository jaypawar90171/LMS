import apiClient from '@/constants/api';
import { useTheme } from "@/context/ThemeContext";
import { tokenAtom } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import type { IMobileCategory } from './index';

interface IItem {
  _id: string;
  title: string;
  description?: string;
  status: string;
  quantity: number;
  availableCopies: number;
  typeSpecificFields?: {
    author?: string;
    isbn?: string;
    publisher?: string;
  };
  mediaUrl?: string;
}

export default function CategoryDetailsScreen() {
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const [subCategories, setSubCategories] = useState<IMobileCategory[]>([]);
  const [items, setItems] = useState<IItem[]>([]);
  const [categoryMeta, setCategoryMeta] = useState<IMobileCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const [token] = useAtom(tokenAtom);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      if (!token || !categoryId) return;

      try {
        // 1) Get all categories (same endpoint as Explore)
        const categoriesResponse = await apiClient.get('/api/mobile/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allCategories: IMobileCategory[] = categoriesResponse.data?.data || [];

        // Current category meta
        const current = allCategories.find((c) => c._id === categoryId);
        if (current) {
          setCategoryMeta(current);
        }

        const subs = allCategories.filter(
          (cat) => cat.parentCategoryId === categoryId
        );
        setSubCategories(subs);

        // 2) Items for this category (root OR subcategory)
        const itemsResponse = await apiClient.get(
          `/api/mobile/categories/${categoryId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const itemsData: IItem[] = itemsResponse.data?.data?.items || [];
        setItems(itemsData);
      } catch (error) {
        console.error('Error fetching category details:', error);
        Alert.alert(
          'Error',
          'Failed to load category details. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token && categoryId) {
      fetchData();
    }
  }, [token, categoryId]);

  const handleDrillDown = (subcategory: IMobileCategory) => {
    router.push({
      pathname: '/(tabs)/explore/category-details',
      params: {
        categoryId: subcategory._id,
        categoryName: subcategory.name,
      },
    });
  };

  const handleItemPress = (item: IItem) => {
    router.push({
      pathname: '/(stack)/item-details',
      params: { itemId: item._id },
    });
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('horror')) return 'skull-outline';
    if (lower.includes('thriller')) return 'flash-outline';
    if (lower.includes('fiction')) return 'book-outline';
    if (lower.includes('non-fiction') || lower.includes('nonfiction'))
      return 'document-text-outline';
    if (lower.includes('classic')) return 'star-outline';
    return 'folder-outline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return '#34C759';
      case 'Issued':
        return colors.primary;
      default:
        return '#34C759';
    }
  };

  if (loading) {
    return (
      <View style={dynamicStyles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderSubcategory = (subcategory: IMobileCategory) => (
    <TouchableOpacity
      key={subcategory._id}
      style={dynamicStyles.categoryCard}
      onPress={() => handleDrillDown(subcategory)}
      activeOpacity={0.9}
    >
      <View style={dynamicStyles.iconRow}>
        <View style={dynamicStyles.iconContainer}>
          <Ionicons
            name={getCategoryIcon(subcategory.name ) as any}
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

      {subcategory.description && (
        <Text
          style={dynamicStyles.categoryDescription}
          numberOfLines={2}
        >
          {subcategory.description}
        </Text>
      )}

      <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
        <View style={dynamicStyles.subChip}>
          <Ionicons
            name="cube-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.subChipText}>
            {subcategory.itemCount} items
          </Text>
        </View>
        <View style={dynamicStyles.subChip}>
          <Ionicons
            name="checkmark-circle-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.subChipText}>
            {subcategory.availableCount} available
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItemGrid = ({ item }: ListRenderItemInfo<IItem>) => {
    const authorOrCreator =
      item.typeSpecificFields?.author ?? item.typeSpecificFields?.publisher;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={dynamicStyles.itemGridCard}
        onPress={() => handleItemPress(item)}
      >
        {item.mediaUrl ? (
          <Image
            source={{ uri: item.mediaUrl }}
            style={dynamicStyles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[dynamicStyles.itemImage, dynamicStyles.placeholderImage]}>
            <Ionicons
              name="cube-outline"
              size={32}
              color={colors.textSecondary}
            />
          </View>
        )}

        <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {authorOrCreator ? (
          <Text style={dynamicStyles.itemCreator} numberOfLines={1}>
            Author: {authorOrCreator}
          </Text>
        ) : null}

        <Text style={dynamicStyles.itemCreator} numberOfLines={1}>
          {item.quantity} Toal Quantities 
        </Text>
        <Text style={dynamicStyles.itemCreator} numberOfLines={1}>
          {item.availableCopies} copies available
        </Text>

        <View style={dynamicStyles.itemStatusRow}>
          <View
            style={[
              dynamicStyles.statusBadge,
              { borderColor: getStatusColor(item.status) + '40' },
            ]}
          >
            <View
              style={[
                dynamicStyles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                dynamicStyles.statusText,
                { color: getStatusColor(item.status) },
              ]}
              numberOfLines={1}
            >
              {item.availableCopies > 0 ? 'Available' : item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  // Check if we have subcategories (Non-leaf node)
  const isParentCategory = subCategories.length > 0;

  // Header content
  const headerContent = categoryMeta
    ? `${categoryMeta.itemCount} items • ${categoryMeta.availableCount} available`
    : `${items.length} total items`;

  // Display subcategories if available (Drill-down behavior)
  if (isParentCategory) {
    return (
      <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
         <View style={dynamicStyles.headerRow}>
            <TouchableOpacity
              style={dynamicStyles.backButton}
              onPress={() => router.back()}
              accessibilityLabel="Back to previous screen"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={dynamicStyles.title}>{categoryName}</Text>
          </View>

        <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.subtitle}>
          {subCategories.length} Subcategories • {headerContent}
        </Text>

        <View style={dynamicStyles.headerAccent} />
      </View>

        {/* Subcategories Grid */}
        <Text style={dynamicStyles.sectionTitle}>Subcategories</Text>
        <View style={dynamicStyles.categoriesGrid}>
          {subCategories.map(renderSubcategory)}
        </View>

        {categoryMeta && (
            <Text style={dynamicStyles.subFooter}>
              Total items in this tree: {categoryMeta.itemCount}
            </Text>
          )}
      </ScrollView>
    );
  }

  // Display items in a grid if NO subcategories (Leaf node)
  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={dynamicStyles.title}>{categoryName}</Text>
      </View>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.subtitle}>{headerContent}</Text>
        <View style={dynamicStyles.headerAccent} />
      </View>

      <Text style={dynamicStyles.sectionTitle}>Items in this Category</Text>

      {items.length === 0 ? (
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
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={renderItemGrid}
          numColumns={2} // Two items per row, as requested
          contentContainerStyle={dynamicStyles.itemsGridContent}
          columnWrapperStyle={dynamicStyles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const windowWidth = Dimensions.get('window').width;
const PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (windowWidth - PADDING * 2 - GAP) / 2;
const IMAGE_HEIGHT = CARD_WIDTH * 1.25;   

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
    // General
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: PADDING,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
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
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    backButton: {
      marginRight: 10,
    },
    subFooter: {
      marginTop: 16,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingBottom: 24,
    },

    // Subcategory Grid 
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: GAP,
    },
    categoryCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 180, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 5,
      elevation: 3,
    },
    iconRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
      marginBottom: 4,
    },
    categoryDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    subChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.inputBackground,
      gap: 4,
    },
    subChipText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Items Grid 
    itemsGridContent: {
      paddingBottom: 24,
      gap: GAP, 
    },
    columnWrapper: {
      justifyContent: 'space-between',
    },
    itemGridCard: {
      width: CARD_WIDTH,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 8,
      marginBottom: 4, 
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    itemImage: {
      width: '100%',
      height: IMAGE_HEIGHT,
      borderRadius: 12,
      marginBottom: 8,
    },
    placeholderImage: {
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      height: 38, // Fixed height for 2 lines
      lineHeight: 19,
      marginHorizontal: 4,
    },
    itemCreator: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: 8,
      marginHorizontal: 4,
    },
    itemStatusRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      padding: 4,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: `${colors.primary}12`,
      borderWidth: 1,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
    },

    // Empty State
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
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
  });
}