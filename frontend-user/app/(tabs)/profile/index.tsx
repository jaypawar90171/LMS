import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom, logoutAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  username: string;
  status: string;
  roles: Array<{
    _id: string;
    roleName: string;
    description: string;
  }>;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
}

interface ProfileOption {
  id: string;
  title: string;
  icon: string;
  screen?: string;
  action?: () => void;
  comingSoon?: boolean;
}

export default function ProfileScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [, logout] = useAtom(logoutAtom);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProfileData(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      if (user) {
        setProfileData({
          id: user.id || user._id,
          fullName: user.fullName || "User",
          email: user.email,
          username: user.username || user.email?.split("@")[0],
          status: user.status || "Active",
          roles: user.roles || [],
          lastLogin: user.lastLogin || new Date().toISOString(),
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString(),
          profilePicture: user.profilePicture,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "#4CAF50";
      case "pending":
        return "#FF9800";
      case "suspended":
        return "#F44336";
      default:
        return COLORS.textSecondary;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/(auth)");
          },
        },
      ]
    );
  };

  const profileOptions: ProfileOption[] = [
    {
      id: "update-profile",
      title: "Update Profile",
      icon: "person-outline",
      screen: "/(tabs)/profile/update-profile",
    },
    {
      id: "change-password",
      title: "Change Password",
      icon: "lock-closed-outline",
      screen: "/(tabs)/profile/change-password",
    },
    {
      id: "history",
      title: "History",
      icon: "time-outline",
      screen: "/(tabs)/profile/history",
    },
    {
      id: "notifications",
      title: "View Notifications",
      icon: "notifications-outline",
      screen: "/(tabs)/profile/notifications",
    },
    {
      id: "notifications preference",
      title: "Notification Preference",
      icon: "notifications-outline",
      screen: "/(tabs)/profile/notificationPreference",
    },
    {
      id: "fines",
      title: "Fines and Services",
      icon: "card-outline",
      screen: "/(tabs)/profile/fines",
    },
    {
      id: "donations",
      title: "Donations",
      icon: "card-outline",
      screen: "/(tabs)/profile/donationList",
    },
  ];

  const handleOptionPress = (option: ProfileOption) => {
    if (option.comingSoon) {
      Alert.alert("Coming Soon", "This feature will be available soon!");
      return;
    }
    
    if (option.screen) {
      router.push(option.screen as any);
    } else if (option.action) {
      option.action();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  const displayData = profileData || user;

  if (!displayData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No user data found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {displayData.profilePicture ? (
            <Image
              source={{ uri: displayData.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {getInitials(displayData.fullName)}
              </Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayData.fullName}</Text>
          <Text style={styles.userEmail}>{displayData.email}</Text>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayData.status) }]}>
            <Text style={styles.statusText}>{displayData.status}</Text>
          </View>

          {/* Role */}
          {displayData.roles && displayData.roles.length > 0 && (
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>
                {displayData.roles.map((role: { roleName: string }) => role.roleName).join(", ")}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Profile Options */}
      <View style={styles.optionsSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        {profileOptions.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionItem,
              index === profileOptions.length - 1 && styles.lastOptionItem,
            ]}
            onPress={() => handleOptionPress(option)}
          >
            <View style={styles.optionLeft}>
              <Ionicons name={option.icon as any} size={22} color={COLORS.primary} />
              <Text style={styles.optionText}>{option.title}</Text>
            </View>
            
            <View style={styles.optionRight}>
              {option.comingSoon && (
                <Text style={styles.comingSoonText}>Soon</Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Username</Text>
          <Text style={styles.infoValue}>{displayData.username}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {new Date(displayData.createdAt).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Last Login</Text>
          <Text style={styles.infoValue}>
            {new Date(displayData.lastLogin).toLocaleDateString()} at{" "}
            {new Date(displayData.lastLogin).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "600",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  roleContainer: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  optionsSection: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    padding: 16,
    paddingBottom: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  optionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  comingSoonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  infoSection: {
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}50`,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "400",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  bottomSpacer: {
    height: 20,
  },
});