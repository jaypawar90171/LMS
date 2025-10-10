import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import styles from "@/assets/styles/forgotPassword.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";
import { Link, router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import CustomToast from "@/components/CustomToast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToastMessage = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleSendEmail = async () => {
    if (!email) {
      showToastMessage("Please enter your email address", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToastMessage("Please enter a valid email address", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload = { email };
      const API_URL = `${API_BASE_URL}/auth/forgot-password`;

      const result = await axios.post(API_URL, payload);

      console.log("Reset email sent:", result.data);
      showToastMessage("Password reset link sent to your email!", "success");

      // Clear email field after successful submission
      setEmail("");
    } catch (error: any) {
      console.log("Error in forgot password:", error);

      let errorMessage = "Network error. Please check your connection.";

      if (error.response) {
        errorMessage =
          error.response.data.error || "Failed to send reset email";
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Please try again later.";
      }

      showToastMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/loginIcon.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* EMAIL INPUT */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor={COLORS.placeholderText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* SEND EMAIL BUTTON */}
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSendEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* BACK TO LOGIN */}
            <View style={styles.backToLoginContainer}>
              <TouchableOpacity
                onPress={handleBackToLogin}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={16} color={COLORS.primary} />
                <Text style={styles.backToLoginText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* TOAST */}
        <CustomToast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          duration={4000}
          onHide={hideToast}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
