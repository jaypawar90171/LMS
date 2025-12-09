import { requestService, transactionService } from "@/services";
import { tokenAtom, userAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface RequestedItem {
    _id: string;
    name: string;
    description?: string;
    category: string;
    reason?: string;
    quantity: number;
    status: "Pending" | "Approved" | "Rejected" | "Cancelled";
    requestedAt: string;
    createdAt: string;
    updatedAt: string;
    userId?: {
        _id: string;
        fullName: string;
        email: string;
        username: string;
    };
}


interface RenewalRequestDetails {
    _id: string;
    userId: string;
    itemId: string;
    currentDueDate: string;
    requestedDueDate: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    reason?: string;
    createdAt: string;
    transactionId: {
        _id: string;
        itemId: {
            _id: string;
            title: string;
            barcode: string;
            itemType: string;
        };
        dueDate: string;
    };
}

interface IssuedItem {
    _id: string;
    itemId: {
        _id: string;
        title: string;
        description?: string;
    };
    userId: {
        _id: string;
        fullName: string;
        email: string;
    };
    issuedDate: string;
    dueDate: string;
    status: string;
    extensionCount: number;
    maxExtensionAllowed: number;
    isOverdue?: boolean;
    daysOverdue?: number;
    daysRemaining?: number;
}

export default function RequestsScreen() {
    const [user] = useAtom(userAtom);
    const [token] = useAtom(tokenAtom);
    const [activeTab, setActiveTab] = useState<"requested" | "renewal">(
        "requested"
    );
    const [requestedItems, setRequestedItems] = useState<RequestedItem[]>([]);
    const [renewalRequests, setRenewalRequests] = useState<RenewalRequestDetails[]>([]);
    const { colors } = useTheme();
        
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);


    const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchRequestedItems = async () => {
        if (!user?.id || !token) return;

        try {
            const response = await requestService.getUserRequests();

            if (response.data.success) {
                setRequestedItems(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch requested items:", error);
            Alert.alert("Error", "Failed to load requested items");
        }
    };

    const fetchRenewalRequests = async () => {
        if (!user?.id || !token) return;

        try {
            const response = await transactionService.getRenewalRequests();

            if (response.data.success) {
                setRenewalRequests(response.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch renewal requests:", error);
            Alert.alert("Error", "Failed to load renewal requests");
        }
    };

    const fetchIssuedItems = async () => {
        if (!user?.id || !token) return;

        try {
            const response = await transactionService.getUserTransactions();

            if (response.data.success) {
                const items = response.data.data || [];
                setIssuedItems(
                    items.map((item: IssuedItem) => ({
                        ...item,
                        isOverdue: new Date(item.dueDate) < new Date(),
                        daysOverdue:
                            new Date(item.dueDate) < new Date()
                                ? Math.floor(
                                      (new Date().getTime() - new Date(item.dueDate).getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                : undefined,
                        daysRemaining:
                            new Date(item.dueDate) >= new Date()
                                ? Math.floor(
                                      (new Date(item.dueDate).getTime() - new Date().getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  )
                                : undefined,
                    }))
                );
            }
        } catch (error) {
            console.error("Failed to fetch issued items:", error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchRequestedItems(), fetchIssuedItems(), fetchRenewalRequests()]);
        setLoading(false);
        setRefreshing(false);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);
    
    const handleCancelRequest = async (id: string) => {
        Alert.alert(
            "Confirm Cancellation",
            "Are you sure you want to cancel this request? This action cannot be reversed.",
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
                            await requestService.cancelRequest(id);

                            Alert.alert("Success", "Request cancelled successfully.");
                            
                            await fetchRequestedItems();
                        } catch (error) {
                            console.error("Failed to cancel request:", error);
                            
                            const errorMessage = (error as any).response?.data?.message || 'Failed to cancel the request. Please try again.';
                            Alert.alert("Error", errorMessage);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const handleItemPress = (
        item: RequestedItem | RenewalRequestDetails,
        type: "requested" | "renewal"
    ) => {
        if (type === 'renewal') {
            const renewalReq = item as RenewalRequestDetails;
            router.push({
                pathname: "/(stack)/item-details",
                params: {
                    itemId: renewalReq.transactionId.itemId._id,
                },
            });
            return;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
            case "issued":
                return "#FF9500";
            case "approved":
                return "#34C759";
            case "rejected":
            case "cancelled": 
                return "#FF3B30";
            default:
                return colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
            case "issued":
                return "time-outline";
            case "approved":
                return "checkmark-circle-outline";
            case "rejected":
            case "cancelled": 
                return "close-circle-outline";
            default:
                return "help-circle-outline";
        }
    };

    if (loading) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <Text style={{color: colors.textPrimary}}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={dynamicStyles.container}>
            {/* Header */}
            <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.headerTitle}>Requests</Text>
                <Text style={dynamicStyles.headerSubtitle}>
                    Manage your item requests and renewals
                </Text>
            </View>

            {/* Tab Navigation */}
            <View style={dynamicStyles.tabContainer}>
                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "requested" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("requested")}
                >
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "requested" && dynamicStyles.activeTabText,
                        ]}
                    >
                        Requested Items ({requestedItems.length})
                    </Text>
                </TouchableOpacity>

                {/*Renewal Requests Tab */}
                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "renewal" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("renewal")}
                >
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "renewal" && dynamicStyles.activeTabText,
                        ]}
                    >
                        Renewal Requests ({renewalRequests.length})
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
                {activeTab === "requested" ? (
                    <View style={dynamicStyles.section}>
                        {requestedItems.length === 0 ? (
                            <View style={dynamicStyles.emptyState}>
                                <Ionicons
                                    name="document-text-outline"
                                    size={64}
                                    color={colors.textSecondary}
                                />
                                <Text style={dynamicStyles.emptyStateTitle}>No Requested Items</Text>
                                <Text style={dynamicStyles.emptyStateText}>
                                    You haven't requested any items yet. Start by exploring our
                                    collection!
                                </Text>
                                <TouchableOpacity
                                    style={dynamicStyles.exploreButton}
                                    onPress={() => router.push("/(tabs)/explore")}
                                >
                                    <Text style={dynamicStyles.exploreButtonText}>Explore Items</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            requestedItems.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    style={dynamicStyles.itemCard}
                                
                                    onPress={() => handleItemPress(item, 'requested')}
                                >
                                    <View style={dynamicStyles.itemContent}>
                                        <View style={dynamicStyles.itemInfo}>
                                            <Text style={dynamicStyles.itemTitle}>{item.name}</Text>
                                            <Text style={dynamicStyles.itemSubtitle}>
                                                Category: {item.category}
                                            </Text>
                                            {item.description && (
                                                <Text style={dynamicStyles.itemDescription} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            )}
                                            <Text style={dynamicStyles.itemDate}>
                                                Requested on{" "}
                                                {new Date(item.requestedAt).toLocaleDateString()}
                                            </Text>
                                        </View>

                                        <View style={dynamicStyles.statusContainer}>
                                            <View
                                                style={[
                                                    dynamicStyles.statusBadge,
                                                    {
                                                        backgroundColor: `${getStatusColor(item.status)}15`,
                                                    },
                                                ]}
                                            >
                                                <Ionicons
                                                    name={getStatusIcon(item.status)}
                                                    size={16}
                                                    color={getStatusColor(item.status)}
                                                />
                                                <Text
                                                    style={[
                                                        dynamicStyles.statusText,
                                                        { color: getStatusColor(item.status) },
                                                    ]}
                                                >
                                                    {item.status.charAt(0).toUpperCase() +
                                                        item.status.slice(1)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    {item.status.toLowerCase() === 'pending' && (
                                        <TouchableOpacity
                                            style={dynamicStyles.cancelButton}
                                            onPress={() => handleCancelRequest(item._id)}
                                        >
                                            <Text style={dynamicStyles.cancelButtonText}>Cancel Request</Text>
                                        </TouchableOpacity>
                                    )}
                          

                                </TouchableOpacity>
                            ))
                        )}
                    </View>
                ) : (
                    /* Renewal Requests Content */
                    <View style={dynamicStyles.section}>
                        {renewalRequests.length === 0 ? (
                            <View style={dynamicStyles.emptyState}>
                                <Ionicons
                                    name="sync-circle-outline"
                                    size={64}
                                    color={colors.textSecondary}
                                />
                                <Text style={dynamicStyles.emptyStateTitle}>No Pending Renewals</Text>
                                <Text style={dynamicStyles.emptyStateText}>
                                    You have no pending renewal requests.
                                </Text>
                            </View>
                        ) : (
                            renewalRequests.map((req) => {
                                const itemTitle = req.transactionId.itemId.title || "Unknown Item";
                                const reqStatus = req.status;

                                return (
                                    <TouchableOpacity
                                        key={req._id}
                                        style={[
                                            dynamicStyles.itemCard,
                                            reqStatus === 'Rejected' && dynamicStyles.overdueCard
                                        ]}
                                        
                                        onPress={() => handleItemPress(req, 'renewal')}
                                    >
                                        <View style={dynamicStyles.itemContent}>
                                            <View style={dynamicStyles.itemInfo}>
                                                <Text style={dynamicStyles.itemTitle}>{itemTitle}</Text>

                                                <View style={dynamicStyles.overdueDetails}>
                                                    <View style={dynamicStyles.detailRow}>
                                                        <Ionicons
                                                            name="calendar-outline"
                                                            size={14}
                                                            color={colors.textSecondary}
                                                        />
                                                        <Text style={dynamicStyles.itemDate}>
                                                            Current Due: {new Date(req.currentDueDate).toLocaleDateString()}
                                                        </Text>
                                                    </View>

                                                    <View style={dynamicStyles.detailRow}>
                                                        <Ionicons
                                                            name="calendar-outline"
                                                            size={14}
                                                            color={colors.textSecondary}
                                                        />
                                                        <Text style={dynamicStyles.itemDate}>
                                                            Requested Due: {new Date(req.requestedDueDate).toLocaleDateString()}
                                                        </Text>
                                                    </View>

                                                    <Text style={dynamicStyles.itemDescription} numberOfLines={2}>
                                                        Reason: {req.reason || 'Standard renewal request'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={dynamicStyles.statusContainer}>
                                                <View
                                                    style={[
                                                        dynamicStyles.statusBadge,
                                                        {
                                                            backgroundColor: `${getStatusColor(reqStatus)}15`,
                                                        },
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name={getStatusIcon(reqStatus)}
                                                        size={16}
                                                        color={getStatusColor(reqStatus)}
                                                    />
                                                    <Text
                                                        style={[
                                                            dynamicStyles.statusText,
                                                            { color: getStatusColor(reqStatus) },
                                                        ]}
                                                    >
                                                        {reqStatus}
                                                    </Text>
                                                </View>
                                                <Text style={dynamicStyles.itemDate}>
                                                    Submitted on {new Date(req.createdAt).toLocaleDateString()}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </View>
                )}
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
    },
    header: {
        padding: 15,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: "center",
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.primary,
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    itemCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    overdueCard: {
    
        borderLeftWidth: 4,
        borderLeftColor: "#FF3B30",
    },
    overdueIndicator: {
    
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: "#FF3B30",
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
    },
    itemContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    itemInfo: {
        flex: 1,
        marginRight: 12,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textPrimary,
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    itemDescription: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
        lineHeight: 16,
    },
    itemDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statusContainer: {
        alignItems: "flex-end",
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    overdueDetails: {
        marginTop: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    overdueText: {
        fontSize: 12,
        color: "#FF3B30",
        fontWeight: "500",
    },
    urgentBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FF3B3015",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    urgentText: {
        fontSize: 12,
        color: "#FF3B30",
        fontWeight: "600",
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
        marginTop: 40,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    emptyStateText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 20,
    },
    exploreButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    exploreButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },
    cancelButton: {
        marginTop: 12,
        backgroundColor: '#FF3B30', 
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    cancelButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: "600",
    },
});
}