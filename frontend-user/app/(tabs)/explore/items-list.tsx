"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, type ListRenderItemInfo } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import { useAtom } from "jotai"
import { tokenAtom } from "@/store/authStore"
import apiClient from "@/constants/api"
import { Ionicons } from "@expo/vector-icons"
import COLORS from "@/constants/color"

type Item = {
  _id: string
  title: string
  authorOrCreator?: string
  status: string
  availableCopies: number
  quantity: number
  mediaUrl?: string
}

export default function ItemsListScreen() {
  const { categoryId, categoryName } = useLocalSearchParams()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [token] = useAtom(tokenAtom)
  const router = useRouter()

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await apiClient.get(`/inventory/categories/items/${categoryId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems(response.data.data || [])
      } catch (error) {
        console.error("Error fetching items:", error)
      } finally {
        setLoading(false)
      }
    }
    if (token) fetchItems()
  }, [token, categoryId])

  const handleItemPress = (item: Item) => {
    router.push({
      pathname: "/(tabs)/home/item-details",
      params: { itemId: item._id, itemType: "new" },
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "#34C759"
      case "Issued":
        return COLORS.primary
      default:
        return "#FF9500"
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading items...</Text>
      </View>
    )
  }

  const renderItem = ({ item }: ListRenderItemInfo<Item>) => {
    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.itemCard} onPress={() => handleItemPress(item)}>
        {item.mediaUrl ? (
          <Image source={{ uri: item.mediaUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage]}>
            <Ionicons name="cube-outline" size={32} color={COLORS.textSecondary} />
          </View>
        )}

        <View style={styles.itemInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
          </View>

          {item.authorOrCreator ? (
            <Text style={styles.itemCreator} numberOfLines={1}>
              By {item.authorOrCreator}
            </Text>
          ) : null}

          <View style={styles.itemMeta}>
            <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) + "40" }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]} numberOfLines={1}>
                {item.status}
              </Text>
            </View>

            <Text style={styles.availability}>
              {item.availableCopies} of {item.quantity} available
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{String(categoryName)}</Text>
        <Text style={styles.subtitle}>
          {items.length} {items.length === 1 ? "item" : "items"} available
        </Text>
      </View>

      {items.length > 0 ? (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyStateTitle}>No Items Found</Text>
          <Text style={styles.emptyStateText}>There are no items available in this category yet.</Text>
        </View>
      )}
    </View>
  )
}

const CARD_MIN_HEIGHT = 132
const IMAGE_SIZE = 104 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  itemCard: {
    flexDirection: "row",
    minHeight: CARD_MIN_HEIGHT,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    // depth and polish
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  itemImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: COLORS.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  itemCreator: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${COLORS.primary}12`,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  availability: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginTop: 16,
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
})
