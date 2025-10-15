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
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { userAtom, tokenAtom } from "@/store/authStore";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";
import COLORS from "@/constants/color";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

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
  const router = useRouter();

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
          <Text style={styles.headerTitle}>Donate Item</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Donation Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Donation Type <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.donationTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.donationTypeButton,
                  formData.donationType === "giveaway" &&
                    styles.donationTypeButtonActive,
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
                      : COLORS.primary
                  }
                />
                <Text
                  style={[
                    styles.donationTypeText,
                    formData.donationType === "giveaway" &&
                      styles.donationTypeTextActive,
                  ]}
                >
                  Giveaway
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.donationTypeButton,
                  formData.donationType === "duration" &&
                    styles.donationTypeButtonActive,
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
                      : COLORS.primary
                  }
                />
                <Text
                  style={[
                    styles.donationTypeText,
                    formData.donationType === "duration" &&
                      styles.donationTypeTextActive,
                  ]}
                >
                  Duration Based
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {formData.donationType === "giveaway"
                ? "Permanently donate this item to the library"
                : "Lend this item to the library for a specific period"}
            </Text>
          </View>

          {/* Item Type/Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Item Type/Category <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.itemType && styles.inputError]}
              placeholder="Enter item category (e.g., Books, Electronics, Furniture)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.itemType}
              onChangeText={(value) => handleInputChange("itemType", value)}
              maxLength={50}
            />
            {errors.itemType ? (
              <Text style={styles.errorText}>{errors.itemType}</Text>
            ) : (
              <Text style={styles.helperText}>
                What type of item are you donating?
              </Text>
            )}
          </View>

          {/* Item Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Item Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.title && styles.inputError]}
              placeholder="Enter item title (e.g., Wireless Headphones, Office Chair)"
              placeholderTextColor={COLORS.textSecondary}
              value={formData.title}
              onChangeText={(value) => handleInputChange("title", value)}
              maxLength={100}
            />
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : (
              <Text style={styles.helperText}>
                Clear and descriptive title for your item
              </Text>
            )}
          </View>

          {/* Duration (Only for duration-based donations) */}
          {formData.donationType === "duration" && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Duration (Days) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textInput, errors.duration && styles.inputError]}
                placeholder="Enter duration in days"
                placeholderTextColor={COLORS.textSecondary}
                value={formData.duration}
                onChangeText={(value) =>
                  handleInputChange("duration", value.replace(/[^0-9]/g, ""))
                }
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.duration ? (
                <Text style={styles.errorText}>{errors.duration}</Text>
              ) : (
                <Text style={styles.helperText}>
                  How many days would you like to lend this item?
                </Text>
              )}
            </View>
          )}

          {/* Description (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the item's condition, features, specifications..."
              placeholderTextColor={COLORS.textSecondary}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <View style={styles.helperRow}>
              <Text style={styles.helperText}>
                Additional details about your item
              </Text>
              <Text style={styles.charCount}>
                {formData.description.length}/500
              </Text>
            </View>
          </View>

          {/* Photo Upload */}
          {/* Photo Upload */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos (Optional)</Text>

            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickImage}
              disabled={uploadingImage || formData.photos.length >= 5}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={COLORS.primary}
                  />
                  <Text style={styles.uploadButtonText}>
                    {formData.photos.length >= 5 ? "Max 5 Photos" : "Add Photo"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Upload photos to help us identify your item (max 5 photos, 500KB
              each)
            </Text>

            {/* Display uploaded images */}
            {formData.photos.length > 0 && (
              <View style={styles.imagesContainer}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: photo }}
                      style={styles.uploadedImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
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
              <View style={styles.uploadProgress}>
                <Text style={styles.uploadProgressText}>
                  Uploading image...
                </Text>
              </View>
            )}
          </View>

          {/* Preferred Contact Method */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Contact Method</Text>
            <View style={styles.contactMethodContainer}>
              <TouchableOpacity
                style={[
                  styles.contactMethodButton,
                  formData.preferredContactMethod === "whatsApp" &&
                    styles.contactMethodButtonActive,
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
                    styles.contactMethodText,
                    formData.preferredContactMethod === "whatsApp" &&
                      styles.contactMethodTextActive,
                  ]}
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactMethodButton,
                  formData.preferredContactMethod === "Email" &&
                    styles.contactMethodButtonActive,
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
                      : COLORS.primary
                  }
                />
                <Text
                  style={[
                    styles.contactMethodText,
                    formData.preferredContactMethod === "Email" &&
                      styles.contactMethodTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              How would you prefer us to contact you about your donation?
            </Text>
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
                  <Ionicons name="heart-outline" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Submit Donation</Text>
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
              Your donation will be reviewed by our team. We'll contact you via
              your preferred method to coordinate the donation process.
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
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
    gap: 8,
  },
  donationTypeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  donationTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
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
    borderColor: COLORS.border,
    backgroundColor: "transparent",
    gap: 6,
  },
  contactMethodButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  contactMethodText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
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
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}10`,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
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
  uploadProgress: {
    marginTop: 8,
    padding: 8,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadProgressText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
