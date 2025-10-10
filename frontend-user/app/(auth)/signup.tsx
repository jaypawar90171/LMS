import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import styles from "@/assets/styles/signup.styles";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";
import { Link, router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomToast from "@/components/CustomToast";
import { Picker } from "@react-native-picker/picker";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    role: "",
    emp_id: "",
    ass_emp_id: "",
  });
  const [showPassword, setShowPassword] = useState(false);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignup = async () => {
    // Basic validation
    if (
      !formData.fullName ||
      !formData.userName ||
      !formData.email ||
      !formData.password ||
      !formData.role
    ) {
      showToastMessage("Please fill all required fields", "error");
      return;
    }

    // Role-specific validation
    if (formData.role === "employee" && !formData.emp_id) {
      showToastMessage("Employee ID is required for employees", "error");
      return;
    }

    if (formData.role === "familyMember" && !formData.ass_emp_id) {
      showToastMessage(
        "Associated Employee ID is required for family members",
        "error"
      );
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToastMessage("Please enter a valid email address", "error");
      return;
    }

    // Password validation
    if (formData.password.length < 8) {
      showToastMessage("Password must be at least 8 characters long", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        userName: formData.userName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        emp_id: formData.emp_id,
        ass_emp_id: formData.ass_emp_id,
      };

      const API_URL = `${API_BASE_URL}/auth/register`;

      const result = await axios.post(API_URL, payload);

      console.log("Signup successful:", result.data);
      showToastMessage("Registration successful! Please login.", "success");

      // Clear form
      setFormData({
        fullName: "",
        userName: "",
        email: "",
        password: "",
        role: "",
        emp_id: "",
        ass_emp_id: "",
      });

      // Navigate to login after delay
      setTimeout(() => {
        router.replace("/(auth)");
      }, 2000);
    } catch (error: any) {
      console.log("Error in signup:", error);

      let errorMessage = "Network error. Please check your connection.";

      if (error.response) {
        errorMessage = error.response.data.error || "Registration failed";
      } else if (error.request) {
        errorMessage = "Cannot connect to server. Please try again later.";
      }

      showToastMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.navigate("/(auth)");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* ILLUSTRATION */}
          <View style={styles.topIllustration}>
            <Image
              source={require("../../assets/images/loginIcon.png")}
              style={styles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join us today! Fill in your details to get started.
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* FULL NAME */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.placeholderText}
                    value={formData.fullName}
                    onChangeText={(value) =>
                      handleInputChange("fullName", value)
                    }
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* USERNAME */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="at-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor={COLORS.placeholderText}
                    value={formData.userName}
                    onChangeText={(value) =>
                      handleInputChange("userName", value)
                    }
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* EMAIL */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.placeholderText}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={COLORS.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={COLORS.placeholderText}
                    value={formData.password}
                    onChangeText={(value) =>
                      handleInputChange("password", value)
                    }
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={COLORS.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ROLE DROPDOWN */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Role *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your role" value="" />
                    <Picker.Item label="Employee" value="employee" />
                    <Picker.Item label="Family Member" value="family" />
                  </Picker>
                </View>
              </View>

              {/* CONDITIONAL FIELDS */}
              {/* Employee ID - Show only when role is employee */}
              {formData.role === "employee" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Employee ID *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="id-card-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your employee ID"
                      placeholderTextColor={COLORS.placeholderText}
                      value={formData.emp_id}
                      onChangeText={(value) =>
                        handleInputChange("emp_id", value)
                      }
                    />
                  </View>
                </View>
              )}

              {/* Associated Employee ID - Show only when role is familyMember */}
              {formData.role === "familyMember" && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Associated Employee ID *</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={COLORS.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter associated employee ID"
                      placeholderTextColor={COLORS.placeholderText}
                      value={formData.ass_emp_id}
                      onChangeText={(value) =>
                        handleInputChange("ass_emp_id", value)
                      }
                    />
                  </View>
                </View>
              )}

              {/* SIGNUP BUTTON */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* BACK TO LOGIN */}
              <View style={styles.backToLoginContainer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={styles.link}>Login</Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
