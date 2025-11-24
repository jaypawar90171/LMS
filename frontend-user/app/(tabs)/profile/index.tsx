import React, { useState, useEffect, useMemo } from "react";
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
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import ThemeToggle from "@/components/ThemeToggle";

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
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [, logout] = useAtom(logoutAtom);
  const { colors } = useTheme();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

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

  const handleChangePhoto = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera roll permissions to change your profile photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const manipulatedImage = await manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );

        await uploadProfilePhoto(manipulatedImage.uri);
      }
    } catch (error: any) {
      console.error("Error changing photo:", error);
      Alert.alert("Error", "Failed to change profile photo. Please try again.");
    }
  };

  const uploadProfilePhoto = async (imageUri: string) => {
    try {
      setUploading(true);

      const formData = new FormData();

      // @ts-ignore
      formData.append("image", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile-photo.jpg",
      });

      const response = await axios.put(
        `${API_BASE_URL}/account/profile/picture`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        const { profilePicture, user: updatedUser } = response.data.data;

        setProfileData((prev) =>
          prev ? { ...prev, profilePicture } : null
        );

        if (updatedUser) {
          setUser(updatedUser);
        }

        Alert.alert("Success", "Profile photo updated successfully!");
      } else {
        throw new Error(
          response.data.message || "Failed to update profile photo"
        );
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        error.response?.data?.message ||
          "Failed to upload profile photo. Please try again."
      );
    } finally {
      setUploading(false);
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
        return colors.textSecondary;
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)");
        },
      },
    ]);
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
      <View style={[dynamicStyles.loadingContainer]}>
        <Text style={{ color: colors.textPrimary }}>Loading profile...</Text>
      </View>
    );
  }

  const displayData = profileData || user;

  if (!displayData) {
    return (
      <View style={[dynamicStyles.loadingContainer]}>
        <Text style={{ color: colors.textPrimary }}>No user data found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[dynamicStyles.container]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[dynamicStyles.header]}>
        <Text style={[dynamicStyles.headerTitle]}>Account</Text>
      </View>

      {/* Profile Card */}
      <View style={[dynamicStyles.profileCard]}>
        {/* Avatar Container */}
        <View style={dynamicStyles.avatarSection}>
          <View style={dynamicStyles.avatarContainer}>
            {displayData.profile ? (
              <Image
                source={{ uri: displayData.profile }}
                style={dynamicStyles.avatar}
              />
            ) : (
              <View style={[dynamicStyles.avatarPlaceholder]}>
                <Text style={dynamicStyles.avatarText}>
                  {getInitials(displayData.fullName)}
                </Text>
              </View>
            )}

            {/* Add Photo Button Overlay */}
            <TouchableOpacity
              style={[dynamicStyles.addPhotoButton]}
              onPress={handleChangePhoto}
              disabled={uploading}
            >
              {uploading ? (
                <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
              ) : (
                <Ionicons name="camera-outline" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={dynamicStyles.userInfo}>
            <Text style={[dynamicStyles.userName]}>
              {displayData.fullName}
            </Text>
            <Text style={[dynamicStyles.userEmail]}>
              {displayData.email}
            </Text>

            {/* Status Badge */}
            <View
              style={[
                dynamicStyles.statusBadge,
                { backgroundColor: getStatusColor(displayData.status) },
              ]}
            >
              <Text style={dynamicStyles.statusText}>{displayData.status}</Text>
            </View>

            {/* Role */}
            {displayData.roles && displayData.roles.length > 0 && (
              <View style={[dynamicStyles.roleContainer]}>
                <Text style={[dynamicStyles.roleText]}>
                  {displayData.roles
                    .map((role: any) => role.roleName)
                    .join(", ")}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Theme Toggle Section */}
      <View style={{ marginHorizontal: 16 }}>
        <ThemeToggle />
      </View>

      {/* Profile Options */}
      <View style={[dynamicStyles.optionsSection]}>
        <Text style={[dynamicStyles.sectionTitle]}>Account Settings</Text>

        {profileOptions.map((option, index) => (
          <TouchableOpacity
            key={option.id}
            style={[
              dynamicStyles.optionItem,
              index === profileOptions.length - 1 &&
                dynamicStyles.lastOptionItem,
            ]}
            onPress={() => handleOptionPress(option)}
          >
            <View style={dynamicStyles.optionLeft}>
              <Ionicons
                name={option.icon as any}
                size={22}
                color={colors.primary}
              />
              <Text style={[dynamicStyles.optionText]}>
                {option.title}
              </Text>
            </View>

            <View style={dynamicStyles.optionRight}>
              {option.comingSoon && (
                <Text style={[dynamicStyles.comingSoonText]}>
                  Soon
                </Text>
              )}
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Info */}
      <View style={[dynamicStyles.infoSection]}>
        <Text style={[dynamicStyles.sectionTitle]}>Account Information</Text>

        <View style={[dynamicStyles.infoItem]}>
          <Text style={[dynamicStyles.infoLabel]}>Username</Text>
          <Text style={[dynamicStyles.infoValue]}>
            {displayData.username}
          </Text>
        </View>

        <View style={[dynamicStyles.infoItem]}>
          <Text style={[dynamicStyles.infoLabel]}>Member Since</Text>
          <Text style={[dynamicStyles.infoValue]}>
            {new Date(displayData.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={[dynamicStyles.infoItem]}>
          <Text style={[dynamicStyles.infoLabel]}>Last Login</Text>
          <Text style={[dynamicStyles.infoValue]}>
            {new Date(displayData.lastLogin).toLocaleDateString()} at{" "}
            {new Date(displayData.lastLogin).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[dynamicStyles.logoutButton]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        <Text style={dynamicStyles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Bottom Spacer */}
      <View style={dynamicStyles.bottomSpacer} />
    </ScrollView>
  );
}

// Function to create dynamic styles based on theme colors
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
      padding: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
    },
    profileCard: {
      backgroundColor: colors.cardBackground,
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
    avatarSection: {
      alignItems: "center",
    },
    avatarContainer: {
      position: "relative",
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
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: "#FFF",
      fontSize: 32,
      fontWeight: "600",
    },
    addPhotoButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: colors.cardBackground,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    userInfo: {
      alignItems: "center",
    },
    userName: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 4,
      textAlign: "center",
    },
    userEmail: {
      fontSize: 16,
      color: colors.textSecondary,
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
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    roleText: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: "500",
    },
    optionsSection: {
      backgroundColor: colors.cardBackground,
      margin: 16,
      borderRadius: 16,
      overflow: "hidden",
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      padding: 16,
      paddingBottom: 8,
    },
    optionItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.textPrimary,
      fontWeight: "500",
    },
    optionRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    comingSoonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    infoSection: {
      backgroundColor: colors.cardBackground,
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
      borderBottomColor: `${colors.border}50`,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "400",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.cardBackground,
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
}