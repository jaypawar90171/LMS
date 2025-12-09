import { useTheme } from "@/context/ThemeContext";
import { itemService, requestService, transactionService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');


interface TypeSpecificFields {
  [key: string]: any;
}

interface PhysicalDetails {
  dimensions?: string;
  weight?: string;
  condition?: string;
}

interface AcquisitionDetails {
  source?: string;
  dateAcquired?: string;
  supplier?: string;
}

interface Category {
  _id: string;
  name: string;
  description?: string;
}

interface ItemDetails {
  _id: string;
  title: string;
  description?: string;
  itemType?: string;
  typeSpecificFields?: TypeSpecificFields;
  physicalDetails?: PhysicalDetails;
  acquisitionDetails?: AcquisitionDetails;
  categoryId?: Category;
  barcode?: string;
  condition?: string;
  quantity?: number;
  availableCopies?: number;
  defaultReturnPeriod?: number;
  status?: string;
  notes?: string;
  tags?: string[];
  photos?: { url: string }[];
  videos?: { url: string }[];
  userHasRequested?: boolean;
  userHasBorrowed?: boolean; 
  queueLength?: number;
  estimatedWaitTime?: string;
}

interface TransactionDetails {
  _id: string;
  transactionId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string; 
  extensionCount: number;
}

export default function ItemDetailsScreen() {
  const { itemId, transactionData } = useLocalSearchParams();

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  

  useEffect(() => {
    if (transactionData) {
      try {
        const parsedTransaction = JSON.parse(transactionData as string);

        setTransaction({
            _id: parsedTransaction._id,
            transactionId: parsedTransaction.transactionId,
            issueDate: parsedTransaction.issueDate,
            dueDate: parsedTransaction.dueDate,
            returnDate: parsedTransaction.returnDate || null,
            status: parsedTransaction.status,
            extensionCount: parsedTransaction.extensionCount || 0,
        } as TransactionDetails);

      } catch (err) {
        console.error("Failed to parse transaction data:", err);
      }
    }

    if (itemId) loadItem(itemId as string);
  }, [itemId, transactionData]);

  const loadItem = async (id: string) => {
    try {
      setLoading(true);
      const res = await itemService.getItemDetails(id);
      setItem(res.data.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load item.");
    } finally {
      setLoading(false);
    }
  };

  const DetailRow = ({ label, value }: any) => (
    <View style={dynamicStyles.detailRow}>
      <Text style={dynamicStyles.detailLabel}>{label}</Text>
      <Text style={dynamicStyles.detailValue}>{value || "N/A"}</Text>
    </View>
  );

  const imageUrl = item?.photos?.[0]?.url;

  const handleIssueItem = async () => {
    if (!item) return;

    Alert.alert(
      "Request Item",
      "Do you want to request this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setActionLoading(true);

              const payload = {
                itemId: item._id,
                requestType: "Borrow",
                notes: ""
              };

              const res = await requestService.createRequest(payload);

              Alert.alert("Success", res.data.message || "Request created.");
              loadItem(item._id);
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.message || "Could not request item.");
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRenewItem = async () => {
    if (!transaction) return;

    Alert.alert(
      "Renew Item",
      "Do you want to request a renewal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setActionLoading(true);

              const res = await transactionService.requestRenewal(
                transaction._id,
                { reason: "Renewal requested from mobile" }
              );

              Alert.alert("Success", res.data.message || "Renewal request submitted!");
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.message || "Could not renew item.");
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const showRenewButton =
    transaction && 
    (transaction.status === "Issued"); 

  const showIssueButton =
    item?.status === "Available" &&
    !item.userHasRequested &&
    !item.userHasBorrowed &&
    !transaction;

  if (loading)
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  if (!item)
    return (
      <View style={dynamicStyles.errorContainer}>
        <Text style={{ color: "red" }}>Item not found</Text>
      </View>
    );

  return (
    <ScrollView style={dynamicStyles.screen}>
      {/* HEADER */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <Text style={dynamicStyles.headerTitle}>Item Details</Text>

        {/* Placeholder to balance layout */}
        <View style={dynamicStyles.placeholder} />
      </View>

      {/* IMAGE */}
      <View style={dynamicStyles.imageWrapper}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={dynamicStyles.heroImage} />
        ) : (
          <View style={dynamicStyles.heroFallback}>
            <Ionicons name="image-outline" size={60} color={colors.textSecondary} />
            <Text>No Image Available</Text>
          </View>
        )}
      </View>

      {/* BASIC INFO */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.title}>{item.title}</Text>
        {item.description && (
          <Text style={dynamicStyles.description}>{item.description}</Text>
        )}
      </View>

      {/* ITEM DETAILS */}
      <View style={dynamicStyles.section}>
  <Text style={dynamicStyles.sectionHeader}>Item Details</Text>

  <DetailRow label="Item Type" value={item?.itemType ?? "N/A"} />
  <DetailRow label="Category" value={item?.categoryId?.name ?? "N/A"} />
  <DetailRow label="Status" value={item?.status ?? "N/A"} />
  <DetailRow label="Condition" value={item?.condition ?? "N/A"} />
  <DetailRow label="Barcode" value={item?.barcode ?? "N/A"} />
  <DetailRow label="Quantity" value={item?.quantity ?? "N/A"} />
  <DetailRow label="Available Copies" value={item?.availableCopies ?? "N/A"} />

  <DetailRow
    label="Currently Issued"
    value={
      item?.quantity != null && item?.availableCopies != null
        ? item.quantity - item.availableCopies
        : "N/A"
    }
  />

  <DetailRow
    label="Return Period"
    value={
      item?.defaultReturnPeriod != null
        ? `${item.defaultReturnPeriod} days`
        : "N/A"
    }
  />
</View>


      {/* TYPE SPECIFIC FIELDS */}
      {item.typeSpecificFields && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionHeader}>Specifications</Text>
          {Object.entries(item.typeSpecificFields).map(([key, value]) => (
            <DetailRow
              key={key}
              label={key.replace(/([A-Z])/g, " $1")}
              value={String(value)}
            />
          ))}
        </View>
      )}

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>User Information</Text>
        <DetailRow label="Requested by You" value={item.userHasRequested ? "Yes" : "No"} />
        <DetailRow label="Borrowed by You" value={item.userHasBorrowed ? "Yes" : "No"} />
      </View>

      {/* QUEUE INFO */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionHeader}>Queue Information</Text>
        <DetailRow label="People in Queue" value={item.queueLength} />
        <DetailRow label="Estimated Wait Time" value={item.estimatedWaitTime} />
      </View>

      {/* NOTES */}
      {item.notes && (
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionHeader}>Notes</Text>
          <Text style={dynamicStyles.description}>{item.notes}</Text>
        </View>
      )}

      {/* ACTION BUTTONS */}
      <View style={dynamicStyles.buttonContainer}>

        {item.userHasBorrowed && (
        <View style={dynamicStyles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.error} />
          <Text style={dynamicStyles.infoText}>
            You have already borrowed this item.
          </Text>
        </View>
        )}

        {item.userHasRequested && !item.userHasBorrowed && (
        <View style={dynamicStyles.infoBox}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={dynamicStyles.infoText}>
            You have already requested this item.
          </Text>
        </View>
        )}

        {/* ISSUE ITEM BUTTON */}
        {showIssueButton && (
          <TouchableOpacity
            onPress={handleIssueItem}
            disabled={actionLoading}
            style={dynamicStyles.primaryButton}
          >
            <Text style={dynamicStyles.primaryButtonText}>
              {actionLoading ? "Processing..." : "Issue Item"}
            </Text>
          </TouchableOpacity>
        )}

        {/* RENEW ITEM BUTTON */}
        {showRenewButton && (
          <TouchableOpacity
            onPress={handleRenewItem}
            disabled={actionLoading}
            style={dynamicStyles.primaryButton}
          >
            <Text style={dynamicStyles.primaryButtonText}>
              {actionLoading ? "Processing..." : "Renew Item"}
            </Text>
          </TouchableOpacity>
        )}

      </View>

    </ScrollView>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },

  imageWrapper: { width, height: width * 1.1 },
  heroImage: { width, height: width * 1.1, resizeMode: 'cover' },

  heroFallback: {
    width,
    height: width * 1.1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.inputBackground
  },

  section: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border
  },

  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  description: { fontSize: 16, marginTop: 6, color: colors.textSecondary },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: colors.textPrimary
  },
  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  padding: 16,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
},

backButton: {
  padding: 4,
},

headerTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: colors.textPrimary,
},

placeholder: {
  width: 32,
},


  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8
  },

  detailLabel: { color: colors.textSecondary, fontSize: 14 },
  detailValue: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },

  buttonContainer: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 16,
    gap: 14
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  primaryButtonText: { color: "#fff", fontWeight: '700', fontSize: 16 },

  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  secondaryButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  infoBox: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  backgroundColor: colors.inputBackground,
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.error,
},

  infoText: {
    color: colors.error,
    fontSize: 14,
    flexShrink: 1,
  },

});
}