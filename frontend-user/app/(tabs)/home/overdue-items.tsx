import ItemCard from "@/components/ItemCard";
import SectionHeader from "@/components/SectionHeader";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { TouchableOpacity } from "react-native";

interface OverdueTransaction {
  _id: string;
  dueDate: string;
  status: string;
  isOverdue: boolean;
  daysOverdue?: number;
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

export default function OverdueItemsScreen() {
  const { items } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [parsedItems, setParsedItems] = useState<OverdueTransaction[]>([]);
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    if (items) {
      try {
        const data = JSON.parse(items as string) as OverdueTransaction[];
        setParsedItems(data);
      } catch (e) {
        console.error("Error parsing overdue items:", e);
        Alert.alert("Error", "Failed to load overdue item data.");
      }
    }
    setLoading(false);
  }, [items]);


  const handleItemPress = (item: OverdueTransaction) => {
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
    <ScrollView
      style={dynamicStyles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={dynamicStyles.headerRow}>
      <TouchableOpacity
        style={dynamicStyles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.primary} />
      </TouchableOpacity>

      <View style={{ flexShrink: 1 }}>
        <SectionHeader
          title="All Overdue Items"
          count={parsedItems.length}
          showAction={false}
        />
      </View>
    </View>


      {parsedItems.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateTitle}>No Overdue Items</Text>
          <Text style={dynamicStyles.emptyStateText}>
            You don’t have any overdue items at the moment.
          </Text>
        </View>
      ) : (
        parsedItems.map((item) => {
          const itemInfo = item.itemId;
          const author =
            itemInfo?.typeSpecificFields?.author || itemInfo.itemType;
          const imageUrl = itemInfo?.typeSpecificFields?.image;

          return (
            <ItemCard
              key={item._id}
              title={itemInfo?.title || "Unknown Title"}
              subtitle={author}
              imageUrl={imageUrl}
              status="Overdue"
              statusColor="#FF3B30"
              dueInfo={`Overdue by ${item.daysOverdue || 0} days`}
              showOverdue={true}
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
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
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
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    backButton: {
      padding: 10,
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
