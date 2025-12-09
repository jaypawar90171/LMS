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
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";


interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  reminderNotifications: boolean;
}




export default function NotificationPreferencesScreen() {
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    pushNotifications: true,
    emailNotifications: true,
    reminderNotifications: true,
  });

  const [originalPreferences, setOriginalPreferences] = useState<NotificationPreferences>({
    pushNotifications: true,
    emailNotifications: true,
    reminderNotifications: true,
  });

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      
      const response = await axios.get(`${API_BASE_URL}/api/mobile/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Notifications settings response:", response.data);

      if (response.data.success) {
        
        const userPrefs: NotificationPreferences = response.data.data || {
          pushNotifications: true,
          emailNotifications: false, 
          reminderNotifications: true,
        };

        setPreferences(userPrefs);
        setOriginalPreferences(userPrefs);
      }
    } catch (error: any) {
      console.error("Failed to fetch notification preferences:", error);
      
      const defaultPrefs: NotificationPreferences = { 
        pushNotifications: true, 
        emailNotifications: true, 
        reminderNotifications: true 
      };
      setPreferences(defaultPrefs);
      setOriginalPreferences(defaultPrefs);
      Alert.alert("Error", "Failed to load notification settings.");
    } finally {
      setFetching(false);
    }
  };

  
  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
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
        `${API_BASE_URL}/api/mobile/notifications/settings`,
        preferences, 
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        
        const updatedSettings: NotificationPreferences = response.data.data;
        
        
        setPreferences(updatedSettings);
        setOriginalPreferences(updatedSettings);

        
        if (user) {
          setUser({
            ...user,
            
            notificationSettings: updatedSettings, 
          });
        }
        
        Alert.alert(
          "Success",
          response.data.message || "Your notification preferences have been updated successfully!",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Failed to update notification preferences:", error);
      
      const errorMessage = 
        error.response?.data?.message || 
        "Failed to update notification preferences. Please try again.";
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Preferences",
      "Are you sure you want to reset all changes to the original fetched settings?",
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

  const handleTestNotification = (type: string) => {
     
    Alert.alert(
      "Test Notification",
      `A test notification for '${type}' will be attempted. (Feature not implemented on server side)`,
      [
        { text: "OK" }
      ]
    );
  };
  
  
  const renderSettingRow = (
    key: keyof NotificationPreferences, 
    title: string, 
    description: string,
    iconName: string,
    iconColor: string
  ) => (
    <View style={dynamicStyles.channelCard}>
      <View style={dynamicStyles.channelHeader}>
        <View style={dynamicStyles.channelInfo}>
          <Ionicons 
            name={iconName as any} 
            size={24} 
            color={iconColor} 
          />
          <View style={dynamicStyles.channelText}>
            <Text style={dynamicStyles.channelName}>{title}</Text>
            <Text style={dynamicStyles.channelDescription}>
              {description}
            </Text>
          </View>
        </View>
        <Switch
          value={preferences[key]}
          onValueChange={(value) => handleToggle(key, value)}
          trackColor={{ false: colors.border, true: iconColor }}
          thumbColor="#FFFFFF"
        />
      </View>
      {preferences[key] && (
        <TouchableOpacity
          style={[dynamicStyles.testButton, { backgroundColor: `${iconColor}10` }]}
          onPress={() => handleTestNotification(title)}
        >
          <Ionicons name="send-outline" size={16} color={iconColor} />
          <Text style={[dynamicStyles.testButtonText, { color: iconColor }]}>
            Send Test
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (fetching) {
    return (
      <View style={dynamicStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading your preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Notification Settings</Text>
        <View style={dynamicStyles.placeholder} />
      </View>

      {/* Changes Indicator */}
      {hasChanges() && (
        <View style={dynamicStyles.changesIndicator}>
          <Ionicons name="information-circle" size={20} color="#FFA000" />
          <Text style={dynamicStyles.changesText}>You have unsaved changes</Text>
        </View>
      )}

      {/* Introduction */}
      <View style={dynamicStyles.introSection}>
        <Ionicons name="notifications-outline" size={32} color={colors.primary} />
        <Text style={dynamicStyles.introTitle}>Manage Your Alerts</Text>
        <Text style={dynamicStyles.introText}>
          Control which notifications you receive and through which methods.
        </Text>
      </View>

      {/* Notification Settings */}
      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>General Settings</Text>
        <Text style={dynamicStyles.sectionDescription}>
          Enable or disable core types of communications.
        </Text>

        {/* 1. Push Notifications */}
        {renderSettingRow(
          "pushNotifications",
          "Push Notifications (App)",
          "Receive instant alerts directly in the mobile application",
          "phone-portrait-outline",
          colors.primary
        )}

        {/* 2. Email Notifications */}
        {renderSettingRow(
          "emailNotifications",
          "Email Notifications",
          "Receive important updates and detailed summaries via email",
          "mail-outline",
          "#D44638" // Red color for GMail/Email
        )}

        {/* 3. Reminder Notifications */}
        {renderSettingRow(
          "reminderNotifications",
          "Reminder Notifications",
          "Receive automated reminders for due dates, overdue items, or reservations",
          "timer-outline",
          "#FF9500" // Orange/Warning color
        )}
      </View>
    

      {/* Important Notes */}
      <View style={dynamicStyles.notesSection}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <View style={dynamicStyles.notesContent}>
          <Text style={dynamicStyles.notesTitle}>Important Information</Text>
          <Text style={dynamicStyles.notesText}>
            • **Critical security and system alerts** will always be sent regardless of these preferences.{"\n"}
            • Disabling a setting may prevent you from receiving important service updates.
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={dynamicStyles.actionsContainer}>
        <TouchableOpacity
          style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
          onPress={handleReset}
          disabled={saving || !hasChanges()}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
            Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.button, 
            dynamicStyles.primaryButton,
            (!hasChanges() || saving) && dynamicStyles.buttonDisabled
          ]}
          onPress={handleSave}
          disabled={saving || !hasChanges()}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={dynamicStyles.buttonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Spacer */}
      <View style={dynamicStyles.bottomSpacer} />
    </ScrollView>
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
    backgroundColor: colors.cardBackground,
    margin: 16,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  channelCard: {
    backgroundColor: colors.cardBackground,
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
    color: colors.textPrimary,
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Removed categoriesList and related dynamicStyles as they are no longer relevant
  notesSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  notesContent: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
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
    color: colors.primary,
  },
  bottomSpacer: {
    height: 20,
  },
});
}