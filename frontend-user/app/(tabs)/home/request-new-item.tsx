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

export default function RequestNewItemScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    reason: "",
    quantity: "1",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item title is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Title must be at least 2 characters long";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason for request is required";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason =
        "Please provide a more detailed reason (at least 10 characters)";
    }

    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
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
    if (!user?.id || !token) {
      Alert.alert("Error", "Please log in to request items");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim() || undefined,
        reason: formData.reason.trim(),
        quantity: parseInt(formData.quantity),
      };

      const response = await axios.post(
        `${API_BASE_URL}/items/request-item`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Success!",
          "Your item request has been submitted successfully. We'll notify you when it's processed.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Failed to submit request:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit request. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      subCategory: "",
      reason: "",
      quantity: "1",
    });
    setErrors({});
  };

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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request New Item</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Item Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Item Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.inputError]}
              placeholder="Enter item title (e.g., Introduction to Algorithms)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              maxLength={100}
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : (
              <Text style={styles.helperText}>
                Be specific about the item you want
              </Text>
            )}
          </View>

          {/* Description (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Provide additional details about the item (features, specifications, edition, etc.)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>
                Include any relevant details that would help identify the item
              </Text>
              <Text style={styles.charCount}>
                {formData.description.length}/200
              </Text>
            </View>
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.category && styles.inputError]}
              placeholder="Enter category (e.g., Books, Electronics, Tools)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.category}
              onChangeText={(value) => handleInputChange("category", value)}
              maxLength={50}
            />
            {errors.category ? (
              <Text style={styles.errorText}>{errors.category}</Text>
            ) : (
              <Text style={styles.helperText}>
                General category of the item
              </Text>
            )}
          </View>

          {/* Subcategory (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subcategory (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter subcategory (e.g., Fiction, Programming, Cookware)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.subCategory}
              onChangeText={(value) => handleInputChange("subCategory", value)}
              maxLength={50}
            />
            <Text style={styles.helperText}>
              More specific classification if applicable
            </Text>
          </View>

          {/* Quantity */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Quantity <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.quantity && styles.inputError]}
              placeholder="1"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.quantity}
              onChangeText={(value) =>
                handleInputChange("quantity", value.replace(/[^0-9]/g, ""))
              }
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.quantity ? (
              <Text style={styles.errorText}>{errors.quantity}</Text>
            ) : (
              <Text style={styles.helperText}>
                How many copies would you like us to consider
              </Text>
            )}
          </View>

          {/* Reason for Request */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Reason for Request <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.reason && styles.inputError]}
              placeholder="Explain why you need this item and how it would benefit the library community..."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.reason}
              onChangeText={(value) => handleInputChange("reason", value)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.reason ? (
              <Text style={styles.errorText}>{errors.reason}</Text>
            ) : (
              <View style={styles.helperRow}>
                <Text style={styles.helperText}>
                  Tell us why this item would be valuable
                </Text>
                <Text style={styles.charCount}>
                  {formData.reason.length}/500
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={clearForm}
              disabled={loading}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Clear Form
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
                  <Ionicons name="send-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.helpText}>
              Your request will be reviewed by our team. We'll notify you once
              it's processed.
            </Text>
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
  textInput: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textArea: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 120,
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
  helperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: {
    color: COLORS.textSecondary,
    fontSize: 12,
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
});
