import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Alert, 
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";


const api = axios.create({
    baseURL: API_BASE_URL,
});
const API_ENDPOINTS = {
    ITEM_REQUESTS: {
        GET_MY_ITEM_REQUESTS: `${API_BASE_URL}/api/mobile/my-item-requests`,
        CANCEL: (id: string) => `${API_BASE_URL}/api/mobile/item-requests/${id}`,
    },
};
const requestService = {
    getMyItemRequests: async (token: string) => {
        return api.get(API_ENDPOINTS.ITEM_REQUESTS.GET_MY_ITEM_REQUESTS, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
    cancelItemRequest: async (id: string, token: string) => {
        return api.delete(API_ENDPOINTS.ITEM_REQUESTS.CANCEL(id), {
            headers: { Authorization: `Bearer ${token}` },
        });
    },
};

interface TransactionItem {
    _id: string;
    
    itemId: {
        _id: string;
        title: string;
        
        author?: string; 
        image?: string; 
    };
    issuedDate: string;
    dueDate: string;
    returnDate: string | null;
    status: 'Issued' | 'Returned' | 'Overdue' | 'Pending'; 
    dueStatus: 'Active' | 'Overdue' | 'DueSoon' | 'Returned'; 
    daysRemaining?: number;
    daysOverdue?: number;
    isOverdue: boolean;
    
    fine?: number | null; 
}

interface ItemRequestItem {
    _id: string;
    requestedItemName: string;
    requestedItemDescription: string;
    requestedCategoryId: {
        name: string;
        _id: string;
    };
    urgency: 'Low' | 'Medium' | 'High';
    neededBy: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
    createdAt: string;
}

interface HistoryData {
    transactions: TransactionItem[];
    itemRequests: ItemRequestItem[];
}

type TabType = "circulation" | "requests" | "overdue";

export default function HistoryScreen() {
    const [user] = useAtom(userAtom);
    const [token] = useAtom(tokenAtom);
    const [activeTab, setActiveTab] = useState<TabType>("circulation");
    const [historyData, setHistoryData] = useState<HistoryData>({ transactions: [], itemRequests: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [fadeAnim] = useState(new Animated.Value(0));
    const { colors } = useTheme();
    
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

    const fetchHistory = useCallback(async () => {
        if (!user?.id || !token) {
            setError("Authentication failed. Please log in.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            setError(null);
            
            // 1. Fetch Transactions (Issued, Returned, Overdue)
            const transactionsPromise = axios.get(`${API_BASE_URL}/api/mobile/transactions`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // 2. Fetch Item Requests (using the dedicated service method)
            const itemRequestsPromise = requestService.getMyItemRequests(token);

            const [transactionsResponse, itemRequestsResponse] = await Promise.all([
                transactionsPromise,
                itemRequestsPromise,
            ]);

            const transactions: TransactionItem[] = transactionsResponse.data.data || [];
            const itemRequests: ItemRequestItem[] = itemRequestsResponse.data.data || [];
            
            setHistoryData({
                transactions,
                itemRequests,
            });

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();

        } catch (error: any) {
            console.error("Failed to fetch history:", error);
            setError("Failed to load history data. Please check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user, token, fadeAnim]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };
    
    const handleCancelItemRequest = useCallback((id: string) => {
        if (!token) return;

        Alert.alert(
            "Confirm Cancellation",
            "Are you sure you want to cancel this item request? This cannot be undone.",
            [
                {
                    text: "No",
                    style: "cancel",
                },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await requestService.cancelItemRequest(id, token);

                            Alert.alert("Success", "Item Request cancelled successfully.");
                            await fetchHistory();
                        } catch (error: any) {
                            console.error("Failed to cancel Item Request:", error);
                            const errorMessage = error.response?.data?.message || 'Failed to cancel the request. Only Pending requests can be cancelled.';
                            Alert.alert("Error", errorMessage);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }, [token, fetchHistory]);
    // --------------------------------------------------

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
            case "issued":
            case "approved":
            case "returned":
                return "#007AFF"; 
            case "duesoon":
            case "medium": 
                return "#FF9500"; 
            case "overdue":
            case "rejected":
                return "#FF3B30"; 
            case "pending":
            case "cancelled": 
                return "#8E8E93"; 

            
            case "low":
                return "#007AFF";
            case "high":
                return "#FF3B30";
            default:
                return colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "active":
            case "issued":
                return "book-outline";
            case "duesoon":
                return "alert-outline";
            case "overdue":
                return "warning-outline";
            case "returned":
                return "checkmark-done-outline";
            case "pending":
                return "time-outline";
            case "approved":
                return "thumbs-up-outline";
            case "rejected":
            case "cancelled":
                return "close-circle-outline";
            default:
                return "help-circle-outline";
        }
    };

   
    const renderCirculationItems = () => {
        const issuedAndReturned = historyData.transactions.filter(
            t => t.dueStatus === 'Active' || t.dueStatus === 'DueSoon' || t.dueStatus === 'Returned'
        );
        
        if (!issuedAndReturned.length) {
            return (
                <View style={dynamicStyles.emptyState}>
                    <Ionicons
                        name="book-outline"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.emptyTitle}>No Recent Circulation History</Text>
                    <Text style={dynamicStyles.emptyText}>
                        This tab shows your currently borrowed items and return history.
                    </Text>
                </View>
            );
        }

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                {issuedAndReturned.map((item, index) => {
                    const isReturned = item.dueStatus === 'Returned';
                    const daysRemaining = item.daysRemaining || 0;
                    const daysOverdue = item.daysOverdue || 0;
                    const daysText = isReturned 
                        ? `Returned on ${formatDate(item.returnDate!)}`
                        : daysRemaining > 0 
                            ? `${daysRemaining} days remaining` 
                            : 'N/A';

                    return (
                        <View
                            key={item._id}
                            style={[
                                dynamicStyles.itemCard,
                                index === issuedAndReturned.length - 1 && dynamicStyles.lastItemCard,
                            ]}
                        >
                            <View style={dynamicStyles.itemHeader}>
                                <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                                    {item.itemId?.title || "Unknown Item"}
                                </Text>
                                <View
                                    style={[
                                        dynamicStyles.statusBadge,
                                        { backgroundColor: getStatusColor(item.dueStatus) },
                                    ]}
                                >
                                    <Ionicons
                                        name={getStatusIcon(item.dueStatus)}
                                        size={12}
                                        color="#FFF"
                                    />
                                    <Text style={dynamicStyles.statusBadgeText}>
                                        {item.dueStatus}
                                    </Text>
                                </View>
                            </View>

                            <Text style={dynamicStyles.itemAuthor}>by {item.itemId?.author || "N/A"}</Text>

                            <View style={dynamicStyles.datesContainer}>
                                <View style={dynamicStyles.dateRow}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={dynamicStyles.dateLabel}>Issued: </Text>
                                    <Text style={dynamicStyles.dateValue}>
                                        {formatDate(item.issuedDate)}
                                    </Text>
                                </View>
                                {!isReturned && (
                                    <View style={dynamicStyles.dateRow}>
                                        <Ionicons
                                            name="flag-outline"
                                            size={14}
                                            color={colors.textSecondary}
                                        />
                                        <Text style={dynamicStyles.dateLabel}>Due: </Text>
                                        <Text style={dynamicStyles.dateValue}>
                                            {formatDate(item.dueDate)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            <View style={dynamicStyles.footer}>
                                <View style={dynamicStyles.daysContainer}>
                                    <Text
                                        style={[
                                            dynamicStyles.daysText,
                                            item.dueStatus === 'DueSoon' && dynamicStyles.daysRemainingText,
                                        ]}
                                    >
                                        {daysText}
                                    </Text>
                                </View>
                                {/* Fine badge display (if any) */}
                                {item.fine && item.fine > 0 && (
                                    <View style={dynamicStyles.fineBadge}>
                                        <Text style={dynamicStyles.fineBadgeText}>
                                            Fine: {formatCurrency(item.fine)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </Animated.View>
        );
    };
    
   
    const renderItemRequests = () => {
        const requests = historyData.itemRequests;

        if (!requests.length) {
            return (
                <View style={dynamicStyles.emptyState}>
                    <Ionicons
                        name="help-circle-outline"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.emptyTitle}>No Item Requests Found</Text>
                    <Text style={dynamicStyles.emptyText}>
                        This shows items you have requested the library to acquire.
                    </Text>
                    <TouchableOpacity 
                        style={[dynamicStyles.retryButton, {marginTop: 20}]} 
                        onPress={() => router.push('/(tabs)/home/request-new-item')}
                    >
                        <Ionicons name="add" size={20} color="#FFF" />
                        <Text style={dynamicStyles.retryButtonText}>Request New Item</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                {requests.map((req, index) => {
                   
                    const isPending = req.status === 'Pending';

                    return (
                        <View
                            key={req._id}
                            style={[
                                dynamicStyles.itemCard,
                                index === requests.length - 1 && dynamicStyles.lastItemCard,
                            ]}
                        >
                            <View style={dynamicStyles.itemHeader}>
                                <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                                    {req.requestedItemName}
                                </Text>
                                <View
                                    style={[
                                        dynamicStyles.statusBadge,
                                       
                                        { backgroundColor: getStatusColor(req.status) }, 
                                    ]}
                                >
                                    <Ionicons
                                        name={getStatusIcon(req.status)}
                                        size={12}
                                        color="#FFF"
                                    />
                                    <Text style={dynamicStyles.statusBadgeText}>{req.status}</Text>
                                </View>
                            </View>

                            {/* Additional Request Details */}
                            <Text style={dynamicStyles.itemAuthor}>
                                Category: {req.requestedCategoryId?.name || 'N/A'}
                            </Text>
                            
                            {/* Description */}
                            <Text style={dynamicStyles.requestDescription}>
                                Description: {req.requestedItemDescription}
                            </Text>

                            <View style={dynamicStyles.datesContainer}>
                                <View style={dynamicStyles.dateRow}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={dynamicStyles.dateLabel}>Requested: </Text>
                                    <Text style={dynamicStyles.dateValue}>
                                        {formatDate(req.createdAt)}
                                    </Text>
                                </View>
                                <View style={dynamicStyles.dateRow}>
                                    <Ionicons
                                        name="time-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={dynamicStyles.dateLabel}>Needed By: </Text>
                                    <Text style={dynamicStyles.dateValue}>
                                        {formatDate(req.neededBy)}
                                    </Text>
                                </View>
                                
                            </View>
                            
                            <View style={dynamicStyles.footer}>
                                <View style={dynamicStyles.daysContainer}>
                                    <Text style={dynamicStyles.urgencyText}>
                                        Urgency: <Text style={{fontWeight: '700', color: getStatusColor(req.urgency) }}>{req.urgency}</Text>
                                    </Text>
                                </View>
                                
                                {/* NEW: Cancel Button */}
                                {isPending && (
                                    <TouchableOpacity
                                        style={dynamicStyles.cancelButton}
                                        onPress={() => handleCancelItemRequest(req._id)}
                                    >
                                        <Text style={dynamicStyles.cancelButtonText}>Cancel Request</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                        </View>
                    );
                })}
            </Animated.View>
        );
    };
    
   
    const renderOverdueItems = () => {
        const overdueItems = historyData.transactions.filter(t => t.dueStatus === 'Overdue');
        
        if (!overdueItems.length) {
            return (
                <View style={dynamicStyles.emptyState}>
                    <Ionicons
                        name="happy-outline"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.emptyTitle}>No Overdue Items! 🎉</Text>
                    <Text style={dynamicStyles.emptyText}>
                        You currently have no overdue books. Keep up the good work!
                    </Text>
                </View>
            );
        }

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                {overdueItems.map((item, index) => {
                    const daysOverdue = item.daysOverdue || 0;
                    
                    return (
                        <View
                            key={item._id}
                            style={[
                                dynamicStyles.itemCard,
                                dynamicStyles.overdueCard,
                                index === overdueItems.length - 1 && dynamicStyles.lastItemCard,
                            ]}
                        >
                            <View style={dynamicStyles.itemHeader}>
                                <Text style={dynamicStyles.itemTitle} numberOfLines={2}>
                                    {item.itemId?.title || "Unknown Item"}
                                </Text>
                                <View
                                    style={[
                                        dynamicStyles.statusBadge,
                                        { backgroundColor: getStatusColor('overdue') },
                                    ]}
                                >
                                    <Ionicons
                                        name={getStatusIcon('overdue')}
                                        size={12}
                                        color="#FFF"
                                    />
                                    <Text style={dynamicStyles.statusBadgeText}>
                                        OVERDUE
                                    </Text>
                                </View>
                            </View>

                            <Text style={dynamicStyles.itemAuthor}>by {item.itemId?.author || "N/A"}</Text>

                            <View style={dynamicStyles.datesContainer}>
                                <View style={dynamicStyles.dateRow}>
                                    <Ionicons
                                        name="calendar-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={dynamicStyles.dateLabel}>Issued: </Text>
                                    <Text style={dynamicStyles.dateValue}>
                                        {formatDate(item.issuedDate)}
                                    </Text>
                                </View>
                                <View style={dynamicStyles.dateRow}>
                                    <Ionicons
                                        name="flag-outline"
                                        size={14}
                                        color={colors.textSecondary}
                                    />
                                    <Text style={dynamicStyles.dateLabel}>Was Due: </Text>
                                    <Text style={[dynamicStyles.dateValue, dynamicStyles.overdueText]}>
                                        {formatDate(item.dueDate)}
                                    </Text>
                                </View>
                            </View>

                            <View style={dynamicStyles.footer}>
                                <View style={dynamicStyles.daysContainer}>
                                    <Text style={[dynamicStyles.daysText, dynamicStyles.overdueText]}>
                                        {daysOverdue} days overdue
                                    </Text>
                                </View>
                                {/* Assuming fine calculation/display logic is handled here if needed */}
                                {item.fine && item.fine > 0 && (
                                    <View style={dynamicStyles.fineBadge}>
                                        <Text style={dynamicStyles.fineBadgeText}>
                                            Fine: {formatCurrency(item.fine)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}
            </Animated.View>
        );
    };

    const getTabContent = () => {
        switch (activeTab) {
            case "circulation":
                return renderCirculationItems();
            case "requests":
                return renderItemRequests();
            case "overdue":
                return renderOverdueItems();
            default:
                return null;
        }
    };

    const getTabCount = (tab: TabType) => {
        if (!historyData) return 0;

        switch (tab) {
            case "circulation":
                // Issued, Active, DueSoon, Returned
                return historyData.transactions.filter(t => t.dueStatus !== 'Overdue').length;
            case "requests":
                return historyData.itemRequests.length;
            case "overdue":
                return historyData.transactions.filter(t => t.dueStatus === 'Overdue').length;
            default:
                return 0;
        }
    };

    if (loading) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={dynamicStyles.loadingText}>Loading your history...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={dynamicStyles.errorContainer}>
                <Ionicons
                    name="alert-circle-outline"
                    size={64}
                    color={colors.textSecondary}
                />
                <Text style={dynamicStyles.errorTitle}>Unable to Load History</Text>
                <Text style={dynamicStyles.errorText}>{error}</Text>
                <TouchableOpacity style={dynamicStyles.retryButton} onPress={fetchHistory}>
                    <Ionicons name="refresh" size={20} color="#FFF" />
                    <Text style={dynamicStyles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
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
                <Text style={dynamicStyles.headerTitle}>History</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            {/* Tabs */}
            <View style={dynamicStyles.tabsContainer}>
                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "circulation" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("circulation")}
                >
                    <Ionicons
                        name="book-outline"
                        size={20}
                        color={
                            activeTab === "circulation" ? colors.primary : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "circulation" && dynamicStyles.activeTabText,
                        ]}
                    >
                        Issued/Returned ({getTabCount("circulation")})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "requests" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("requests")}
                >
                    <Ionicons
                        name="chatbox-ellipses-outline"
                        size={20}
                        color={
                            activeTab === "requests" ? colors.primary : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "requests" && dynamicStyles.activeTabText,
                        ]}
                    >
                        New Item Requests ({getTabCount("requests")})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "overdue" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("overdue")}
                >
                    <Ionicons
                        name="warning-outline"
                        size={20}
                        color={
                            activeTab === "overdue" ? colors.primary : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "overdue" && dynamicStyles.activeTabText,
                        ]}
                    >
                        Overdue ({getTabCount("overdue")})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={dynamicStyles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={dynamicStyles.contentContainer}>{getTabContent()}</View>

                {/* Bottom Spacer */}
                <View style={dynamicStyles.bottomSpacer} />
            </ScrollView>
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        padding: 32,
        gap: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: colors.textPrimary,
        textAlign: "center",
    },
    errorText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 22,
    },
    retryButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.primary,
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
        textAlign: "center",
    },
    placeholder: {
        width: 32,
    },
    tabsContainer: {
        flexDirection: "row",
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 16,
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 10, 
        fontWeight: "600",
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    emptyState: {
        alignItems: "center",
        padding: 40,
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
    },
    itemCard: {
        backgroundColor: colors.cardBackground,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    overdueCard: {
        borderLeftColor: '#FF3B30',
    },
    lastItemCard: {
        marginBottom: 0,
    },
    itemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 8,
    },
    itemTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginRight: 12,
    },
    requestDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 12,
        lineHeight: 18,
    },
    fineReason: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: colors.textPrimary,
        marginRight: 12,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#FFF",
        textTransform: "uppercase",
    },
    itemAuthor: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    datesContainer: {
        gap: 6,
        marginBottom: 12,
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    dateLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    dateValue: {
        fontSize: 12,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    daysContainer: {
        flex: 1,
    },
    daysText: {
        fontSize: 14,
        fontWeight: "600",
    },
    daysRemainingText: {
        color: "#FF9500", 
    },
    overdueText: {
        color: "#FF3B30",
    },
    fineBadge: {
        backgroundColor: "#FF3B30",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    fineBadgeText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#FFF",
    },
    urgencyText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    bottomSpacer: {
        height: 20,
    },
    
    cancelButton: {
        backgroundColor: '#FF3B30', 
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginLeft: 10, 
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: "600",
    },
    
});
}
