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
import createDynamicStyles from "@/assets/styles/forgotPassword.styles";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import CustomToast from "@/components/CustomToast";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { colors } = useTheme();
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  

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
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.topIllustration}>
          <Image
            source={require("../../assets/images/loginIcon.png")}
            style={dynamicStyles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.title}>Reset Password</Text>
            <Text style={dynamicStyles.subtitle}>
              Enter your email address and we'll send you a link to reset your
              password
            </Text>
          </View>

          <View style={dynamicStyles.formContainer}>
            {/* EMAIL INPUT */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Email Address</Text>
              <View style={dynamicStyles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                  style={dynamicStyles.inputIcon}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor={colors.placeholderText}
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
              style={[dynamicStyles.button, isLoading && dynamicStyles.buttonDisabled]}
              onPress={handleSendEmail}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={dynamicStyles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* BACK TO LOGIN */}
            <View style={dynamicStyles.backToLoginContainer}>
              <TouchableOpacity
                onPress={handleBackToLogin}
                style={dynamicStyles.backButton}
              >
                <Ionicons name="arrow-back" size={16} color={colors.primary} />
                <Text style={dynamicStyles.backToLoginText}>Back to Login</Text>
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
