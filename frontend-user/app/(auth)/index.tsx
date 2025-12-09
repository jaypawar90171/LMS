import createDynamicStyles from "@/assets/styles/login.styles";
import CustomToast from "@/components/CustomToast";
import { useTheme } from "@/context/ThemeContext";
import { isLoadingAtom, loginAtom, userAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Login() {
  console.log('Login component rendering...');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const router = useRouter();
  const { colors } = useTheme();
      
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  

  const isLoading = useAtomValue(isLoadingAtom);
  const login = useSetAtom(loginAtom);
  const user = useAtomValue(userAtom);
  console.log(`${user} logged in succesgully`);

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
    console.log('handleLogin called');
    console.log('Email:', email, 'Password length:', password.length);
    
    if (!email || !password) {
      console.log('Validation failed - missing email or password');
      showToastMessage("Please enter both email and password", "error");
      return;
    }

    console.log('Starting login process...');
    try {
      const result = await login({ email, password, rememberMe });
      console.log('Login result:', result);
      
      if (result && result.success) {
        if (result.requirePasswordChange) {
          console.log('Password change required');
          showToastMessage("Please update your password to continue", "info");
          setTimeout(() => {
            router.replace("/(tabs)/profile/change-password");
          }, 1000);
        } else {
          console.log('Login successful, redirecting to home');
          showToastMessage("Login successful!", "success");
          setTimeout(() => {
            router.replace("/(tabs)/home");
          }, 1500);
        }
      } else {
        console.log('Login failed:', result?.error || 'Unknown error');
        showToastMessage(result?.error || 'Login failed', "error");
      }
    } catch (error) {
      console.error('Login exception:', error);
      showToastMessage('An unexpected error occurred', "error");
    }
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
          <View style={dynamicStyles.formContainer}>
            {/* EMAIL */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Email</Text>
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
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Password</Text>
              <View style={dynamicStyles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.primary}
                  style={dynamicStyles.inputIcon}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholderText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
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

            {/* FORGOT PASSWORD*/}
            <TouchableOpacity
              style={dynamicStyles.forgotPasswordContainer}
              onPress={() => {
                router.navigate("/(auth)/forgotPassword");
              }}
            >
              <Text style={dynamicStyles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* REMEMBER ME */}
            <View style={dynamicStyles.rememberMeContainer}>
              <TouchableOpacity
                style={dynamicStyles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  style={[
                    dynamicStyles.checkbox,
                    rememberMe && dynamicStyles.checkboxChecked,
                  ]}
                >
                  {rememberMe && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={dynamicStyles.rememberMeText}>Remember me</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[dynamicStyles.button, isLoading && dynamicStyles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={dynamicStyles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* FOOTER */}
            <View style={dynamicStyles.footer}>
              <Text style={dynamicStyles.footerText}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                <Text style={dynamicStyles.link}>Sign Up</Text>
              </TouchableOpacity>
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
