import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';

interface ProfileForm {
  fullName: string;
  username: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: string;
  roles: Array<{
    _id: string;
    roleName: string;
    description: string;
  }>;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export default function UpdateProfileScreen() {
  const [user, setUser] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<ProfileForm>({
    fullName: "",
    username: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const [originalData, setOriginalData] = useState<ProfileForm>({
    fullName: "",
    username: "",
    phoneNumber: "",
    dateOfBirth: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`${API_BASE_URL}/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const profile = response.data.data;
        const formattedData: ProfileForm = {
          fullName: profile.fullName || "",
          username: profile.username || "",
          phoneNumber: profile.phoneNumber || "",
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
          address: {
            street: profile.address?.street || "",
            city: profile.address?.city || "",
            state: profile.address?.state || "",
            postalCode: profile.address?.postalCode || "",
            country: profile.address?.country || "",
          },
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      }
    } catch (error: any) {
      console.error("Failed to fetch profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setFetching(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Optional fields validation
    if (formData.phoneNumber && !/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please enter a valid phone number";
    }

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = "Date of birth must be in the past";
      }
    }

    if (formData.address.postalCode && !/^[A-Z0-9\s-]+$/.test(formData.address.postalCode)) {
      newErrors.postalCode = "Please enter a valid postal code";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object), 
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      handleInputChange("dateOfBirth", formattedDate);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!hasChanges()) {
      Alert.alert("No Changes", "You haven't made any changes to your profile.");
      return;
    }

    setLoading(true);

    try {
      // Prepare data for submission (remove empty strings for optional fields)
      const submissionData: any = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
      };

      // Only include optional fields if they have values
      if (formData.phoneNumber.trim()) submissionData.phoneNumber = formData.phoneNumber.trim();
      if (formData.dateOfBirth) submissionData.dateOfBirth = formData.dateOfBirth;

      // Include address only if at least one field is filled
      const hasAddress = Object.values(formData.address).some(value => value.trim());
      if (hasAddress) {
        submissionData.address = {};
        Object.entries(formData.address).forEach(([key, value]) => {
          if (value.trim()) {
            submissionData.address[key] = value.trim();
          }
        });
      }

      const response = await axios.put(
        `${API_BASE_URL}/account/profile`,
        submissionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Update local user state
        if (user) {
          setUser({
            ...user,
            fullName: formData.fullName,
            username: formData.username,
          });
        }

        Alert.alert(
          "Success",
          "Your profile has been updated successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        "Failed to update profile. Please try again.";
      
      if (error.response?.status === 400) {
        if (errorMessage.includes('username')) {
          Alert.alert("Username Taken", "This username is already taken. Please choose another one.");
        } else {
          Alert.alert("Validation Error", errorMessage);
        }
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Changes",
      "Are you sure you want to discard all changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setFormData(originalData);
            setErrors({});
          },
        },
      ]
    );
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Select date";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.navigate("/(tabs)/profile")}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Changes Indicator */}
        {hasChanges() && (
          <View style={styles.changesIndicator}>
            <Ionicons name="information-circle" size={20} color="#FFA000" />
            <Text style={styles.changesText}>You have unsaved changes</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.fullName && styles.inputError]}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.fullName}
                onChangeText={(value) => handleInputChange("fullName", value)}
                maxLength={50}
              />
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Username <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.username && styles.inputError]}
                placeholder="Choose a username"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.username}
                onChangeText={(value) => handleInputChange("username", value)}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : (
                <Text style={styles.helperText}>
                  Letters, numbers, and underscores only
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={[styles.textInput, errors.phoneNumber && styles.inputError]}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange("phoneNumber", value)}
                keyboardType="phone-pad"
                maxLength={20}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.dateOfBirth && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={formData.dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                  {formatDateForDisplay(formData.dateOfBirth)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address (Optional)</Text>
            
            {/* Street */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Street</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Street address"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.address.street}
                onChangeText={(value) => handleInputChange("address.street", value)}
                maxLength={100}
              />
            </View>

            {/* City & State */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex]}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="City"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.address.city}
                  onChangeText={(value) => handleInputChange("address.city", value)}
                  maxLength={50}
                />
              </View>
              <View style={[styles.inputGroup, styles.flex, styles.leftSpacing]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="State"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.address.state}
                  onChangeText={(value) => handleInputChange("address.state", value)}
                  maxLength={50}
                />
              </View>
            </View>

            {/* Postal Code & Country */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex]}>
                <Text style={styles.label}>Postal Code</Text>
                <TextInput
                  style={[styles.textInput, errors.postalCode && styles.inputError]}
                  placeholder="Postal code"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.address.postalCode}
                  onChangeText={(value) => handleInputChange("address.postalCode", value)}
                  maxLength={20}
                />
                {errors.postalCode && (
                  <Text style={styles.errorText}>{errors.postalCode}</Text>
                )}
              </View>
              <View style={[styles.inputGroup, styles.flex, styles.leftSpacing]}>
                <Text style={styles.label}>Country</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Country"
                  placeholderTextColor={COLORS.textSecondary}
                  value={formData.address.country}
                  onChangeText={(value) => handleInputChange("address.country", value)}
                  maxLength={50}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleReset}
              disabled={loading || !hasChanges()}
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
                (!hasChanges() || loading) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading || !hasChanges()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.helpText}>
              Fields marked with <Text style={styles.required}>*</Text> are required. 
              Your username must be unique across the platform.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerDone}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.backgroundColor,
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
  formContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: COLORS.cardBackground,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: "#FF3B30",
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  leftSpacing: {
    marginLeft: 0,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
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
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  datePickerDone: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  datePickerDoneText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});