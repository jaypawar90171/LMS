import { API_BASE_URL } from "@/constants/api";
import { useTheme } from "@/context/ThemeContext";
import { tokenAtom, userAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from "axios";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

const countriesUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2';
const geonamesUrl = 'http://api.geonames.org';
const geonamesUsername = 'jay_pawar'; // Replace with your GeoNames username
const countryStateUrl = 'https://countriesnow.space/api/v0.1/countries/states';
const countryCityUrl = 'https://countriesnow.space/api/v0.1/countries/state/cities'; 


interface CountryCode {
    code: string;
    name: string;
    flag?: string;
}

interface Country {
    name: string;
    code: string;
    callingCode?: string;
}

interface State {
    name: string;
    code: string;
}

interface City {
    name: string;
}

interface ProfileForm {
    fullName: string;
    countryCode: string;
    mobileNumber: string;
    dateOfBirth: string;
    addressCountry: string;
    addressState: string;
    addressCity: string;
    addressStreet: string;
    postalCode: string;
}

interface ProfileData {
    id: string;
    fullName: string;
    email: string;
    username: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    } | string;
    status: string;
    roles: Array<{
        _id: string;
        roleName: string;
        description: string;
    }>;
    lastLogin: string;
    createdAt: string;
    updatedAt: string;
}

const formatAddressString = (addressData: ProfileData['address']): string => {
    if (typeof addressData === 'string') {
        return addressData;
    }
    if (addressData) {
        return [
            addressData.street,
            addressData.city,
            addressData.state,
            addressData.postalCode,
            addressData.country
        ].filter(Boolean).join(', ');
    }
    return "";
}

interface PickerModalProps {
    visible: boolean;
    onClose: () => void;
    options: { label: string; value: string }[];
    onSelect: (value: string) => void;
    title: string;
    colors: any;
    loading?: boolean;
}

const PickerModal: React.FC<PickerModalProps> = ({ 
    visible, 
    onClose, 
    options, 
    onSelect, 
    title, 
    colors,
    loading = false 
}) => {
    const pickerStyles = useMemo(() => createPickerStyles(colors), [colors]);

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerStyles.modalOverlay}>
                    <View style={pickerStyles.modalContent}>
                        <Text style={pickerStyles.modalTitle}>{title}</Text>
                        
                        {loading ? (
                            <View style={pickerStyles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={pickerStyles.loadingText}>Loading...</Text>
                            </View>
                        ) : (
                            <ScrollView style={pickerStyles.scrollView}>
                                {options.length > 0 ? (
                                    options.map((option, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={pickerStyles.option}
                                            onPress={() => {
                                                onSelect(option.value);
                                                onClose();
                                            }}
                                        >
                                            <Text style={pickerStyles.optionText}>{option.label}</Text>
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <View style={pickerStyles.emptyContainer}>
                                        <Ionicons name="warning-outline" size={24} color={colors.textSecondary} />
                                        <Text style={pickerStyles.emptyText}>No data available</Text>
                                    </View>
                                )}
                            </ScrollView>
                        )}
                        
                        <TouchableOpacity style={pickerStyles.closeButton} onPress={onClose}>
                            <Text style={pickerStyles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const createPickerStyles = (colors: any) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: colors.cardBackground,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '60%',
        paddingTop: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    scrollView: {
        paddingHorizontal: 16,
    },
    option: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    optionText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    closeButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: colors.textSecondary,
        fontSize: 14,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        color: colors.textSecondary,
        fontSize: 14,
    },
});

export default function UpdateProfileScreen() {
    const [user, setUser] = useAtom(userAtom);
    const [token] = useAtom(tokenAtom);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [activePicker, setActivePicker] = useState<null | 'code' | 'country' | 'state' | 'city'>(null);

    const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingData, setLoadingData] = useState({
        countries: false,
        states: false,
        cities: false,
        codes: false,
    });

    const router = useRouter();
    const { colors } = useTheme();

    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);

    const initialFormState: ProfileForm = {
        fullName: "",
        countryCode: "+1",
        mobileNumber: "",
        dateOfBirth: "",
        addressCountry: "",
        addressState: "",
        addressCity: "",
        addressStreet: "",
        postalCode: "",
    };

    const [formData, setFormData] = useState<ProfileForm>(initialFormState);
    const [originalData, setOriginalData] = useState<ProfileForm>(initialFormState);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchAPIData();
        fetchProfileData();
    }, []);

    const fetchAPIData = async () => {
        try {
            await Promise.all([
                fetchCountries(),
                fetchCountryCodes()
            ]);
        } catch (error) {
            console.error("Error fetching API data:", error);
            setCountries([]);
            setCountryCodes([]);
        }
    };

    const fetchCountries = async () => {
    try {
        setLoadingData(prev => ({ ...prev, countries: true }));

        const response = await axios.get(countriesUrl);

        const countriesData: Country[] = response.data
            .map((item: any) => ({
                name: item.name?.common,
                code: item.cca2,
            }))
            .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

        setCountries(countriesData);
    } catch (error) {
        console.error("Error fetching countries:", error);
        setCountries([]);
    } finally {
        setLoadingData(prev => ({ ...prev, countries: false }));
    }
};


    const fetchCountryCodes = async () => {
        try {
            setLoadingData(prev => ({ ...prev, codes: true }));
            const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,idd');
            
            const codes: CountryCode[] = response.data
                .filter((country: any) => country.idd?.root)
                .map((country: any) => {
                    const suffix = country.idd.suffixes?.[0] || '';
                    return {
                        code: `${country.idd.root}${suffix}`,
                        name: country.name.common,
                    };
                })
                .sort((a: CountryCode, b: CountryCode) => a.name.localeCompare(b.name));
            
            setCountryCodes(codes);
        } catch (error) {
            console.error("Error fetching country codes:", error);
            setCountryCodes([]);
        } finally {
            setLoadingData(prev => ({ ...prev, codes: false }));
        }
    };

    const fetchStates = async (countryCode: string) => {
    if (!countryCode) {
        setStates([]);
        setCities([]);
        return;
    }

    try {
        setLoadingData(prev => ({ ...prev, states: true }));

        const country = countries.find(c => c.code === countryCode);
        if (!country) return;

        const response = await axios.post(countryStateUrl, {
            country: country.name,
        });

        const statesList = response.data?.data?.states || [];

        const formattedStates = statesList
            .map((s: any) => ({
                name: s.name,
                code: s.state_code || s.name,
            }))
            .sort((a: State, b: State) => a.name.localeCompare(b.name));

        setStates(formattedStates);
    } catch (error) {
        console.error("Error fetching states:", error);
        setStates([]);
    } finally {
        setLoadingData(prev => ({ ...prev, states: false }));
    }
};


    const fetchCities = async (countryCode: string, stateName: string) => {
    if (!countryCode || !stateName) {
        setCities([]);
        return;
    }

    try {
        setLoadingData(prev => ({ ...prev, cities: true }));

        const country = countries.find(c => c.code === countryCode);
        if (!country) return;

        const response = await axios.post(countryCityUrl, {
            country: country.name,
            state: stateName,
        });

        const citiesList = response.data?.data || [];

        const formattedCities = citiesList
            .map((city: string) => ({
                name: city,
            }))
            .sort((a: City, b: City) => a.name.localeCompare(b.name));

        setCities(formattedCities);
    } catch (error) {
        console.error("Error fetching cities:", error);
        setCities([]);
    } finally {
        setLoadingData(prev => ({ ...prev, cities: false }));
    }
};

    useEffect(() => {
        if (formData.addressCountry) {
            fetchStates(formData.addressCountry);
        } else {
            setStates([]);
            setCities([]);
        }
    }, [formData.addressCountry]);

    useEffect(() => {
        if (formData.addressCountry && formData.addressState) {
            fetchCities(formData.addressCountry, formData.addressState);
        } else {
            setCities([]);
        }
    }, [formData.addressCountry, formData.addressState]);

    const splitPhoneNumber = (fullNumber: string): { code: string, number: string } => {
        if (!fullNumber) return { code: "+1", number: "" };

        const matchingCode = countryCodes.find(cc => fullNumber.startsWith(cc.code));

        if (matchingCode) {
            return {
                code: matchingCode.code,
                number: fullNumber.substring(matchingCode.code.length).trim(),
            };
        }
        return {
            code: "+1",
            number: fullNumber.trim(),
        };
    };

    const splitAddress = (fullAddress: string): Pick<ProfileForm, 'addressCountry' | 'addressState' | 'addressCity' | 'addressStreet' | 'postalCode'> => {
        const defaultReturn = { 
            addressCountry: "", 
            addressState: "", 
            addressCity: "", 
            addressStreet: "", 
            postalCode: "" 
        };
        
        const parts = fullAddress.split(',').map(p => p.trim()).filter(Boolean);

        if (parts.length >= 5) {
            const country = parts[parts.length - 1];
            const postalCode = parts[parts.length - 2];
            const state = parts[parts.length - 3];
            const city = parts[parts.length - 4];
            const street = parts.slice(0, parts.length - 4).join(', ');

            return {
                addressCountry: country,
                addressState: state,
                addressCity: city,
                addressStreet: street,
                postalCode: postalCode,
            };
        } 
        
        if (parts.length > 0) {
             const country = parts[parts.length - 1] || "";
             const state = parts.length > 1 ? parts[parts.length - 2] : "";
             const city = parts.length > 2 ? parts[parts.length - 3] : "";
             const street = parts.slice(0, Math.max(0, parts.length - 3)).join(', ') || parts.join(', ');
             
             return {
                 addressCountry: country,
                 addressState: state,
                 addressCity: city,
                 addressStreet: street,
                 postalCode: "",
             };
        }
        return defaultReturn;
    };

    const fetchProfileData = async () => {
        try {
            setFetching(true);
            const response = await axios.get<any, { data: { success: boolean, data: ProfileData } }>(
                `${API_BASE_URL}/api/mobile/profile`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                const profile = response.data.data;
                const fullPhoneNumber = profile.phoneNumber || "";
                const { code, number } = splitPhoneNumber(fullPhoneNumber);
                const fullAddressString = formatAddressString(profile.address);
                const { addressCountry, addressState, addressCity, addressStreet, postalCode } = splitAddress(fullAddressString);

                const formattedData: ProfileForm = {
                    fullName: profile.fullName || "",
                    countryCode: code,
                    mobileNumber: number,
                    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : "",
                    addressCountry: addressCountry,
                    addressState: addressState,
                    addressCity: addressCity,
                    addressStreet: addressStreet,
                    postalCode: postalCode,
                };

                setFormData(formattedData);
                setOriginalData(formattedData);
            }
        } catch (error: any) {
            console.error("Failed to fetch profile:", error);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setFetching(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Full name is required";
        } else if (formData.fullName.trim().length < 2) {
            newErrors.fullName = "Full name must be at least 2 characters";
        }

        const fullPhoneNumber = formData.countryCode + formData.mobileNumber;
        if (formData.mobileNumber.trim() && !/^\+?[\d\s-()]+$/.test(fullPhoneNumber)) {
            newErrors.mobileNumber = "Please enter a valid mobile number";
        }

        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            if (dob >= today) {
                newErrors.dateOfBirth = "Date of birth must be in the past";
            }
        }

        if (formData.addressCity || formData.addressState || formData.addressCountry || formData.postalCode) {
            if (!formData.addressCountry) newErrors.addressCountry = "Country is required";
            if (!formData.addressState) newErrors.addressState = "State is required";
            if (!formData.addressCity) newErrors.addressCity = "City is required";
            if (!formData.postalCode.trim() && (formData.addressCity || formData.addressStreet)) {
                newErrors.postalCode = "Postal code is recommended for a complete address";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof ProfileForm, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }

        if (field === 'addressCountry') {
            setFormData(prev => ({ 
                ...prev, 
                addressState: '', 
                addressCity: '', 
                postalCode: '' 
            }));
        }
        if (field === 'addressState') {
            setFormData(prev => ({ ...prev, addressCity: '' }));
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split('T')[0];
            handleInputChange("dateOfBirth", formattedDate);
        }
    };

    const currentFullPhoneNumber = formData.countryCode + formData.mobileNumber;
    const originalFullPhoneNumber = originalData.countryCode + originalData.mobileNumber;

    const currentAddressString = [
        formData.addressStreet, 
        formData.addressCity, 
        formData.addressState, 
        formData.postalCode,
        formData.addressCountry
    ].filter(Boolean).join(', ');

    const originalAddressString = [
        originalData.addressStreet, 
        originalData.addressCity, 
        originalData.addressState, 
        originalData.postalCode,
        originalData.addressCountry
    ].filter(Boolean).join(', ');

    const hasChanges = useMemo(() => {
        return (
            formData.fullName !== originalData.fullName ||
            currentFullPhoneNumber !== originalFullPhoneNumber ||
            formData.dateOfBirth !== originalData.dateOfBirth ||
            currentAddressString !== originalAddressString
        );
    }, [formData, originalData, currentFullPhoneNumber, originalAddressString]);

    const handleSubmit = async () => {
        if (!validateForm()) return;

        if (!hasChanges) {
            Alert.alert("No Changes", "You haven't made any changes to your profile.");
            return;
        }

        setLoading(true);

        try {
            const submissionData: any = {
                fullName: formData.fullName.trim(),
            };

            if (formData.mobileNumber.trim()) {
                submissionData.phoneNumber = formData.countryCode + formData.mobileNumber.trim();
            }

            if (formData.dateOfBirth) submissionData.dateOfBirth = formData.dateOfBirth;

            if (currentAddressString.trim()) {
                submissionData.address = currentAddressString.trim();
            }

            const response = await axios.put(
                `${API_BASE_URL}/api/mobile/profile`,
                submissionData,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                if (user) {
                    setUser({
                        ...user,
                        fullName: formData.fullName,
                    });
                }

                Alert.alert(
                    "Success",
                    "Your profile has been updated successfully!",
                    [
                        {
                            text: "OK",
                            onPress: () => {
                                router.back();
                            },
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error("Profile update error:", error);

            const errorMessage =
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Failed to update profile. Please try again.";

            if (error.response?.status === 400) {
                Alert.alert("Validation Error", errorMessage);
            } else {
                Alert.alert("Error", errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        Alert.alert(
            "Reset Changes",
            "Are you sure you want to discard all changes?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: () => {
                        setFormData(originalData);
                        setErrors({});
                    },
                },
            ]
        );
    };

    const formatDateForDisplay = (dateString: string) => {
        if (!dateString) return "Select date";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const countryOptions = useMemo(() => {
        return countries.map(country => ({
            label: country.name,
            value: country.code,
        }));
    }, [countries]);

    const stateOptions = useMemo(() => {
        return states.map(state => ({
            label: state.name,
            value: state.name,
        }));
    }, [states]);

    const cityOptions = useMemo(() => {
        return cities.map(city => ({
            label: city.name,
            value: city.name,
        }));
    }, [cities]);

    const codeOptions = useMemo(() => {
        return countryCodes.map(c => ({
            label: `${c.name} (${c.code})`,
            value: c.code,
        }));
    }, [countryCodes]);

    if (fetching) {
        return (
            <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={dynamicStyles.loadingText}>Loading your profile...</Text>
            </View>
        );
    }

    let pickerProps: Omit<PickerModalProps, 'visible' | 'onClose' | 'colors'> = {
        title: "",
        options: [],
        onSelect: () => { },
    };

    switch (activePicker) {
        case 'code':
            pickerProps = {
                title: "Select Country Code",
                options: codeOptions,
                onSelect: (value) => handleInputChange('countryCode', value),
            };
            break;
        case 'country':
            pickerProps = {
                title: "Select Country",
                options: countryOptions,
                onSelect: (value) => handleInputChange('addressCountry', value),
            };
            break;
        case 'state':
            pickerProps = {
                title: "Select State",
                options: stateOptions,
                onSelect: (value) => handleInputChange('addressState', value),
            };
            break;
        case 'city':
            pickerProps = {
                title: "Select City",
                options: cityOptions,
                onSelect: (value) => handleInputChange('addressCity', value),
            };
            break;
        default:
            break;
    }

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
                <View style={dynamicStyles.header}>
                    <TouchableOpacity
                        style={dynamicStyles.backButton}
                        onPress={() => router.navigate("/(tabs)/profile")}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={dynamicStyles.headerTitle}>Update Profile</Text>
                    <View style={dynamicStyles.placeholder} />
                </View>

                {hasChanges && (
                    <View style={dynamicStyles.changesIndicator}>
                        <Ionicons name="information-circle" size={20} color="#FFA000" />
                        <Text style={dynamicStyles.changesText}>You have unsaved changes</Text>
                    </View>
                )}

                <View style={dynamicStyles.formContainer}>
                    <View style={dynamicStyles.section}>
                        <Text style={dynamicStyles.sectionTitle}>Personal Information</Text>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>
                                Full Name <Text style={dynamicStyles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[dynamicStyles.textInput, errors.fullName && dynamicStyles.inputError]}
                                placeholder="Enter your full name"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.fullName}
                                onChangeText={(value) => handleInputChange("fullName", value)}
                                maxLength={50}
                            />
                            {errors.fullName && (
                                <Text style={dynamicStyles.errorText}>{errors.fullName}</Text>
                            )}
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>Mobile Number</Text>
                            <View style={dynamicStyles.phoneInputRow}>
                                <TouchableOpacity
                                    style={[dynamicStyles.codePicker, errors.mobileNumber && dynamicStyles.inputError]}
                                    onPress={() => setActivePicker('code')}
                                >
                                    <Text style={dynamicStyles.dateText}>{formData.countryCode}</Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TextInput
                                    style={[dynamicStyles.mobileNumberInput, errors.mobileNumber && dynamicStyles.inputError]}
                                    placeholder="Mobile Number"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.mobileNumber}
                                    onChangeText={(value) => handleInputChange("mobileNumber", value)}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>
                            {errors.mobileNumber && (
                                <Text style={dynamicStyles.errorText}>{errors.mobileNumber}</Text>
                            )}
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>Date of Birth</Text>
                            <TouchableOpacity
                                style={[dynamicStyles.dateInput, errors.dateOfBirth && dynamicStyles.inputError]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={formData.dateOfBirth ? dynamicStyles.dateText : dynamicStyles.datePlaceholder}>
                                    {formatDateForDisplay(formData.dateOfBirth)}
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                            {errors.dateOfBirth && (
                                <Text style={dynamicStyles.errorText}>{errors.dateOfBirth}</Text>
                            )}
                        </View>
                    </View>

                    <View style={dynamicStyles.section}>
                        <Text style={dynamicStyles.sectionTitle}>Address Information</Text>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>Country</Text>
                            <TouchableOpacity
                                style={[dynamicStyles.dateInput, errors.addressCountry && dynamicStyles.inputError]}
                                onPress={() => setActivePicker('country')}
                                disabled={loadingData.countries || countries.length === 0}
                            >
                                {loadingData.countries ? (
                                    <View style={dynamicStyles.loadingInline}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={dynamicStyles.loadingInlineText}>Loading countries...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={formData.addressCountry ? dynamicStyles.dateText : dynamicStyles.datePlaceholder}>
                                            {formData.addressCountry || "Select Country"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                                    </>
                                )}
                            </TouchableOpacity>
                            {errors.addressCountry && (
                                <Text style={dynamicStyles.errorText}>{errors.addressCountry}</Text>
                            )}
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>State / Province</Text>
                            <TouchableOpacity
                                style={[dynamicStyles.dateInput, errors.addressState && dynamicStyles.inputError]}
                                onPress={() => setActivePicker('state')}
                                disabled={!formData.addressCountry || loadingData.states || states.length === 0}
                            >
                                {loadingData.states ? (
                                    <View style={dynamicStyles.loadingInline}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={dynamicStyles.loadingInlineText}>Loading states...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={formData.addressState ? dynamicStyles.dateText : dynamicStyles.datePlaceholder}>
                                            {formData.addressState || "Select State"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                                    </>
                                )}
                            </TouchableOpacity>
                            {errors.addressState && (
                                <Text style={dynamicStyles.errorText}>{errors.addressState}</Text>
                            )}
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>City</Text>
                            <TouchableOpacity
                                style={[dynamicStyles.dateInput, errors.addressCity && dynamicStyles.inputError]}
                                onPress={() => setActivePicker('city')}
                                disabled={!formData.addressState || loadingData.cities || cities.length === 0}
                            >
                                {loadingData.cities ? (
                                    <View style={dynamicStyles.loadingInline}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={dynamicStyles.loadingInlineText}>Loading cities...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <Text style={formData.addressCity ? dynamicStyles.dateText : dynamicStyles.datePlaceholder}>
                                            {formData.addressCity || "Select City"}
                                        </Text>
                                        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                                    </>
                                )}
                            </TouchableOpacity>
                            {errors.addressCity && (
                                <Text style={dynamicStyles.errorText}>{errors.addressCity}</Text>
                            )}
                        </View>
                        
                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>Postal Code / ZIP</Text>
                            <TextInput
                                style={[dynamicStyles.textInput, errors.postalCode && dynamicStyles.inputError]}
                                placeholder="Enter postal or zip code"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.postalCode}
                                onChangeText={(value) => handleInputChange("postalCode", value)}
                                keyboardType="default"
                                maxLength={10}
                            />
                            {errors.postalCode && (
                                <Text style={dynamicStyles.errorText}>{errors.postalCode}</Text>
                            )}
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={dynamicStyles.label}>Street/Detail Address</Text>
                            <TextInput
                                style={[dynamicStyles.textInput, { minHeight: 80 }]}
                                placeholder="Enter street address, building name, apartment number, etc."
                                placeholderTextColor={colors.textSecondary}
                                value={formData.addressStreet}
                                onChangeText={(value) => handleInputChange("addressStreet", value)}
                                multiline
                                numberOfLines={3}
                                maxLength={200}
                            />
                        </View>
                    </View>

                    <View style={dynamicStyles.actionsContainer}>
                        <TouchableOpacity
                            style={[dynamicStyles.button, dynamicStyles.secondaryButton]}
                            onPress={handleReset}
                            disabled={loading || !hasChanges}
                        >
                            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
                            <Text style={[dynamicStyles.buttonText, dynamicStyles.secondaryButtonText]}>
                                Reset
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                dynamicStyles.button,
                                dynamicStyles.primaryButton,
                                (!hasChanges || loading) && dynamicStyles.buttonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={loading || !hasChanges}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Ionicons name="save-outline" size={20} color="#FFF" />
                                    <Text style={dynamicStyles.buttonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={dynamicStyles.helpContainer}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                        <Text style={dynamicStyles.helpText}>
                            Fields marked with <Text style={dynamicStyles.required}>*</Text> are required.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {showDatePicker && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={() => setShowDatePicker(false)}
                >
                    <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                        <View style={dynamicStyles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={dynamicStyles.datePickerContainer}>
                                    <DateTimePicker
                                        value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={handleDateChange}
                                        maximumDate={new Date()}
                                    />
                                    {Platform.OS === 'ios' && (
                                        <TouchableOpacity
                                            style={dynamicStyles.datePickerDone}
                                            onPress={() => setShowDatePicker(false)}
                                        >
                                            <Text style={dynamicStyles.datePickerDoneText}>Done</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            )}

            <PickerModal
                visible={activePicker !== null}
                onClose={() => setActivePicker(null)}
                title={pickerProps.title}
                options={pickerProps.options}
                onSelect={pickerProps.onSelect}
                colors={colors}
                loading={activePicker === 'country' ? loadingData.countries : 
                       activePicker === 'state' ? loadingData.states :
                       activePicker === 'city' ? loadingData.cities :
                       activePicker === 'code' ? loadingData.codes : false}
            />
        </KeyboardAvoidingView>
    );
}

function createDynamicStyles(colors: any) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
            gap: 16,
        },
        loadingText: {
            fontSize: 16,
            color: colors.textSecondary,
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
        changesIndicator: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 12,
            backgroundColor: "#FFF3E0",
            borderBottomWidth: 1,
            borderBottomColor: "#FFA000",
        },
        changesText: {
            color: "#E65100",
            fontSize: 14,
            fontWeight: "500",
        },
        formContainer: {
            padding: 16,
        },
        section: {
            backgroundColor: colors.cardBackground,
            marginBottom: 24,
            padding: 20,
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: "600",
            color: colors.textPrimary,
            marginBottom: 16,
        },
        inputGroup: {
            marginBottom: 20,
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
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: colors.textPrimary,
        },
        dateInput: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            minHeight: 56,
        },
        dateText: {
            fontSize: 16,
            color: colors.textPrimary,
        },
        datePlaceholder: {
            fontSize: 16,
            color: colors.textSecondary,
        },
        inputError: {
            borderColor: "#FF3B30",
        },
        errorText: {
            color: "#FF3B30",
            fontSize: 14,
            marginTop: 4,
        },
        phoneInputRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        codePicker: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            width: 100,
            minHeight: 56,
        },
        mobileNumberInput: {
            flex: 1,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 16,
            fontSize: 16,
            color: colors.textPrimary,
            minHeight: 56,
        },
        loadingInline: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: 8,
        },
        loadingInlineText: {
            color: colors.textSecondary,
            fontSize: 14,
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
        buttonDisabled: {
            opacity: 0.6,
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
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        datePickerContainer: {
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 16,
        },
        datePickerDone: {
            padding: 16,
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        datePickerDoneText: {
            color: colors.primary,
            fontSize: 16,
            fontWeight: '600',
        },
    });
}