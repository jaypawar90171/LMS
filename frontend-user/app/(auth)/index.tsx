import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import React, { useState } from "react";
import styles from "@/assets/styles/login.styles";
import { KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/color";
import { Link } from "expo-router";
import axios from "axios";
import { API_BASE_URL } from "@/constants/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomToast from "@/components/CustomToast";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const router = useRouter();

  const showToastMessage = (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => {
    console.log("Toast triggered:", { message, type });
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    console.log("showToast state should be true");
  };

  const hideToast = () => {
    console.log("Hiding toast");
    setShowToast(false);
  };

  const handleLogin = async () => {
    console.log("Login attempted");

    if (!email || !password) {
      showToastMessage("Please enter both email and password", "error");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email,
        password,
        rememberMe,
      };

      const API_URL = `${API_BASE_URL}/auth/login`;
      console.log("API URL:", API_URL);

      const result = await axios.post(API_URL, payload);

      console.log("Login successful:", result.data);
      showToastMessage("Login successful!", "success");

      await AsyncStorage.setItem("token", result.data.token);

      setTimeout(() => {
        //navigation
      }, 1000);
    } catch (error: any) {
      console.log("Error in login user:", error);

      let errorMessage = "Network error. Please check your connection.";

      if (error.response) {
        errorMessage = error.response.data.error || "Login failed";
      } else if (error.request) {
        errorMessage =
          "Cannot connect to server. Please check if the server is running.";
      }

      showToastMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          <View style={styles.formContainer}>
            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
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
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={COLORS.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* FORGOT PASSWORD*/}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => {
                router.navigate("/(auth)/forgotPassword");
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* REMEMBER ME */}
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberMe && styles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>

        {/* CUSTOM TOAST COMPONENT */}
        <CustomToast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          duration={3000}
          onHide={hideToast}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
