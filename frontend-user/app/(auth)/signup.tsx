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
import React, { useState, useMemo, useEffect } from "react";
import createDynamicStyles from "@/assets/styles/signup.styles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import CustomToast from "@/components/CustomToast";
import PickerModal from "@/components/PickerModal";   
import axios from "axios";

import { useTheme } from "@/context/ThemeContext";
import { useSetAtom, useAtomValue } from "jotai";
import { isLoadingAtom, registerAtom } from "@/store/authStore";

// 🌍 API URLs
const countriesUrl = "https://restcountries.com/v3.1/all?fields=name,cca2";
const countryStateUrl = "https://countriesnow.space/api/v0.1/countries/states";
const countryCityUrl =
  "https://countriesnow.space/api/v0.1/countries/state/cities";

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    countryCode: "",
    mobileNumber: "",
    dateOfBirth: "",
    addressCountry: "",
    addressState: "",
    addressCity: "",
    postalCode: "",
    street: "",
    employeeId: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

  const isLoading = useAtomValue(isLoadingAtom);
  const register = useSetAtom(registerAtom);

  const [activePicker, setActivePicker] = useState<
    null | "code" | "country" | "state" | "city"
  >(null);

  const [countryCodes, setCountryCodes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const [loadingData, setLoadingData] = useState({
    codes: false,
    countries: false,
    states: false,
    cities: false,
  });

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

    if (field === "addressCountry") {
      setFormData((prev) => ({
        ...prev,
        addressState: "",
        addressCity: "",
      }));
      setStates([]);
      setCities([]);
    }

    if (field === "addressState") {
      setFormData((prev) => ({
        ...prev,
        addressCity: "",
      }));
      setCities([]);
    }
  };

  const fetchCountryCodes = async () => {
    try {
      setLoadingData((p) => ({ ...p, codes: true }));
      const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,idd");

      const list = res.data
        .filter((c: any) => c.idd?.root)
        .map((c: any) => {
          const suffix = c.idd.suffixes?.[0] || "";
          return {
            label: `${c.name.common} (${c.idd.root}${suffix})`,
            value: `${c.idd.root}${suffix}`,
          };
        })
        .sort((a: any, b: any) => a.label.localeCompare(b.label));

      setCountryCodes(list);
    } catch (err) {
      setCountryCodes([]);
    } finally {
      setLoadingData((p) => ({ ...p, codes: false }));
    }
  };

  const fetchCountries = async () => {
    try {
      setLoadingData((p) => ({ ...p, countries: true }));
      const res = await axios.get(countriesUrl);

      const list = res.data
        .map((c: any) => ({
          label: c.name.common,
          value: c.code || c.cca2,
          name: c.name.common,
          code: c.cca2,
        }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));

      setCountries(list);
    } catch (err) {
      setCountries([]);
    } finally {
      setLoadingData((p) => ({ ...p, countries: false }));
    }
  };

  const fetchStates = async (countryCode: string) => {
    try {
      setLoadingData((p) => ({ ...p, states: true }));

      const selectedCountry = countries.find((c) => c.code === countryCode);
      if (!selectedCountry) return;

      const res = await axios.post(countryStateUrl, {
        country: selectedCountry.label,
      });

      const list = res.data.data.states?.map((s: any) => ({
        label: s.name,
        value: s.name,
      })) || [];

      setStates(list);
    } catch (err) {
      setStates([]);
    } finally {
      setLoadingData((p) => ({ ...p, states: false }));
    }
  };

  const fetchCities = async (countryCode: string, stateName: string) => {
    try {
      setLoadingData((p) => ({ ...p, cities: true }));

      const selectedCountry = countries.find((c) => c.code === countryCode);
      if (!selectedCountry) return;

      const res = await axios.post(countryCityUrl, {
        country: selectedCountry.label,
        state: stateName,
      });

      const list =
        res.data.data?.map((city: string) => ({
          label: city,
          value: city,
        })) || [];

      setCities(list);
    } catch (err) {
      setCities([]);
    } finally {
      setLoadingData((p) => ({ ...p, cities: false }));
    }
  };

  useEffect(() => {
    fetchCountryCodes();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.addressCountry) {
      fetchStates(formData.addressCountry);
    }
  }, [formData.addressCountry]);

  useEffect(() => {
    if (formData.addressState) {
      fetchCities(formData.addressCountry, formData.addressState);
    }
  }, [formData.addressState]);

  const handleSignup = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.countryCode ||
      !formData.mobileNumber ||
      !formData.dateOfBirth ||
      !formData.addressCountry ||
      !formData.addressState ||
      !formData.addressCity ||
      !formData.postalCode ||
      !formData.street ||
      !formData.employeeId
    ) {
      showToastMessage("Please fill all required fields", "error");
      return;
    }

    const fullPhoneNumber = formData.countryCode + formData.mobileNumber;

    const addressString = [
      formData.street,
      formData.addressCity,
      formData.addressState,
      formData.postalCode,
      formData.addressCountry,
    ]
      .filter(Boolean)
      .join(", ");

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      phoneNumber: fullPhoneNumber,
      dateOfBirth: formData.dateOfBirth,
      address: addressString,
      employeeId: formData.employeeId,
    };

    console.log("PAYLOAD:", payload);
    const result = await register(payload);

    if (result.success) {
      showToastMessage("Registration successful!", "success");

      setTimeout(() => {
        router.replace("/(auth)");
      }, 2000);
    } else {
      showToastMessage(result.error, "error");
    }
  };

  const pickerProps = {
    code: {
      title: "Select Country Code",
      options: countryCodes,
      onSelect: (v: string) => handleInputChange("countryCode", v),
      loading: loadingData.codes,
    },
    country: {
      title: "Select Country",
      options: countries,
      onSelect: (v: string) => handleInputChange("addressCountry", v),
      loading: loadingData.countries,
    },
    state: {
      title: "Select State",
      options: states,
      onSelect: (v: string) => handleInputChange("addressState", v),
      loading: loadingData.states,
    },
    city: {
      title: "Select City",
      options: cities,
      onSelect: (v: string) => handleInputChange("addressCity", v),
      loading: loadingData.cities,
    },
  };

  const selectedPicker =
    activePicker !== null ? pickerProps[activePicker] : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={dynamicStyles.scrollViewStyle}
        contentContainerStyle={dynamicStyles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={dynamicStyles.container}>
          {/* IMAGE */}
          <View style={dynamicStyles.topIllustration}>
            <Image
              source={require("../../assets/images/loginIcon.png")}
              style={dynamicStyles.illustrationImage}
              resizeMode="contain"
            />
          </View>

          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.title}>Create Account</Text>

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
                  onChangeText={(v) => handleInputChange("fullName", v)}
                />
              </View>
            </View>

            {/* MOBILE NUMBER */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Mobile Number *</Text>

              <View style={dynamicStyles.phoneContainer}>
                {/* COUNTRY CODE PICKER */}
                <TouchableOpacity
                  style={dynamicStyles.codePicker}
                  onPress={() => setActivePicker("code")}
                >
                  <Text style={dynamicStyles.codeText}>
                    {formData.countryCode || "+Code"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {/* PHONE NUMBER INPUT */}
                <TextInput
                  style={dynamicStyles.phoneInput}
                  placeholder="Phone Number"
                  placeholderTextColor={colors.placeholderText}
                  value={formData.mobileNumber}
                  onChangeText={(v) => handleInputChange("mobileNumber", v)}
                  keyboardType="phone-pad"
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
                  placeholder="Enter email"
                  placeholderTextColor={colors.placeholderText}
                  value={formData.email}
                  onChangeText={(v) => handleInputChange("email", v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  placeholder="Create password"
                  placeholderTextColor={colors.placeholderText}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(v) => handleInputChange("password", v)}
                />
                <TouchableOpacity
                  style={dynamicStyles.eyeIcon}
                  onPress={() => setShowPassword((p) => !p)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* DATE OF BIRTH */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Date of Birth *</Text>
              <View style={dynamicStyles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.primary}
                  style={dynamicStyles.inputIcon}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.placeholderText}
                  value={formData.dateOfBirth}
                  onChangeText={(v) => handleInputChange("dateOfBirth", v)}
                />
              </View>
            </View>

            {/* ADDRESS SECTION */}
            <Text style={dynamicStyles.sectionTitle}>Address *</Text>

            {/* COUNTRY */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Country *</Text>
              <TouchableOpacity
                style={dynamicStyles.selectInput}
                onPress={() => setActivePicker("country")}
              >
                <Text style={dynamicStyles.selectInputText}>
                  {formData.addressCountry || "Select Country"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* STATE */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>State *</Text>
              <TouchableOpacity
                style={dynamicStyles.selectInput}
                onPress={() => setActivePicker("state")}
                disabled={!formData.addressCountry}
              >
                <Text style={dynamicStyles.selectInputText}>
                  {formData.addressState || "Select State"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* CITY */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>City *</Text>
              <TouchableOpacity
                style={dynamicStyles.selectInput}
                onPress={() => setActivePicker("city")}
                disabled={!formData.addressState}
              >
                <Text style={dynamicStyles.selectInputText}>
                  {formData.addressCity || "Select City"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* PINCODE */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Postal Code *</Text>
              <View style={dynamicStyles.inputContainer}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color={colors.primary}
                  style={dynamicStyles.inputIcon}
                />
                <TextInput
                  style={dynamicStyles.input}
                  placeholder="Enter postal code"
                  placeholderTextColor={colors.placeholderText}
                  value={formData.postalCode}
                  onChangeText={(v) => handleInputChange("postalCode", v)}
                />
              </View>
            </View>

            {/* STREET ADDRESS */}
            <View style={dynamicStyles.inputGroup}>
              <Text style={dynamicStyles.label}>Street Address *</Text>
              <TextInput
                style={[dynamicStyles.input, { height: 80 }]}
                placeholder="Apartment, Street, Building, etc."
                placeholderTextColor={colors.placeholderText}
                multiline
                value={formData.street}
                onChangeText={(v) => handleInputChange("street", v)}
              />
            </View>

            {/* EMPLOYEE ID */}
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
                  placeholder="Enter Employee ID"
                  placeholderTextColor={colors.placeholderText}
                  value={formData.employeeId}
                  onChangeText={(v) => handleInputChange("employeeId", v)}
                />
              </View>
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              style={[
                dynamicStyles.button,
                isLoading && dynamicStyles.buttonDisabled,
              ]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={dynamicStyles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={dynamicStyles.backToLoginContainer}>
              <Text style={dynamicStyles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.navigate("/(auth)")}>
                <Text style={dynamicStyles.link}>Login</Text>
              </TouchableOpacity>
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

          {/* PICKER MODAL */}
          {selectedPicker && (
            <PickerModal
              visible={activePicker !== null}
              onClose={() => setActivePicker(null)}
              title={selectedPicker.title}
              options={selectedPicker.options}
              onSelect={selectedPicker.onSelect}
              loading={selectedPicker.loading}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
