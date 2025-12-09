import ItemCard from '@/components/ItemCard';
import QuickActionButton from '@/components/QuickActionButton';
import SectionHeader from '@/components/SectionHeader';
import { useTheme } from "@/context/ThemeContext";
import { dashboardService, itemService, notificationService } from '@/services';
import { tokenAtom, userAtom } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface DashboardUser {
  fullName: string;
  roles: string[];
}

interface DashboardItemTypeSpecificFields {
  author?: string;
  isbn?: string;
  publisher?: string;
  publicationYear?: number;
  pages?: number;
  image?: string;
}

interface DashboardItemCategory {
  _id: string;
  name: string;
}

interface DashboardItem {
  _id: string;
  title: string;
  description?: string;
  itemType?: string;
  typeSpecificFields?: DashboardItemTypeSpecificFields;
  // extra optional fields to align with InventoryItem / Queue populates
  authorOrCreator?: string;
  mediaUrl?: string;
  price?: number;
  quantity?: number;
  availableCopies?: number;
  categoryId?: string | DashboardItemCategory;
  subcategoryId?: string;
  condition?: string;
  status: string;
  barcode?: string;
  defaultReturnPeriod?: number;
  physicalDetails?: {
    condition?: string;
    dimensions?: string;
    weight?: string;
  };
  acquisitionDetails?: {
    source?: string;
    dateAcquired?: string;
    supplier?: string;
  };
  notes?: string;
  tags?: string[];
  photos?: string[];
  videos?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardCopy {
  _id: string;
  copyNumber: number;
  condition: string;
}

interface DashboardTransaction {
  _id: string;
  transactionId: string;
  userId: string;
  itemId: DashboardItem;
  copyId: DashboardCopy;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  returnCondition: string;
  extensionCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardSummary {
  issued: number;
  overdue: number;
  newArrivals: number;
}

interface DashboardQueuedItem {
  _id: string;
  itemId: DashboardItem;
  queueMembers?: any[];
  currentNotifiedUser?: any;
}

interface DashboardData {
  user?: DashboardUser;
  issuedTransactions?: DashboardTransaction[];
  overdueTransactions?: DashboardTransaction[];
  queuedItems?: DashboardQueuedItem[];
  newArrivals?: DashboardItem[];
  summary?: DashboardSummary;
}

type IssuedItem = DashboardTransaction;
type NewArrivalItem = DashboardItem;
type QueuedItem = DashboardQueuedItem;

export default function HomeScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const { colors } = useTheme();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const router = useRouter();

const fetchDashboardData = async () => {
  if (!user || !user.id || !token) {
    console.log('Missing user ID or token');
    setLoading(false);
    return;
  }

  try {
    const response = await dashboardService.getDashboardData(user.id);
    const data: DashboardData | undefined = response?.data;
    console.log(data);
    if (data) {
      const issued =
        data.summary?.issued ?? data.issuedTransactions?.length ?? 0;
      const overdue =
        data.summary?.overdue ?? data.overdueTransactions?.length ?? 0;
      const newArrivals =
        data.summary?.newArrivals ?? data.newArrivals?.length ?? 0;

      setDashboardData({
        user: {
          fullName: data.user?.fullName ?? user.fullName ?? 'User',
          roles: data.user?.roles ?? [],
        },
        issuedTransactions: data.issuedTransactions ?? [],
        overdueTransactions: data.overdueTransactions ?? [],
        queuedItems: data.queuedItems ?? [],
        newArrivals: data.newArrivals ?? [],
        summary: {
          issued,
          overdue,
          newArrivals,
        },
      });
    }

    // Notifications
    try {
      const notifResponse = await notificationService.getNotifications();
      const notifications = notifResponse?.data?.data || [];
      const unread = notifications.filter((n: any) => n.read === false).length;
      setUnreadCount(unread);
    } catch (notifError: any) {
      if (notifError.response?.status !== 404) {
        console.error('Notifications error:', notifError.message);
      }
      setUnreadCount(0);
    }
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    Alert.alert('Error', 'Failed to load dashboard data.');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handleViewAllNotifications = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }
    try {
      const response = await notificationService.getNotifications();
      router.push({
        pathname: '/profile/notifications',
        params: {
          items: JSON.stringify(response?.data?.data?.notifications || []),
        },
      });
    } catch (error: any) {
      console.error('Error navigating to notifications:', error);
      Alert.alert('Error', 'Could not load notifications.');
    }
  };

  const handleViewAllIssued = () => {
  if (!token) {
    Alert.alert("Error", "Authentication required");
    return;
  }

  try {
    router.push({
      pathname: "/home/issued-items",
      params: {
        items: JSON.stringify(dashboardData?.issuedTransactions || []),
      },
    });
  } catch (error: any) {
    console.error("Error navigating to issued items:", error);
    Alert.alert("Error", "Could not load issued items.");
  }
};

  const handleViewAllOverdue = () => {
  if (!token) {
    Alert.alert("Error", "Authentication required");
    return;
  }

  try {
    router.push({
      pathname: "/home/overdue-items",
      params: {
        items: JSON.stringify(dashboardData?.overdueTransactions || []),
      },
    });
  } catch (error: any) {
    console.error("Error navigating to overdue items:", error);
    Alert.alert("Error", "Could not load overdue items.");
  }
};


  const handleViewAllNewArrivals = async () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }
    try {
      const response = await itemService.getNewArrivals();
      const itemsFromService = response?.data?.data || [];
      const itemsFromDashboard = dashboardData?.newArrivals || [];
      const combined = itemsFromService.length
        ? itemsFromService
        : itemsFromDashboard;

      router.push({
        pathname: '/home/new-arrivals',
        params: {
          items: JSON.stringify(combined),
        },
      });
    } catch (error: any) {
      console.error('Error fetching new arrivals:', error);
      Alert.alert('Error', 'Could not load new arrivals.');
    }
  };

  const handleViewAllQueued = () => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    const queuedList = dashboardData?.queuedItems || [];

    router.push({
      pathname: '/home/queued-items',
      params: {
        items: JSON.stringify(queuedList),
      },
    });
  };

  const handleRequestBook = () => {
    router.push({ pathname: '/home/request-new-item' });
  };

  const handleDonate = () => {
    router.push({ pathname: '/(tabs)/home/donate-item' });
  };


  const handleItemPress = (
    item: IssuedItem | NewArrivalItem | QueuedItem,
    type: 'issued' | 'overdue' | 'new' | 'queued'
  ) => {
    let itemId: string | undefined;

    if (type === 'issued' || type === 'overdue') {
      itemId = (item as IssuedItem).itemId?._id;
    } else if (type === 'queued') {
      itemId = (item as QueuedItem).itemId?._id;
    } else {
      itemId = (item as NewArrivalItem)._id;
    }

    if (!itemId) {
      Alert.alert('Error', 'Item details are not available.');
      return;
    }

    if (type === 'queued') {
      router.push({
        pathname: '/home/queued-item-details',
        params: {
          queueId: (item as QueuedItem)._id,
        },
      });
      return;
    }

    router.push({
      pathname: '/(stack)/item-details',
      params: {
        itemId,
        itemType: type,
      },
    });
  };

  const calculateDaysRemaining = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateDaysOverdue = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isItemOverdue = (dueDate: string): boolean => {
    const due = new Date(dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return today > due;
  };

  const displayName =
    dashboardData?.user?.fullName || user?.fullName || 'User';
  const roles = dashboardData?.user?.roles || [];

  const issuedList = dashboardData?.issuedTransactions || [];
  const overdueList = dashboardData?.overdueTransactions || [];
  const queuedList = dashboardData?.queuedItems || [];
  const summaryQueued = queuedList.length ?? 0;
  const newArrivalsList = dashboardData?.newArrivals || [];

  const summaryIssued = dashboardData?.summary?.issued ?? issuedList.length;
  const summaryOverdue = dashboardData?.summary?.overdue ?? overdueList.length;

  const summaryNewArrivals =
    dashboardData?.summary?.newArrivals ?? newArrivalsList.length;

  const OverviewCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: string;
    label: string;
    value: number;
    color: string;
  }) => (
    <View
      style={[
        dynamicStyles.overviewCard,
        { borderColor: color, backgroundColor: `${color}10` },
      ]}
    >
      <View
        style={[dynamicStyles.iconBadge, { backgroundColor: `${color}25` }]}
      >
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={[dynamicStyles.overviewValue, { color }]}>{value}</Text>
      <Text style={dynamicStyles.overviewLabel}>{label}</Text>
    </View>
  );

  const RoleChip = ({ text }: { text: string }) => (
    <View style={dynamicStyles.roleChip}>
      <Ionicons
        name="shield-checkmark-outline"
        size={12}
        color={colors.textSecondary}
      />
      <Text style={dynamicStyles.roleChipText}>{text}</Text>
    </View>
  );

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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome + notifications */}
      <View style={dynamicStyles.welcomeCard}>
        <View style={dynamicStyles.welcomeIcon}>
          <Ionicons name="book-outline" size={28} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={dynamicStyles.welcomeText}>Welcome, {displayName?.split(" ")[0]}</Text>
          <Text style={dynamicStyles.subtitle}>
            Manage your library items efficiently
          </Text>

          {roles.length > 0 && (
            <View style={dynamicStyles.rolesRow}>
              {roles.slice(0, 3).map((r, idx) => (
                <RoleChip key={idx} text={r} />
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={dynamicStyles.notificationIconContainer}
          onPress={handleViewAllNotifications}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.primary}
          />
          {unreadCount > 0 && (
            <View style={dynamicStyles.badge}>
              <Text style={dynamicStyles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Overview */}
      <View style={dynamicStyles.overviewGrid}>
        <OverviewCard
          icon="document-text-outline"
          label="Issued"
          value={summaryIssued}
          color={colors.primary}
        />
        <OverviewCard
          icon="alert-circle-outline"
          label="Overdue"
          value={summaryOverdue}
          color="#FF3B30"
        />
        <OverviewCard
          icon="hourglass-outline"
          label="Queued"
          value={summaryQueued}
          color={colors.primary}
        />
        <OverviewCard
          icon="sparkles-outline"
          label="New"
          value={summaryNewArrivals}
          color="#34C759"
        />
      </View>

      {/* Currently Issued Items */}
      <SectionHeader
        title="Currently Issued"
        count={issuedList.length}
        showAction={issuedList.length > 0}
        actionText={`View All (${issuedList.length})`}
        onActionPress={handleViewAllIssued}
      />
      {issuedList.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="document-text-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateText}>
            No currently issued items
          </Text>
        </View>
      ) : (
        (() => {
          const item = issuedList[0];
          const overdue = isItemOverdue(item.dueDate);
          const daysOverdue = calculateDaysOverdue(item.dueDate);
          const daysRemaining = calculateDaysRemaining(item.dueDate);

          return (
            <ItemCard
              key={item._id}
              title={item.itemId?.title || 'Unknown Title'}
              subtitle={
                item.itemId?.typeSpecificFields?.author ||
                item.itemId?.itemType
              }
              imageUrl={item.itemId?.typeSpecificFields?.image}
              status={item.status}
              statusColor={overdue ? '#FF3B30' : colors.primary}
              dueInfo={
                overdue
                  ? `Overdue by ${daysOverdue} days`
                  : `Due in ${daysRemaining} days`
              }
              showOverdue={overdue}
              onPress={() => handleItemPress(item, 'issued')}
            />
          );
        })()
      )}

      {/* Overdue Items */}
      <SectionHeader
        title="Overdue Items"
        count={overdueList.length}
        showAction={overdueList.length > 0}
        actionText={`View All (${overdueList.length})`}
        onActionPress={handleViewAllOverdue}
      />  
      {overdueList.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateText}>
            No currently overdue items
          </Text>
        </View>
      ) : (
        (() => {
          const item = overdueList[0];
          const daysOverdue = calculateDaysOverdue(item.dueDate);
          return (
            <ItemCard
              key={item._id}
              title={item.itemId?.title || 'Unknown Title'}
              subtitle={
                item.itemId?.typeSpecificFields?.author ||
                item.itemId?.itemType
              }
              imageUrl={item.itemId?.typeSpecificFields?.image}
              status="Overdue"
              statusColor="#FF3B30"
              dueInfo={`Overdue by ${daysOverdue} days`}
              showOverdue={true}
              onPress={() => handleItemPress(item, 'overdue')}
            />
          );
        })()
      )}

      {/* Queued Items */}
      <SectionHeader
        title="Queued Items"
        count={queuedList.length}
        showAction={queuedList.length > 0}
        actionText={`View All (${queuedList.length})`}
        onActionPress={handleViewAllQueued}
      />

      {queuedList.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="hourglass-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateText}>No queued items</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.horizontalScroll}
        >
          {queuedList.map((queue: QueuedItem) => (
            <View key={queue._id} style={dynamicStyles.newArrivalCard}>
              <ItemCard
                title={queue.itemId?.title || 'Unknown Item'}
                subtitle={
                  queue.itemId?.authorOrCreator ||
                  queue.itemId?.typeSpecificFields?.author ||
                  queue.itemId?.itemType
                }
                imageUrl={
                  queue.itemId?.mediaUrl ||
                  queue.itemId?.typeSpecificFields?.image
                }
                status="Queued"
                statusColor={colors.primary}
                onPress={() => handleItemPress(queue, 'queued')}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* New Arrivals */}
      <SectionHeader
        title="New Arrivals"
        count={newArrivalsList.length}
        showAction={newArrivalsList.length > 0}
        actionText={`Explore (${newArrivalsList.length})`}
        onActionPress={handleViewAllNewArrivals}
      />
      {newArrivalsList.length === 0 ? (
        <View style={dynamicStyles.emptyState}>
          <Ionicons
            name="sparkles-outline"
            size={32}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.emptyStateText}>
            No new arrivals to show
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.horizontalScroll}
        >
          {newArrivalsList.map((item: NewArrivalItem) => (
            <View key={item._id} style={dynamicStyles.newArrivalCard}>
              <ItemCard
                title={item.title}
                subtitle={
                  item.typeSpecificFields?.author ||
                  item.typeSpecificFields?.publisher
                }
                imageUrl={item.typeSpecificFields?.image}
                status={item.status}
                statusColor={
                  item.status === 'Available' ? '#34C759' : '#FF9500'
                }
                onPress={() => handleItemPress(item, 'new')}
              />
            </View>
          ))}
        </ScrollView>
      )}

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" showAction={false} />
      <View style={dynamicStyles.quickActionsContainer}>
        <QuickActionButton
          icon="add-circle-outline"
          title="Request New Item"
          onPress={handleRequestBook}
        />
        <QuickActionButton
          icon="heart-outline"
          title="Donate Item"
          onPress={handleDonate}
        />
        <QuickActionButton
          icon="bug-outline"
          title="API Health Check"
          onPress={() => router.push('/api-test')}
        />
      </View>
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
    welcomeCard: {
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
      gap: 16,
    },
    welcomeIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    rolesRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      flexWrap: 'wrap',
    },
    roleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.inputBackground,
      borderColor: colors.border,
      borderWidth: 1,
    },
    roleChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    notificationIconContainer: {
      position: 'relative',
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: `${colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      position: 'absolute',
      top: -2,
      right: -2,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    overviewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 24,
      gap: 12,
    },
    overviewCard: {
      width: '42%',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      alignItems: 'center',
      gap: 8,
    },
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    overviewValue: {
      fontSize: 22,
      fontWeight: '800',
    },
    overviewLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    emptyState: {
      backgroundColor: colors.cardBackground,
      padding: 32,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      marginBottom: 20,
      gap: 12,
    },
    emptyStateText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyStateSubText: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },
    horizontalScroll: {
      flexDirection: 'row',
      paddingVertical: 8,
      gap: 12,
    },
    newArrivalCard: {
      width: 300,
    },
    quickActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      flexWrap: 'wrap',
      marginBottom: 32,
      gap: 12,
    },
  });
}
