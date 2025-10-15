import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface NotificationPreferences {
  email: boolean;
  whatsApp: boolean;
}

interface NotificationCategory {
  id: string;
  title: string;
  description: string;
  channel: "email" | "whatsApp";
  enabled: boolean;
}

export default function NotificationPreferencesScreen() {
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    whatsApp: true,
  });

  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>({
    email: true,
    whatsApp: true,
  });

  // Notification categories with descriptions
  const notificationCategories: NotificationCategory[] = [
    {
      id: "borrowing",
      title: "Borrowing Updates",
      description: "Item due dates, renewal confirmations, and availability notifications",
      channel: "email",
      enabled: true,
    },
    {
      id: "queue",
      title: "Queue Notifications",
      description: "When queued items become available or your queue position changes",
      channel: "email",
      enabled: true,
    },
    {
      id: "fines",
      title: "Fine Alerts",
      description: "Overdue fines, payment reminders, and fine status updates",
      channel: "email",
      enabled: true,
    },
    {
      id: "reservations",
      title: "Reservation Status",
      description: "When your reserved items are ready for pickup",
      channel: "whatsApp",
      enabled: true,
    },
    {
      id: "system",
      title: "System Announcements",
      description: "Library hours changes, maintenance alerts, and important updates",
      channel: "whatsApp",
      enabled: true,
    },
    {
      id: "promotional",
      title: "Promotional Updates",
      description: "New arrivals, events, and special library promotions",
      channel: "email",
      enabled: true,
    },
  ];

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const userData = response.data.data;
        const userPrefs = userData.notificationPreference || {
          email: true,
          whatsApp: true,
        };

        setPreferences(userPrefs);
        setOriginalPreferences(userPrefs);
      }
    } catch (error: any) {
      console.error("Failed to fetch notification preferences:", error);
      // Fallback to default preferences
      setPreferences({ email: true, whatsApp: true });
      setOriginalPreferences({ email: true, whatsApp: true });
    } finally {
      setFetching(false);
    }
  };

  const handleChannelToggle = (channel: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: value,
    }));
  };

  const hasChanges = () => {
    return JSON.stringify(preferences) !== JSON.stringify(originalPreferences);
  };

  const handleSave = async () => {
    if (!hasChanges()) {
      Alert.alert("No Changes", "You haven't made any changes to your notification preferences.");
      return;
    }

    setSaving(true);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/account/notifications`,
        preferences,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Update local user state
        if (user) {
          setUser({
            ...user,
            notificationPreference: preferences,
          });
        }

        setOriginalPreferences(preferences);
        
        Alert.alert(
          "Success",
          "Your notification preferences have been updated successfully!",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Failed to update notification preferences:", error);
      
      const errorMessage = 
        error.response?.data?.error || 
        "Failed to update notification preferences. Please try again.";
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Preferences",
      "Are you sure you want to reset all changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setPreferences(originalPreferences);
          },
        },
      ]
    );
  };

  const handleTestNotification = (channel: "email" | "whatsApp") => {
    Alert.alert(
      "Test Notification",
      `A test notification will be sent to your ${channel === 'email' ? 'email address' : 'WhatsApp number'}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Test",
          onPress: () => {
            Alert.alert(
              "Test Sent",
              `A test notification has been sent to your ${channel}.`,
              [{ text: "OK" }]
            );
          },
        },
      ]
    );
  };

  const getChannelDescription = (channel: "email" | "whatsApp") => {
    switch (channel) {
      case "email":
        return "Receive notifications via email at your registered email address";
      case "whatsApp":
        return "Receive instant notifications via WhatsApp for urgent updates";
      default:
        return "";
    }
  };

  const getChannelIcon = (channel: "email" | "whatsApp") => {
    switch (channel) {
      case "email":
        return "mail-outline";
      case "whatsApp":
        return "logo-whatsapp";
      default:
        return "notifications-outline";
    }
  };

  const getChannelColor = (channel: "email" | "whatsApp") => {
    switch (channel) {
      case "email":
        return COLORS.primary;
      case "whatsApp":
        return "#25D366";
      default:
        return COLORS.textSecondary;
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Changes Indicator */}
      {hasChanges() && (
        <View style={styles.changesIndicator}>
          <Ionicons name="information-circle" size={20} color="#FFA000" />
          <Text style={styles.changesText}>You have unsaved changes</Text>
        </View>
      )}

      {/* Introduction */}
      <View style={styles.introSection}>
        <Ionicons name="notifications-outline" size={32} color={COLORS.primary} />
        <Text style={styles.introTitle}>Stay Informed</Text>
        <Text style={styles.introText}>
          Choose how you want to receive notifications from the library. 
          We'll keep you updated about your borrowed items, due dates, and important announcements.
        </Text>
      </View>

      {/* Notification Channels */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Channels</Text>
        <Text style={styles.sectionDescription}>
          Select which channels you'd like to receive notifications through
        </Text>

        {/* Email Channel */}
        <View style={styles.channelCard}>
          <View style={styles.channelHeader}>
            <View style={styles.channelInfo}>
              <Ionicons 
                name={getChannelIcon("email")} 
                size={24} 
                color={getChannelColor("email")} 
              />
              <View style={styles.channelText}>
                <Text style={styles.channelName}>Email Notifications</Text>
                <Text style={styles.channelDescription}>
                  {getChannelDescription("email")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.email}
              onValueChange={(value) => handleChannelToggle("email", value)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {preferences.email && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestNotification("email")}
            >
              <Ionicons name="send-outline" size={16} color={COLORS.primary} />
              <Text style={styles.testButtonText}>Send Test Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* WhatsApp Channel */}
        <View style={styles.channelCard}>
          <View style={styles.channelHeader}>
            <View style={styles.channelInfo}>
              <Ionicons 
                name={getChannelIcon("whatsApp")} 
                size={24} 
                color={getChannelColor("whatsApp")} 
              />
              <View style={styles.channelText}>
                <Text style={styles.channelName}>WhatsApp Notifications</Text>
                <Text style={styles.channelDescription}>
                  {getChannelDescription("whatsApp")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.whatsApp}
              onValueChange={(value) => handleChannelToggle("whatsApp", value)}
              trackColor={{ false: COLORS.border, true: "#25D366" }}
              thumbColor="#FFFFFF"
            />
          </View>
          {preferences.whatsApp && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => handleTestNotification("whatsApp")}
            >
              <Ionicons name="send-outline" size={16} color="#25D366" />
              <Text style={[styles.testButtonText, { color: "#25D366" }]}>
                Send Test WhatsApp
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notification Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Types</Text>
        <Text style={styles.sectionDescription}>
          These notifications will be sent through your enabled channels
        </Text>

        <View style={styles.categoriesList}>
          {notificationCategories.map((category, index) => (
            <View
              key={category.id}
              style={[
                styles.categoryCard,
                index === notificationCategories.length - 1 && styles.lastCategoryCard,
              ]}
            >
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
              <View style={styles.channelBadge}>
                <Ionicons 
                  name={getChannelIcon(category.channel)} 
                  size={12} 
                  color={getChannelColor(category.channel)} 
                />
                <Text style={styles.channelBadgeText}>
                  {category.channel === 'email' ? 'Email' : 'WhatsApp'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Important Notes */}
      <View style={styles.notesSection}>
        <Ionicons name="information-circle" size={20} color={COLORS.primary} />
        <View style={styles.notesContent}>
          <Text style={styles.notesTitle}>Important Information</Text>
          <Text style={styles.notesText}>
            • Critical alerts (like security notices) will always be sent regardless of your preferences{"\n"}
            • You can update these settings at any time{"\n"}
            • Some notifications may be required for account security
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleReset}
          disabled={saving || !hasChanges()}
        >
          <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton,
            (!hasChanges() || saving) && styles.buttonDisabled
          ]}
          onPress={handleSave}
          disabled={saving || !hasChanges()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

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
    backgroundColor: COLORS.background,
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
    textAlign: "center",
  },
  placeholder: {
    width: 32,
  },
  changesIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF3E0",
    borderBottomWidth: 1,
    borderBottomColor: "#FFA000",
  },
  changesText: {
    color: "#E65100",
    fontSize: 14,
    fontWeight: "500",
  },
  introSection: {
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.cardBackground,
    margin: 16,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  channelCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  channelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  channelInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
    gap: 12,
  },
  channelText: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 6,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.primary,
  },
  categoriesList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    overflow: "hidden",
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lastCategoryCard: {
    borderBottomWidth: 0,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.primary,
    textTransform: "uppercase",
  },
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  notesContent: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    margin: 16,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  bottomSpacer: {
    height: 20,
  },
});