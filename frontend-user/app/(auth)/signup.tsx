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
import createDynamicStyles from "@/assets/styles/signup.styles"
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomToast from "@/components/CustomToast";
import { Picker } from "@react-native-picker/picker";
import { useSetAtom, useAtomValue } from "jotai";
import { isLoadingAtom, registerAtom } from "@/store/authStore";
import { useTheme } from "@/context/ThemeContext";
import {useMemo} from 'react';

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const isLoading = useAtomValue(isLoadingAtom);
  const register = useSetAtom(registerAtom);

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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignup = async () => {
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

    const result = await register(formData);
    if (result.success) {
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
      setTimeout(() => {
        router.replace("/(auth)");
      }, 2000);
    } else {
      showToastMessage(result.error, "error");
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
        style={dynamicStyles.scrollViewStyle}
        contentContainerStyle={dynamicStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.container}>
          {/* ILLUSTRATION */}
          <View style={dynamicStyles.topIllustration}>
            <Image
              source={require("../../assets/images/loginIcon.png")}
              style={dynamicStyles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <View style={dynamicStyles.card}>
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>Create Account</Text>
              <Text style={dynamicStyles.subtitle}>
                Join us today! Fill in your details to get started.
              </Text>
            </View>

            <View style={dynamicStyles.formContainer}>
              {/* FULL NAME */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Full Name *</Text>
                <View style={dynamicStyles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.primary}
                    style={dynamicStyles.inputIcon}
                  />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.placeholderText}
                    value={formData.fullName}
                    onChangeText={(value) =>
                      handleInputChange("fullName", value)
                    }
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* USERNAME */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Username *</Text>
                <View style={dynamicStyles.inputContainer}>
                  <Ionicons
                    name="at-outline"
                    size={20}
                    color={colors.primary}
                    style={dynamicStyles.inputIcon}
                  />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Choose a username"
                    placeholderTextColor={colors.placeholderText}
                    value={formData.userName}
                    onChangeText={(value) =>
                      handleInputChange("userName", value)
                    }
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* EMAIL */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Email *</Text>
                <View style={dynamicStyles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={colors.primary}
                    style={dynamicStyles.inputIcon}
                  />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.placeholderText}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Password *</Text>
                <View style={dynamicStyles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={colors.primary}
                    style={dynamicStyles.inputIcon}
                  />
                  <TextInput
                    style={dynamicStyles.input}
                    placeholder="Create a password"
                    placeholderTextColor={colors.placeholderText}
                    value={formData.password}
                    onChangeText={(value) =>
                      handleInputChange("password", value)
                    }
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={dynamicStyles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ROLE DROPDOWN */}
              <View style={dynamicStyles.inputGroup}>
                <Text style={dynamicStyles.label}>Role *</Text>
                <View style={dynamicStyles.pickerContainer}>
                  <Picker
                    selectedValue={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                    style={dynamicStyles.picker}
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
                <View style={dynamicStyles.inputGroup}>
                  <Text style={dynamicStyles.label}>Employee ID *</Text>
                  <View style={dynamicStyles.inputContainer}>
                    <Ionicons
                      name="id-card-outline"
                      size={20}
                      color={colors.primary}
                      style={dynamicStyles.inputIcon}
                    />
                    <TextInput
                      style={dynamicStyles.input}
                      placeholder="Enter your employee ID"
                      placeholderTextColor={colors.placeholderText}
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
                <View style={dynamicStyles.inputGroup}>
                  <Text style={dynamicStyles.label}>Associated Employee ID *</Text>
                  <View style={dynamicStyles.inputContainer}>
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={colors.primary}
                      style={dynamicStyles.inputIcon}
                    />
                    <TextInput
                      style={dynamicStyles.input}
                      placeholder="Enter associated employee ID"
                      placeholderTextColor={colors.placeholderText}
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
                style={[dynamicStyles.button, isLoading && dynamicStyles.buttonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={dynamicStyles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* BACK TO LOGIN */}
              <View style={dynamicStyles.backToLoginContainer}>
                <Text style={dynamicStyles.footerText}>Already have an account?</Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={dynamicStyles.link}>Login</Text>
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
