import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

export default function RequestNewItemScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubcategoryPicker, setShowSubcategoryPicker] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
const [customCategory, setCustomCategory] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();
  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/inventory/categories`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const allCats = response.data.data;
      setAllCategories(allCats); 
      setCategories(allCats.filter((cat: any) => cat.categoryType === "parent"));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subCategory: "",
    reason: "",
    quantity: "1",
  });

  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
      subCategory: "",
    }));
    
    const subs = allCategories.filter(
      (cat: any) =>
        cat.categoryType === "subcategory" &&
        cat.parentCategoryId &&
        (typeof cat.parentCategoryId === "string"
          ? cat.parentCategoryId === categoryId
          : cat.parentCategoryId._id === categoryId)
    );
    setSubcategories(subs);
    
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: "" }));
    }
  };


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Item title is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Title must be at least 2 characters long";
    }

    if (showCustomCategory) {
      if (!customCategory.trim()) {
        newErrors.category = "Custom category is required";
      } else if (customCategory.trim().length < 2) {
        newErrors.category = "Category must be at least 2 characters long";
      }
    } else {
      if (!formData.category.trim()) {
        newErrors.category = "Category is required";
      }
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
        category: showCustomCategory ? customCategory.trim() : formData.category.trim(),
        subCategory: !showCustomCategory && formData.subCategory ? formData.subCategory : undefined,
        reason: formData.reason.trim(),
        quantity: parseInt(formData.quantity),
      };

      const response = await axios.post(
        `${API_BASE_URL}/items/new/request-item`,
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
    setCustomCategory("");
    setShowCustomCategory(false);
    setSubcategories([]);
    setErrors({});
  };

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={dynamicStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Request New Item</Text>
          <View style={dynamicStyles.placeholder} />
        </View>

        {/* Form */}
        <View style={dynamicStyles.formContainer}>
          {/* Item Title */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Item Title <Text style={dynamicStyles.required}>*</Text>
            </Text>
            <TextInput
              style={[dynamicStyles.textInput, errors.name && dynamicStyles.inputError]}
              placeholder="Enter item title (e.g., Introduction to Algorithms)"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              maxLength={100}
            />
            {errors.name ? (
              <Text style={dynamicStyles.errorText}>{errors.name}</Text>
            ) : (
              <Text style={dynamicStyles.helperText}>
                Be specific about the item you want
              </Text>
            )}
          </View>

          {/* Description  */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Description <Text style={dynamicStyles.required}>*</Text></Text>
            <TextInput
              style={dynamicStyles.textInput}
              placeholder="Provide additional details about the item (features, specifications, edition, etc.)"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={200}
            />
            <View style={dynamicStyles.helperRow}>
              <Text style={dynamicStyles.helperText}>
                Include any relevant details that would help identify the item
              </Text>
              <Text style={dynamicStyles.charCount}>
                {formData.description.length}/200
              </Text>
            </View>
          </View>

          {/* Category */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Category <Text style={dynamicStyles.required}>*</Text>
            </Text>
            {showCustomCategory ? (
              <View>
                <TextInput
                  style={[dynamicStyles.textInput, errors.category && dynamicStyles.inputError]}
                  placeholder="Enter custom category"
                  placeholderTextColor={colors.textSecondary}
                  value={customCategory}
                  onChangeText={(value) => {
                    setCustomCategory(value);
                    if (errors.category) {
                      setErrors(prev => ({ ...prev, category: "" }));
                    }
                  }}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={dynamicStyles.switchToDropdown}
                  onPress={() => {
                    setShowCustomCategory(false);
                    setCustomCategory("");
                    setFormData(prev => ({ ...prev, category: "" }));
                  }}
                >
                  <Text style={dynamicStyles.switchText}>Choose from list instead</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[dynamicStyles.textInput, errors.category && dynamicStyles.inputError]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={formData.category ? dynamicStyles.selectedText : dynamicStyles.placeholderText}>
                  {formData.category 
                    ? categories.find(c => c._id === formData.category)?.name 
                    : "Select category"}
                </Text>
              </TouchableOpacity>
            )}
            {errors.category && (
              <Text style={dynamicStyles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Subcategory */}
          {subcategories.length > 0 && (
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Subcategory (Optional)</Text>
              <TouchableOpacity
                style={dynamicStyles.textInput}
                onPress={() => setShowSubcategoryPicker(true)}
              >
                <Text style={formData.subCategory ? dynamicStyles.selectedText : dynamicStyles.placeholderText}>
                  {formData.subCategory 
                    ? subcategories.find(s => s._id === formData.subCategory)?.name 
                    : "Select subcategory"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quantity */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Quantity <Text style={dynamicStyles.required}>*</Text>
            </Text>
            <TextInput
              style={[dynamicStyles.textInput, errors.quantity && dynamicStyles.inputError]}
              placeholder="1"
              placeholderTextColor={colors.textSecondary}
              value={formData.quantity}
              onChangeText={(value) =>
                handleInputChange("quantity", value.replace(/[^0-9]/g, ""))
              }
              keyboardType="numeric"
              maxLength={3}
            />
            {errors.quantity ? (
              <Text style={dynamicStyles.errorText}>{errors.quantity}</Text>
            ) : (
              <Text style={dynamicStyles.helperText}>
                How many copies would you like us to consider
              </Text>
            )}
          </View>

          {/* Reason for Request */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Reason for Request <Text style={dynamicStyles.required}>*</Text>
            </Text>
            <TextInput
              style={[dynamicStyles.textArea, errors.reason && dynamicStyles.inputError]}
              placeholder="Explain why you need this item and how it would benefit the library community..."
              placeholderTextColor={colors.textSecondary}
              value={formData.reason}
              onChangeText={(value) => handleInputChange("reason", value)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
            />
            {errors.reason ? (
              <Text style={dynamicStyles.errorText}>{errors.reason}</Text>
            ) : (
              <View style={dynamicStyles.helperRow}>
                <Text style={dynamicStyles.helperText}>
                  Tell us why this item would be valuable
                </Text>
                <Text style={dynamicStyles.charCount}>
                  {formData.reason.length}/500
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={dynamicStyles.actionsContainer}>
            <TouchableOpacity
              style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
              onPress={clearForm}
              disabled={loading}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
                Clear Form
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dynamicStyles.button, dynamicStyles.primaryButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFF" />
                  <Text style={dynamicStyles.buttonText}>Submit Request</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={dynamicStyles.helpContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.helpText}>
              Your request will be reviewed by our team. We'll notify you once
              it's processed.
            </Text>
          </View>
        </View>

        {/* Category Picker Modal */}
        <Modal
        visible={showCategoryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}
        >
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.pickerContainer}>
            <View style={dynamicStyles.pickerHeader}>
              <Text style={dynamicStyles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat._id}
                  style={dynamicStyles.pickerItem}
                  onPress={() => {
                    handleCategoryChange(cat._id);
                    setShowCategoryPicker(false);
                    setShowCustomCategory(false);
                  }}
                >
                  <Text style={dynamicStyles.pickerItemText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
              {/* Add Other Option */}
              <TouchableOpacity
                style={[dynamicStyles.pickerItem, dynamicStyles.otherOption]}
                onPress={() => {
                  setShowCategoryPicker(false);
                  setShowCustomCategory(true);
                  setFormData(prev => ({ ...prev, category: "other" }));
                  setSubcategories([]);
                }}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={[dynamicStyles.pickerItemText, dynamicStyles.otherOptionText]}>Other (Custom Category)</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
        </Modal>

{/* Subcategory Picker Modal */}
<Modal
  visible={showSubcategoryPicker}
  transparent
  animationType="slide"
  onRequestClose={() => setShowSubcategoryPicker(false)}
>
  <View style={dynamicStyles.modalOverlay}>
    <View style={dynamicStyles.pickerContainer}>
      <View style={dynamicStyles.pickerHeader}>
        <Text style={dynamicStyles.pickerTitle}>Select Subcategory</Text>
        <TouchableOpacity onPress={() => setShowSubcategoryPicker(false)}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        {subcategories.map((subcat) => (
          <TouchableOpacity
            key={subcat._id}
            style={dynamicStyles.pickerItem}
            onPress={() => {
              setFormData(prev => ({ ...prev, subCategory: subcat._id }));
              setShowSubcategoryPicker(false);
            }}
          >
            <Text style={dynamicStyles.pickerItemText}>{subcat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: "#FF3B30",
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: {
    color: colors.textSecondary,
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
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 16,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  selectedText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  otherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: `${colors.primary}10`,
  },
  otherOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  switchToDropdown: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  switchText: {
    color: colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

}
