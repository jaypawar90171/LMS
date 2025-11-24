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
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";

interface DonationFormData {
  itemType: string;
  title: string;
  description: string;
  photos: string[];
  duration: string;
  preferredContactMethod: "Email" | "whatsApp";
  donationType: "giveaway" | "duration";
}

export default function DonateItemScreen() {
  const [user] = useAtom(userAtom);
  const [token] = useAtom(tokenAtom);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");

  const router = useRouter();

  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/inventory/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allCats = response.data.data;
      setAllCategories(allCats);
      setCategories(
        allCats.filter((cat: any) => cat.categoryType === "parent")
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Form state
  const [formData, setFormData] = useState<DonationFormData>({
    itemType: "",
    title: "",
    description: "",
    photos: [],
    duration: "0",
    preferredContactMethod: "whatsApp",
    donationType: "giveaway",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Required fields
    if (!formData.itemType.trim()) {
      newErrors.itemType = "Item type/category is required";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Item title is required";
    } else if (formData.title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters long";
    }

    // Duration validation for duration-based donations
    if (formData.donationType === "duration") {
      const duration = parseInt(formData.duration);
      if (!formData.duration || duration < 1) {
        newErrors.duration = "Duration must be at least 1 day";
      } else if (duration > 365) {
        newErrors.duration = "Duration cannot exceed 365 days";
      }
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

  const handleDonationTypeChange = (type: "giveaway" | "duration") => {
    setFormData((prev) => ({
      ...prev,
      donationType: type,
      duration: type === "giveaway" ? "0" : prev.duration,
    }));

    if (type === "giveaway" && errors.duration) {
      setErrors((prev) => ({
        ...prev,
        duration: "",
      }));
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera roll permissions to upload images."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const uploadImage = async (uri: string) => {
    if (!token) {
      Alert.alert("Error", "Please log in to upload images");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();

      const filename = uri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
        type,
        name: filename,
      } as any);

      const response = await axios.post(
        `${API_BASE_URL}/upload/image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        }
      );

      if (response.data.success && response.data.data.url) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, response.data.data.url],
        }));
        Alert.alert("Success", "Image uploaded successfully");
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error: any) {
      console.error("Image upload error:", error);

      if (error.code === "ECONNABORTED") {
        Alert.alert(
          "Upload Timeout",
          "Image upload took too long. Please try again with a smaller image."
        );
      } else if (error.response?.status === 413) {
        Alert.alert(
          "File Too Large",
          "Please select an image smaller than 500KB."
        );
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to upload image. Please try again.";
        Alert.alert("Upload Error", errorMessage);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      itemType: categoryId,
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user?.id || !token) {
      Alert.alert("Error", "Please log in to donate items");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        itemType: formData.itemType.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        photos: formData.photos.length > 0 ? formData.photos[0] : undefined,
        duration:
          formData.donationType === "duration"
            ? parseInt(formData.duration)
            : 0,
        preferredContactMethod: formData.preferredContactMethod,
        donationType: formData.donationType,
      };

      console.log("Submitting donation data:", requestData);

      const response = await axios.post(
        `${API_BASE_URL}/items/donations/express-interest`,
        requestData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Thank You!",
          "Your donation request has been submitted successfully. We'll contact you soon.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error("Failed to submit donation:", error);

      console.log("Error response:", error.response?.data);
      console.log("Error status:", error.response?.status);
      console.log("Error headers:", error.response?.headers);

      const errorMessage =
        error.response?.data?.message ||
        "Failed to submit donation request. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({
      itemType: "",
      title: "",
      description: "",
      photos: [],
      duration: "0",
      preferredContactMethod: "whatsApp",
      donationType: "giveaway",
    });
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
          <Text style={dynamicStyles.headerTitle}>Donate Item</Text>
          <View style={dynamicStyles.placeholder} />
        </View>

        {/* Form */}
        <View style={dynamicStyles.formContainer}>
          {/* Donation Type Selection */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Donation Type <Text style={dynamicStyles.required}>*</Text>
            </Text>
            <View style={dynamicStyles.donationTypeContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.donationTypeButton,
                  formData.donationType === "giveaway" &&
                    dynamicStyles.donationTypeButtonActive,
                ]}
                onPress={() => handleDonationTypeChange("giveaway")}
              >
                <Ionicons
                  name={
                    formData.donationType === "giveaway"
                      ? "gift"
                      : "gift-outline"
                  }
                  size={20}
                  color={
                    formData.donationType === "giveaway"
                      ? "#FFF"
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    dynamicStyles.donationTypeText,
                    formData.donationType === "giveaway" &&
                      dynamicStyles.donationTypeTextActive,
                  ]}
                >
                  Giveaway
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.donationTypeButton,
                  formData.donationType === "duration" &&
                    dynamicStyles.donationTypeButtonActive,
                ]}
                onPress={() => handleDonationTypeChange("duration")}
              >
                <Ionicons
                  name={
                    formData.donationType === "duration"
                      ? "time"
                      : "time-outline"
                  }
                  size={20}
                  color={
                    formData.donationType === "duration"
                      ? "#FFF"
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    dynamicStyles.donationTypeText,
                    formData.donationType === "duration" &&
                      dynamicStyles.donationTypeTextActive,
                  ]}
                >
                  Duration Based
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={dynamicStyles.helperText}>
              {formData.donationType === "giveaway"
                ? "Permanently donate this item to the library"
                : "Lend this item to the library for a specific period"}
            </Text>
          </View>

          {/* Item Type/Category */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Item Type/Category <Text style={dynamicStyles.required}>*</Text>
            </Text>

            {showCustomCategory ? (
              <View>
                <TextInput
                  style={[
                    dynamicStyles.textInput,
                    errors.itemType && dynamicStyles.inputError,
                  ]}
                  placeholder="Enter custom category"
                  placeholderTextColor={colors.textSecondary}
                  value={customCategory}
                  onChangeText={(value) => setCustomCategory(value)}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={dynamicStyles.switchToDropdown}
                  onPress={() => {
                    setShowCustomCategory(false);
                    setCustomCategory("");
                    setFormData((prev) => ({ ...prev, itemType: "" }));
                  }}
                >
                  <Text style={dynamicStyles.switchText}>
                    Choose from list instead
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[dynamicStyles.textInput, errors.itemType && dynamicStyles.inputError]}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text
                  style={
                    formData.itemType
                      ? dynamicStyles.selectedText
                      : dynamicStyles.placeholderText
                  }
                >
                  {formData.itemType
                    ? categories.find((c) => c._id === formData.itemType)?.name
                    : "Select category"}
                </Text>
              </TouchableOpacity>
            )}

            {errors.itemType && (
              <Text style={dynamicStyles.errorText}>{errors.itemType}</Text>
            )}
          </View>

          {/* Item Title */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>
              Item Title <Text style={dynamicStyles.required}>*</Text>
            </Text>
            <TextInput
              style={[dynamicStyles.textInput, errors.title && dynamicStyles.inputError]}
              placeholder="Enter item title (e.g., Wireless Headphones, Office Chair)"
              placeholderTextColor={colors.textSecondary}
              value={formData.title}
              onChangeText={(value) => handleInputChange("title", value)}
              maxLength={100}
            />
            {errors.title ? (
              <Text style={dynamicStyles.errorText}>{errors.title}</Text>
            ) : (
              <Text style={dynamicStyles.helperText}>
                Clear and descriptive title for your item
              </Text>
            )}
          </View>

          {/* Duration */}
          {formData.donationType === "duration" && (
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>
                Duration (Days) <Text style={dynamicStyles.required}>*</Text>
              </Text>
              <TextInput
                style={[dynamicStyles.textInput, errors.duration && dynamicStyles.inputError]}
                placeholder="Enter duration in days"
                placeholderTextColor={colors.textSecondary}
                value={formData.duration}
                onChangeText={(value) =>
                  handleInputChange("duration", value.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.duration ? (
                <Text style={dynamicStyles.errorText}>{errors.duration}</Text>
              ) : (
                <Text style={dynamicStyles.helperText}>
                  How many days would you like to lend this item?
                </Text>
              )}
            </View>
          )}

          {/* Description (Optional) */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Description</Text>
            <TextInput
              style={dynamicStyles.textArea}
              placeholder="Describe the item's condition, features, specifications..."
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={dynamicStyles.helperRow}>
              <Text style={dynamicStyles.helperText}>
                Additional details about your item
              </Text>
              <Text style={dynamicStyles.charCount}>
                {formData.description.length}/500
              </Text>
            </View>
          </View>

          {/* Photo Upload */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Photos</Text>

            {/* Upload Button */}
            <TouchableOpacity
              style={dynamicStyles.uploadButton}
              onPress={pickImage}
              disabled={uploadingImage || formData.photos.length >= 5}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={dynamicStyles.uploadButtonText}>
                    {formData.photos.length >= 5 ? "Max 5 Photos" : "Add Photo"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={dynamicStyles.helperText}>
              Upload photos to help us identify your item (max 5 photos, 500KB
              each)
            </Text>

            {/* Display uploaded images */}
            {formData.photos.length > 0 && (
              <View style={dynamicStyles.imagesContainer}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={dynamicStyles.imageWrapper}>
                    <Image
                      source={{ uri: photo }}
                      style={dynamicStyles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={dynamicStyles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Upload Progress */}
            {uploadingImage && (
              <View style={dynamicStyles.uploadProgress}>
                <Text style={dynamicStyles.uploadProgressText}>
                  Uploading image...
                </Text>
              </View>
            )}
          </View>

          {/* Preferred Contact Method */}
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Preferred Contact Method</Text>
            <View style={dynamicStyles.contactMethodContainer}>
              <TouchableOpacity
                style={[
                  dynamicStyles.contactMethodButton,
                  formData.preferredContactMethod === "whatsApp" &&
                    dynamicStyles.contactMethodButtonActive,
                ]}
                onPress={() =>
                  handleInputChange("preferredContactMethod", "whatsApp")
                }
              >
                <Ionicons
                  name={
                    formData.preferredContactMethod === "whatsApp"
                      ? "logo-whatsapp"
                      : "logo-whatsapp"
                  }
                  size={20}
                  color={
                    formData.preferredContactMethod === "whatsApp"
                      ? "#FFF"
                      : "#25D366"
                  }
                />
                <Text
                  style={[
                    dynamicStyles.contactMethodText,
                    formData.preferredContactMethod === "whatsApp" &&
                      dynamicStyles.contactMethodTextActive,
                  ]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  dynamicStyles.contactMethodButton,
                  formData.preferredContactMethod === "Email" &&
                    dynamicStyles.contactMethodButtonActive,
                ]}
                onPress={() =>
                  handleInputChange("preferredContactMethod", "Email")
                }
              >
                <Ionicons
                  name={
                    formData.preferredContactMethod === "Email"
                      ? "mail"
                      : "mail-outline"
                  }
                  size={20}
                  color={
                    formData.preferredContactMethod === "Email"
                      ? "#FFF"
                      : colors.primary
                  }
                />
                <Text
                  style={[
                    dynamicStyles.contactMethodText,
                    formData.preferredContactMethod === "Email" &&
                      dynamicStyles.contactMethodTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={dynamicStyles.helperText}>
              How would you prefer us to contact you about your donation?
            </Text>
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
                  <Ionicons name="heart-outline" size={20} color="#FFF" />
                  <Text style={dynamicStyles.buttonText}>Submit Donation</Text>
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
              Your donation will be reviewed by our team. We'll contact you via
              your preferred method to coordinate the donation process.
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
                    setFormData((prev) => ({ ...prev, itemType: "other" }));
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={[dynamicStyles.pickerItemText, dynamicStyles.otherOptionText]}>
                    Other (Custom Category)
                  </Text>
                </TouchableOpacity>
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
      minHeight: 100,
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
    // Donation Type Styles
    donationTypeContainer: {
      flexDirection: "row",
      gap: 12,
    },
    donationTypeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: "transparent",
      gap: 8,
    },
    donationTypeButtonActive: {
      backgroundColor: colors.primary,
    },
    donationTypeText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
    },
    donationTypeTextActive: {
      color: "#FFF",
    },
    // Contact Method Styles
    contactMethodContainer: {
      flexDirection: "row",
      gap: 12,
    },
    contactMethodButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: "transparent",
      gap: 6,
    },
    contactMethodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    contactMethodText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
    },
    contactMethodTextActive: {
      color: "#FFF",
    },
    // Image Upload Styles
    uploadButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: "dashed",
      borderRadius: 12,
      backgroundColor: `${colors.primary}10`,
      gap: 8,
    },
    uploadButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    imagesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 12,
    },
    imageWrapper: {
      position: "relative",
    },
    uploadedImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    removeImageButton: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#FFF",
      borderRadius: 10,
    },
    // Action Buttons
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
    uploadProgress: {
      marginTop: 8,
      padding: 8,
      backgroundColor: `${colors.primary}10`,
      borderRadius: 8,
      alignItems: "center",
    },
    uploadProgressText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: "500",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    pickerContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "70%",
    },
    pickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: "600",
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
    otherOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: `${colors.primary}10`,
    },
    otherOptionText: {
      color: colors.primary,
      fontWeight: "600",
    },
    switchToDropdown: {
      marginTop: 8,
      alignSelf: "flex-start",
    },
    switchText: {
      color: colors.primary,
      fontSize: 14,
      textDecorationLine: "underline",
    },
    selectedText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    placeholderText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });
}
