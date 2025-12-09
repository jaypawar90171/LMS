import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { tokenAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { debounce } from "lodash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

const RECENT_SEARCHES_KEY = "recent_searches";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [token] = useAtom(tokenAtom);
  const router = useRouter();
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    if (!query.trim()) return;

    try {
      const updatedSearches = [
        query.trim(),
        ...recentSearches.filter(
          (s) => s.toLowerCase() !== query.trim().toLowerCase()
        ),
      ].slice(0, 10); 

      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(updatedSearches)
      );
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  
  const performSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim() || !token) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/mobile/items/search?q=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setSearchResults(data.data || []);
        setHasSearched(true);

        
        await saveRecentSearch(query);
      } catch (error) {
        console.error("Search error:", error);
        Alert.alert("Error", "Failed to perform search. Please try again.");
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [token]
  );

  
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      setLoading(true);
      performSearch(text);
    } else {
      setSearchResults([]);
      setHasSearched(false);
      setLoading(false);
    }
  };

  const handleItemPress = (item: any) => {
    Keyboard.dismiss();
    router.push({
      pathname: "/(stack)/item-details",
      params: {
        itemId: item._id,
        itemType: "new",
      },
    });
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available":
        return "#34C759";
      case "Issued":
        return colors.primary;
      default:
        return "#FF9500";
    }
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={dynamicStyles.resultItem}
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
            size={24}
            color={colors.textSecondary}
          />
        </View>
      )}

      <View style={dynamicStyles.itemInfo}>
        <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {item.authorOrCreator && (
          <Text style={dynamicStyles.itemCreator} numberOfLines={1}>
            By {item.authorOrCreator}
          </Text>
        )}

        {item.categoryId && (
          <Text style={dynamicStyles.itemCategory} numberOfLines={1}>
            {item.categoryId.name}
          </Text>
        )}

        <View style={dynamicStyles.itemMeta}>
          <View
            style={[
              dynamicStyles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}15` },
            ]}
          >
            <Text
              style={[
                dynamicStyles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Text>
          </View>
          <Text style={dynamicStyles.availability}>
            {item.availableCopies || 0} available
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={dynamicStyles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
      <Text style={dynamicStyles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Search Header */}
      <View style={dynamicStyles.searchHeader}>
        <View style={dynamicStyles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textSecondary}
          />
          <TextInput
            style={dynamicStyles.searchInput}
            placeholder="Search for Books, Courses, Toys..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {hasSearched ? (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={dynamicStyles.resultsList}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={dynamicStyles.emptyStateTitle}>
                {loading ? "Searching..." : "No items found"}
              </Text>
              <Text style={dynamicStyles.emptyStateText}>
                {loading
                  ? "Please wait while we search..."
                  : "Try different keywords or browse categories"}
              </Text>
            </View>
          }
        />
      ) : (
        /* Recent Searches */
        <ScrollView style={dynamicStyles.recentSearchesContainer}>
          {recentSearches.length > 0 && (
            <View style={dynamicStyles.recentSearchesSection}>
              <View style={dynamicStyles.sectionHeader}>
                <Text style={dynamicStyles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={dynamicStyles.clearButton}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearchItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Popular Searches */}
          <View style={dynamicStyles.popularSearchesSection}>
            <Text style={dynamicStyles.sectionTitle}>Popular Searches</Text>
            <View style={dynamicStyles.popularSearchesGrid}>
              {[
                "Fiction",
                "Electronics",
                "Tools",
                "Kitchen",
                "Sports",
                "Toys",
              ].map((term) => (
                <TouchableOpacity
                  key={term}
                  style={dynamicStyles.popularSearchChip}
                  onPress={() => handleRecentSearchPress(term)}
                >
                  <Text style={dynamicStyles.popularSearchText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    padding: 16,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    padding: 0,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: colors.inputBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemCreator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  availability: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recentSearchesContainer: {
    flex: 1,
    padding: 16,
  },
  recentSearchesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  clearButton: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  recentSearchText: {
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  popularSearchesSection: {
    marginBottom: 24,
  },
  popularSearchesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  popularSearchChip: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  popularSearchText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
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
});
}
 