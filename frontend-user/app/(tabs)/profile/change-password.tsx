import React, { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordValidation {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
}

export default function ChangePasswordScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Password validation rules
  const validatePassword = (password: string): PasswordValidation => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      passwordsMatch: password === formData.confirmPassword,
    };
  };

  const passwordValidation = validatePassword(formData.newPassword);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (!passwordValidation.hasMinLength) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!passwordValidation.hasMinLength || 
        !passwordValidation.hasUpperCase || 
        !passwordValidation.hasLowerCase ||
        !passwordValidation.hasNumber) {
      Alert.alert(
        "Weak Password",
        "Please ensure your password meets all the requirements below."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/account/password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success",
          "Your password has been updated successfully!",
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
      console.error("Password change error:", error);
      
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        "Failed to update password. Please try again.";
      
      if (error.response?.status === 401) {
        Alert.alert("Incorrect Password", "Your current password is incorrect. Please try again.");
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setErrors({});
  };

  const getPasswordStrength = (): { strength: string; color: string; width: number } => {
    const validations = [
      passwordValidation.hasMinLength,
      passwordValidation.hasUpperCase,
      passwordValidation.hasLowerCase,
      passwordValidation.hasNumber,
      passwordValidation.hasSpecialChar,
    ];
    
    const strengthCount = validations.filter(Boolean).length;
    
    if (strengthCount === 0) return { strength: "Very Weak", color: "#FF3B30", width: 20 };
    if (strengthCount <= 2) return { strength: "Weak", color: "#FF9500", width: 40 };
    if (strengthCount <= 3) return { strength: "Fair", color: "#FFCC00", width: 60 };
    if (strengthCount <= 4) return { strength: "Good", color: "#34C759", width: 80 };
    return { strength: "Strong", color: "#32D74B", width: 100 };
  };

  const passwordStrength = getPasswordStrength();

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
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.primary} />
          <Text style={styles.securityTitle}>Secure Password Update</Text>
          <Text style={styles.securityText}>
            For your security, please enter your current password and create a new strong password.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Current Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.passwordInputContainer, errors.currentPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your current password"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange("currentPassword", value)}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text style={styles.errorText}>{errors.currentPassword}</Text>
            )}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              New Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.passwordInputContainer, errors.newPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a new password"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange("newPassword", value)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {formData.newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthProgress, 
                      { 
                        backgroundColor: passwordStrength.color,
                        width: `${passwordStrength.width}%`
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.strength}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordValidation.hasMinLength ? "#34C759" : COLORS.textSecondary}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.hasMinLength && styles.requirementMet
                ]}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.hasUpperCase ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordValidation.hasUpperCase ? "#34C759" : COLORS.textSecondary}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.hasUpperCase && styles.requirementMet
                ]}>
                  One uppercase letter (A-Z)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.hasLowerCase ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordValidation.hasLowerCase ? "#34C759" : COLORS.textSecondary}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.hasLowerCase && styles.requirementMet
                ]}>
                  One lowercase letter (a-z)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.hasNumber ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordValidation.hasNumber ? "#34C759" : COLORS.textSecondary}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.hasNumber && styles.requirementMet
                ]}>
                  One number (0-9)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={passwordValidation.hasSpecialChar ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={passwordValidation.hasSpecialChar ? "#34C759" : COLORS.textSecondary}
                />
                <Text style={[
                  styles.requirementText,
                  passwordValidation.hasSpecialChar && styles.requirementMet
                ]}>
                  One special character (!@#$% etc.)
                </Text>
              </View>
            </View>
            
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirm New Password <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.passwordInputContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your new password"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange("confirmPassword", value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <Ionicons
                  name={passwordValidation.passwordsMatch ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={passwordValidation.passwordsMatch ? "#34C759" : "#FF3B30"}
                />
                <Text style={[
                  styles.matchText,
                  { color: passwordValidation.passwordsMatch ? "#34C759" : "#FF3B30" }
                ]}>
                  {passwordValidation.passwordsMatch ? "Passwords match" : "Passwords do not match"}
                </Text>
              </View>
            )}
            
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={clearForm}
              disabled={loading}
            >
              <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="lock-closed" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Update Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsContainer}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            <View style={styles.tipsContent}>
              <Text style={styles.tipsTitle}>Security Tips</Text>
              <Text style={styles.tipsText}>
                • Use a unique password that you don't use elsewhere{"\n"}
                • Avoid common words and personal information{"\n"}
                • Consider using a password manager
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  securityInfo: {
    backgroundColor: `${COLORS.primary}10`,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    alignItems: "center",
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  securityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
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
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  eyeButton: {
    padding: 4,
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    marginTop: 4,
  },
  strengthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthProgress: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 60,
  },
  requirementsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: `${COLORS.primary}05`,
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  requirementMet: {
    color: "#34C759",
    fontWeight: "500",
  },
  matchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "500",
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
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});