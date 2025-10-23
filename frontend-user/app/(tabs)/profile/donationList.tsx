import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface Donation {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    username: string;
  };
  itemType: string;
  title: string;
  description?: string;
  photos?: string;
  duration: number;
  donationType: "giveaway" | "duration";
  preferredContactMethod: string;
  status: "Pending" | "Approved" | "Rejected" | "Completed";
  inventoryItemId: string | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type FilterStatus = "all" | "pending" | "approved" | "rejected" | "completed";
type FilterType = "all" | "giveaway" | "duration";

export default function MyDonationsScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, statusFilter, typeFilter, searchQuery]);

  const fetchDonations = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/items/donations/my-donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDonations(response.data.data || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch donations:", error);
      setError("Failed to load donations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonations();
  };

  const filterDonations = () => {
    let filtered = [...donations];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((donation) => 
        donation.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((donation) => donation.donationType === typeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((donation) =>
        donation.title.toLowerCase().includes(query) ||
        (donation.description && donation.description.toLowerCase().includes(query))
      );
    }

    setFilteredDonations(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#34C759";
      case "pending":
        return "#FF9500";
      case "rejected":
        return "#FF3B30";
      case "completed":
        return "#007AFF";
      default:
        return COLORS.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "checkmark-circle";
      case "pending":
        return "time";
      case "rejected":
        return "close-circle";
      case "completed":
        return "checkmark-done";
      default:
        return "help-circle";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "giveaway":
        return "gift";
      case "duration":
        return "calendar";
      default:
        return "cube";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDurationText = (duration: number, donationType: string) => {
    if (donationType === "giveaway") {
      return "Giveaway";
    }
    return `${duration} day${duration !== 1 ? 's' : ''}`;
  };

  const handleWithdrawDonation = async (donationId: string) => {
    Alert.alert(
      "Withdraw Donation",
      "Are you sure you want to withdraw this donation request?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              // Implement withdrawal API call here
              Alert.alert("Success", "Donation request withdrawn successfully");
              fetchDonations(); // Refresh the list
            } catch (error) {
              Alert.alert("Error", "Failed to withdraw donation request");
            }
          },
        },
      ]
    );
  };

  const getStats = () => {
    const total = donations.length;
    const pending = donations.filter(d => d.status === "Pending").length;
    const approved = donations.filter(d => d.status === "Approved").length;
    const rejected = donations.filter(d => d.status === "Rejected").length;
    const completed = donations.filter(d => d.status === "Completed").length;

    return { total, pending, approved, rejected, completed };
  };

  const renderDonationItem = ({ item }: { item: Donation }) => {
    return (
      <View style={styles.donationCard}>
        {/* Header with Image and Status */}
        <View style={styles.cardHeader}>
          {item.photos ? (
            <Image source={{ uri: item.photos }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, styles.placeholderImage]}>
              <Ionicons name="cube" size={32} color={COLORS.textSecondary} />
            </View>
          )}
          
          <View style={styles.headerInfo}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.statusBadge}>
              <Ionicons
                name={getStatusIcon(item.status)}
                size={14}
                color={getStatusColor(item.status)}
              />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Ionicons name={getTypeIcon(item.donationType)} size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {getDurationText(item.duration, item.donationType)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="calendar" size={16} color={COLORS.primary} />
              <Text style={styles.detailText}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          {item.status === "Pending" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.withdrawButton]}
              onPress={() => handleWithdrawDonation(item._id)}
            >
              <Ionicons name="close" size={16} color="#FF3B30" />
              <Text style={[styles.actionButtonText, { color: "#FF3B30" }]}>
                Withdraw
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => {
              // Navigate to donation details
            //   router.push(``);
            }}
          >
            <Ionicons name="eye" size={16} color={COLORS.primary} />
            <Text style={[styles.actionButtonText, { color: COLORS.primary }]}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your donations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Donations</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={fetchDonations}
          >
            <Ionicons name="refresh" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Overview */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#FF9500" }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#34C759" }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#FF3B30" }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#007AFF" }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </ScrollView>

      {/* Search and Filter Bar */}
      <View style={styles.filterBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search donations..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={18} color={COLORS.primary} />
          {(statusFilter !== "all" || typeFilter !== "all") && (
            <View style={styles.filterIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickFilters}
      >
        {(["all", "pending", "approved", "rejected", "completed"] as FilterStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.quickFilter,
              statusFilter === status && styles.quickFilterActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.quickFilterText,
                statusFilter === status && styles.quickFilterTextActive,
              ]}
            >
              {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Donations List */}
      <FlatList
        data={filteredDonations}
        renderItem={renderDonationItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          error ? (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={64}
                color={COLORS.textSecondary}
              />
              <Text style={styles.errorTitle}>Unable to Load Donations</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchDonations}
              >
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="gift-outline"
                size={64}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyTitle}>
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "No matching donations"
                  : "No donations yet"}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Start by donating an item to help others in need!"}
              </Text>
              {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Donations</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Status</Text>
              {(["all", "pending", "approved", "rejected", "completed"] as FilterStatus[]).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={styles.filterOption}
                  onPress={() => setStatusFilter(status)}
                >
                  <Ionicons
                    name={
                      statusFilter === status
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      statusFilter === status
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.filterOptionText}>
                    {status === "all" ? "All Statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Donation Type</Text>
              {(["all", "giveaway", "duration"] as FilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.filterOption}
                  onPress={() => setTypeFilter(type)}
                >
                  <Ionicons
                    name={
                      typeFilter === type
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color={
                      typeFilter === type
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text style={styles.filterOptionText}>
                    {type === "all" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={() => {
                setStatusFilter("all");
                setTypeFilter("all");
              }}
            >
              <Text style={styles.secondaryButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.primaryButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerAction: {
    padding: 4,
  },
  statsContainer: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statCard: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.cardBackground,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filterButton: {
    padding: 8,
    position: "relative",
  },
  filterIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  quickFilters: {
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
  },
  quickFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  quickFilterActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  quickFilterTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  donationCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  withdrawButton: {
    borderColor: "#FF3B30",
  },
  detailsButton: {
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  clearFiltersText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});