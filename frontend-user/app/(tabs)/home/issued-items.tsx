import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { TouchableOpacity } from "react-native";

interface IssuedTransaction {
  _id: string;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  daysOverdue?: number;
  daysRemaining?: number;
  itemId: {
    _id: string;
    title: string;
    itemType: string;
    condition: string;
    typeSpecificFields?: {
      author?: string;
      publisher?: string;
      image?: string;
    };
  };
}

export default function IssuedItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parsedItems, setParsedItems] = useState<IssuedTransaction[]>([]);
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    if (items) {
      try {
        const data = JSON.parse(items as string) as IssuedTransaction[];
        setParsedItems(data);
      } catch (e) {
        console.error("Error parsing issued items:", e);
        Alert.alert("Error", "Failed to load issued item data.");
      }
    }
    setLoading(false);
  }, [items]);


  const handleItemPress = (item: IssuedTransaction) => {
    router.push({
      pathname: "/(stack)/item-details",
      params: {
        itemId: item.itemId?._id,
        transactionData: JSON.stringify(item), 
      },
    });
  };

  if (loading) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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

      <View style={dynamicStyles.headerRow}>
        <SectionHeader
          title="All Issued Items"
          count={parsedItems.length}
          showAction={false}
        />
      </View>
</View>


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
        parsedItems.map((item) => {
          const itemDetails = item.itemId;
          const author = itemDetails?.typeSpecificFields?.author || itemDetails.itemType;
          const imageUrl = itemDetails?.typeSpecificFields?.image;
          
          const statusText = item.isOverdue ? "Overdue" : "Issued";
          const statusColor = item.isOverdue ? "#FF3B30" : colors.primary;

          const dueInfo = item.isOverdue
            ? `Overdue by ${item.daysOverdue || 0} days`
            : `Due in ${item.daysRemaining || 0} days`;

          return (
            <ItemCard
              key={item._id}
              title={itemDetails?.title || "Unknown Title"}
              subtitle={author}
              imageUrl={imageUrl}
              status={statusText}
              statusColor={statusColor}
              dueInfo={dueInfo}
              showOverdue={!!item.isOverdue}
              onPress={() => handleItemPress(item)}
            />
          );
        })
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    padding: 4,
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