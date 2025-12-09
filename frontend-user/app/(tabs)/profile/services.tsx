import { useTheme } from "@/context/ThemeContext";
import { serviceService } from "@/services/serviceService";
import { tokenAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface ServiceSettings {
    extendedDays?: number;
    maxExtensions?: number;
    priorityLevel?: number;
    skipQueuePosition?: boolean;
}

interface AvailableService {
    _id: string;
    name: string;
    description: string;
    settings: ServiceSettings;
    isRequested?: boolean;
}

interface UserServiceDetail {
    _id: string;
    serviceId: AvailableService;
    status: "Active" | "Suspended" | "Expired";
    grantedDate: string;
    expiryDate: string | null;
    usageCount: number;
    maxUsage: number | null;
    currentUsage: number;
}

type TabType = "available" | "my_services";

export default function ServicesScreen() {
    const [token] = useAtom(tokenAtom);

    const [activeTab, setActiveTab] = useState<TabType>("available");
    const [availableServices, setAvailableServices] = useState<AvailableService[]>([]);
    const [userServices, setUserServices] = useState<UserServiceDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { colors } = useTheme();
    const router = useRouter();
        
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

    const fetchData = useCallback(async () => {
        if (!token) {
            setError("Authentication token missing.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            setError(null);

            const available = await serviceService.getAvailableServices(token);
            const userActive = await serviceService.getUserServices(token);

            const activeServiceIds = new Set(userActive.map((us) => us.serviceId._id));

            const markedAvailable = available.map((service) => ({
                ...service,
                isRequested: activeServiceIds.has(service._id),
            }));

            setAvailableServices(markedAvailable);
            setUserServices(userActive);
        } catch (err: any) {
            console.error("Service fetch error:", err.response?.data || err);
            setError("Failed to load service data. Please refresh.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            setLoading(true);
            fetchData();
        }
    }, [token, fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleRequestService = useCallback(
        (serviceId: string, serviceName: string) => {
            if (!token) return;

            Alert.alert(
                "Confirm Request",
                `Do you want to request the "${serviceName}" service?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Request",
                        style: "default",
                        onPress: async () => {
                            setLoading(true);
                            try {
                                const response = await serviceService.requestService(
                                    serviceId,
                                    token
                                );

                                Alert.alert(
                                    "Success",
                                    response.message || "Service request submitted!"
                                );

                                await fetchData();
                            } catch (err: any) {
                                const errorMessage =
                                    err.response?.data?.message ||
                                    "Failed to submit service request.";
                                Alert.alert("Error", errorMessage);
                            } finally {
                                setLoading(false);
                            }
                        },
                    },
                ]
            );
        },
        [token, fetchData]
    );

    const getStatusStyle = (status: UserServiceDetail["status"]) => {
        switch (status) {
            case "Active":
                return {
                    color: colors.success,
                    backgroundColor: `${colors.success}10`,
                };
            case "Suspended":
                return {
                    color: colors.warning,
                    backgroundColor: `${colors.warning}10`,
                };
            case "Expired":
                return {
                    color: colors.error,
                    backgroundColor: `${colors.error}10`,
                };
            default:
                return {
                    color: colors.textSecondary,
                    backgroundColor: `${colors.textSecondary}10`,
                };
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    
    const renderAvailableServices = () => {
        if (availableServices.length === 0) {
            return (
                <View style={dynamicStyles.emptyState}>
                    <Ionicons
                        name="alert-circle-outline"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.emptyTitle}>No Services Available</Text>
                    <Text style={dynamicStyles.emptyText}>
                        No special services are available right now.
                    </Text>
                </View>
            );
        }

        return availableServices.map((service) => (
            <View key={service._id} style={dynamicStyles.serviceCard}>
                <View style={dynamicStyles.cardHeader}>
                    <Text style={dynamicStyles.cardTitle}>{service.name}</Text>

                    {service.isRequested && (
                        <View
                            style={[
                                dynamicStyles.badge,
                                { backgroundColor: `${colors.success}20` },
                            ]}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.success }}>
                                ACTIVE
                            </Text>
                        </View>
                    )}
                </View>

                <Text style={dynamicStyles.cardDescription}>{service.description}</Text>

                {/* Extended Borrow Setting */}
                {service.settings.extendedDays ? (
                    <View style={dynamicStyles.row}>
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={colors.textSecondary}
                        />
                        <Text style={dynamicStyles.settingText}>
                            Extends loan by {service.settings.extendedDays} days
                        </Text>
                    </View>
                ) : null}

                {/* Priority Setting */}
                {service.settings.priorityLevel ? (
                    <View style={dynamicStyles.row}>
                        <Ionicons
                            name="star-outline"
                            size={16}
                            color={colors.textSecondary}
                        />
                        <Text style={dynamicStyles.settingText}>
                            Priority Level: {service.settings.priorityLevel}
                        </Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[
                        dynamicStyles.requestButton,
                        service.isRequested && dynamicStyles.requestedButton,
                    ]}
                    onPress={() => handleRequestService(service._id, service.name)}
                    disabled={service.isRequested}
                >
                    <Text style={dynamicStyles.requestButtonText}>
                        {service.isRequested ? "Service Active" : "Request Service"}
                    </Text>
                </TouchableOpacity>
            </View>
        ));
    };

    
    const renderUserServices = () => {
        if (userServices.length === 0) {
            return (
                <View style={dynamicStyles.emptyState}>
                    <Ionicons
                        name="person-circle-outline"
                        size={64}
                        color={colors.textSecondary}
                    />
                    <Text style={dynamicStyles.emptyTitle}>No Active Services</Text>
                    <Text style={dynamicStyles.emptyText}>
                        You have no active services. Request one from the Available tab!
                    </Text>
                </View>
            );
        }

        return userServices.map((us) => {
            const service = us.serviceId;
            const statusStyle = getStatusStyle(us.status);

            const daysRemaining = us.expiryDate
                ? Math.ceil(
                      (new Date(us.expiryDate).getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                  )
                : null;

            return (
                <View
                    key={us._id}
                    style={[dynamicStyles.serviceCard, { borderLeftColor: statusStyle.color }]}
                >
                    <View style={dynamicStyles.cardHeader}>
                        <Text style={dynamicStyles.cardTitle}>{service.name}</Text>

                        <View
                            style={[
                                dynamicStyles.badge,
                                { backgroundColor: statusStyle.backgroundColor },
                            ]}
                        >
                            <Text
                                style={[
                                    dynamicStyles.badgeText,
                                    { color: statusStyle.color },
                                ]}
                            >
                                {us.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <Text style={dynamicStyles.cardDescription}>{service.description}</Text>

                    <View style={dynamicStyles.detailsContainer}>
                        {/* Granted Date */}
                        <View style={dynamicStyles.row}>
                            <Ionicons
                                name="calendar-outline"
                                size={16}
                                color={colors.textSecondary}
                            />
                            <Text style={dynamicStyles.detailText}>
                                Granted: {formatDate(us.grantedDate)}
                            </Text>
                        </View>

                        {/* Expiry Date */}
                        {us.expiryDate && (
                            <View style={dynamicStyles.row}>
                                <Ionicons
                                    name="alert-circle-outline"
                                    size={16}
                                    color={
                                        daysRemaining !== null && daysRemaining <= 7
                                            ? colors.warning
                                            : colors.textSecondary
                                    }
                                />
                                <Text style={dynamicStyles.detailText}>
                                    Expires: {formatDate(us.expiryDate)}{" "}
                                    {daysRemaining !== null &&
                                        (daysRemaining > 0
                                            ? `(${daysRemaining} days left)`
                                            : "(Expired)")}
                                </Text>
                            </View>
                        )}

                        {/* Usage */}
                        {us.maxUsage !== null && (
                            <View style={dynamicStyles.row}>
                                <Ionicons
                                    name="swap-horizontal-outline"
                                    size={16}
                                    color={
                                        us.currentUsage >= us.maxUsage
                                            ? colors.error
                                            : colors.textSecondary
                                    }
                                />
                                <Text style={dynamicStyles.detailText}>
                                    Usage: {us.currentUsage} of {us.maxUsage}
                                </Text>
                            </View>
                        )}

                        {/* Extended Borrow Days */}
                        {service.settings.extendedDays && (
                            <View style={dynamicStyles.row}>
                                <Ionicons
                                    name="time-outline"
                                    size={16}
                                    color={colors.textSecondary}
                                />
                                <Text style={dynamicStyles.detailText}>
                                    Loan Extension: +{service.settings.extendedDays} days
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            );
        });
    };

    
    if (loading) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={dynamicStyles.loadingText}>Loading library services...</Text>
            </View>
        );
    }

    return (
        <View style={dynamicStyles.container}>
            <View style={dynamicStyles.header}>
  <TouchableOpacity
    style={dynamicStyles.backButton}
    onPress={() => router.navigate("/(tabs)/profile")}
  >
    <Ionicons name="arrow-back" size={24} color={colors.primary} />
  </TouchableOpacity>

  <Text style={dynamicStyles.headerTitle}>Premium Services</Text>

  {/* Placeholder to balance layout */}
  <View style={dynamicStyles.placeholder} />
</View>


            <View style={dynamicStyles.tabContainer}>
                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "available" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("available")}
                >
                    <Ionicons
                        name="grid-outline"
                        size={20}
                        color={
                            activeTab === "available"
                                ? colors.primary
                                : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "available" && dynamicStyles.activeTabText,
                        ]}
                    >
                        Available ({availableServices.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[dynamicStyles.tab, activeTab === "my_services" && dynamicStyles.activeTab]}
                    onPress={() => setActiveTab("my_services")}
                >
                    <Ionicons
                        name="bookmark-outline"
                        size={20}
                        color={
                            activeTab === "my_services"
                                ? colors.primary
                                : colors.textSecondary
                        }
                    />
                    <Text
                        style={[
                            dynamicStyles.tabText,
                            activeTab === "my_services" && dynamicStyles.activeTabText,
                        ]}
                    >
                        My Active Services ({userServices.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={dynamicStyles.content}
                contentContainerStyle={dynamicStyles.contentPadding}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {error ? (
                    <View style={dynamicStyles.errorState}>
                        <Ionicons name="sad-outline" size={64} color={colors.error} />
                        <Text style={dynamicStyles.errorTitle}>Error Loading Data</Text>
                        <Text style={dynamicStyles.errorText}>{error}</Text>
                        <TouchableOpacity style={dynamicStyles.retryButton} onPress={fetchData}>
                            <Text style={dynamicStyles.retryButtonText}>Tap to Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : activeTab === "available" ? (
                    renderAvailableServices()
                ) : (
                    renderUserServices()
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
    },
    loadingText: {
        marginTop: 10,
        color: colors.textSecondary,
    },
    backButton: {
    padding: 4,
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
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.textPrimary,
    },
    placeholder: {
    width: 24,
  },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
    },
    tabContainer: {
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
        paddingVertical: 16,
        borderBottomWidth: 3,
        borderBottomColor: "transparent",
        gap: 6,
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
    contentPadding: {
        padding: 16,
    },
    serviceCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.textPrimary,
        flexShrink: 1,
        marginRight: 10,
    },
    cardDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
    },
    settingText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    requestButton: {
        backgroundColor: colors.primary,
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
        alignItems: "center",
    },
    requestButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
    },
    requestedButton: {
        backgroundColor: colors.success,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    detailsContainer: {
        marginTop: 8,
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: colors.textPrimary,
    },
    emptyState: {
        alignItems: "center",
        padding: 40,
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        marginTop: 40,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: "dashed",
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
    },
    errorState: {
        alignItems: "center",
        padding: 40,
        backgroundColor: colors.cardBackground,
        borderRadius: 12,
        marginTop: 40,
        borderWidth: 1,
        borderColor: colors.error,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.error,
        marginTop: 16,
    },
    errorText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: colors.error,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
});
}
