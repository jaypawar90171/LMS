'use client';

import { API_BASE_URL } from '@/constants/api';
import { tokenAtom, userAtom } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Donation {
    _id: string;
    userId: string;
    itemName: string;
    description?: string;
    condition: string;
    availableDate: string;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed';
    photos: Array<{ _id: string }>;
    createdAt: string;
    updatedAt: string;
}

type FilterStatus = 'all' | 'Pending' | 'Accepted' | 'Rejected' | 'Completed';

export default function MyDonationsScreen() {
    const [user] = useAtom(userAtom);
    const [token] = useAtom(tokenAtom);
    const [donations, setDonations] = useState<Donation[]>([]);
    const [filteredDonations, setFilteredDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const router = useRouter();
    const { colors } = useTheme();
        
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

    useEffect(() => {
        fetchDonations();
    }, [token]);

    useEffect(() => {
        filterDonations();
    }, [donations, statusFilter, searchQuery]);

    const fetchDonations = async (page: number = 1, status?: string) => {
        try {
            setError(null);
            setLoading(page === 1);
            setRefreshing(page === 1);

            const params: any = { page: page.toString(), limit: '10' };
            if (status && status !== 'all') {
                params.status = status;
            }

            const response = await axios.get(`${API_BASE_URL}/api/mobile/donations`, {
                headers: { Authorization: `Bearer ${token}` },
                params,
            });

            if (response.data.success) {
                if (page === 1) {
                    setDonations(response.data.data || []);
                } else {
                    setDonations(prev => [...prev, ...(response.data.data || [])]);
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch donations:', error);
            setError('Failed to load donations. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setCurrentPage(1);
        fetchDonations(1);
    };

    const filterDonations = () => {
        let filtered = [...donations];

        if (statusFilter !== 'all') {
            filtered = filtered.filter(
                donation => donation.status === statusFilter
            );
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                donation =>
                    donation.itemName.toLowerCase().includes(query) ||
                    (donation.description &&
                        donation.description.toLowerCase().includes(query))
            );
        }

        setFilteredDonations(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Accepted':
                return '#34C759';
            case 'Pending':
                return '#FF9500';
            case 'Rejected':
                return '#FF3B30';
            case 'Completed':
                return '#007AFF';
            default:
                return colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Accepted':
                return 'checkmark-circle';
            case 'Pending':
                return 'time-outline';
            case 'Rejected':
                return 'close-circle';
            case 'Completed':
                return 'checkmark-done-circle';
            default:
                return 'help-circle-outline';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatAvailableDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStats = () => {
        const total = donations.length;
        const pending = donations.filter(d => d.status === 'Pending').length;
        const accepted = donations.filter(d => d.status === 'Accepted').length;
        const rejected = donations.filter(d => d.status === 'Rejected').length;
        const completed = donations.filter(d => d.status === 'Completed').length;

        return { total, pending, accepted, rejected, completed };
    };

    const renderDonationItem = ({ item }: { item: Donation }) => {
        const hasPhoto = item.photos && item.photos.length > 0;
        const isPending = item.status === 'Pending';

        return (
            <View style={dynamicStyles.donationCard}>
                {/* Header with Image and Status */}
                <View style={dynamicStyles.cardHeader}>
                    {hasPhoto ? (
                        <Image
                            source={{ uri: `${API_BASE_URL}/uploads/photos/${item.photos[0]._id}` }}
                            style={dynamicStyles.itemImage}
                            defaultSource={undefined}
                        />
                    ) : (
                        <View style={[dynamicStyles.itemImage, dynamicStyles.placeholderImage]}>
                            <Ionicons name="book-outline" size={32} color={colors.textSecondary} />
                        </View>
                    )}

                    <View style={dynamicStyles.headerInfo}>
                        <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                            {item.itemName}
                        </Text>
                        <View style={dynamicStyles.statusBadge}>
                            <Ionicons
                                name={getStatusIcon(item.status)}
                                size={14}
                                color={getStatusColor(item.status)}
                            />
                            <Text
                                style={[
                                    dynamicStyles.statusText,
                                    { color: getStatusColor(item.status) },
                                ]}
                            >
                                {item.status}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Description */}
                {item.description && (
                    <Text style={dynamicStyles.itemDescription} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                {/* Details (Ensuring all key info is visible) */}
                <View style={dynamicStyles.detailsContainer}>
                    <View style={dynamicStyles.detailRow}>
                        <View style={dynamicStyles.detailItem}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                            <Text style={dynamicStyles.detailText}>
                                Condition: <Text style={{fontWeight: '600'}}>{item.condition}</Text>
                            </Text>
                        </View>
                        {/* Only show pick-up/availability date if not completed/rejected for relevance */}
                        {!['Rejected', 'Completed'].includes(item.status) && (
                            <View style={dynamicStyles.detailItem}>
                                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                                <Text style={dynamicStyles.detailText}>
                                    Available by: <Text style={{fontWeight: '600'}}>{formatAvailableDate(item.availableDate)}</Text>
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={dynamicStyles.detailRow}>
                        <View style={dynamicStyles.detailItem}>
                            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                            <Text style={dynamicStyles.detailText}>Submitted: {formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                </View>

                {/* Actions (Only Withdraw for Pending status) */}
                <View style={[dynamicStyles.actionButtons, isPending ? dynamicStyles.singleActionButton : {}]}>
                    {/* Note/Message if rejected or accepted */}
                    {item.status === 'Accepted' && (
                        <View style={dynamicStyles.infoMessage}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                            <Text style={dynamicStyles.infoMessageText}>
                                Accepted! We will contact you shortly for pickup.
                            </Text>
                        </View>
                    )}
                    {item.status === 'Rejected' && (
                        <View style={dynamicStyles.errorMessage}>
                            <Ionicons name="close-circle-outline" size={16} color="#FF3B30" />
                            <Text style={dynamicStyles.infoMessageText}>
                                Rejected. Contact support for details.
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const stats = getStats();

    if (loading && donations.length === 0) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={dynamicStyles.loadingText}>Loading your donations...</Text>
            </View>
        );
    }

    return (
        <View style={dynamicStyles.container}>
            {/* Header */}
            <View style={dynamicStyles.header}>
                <TouchableOpacity
                    style={dynamicStyles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.primary} />
                </TouchableOpacity>
                <Text style={dynamicStyles.headerTitle}>My Donations</Text>
                <View style={dynamicStyles.headerActions}>
                    <TouchableOpacity
                        style={dynamicStyles.headerAction}
                        onPress={onRefresh}
                    >
                        <Ionicons name="refresh" size={20} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats Overview */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={dynamicStyles.statsContainer}
                contentContainerStyle={dynamicStyles.statsContentContainer}
            >
                <View style={dynamicStyles.statCard}>
                    <Text style={dynamicStyles.statNumber}>{stats.total}</Text>
                    <Text style={dynamicStyles.statLabel}>Total</Text>
                </View>
                <View style={dynamicStyles.statCard}>
                    <Text style={[dynamicStyles.statNumber, { color: '#FF9500' }]}>
                        {stats.pending}
                    </Text>
                    <Text style={dynamicStyles.statLabel}>Pending</Text>
                </View>
                <View style={dynamicStyles.statCard}>
                    <Text style={[dynamicStyles.statNumber, { color: '#34C759' }]}>
                        {stats.accepted}
                    </Text>
                    <Text style={dynamicStyles.statLabel}>Accepted</Text>
                </View>
                <View style={dynamicStyles.statCard}>
                    <Text style={[dynamicStyles.statNumber, { color: '#FF3B30' }]}>
                        {stats.rejected}
                    </Text>
                    <Text style={dynamicStyles.statLabel}>Rejected</Text>
                </View>
                <View style={dynamicStyles.statCard}>
                    <Text style={[dynamicStyles.statNumber, { color: '#007AFF' }]}>
                        {stats.completed}
                    </Text>
                    <Text style={dynamicStyles.statLabel}>Completed</Text>
                </View>
            </ScrollView>

            {/* Search and Filter Bar */}
            <View style={dynamicStyles.filterBar}>
                <View style={dynamicStyles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.textSecondary} />
                    <TextInput
                        style={dynamicStyles.searchInput}
                        placeholder="Search donations..."
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons
                                name="close-circle"
                                size={18}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={dynamicStyles.filterButton}
                    onPress={() => setShowFilterModal(true)}
                >
                    <Ionicons name="filter" size={18} color={colors.primary} />
                    {statusFilter !== 'all' && <View style={dynamicStyles.filterIndicator} />}
                </TouchableOpacity>
            </View>

            {/* Quick Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={dynamicStyles.quickFilters}
            >
                {(['all', 'Pending', 'Accepted', 'Rejected', 'Completed'] as FilterStatus[]).map(
                    status => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                dynamicStyles.quickFilter,
                                statusFilter === status && dynamicStyles.quickFilterActive,
                            ]}
                            onPress={() => {
                                setStatusFilter(status);
                                fetchDonations(1, status);
                            }}
                        >
                            <Text
                                style={[
                                    dynamicStyles.quickFilterText,
                                    statusFilter === status && dynamicStyles.quickFilterTextActive,
                                ]}
                            >
                                {status === 'all' ? 'All' : status}
                            </Text>
                        </TouchableOpacity>
                    )
                )}
            </ScrollView>

            {/* Donations List */}
            <FlatList
                data={filteredDonations}
                renderItem={renderDonationItem}
                keyExtractor={item => item._id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={dynamicStyles.listContent}
                ListEmptyComponent={
                    error ? (
                        <View style={dynamicStyles.errorContainer}>
                            <Ionicons
                                name="alert-circle-outline"
                                size={64}
                                color={colors.textSecondary}
                            />
                            <Text style={dynamicStyles.errorTitle}>Unable to Load Donations</Text>
                            <Text style={dynamicStyles.errorText}>{error}</Text>
                            <TouchableOpacity
                                style={dynamicStyles.retryButton}
                                onPress={() => fetchDonations(1)}
                            >
                                <Ionicons name="refresh" size={20} color="#FFF" />
                                <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={dynamicStyles.emptyState}>
                            <Ionicons
                                name="gift-outline"
                                size={64}
                                color={colors.textSecondary}
                            />
                            <Text style={dynamicStyles.emptyTitle}>
                                {searchQuery || statusFilter !== 'all'
                                    ? 'No matching donations'
                                    : 'No donations yet'}
                            </Text>
                            <Text style={dynamicStyles.emptyText}>
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Try adjusting your filters or search terms'
                                    : 'Start by donating an item to help others in need!'}
                            </Text>
                            {(searchQuery || statusFilter !== 'all') && (
                                <TouchableOpacity
                                    style={dynamicStyles.clearFiltersButton}
                                    onPress={() => {
                                        setSearchQuery('');
                                        setStatusFilter('all');
                                        fetchDonations(1);
                                    }}
                                >
                                    <Text style={dynamicStyles.clearFiltersText}>Clear Filters</Text>
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
                <View style={dynamicStyles.modalContainer}>
                    <View style={dynamicStyles.modalHeader}>
                        <Text style={dynamicStyles.modalTitle}>Filter Donations</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={dynamicStyles.modalContent}>
                        <View style={dynamicStyles.filterSection}>
                            <Text style={dynamicStyles.filterSectionTitle}>Status</Text>
                            {(['all', 'Pending', 'Accepted', 'Rejected', 'Completed'] as FilterStatus[]).map(
                                status => (
                                    <TouchableOpacity
                                        key={status}
                                        style={dynamicStyles.filterOption}
                                        onPress={() => {
                                            setStatusFilter(status);
                                            setShowFilterModal(false);
                                            fetchDonations(1, status);
                                        }}
                                    >
                                        <Ionicons
                                            name={
                                                statusFilter === status
                                                    ? 'radio-button-on'
                                                    : 'radio-button-off'
                                            }
                                            size={20}
                                            color={
                                                statusFilter === status
                                                    ? colors.primary
                                                    : colors.textSecondary
                                            }
                                        />
                                        <Text style={dynamicStyles.filterOptionText}>
                                            {status === 'all' ? 'All Statuses' : status}
                                        </Text>
                                    </TouchableOpacity>
                                )
                            )}
                        </View>
                    </ScrollView>

                    <View style={dynamicStyles.modalFooter}>
                        <TouchableOpacity
                            style={[dynamicStyles.modalButton, dynamicStyles.secondaryButton]}
                            onPress={() => {
                                setStatusFilter('all');
                                setShowFilterModal(false);
                                fetchDonations(1);
                            }}
                        >
                            <Text style={dynamicStyles.secondaryButtonText}>Reset Filters</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[dynamicStyles.modalButton, dynamicStyles.primaryButton]}
                            onPress={() => setShowFilterModal(false)}
                        >
                            <Text style={dynamicStyles.primaryButtonText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function createDynamicStyles(colors: any) {
    return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
        fontWeight: '700',
        color: colors.textPrimary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerAction: {
        padding: 4,
    },
    statsContainer: {
        backgroundColor: colors.cardBackground,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    statsContentContainer: {
        paddingRight: 4, // Allow last item to be visible
    },
    statCard: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.background,
        borderRadius: 12,
        marginRight: 12,
        minWidth: 90,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        backgroundColor: colors.cardBackground,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
    },
    filterButton: {
        padding: 8,
        position: 'relative',
    },
    filterIndicator: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    quickFilters: {
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 16,
    },
    quickFilter: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 8,
    },
    quickFilterActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    quickFilterText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    quickFilterTextActive: {
        color: colors.primary,
        fontWeight: '600',
    },
    listContent: {
        flexGrow: 1,
        padding: 16,
    },
    donationCard: {
        backgroundColor: colors.cardBackground,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    placeholderImage: {
        backgroundColor: `${colors.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemTitle: {
        fontSize: 18, // Slightly larger title
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        backgroundColor: `${colors.primary}10`,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    itemDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
        borderLeftWidth: 2,
        borderLeftColor: colors.border,
        paddingLeft: 8,
    },
    detailsContainer: {
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14, // Slightly larger text for details
        color: colors.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    singleActionButton: {
        justifyContent: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    withdrawButton: {
        borderColor: '#FF3B30',
    },
    // Removed detailsButton as the action is removed
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: `${colors.primary}10`,
        borderRadius: 8,
        gap: 8,
        flex: 1,
    },
    errorMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: `#FF3B3010`,
        borderRadius: 8,
        gap: 8,
        flex: 1,
    },
    infoMessageText: {
        fontSize: 14,
        color: colors.textPrimary,
        flexShrink: 1,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        gap: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    clearFiltersButton: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
        borderRadius: 8,
    },
    clearFiltersText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
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
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
    },
    filterOptionText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: colors.primary,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
});
}