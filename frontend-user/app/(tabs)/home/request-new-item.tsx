import { API_BASE_URL } from "@/constants/api";
import { tokenAtom, userAtom } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
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
    View,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";

interface Category {
    _id: string;
    name: string;
    parentCategoryId: string | null;
    description: string;
    itemCount: number;
    availableCount: number;
}
const URGENCY_OPTIONS: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

export default function RequestNewItemScreen() {
    const [user] = useAtom(userAtom);
    const [token] = useAtom(tokenAtom);
    const [loading, setLoading] = useState(false);
    const [allCategories, setAllCategories] = useState<Category[]>([]);
    const [rootCategories, setRootCategories] = useState<Category[]>([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showCustomCategory] = useState(false); 
    const [customCategory] = useState("");
    const { colors } = useTheme();
        
    const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const router = useRouter();

    
    const [formData, setFormData] = useState({
        name: "", 
        description: "", 
        category: "", 
        urgency: "Medium" as 'Low' | 'Medium' | 'High', 
        neededBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
        reason: "", 
    });

    useEffect(() => {
        fetchCategories();
    }, []);
    
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/mobile/categories`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const allCats: Category[] = response.data.data || [];
            setAllCategories(allCats);
            
            
            setRootCategories(allCats.filter((cat: Category) => cat.parentCategoryId === null));
            
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            setRootCategories([]);
        }
    };

    const handleCategoryChange = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            category: categoryId,
        }));
        
        if (errors.category) {
            setErrors(prev => ({ ...prev, category: "" }));
        }
    };

    const handleInputChange = (field: keyof typeof formData, value: string | Date) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: "",
            }));
        }
    };
    
    
    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        
        setShowDatePicker(false); 

        
        if (event.type === 'set' && selectedDate) {
            handleInputChange("neededBy", selectedDate);
        }
        
    };
    


    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        
        if (!formData.name.trim()) {
            newErrors.name = "Item title is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Title must be at least 2 characters long";
        }

        
        if (!formData.category.trim()) {
            newErrors.category = "Category is required";
        }

        
        if (!formData.reason.trim()) {
            newErrors.reason = "Description/Reason for request is required";
        } else if (formData.reason.trim().length < 10) {
            newErrors.reason =
                "Please provide a more detailed reason (at least 10 characters)";
        }
        
        
        
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0); 
        
        if (!formData.neededBy || formData.neededBy < tomorrow) {
            newErrors.neededBy = "A future date is required.";
        }
        
        
        if (!formData.urgency) {
             newErrors.urgency = "Urgency is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        if (!user?.id || !token) {
            Alert.alert("Error", "Please log in to request items");
            return;
        }
        
        setLoading(true);

        try {
            
            const payload = {
                requestedItemName: formData.name.trim(),
                requestedItemDescription: formData.reason.trim(), 
                requestedCategoryId: formData.category.trim(),
                urgency: formData.urgency,
                neededBy: formData.neededBy.toISOString(), 
            };
            
            console.log("Submitting Request Payload:", payload); 

            const response = await axios.post(
                `${API_BASE_URL}/api/mobile/item-request`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data.success) {
                Alert.alert(
                    "Success!",
                    response.data.message || "Your item request has been submitted successfully. We'll notify you when it's processed.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.back(),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error("Failed to submit request:", error);
            const errorMessage =
                error.response?.data?.message ||
                "Failed to submit request. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setFormData({
            name: "",
            description: "",
            category: "",
            urgency: "Medium",
            neededBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            reason: "",
        });
        setErrors({});
    };

    const getCategoryName = () => {
        const category = allCategories.find((c) => c._id === formData.category);
        return category ? category.name : "Select category";
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
                    <Text style={dynamicStyles.headerTitle}>Request New Item</Text>
                    <View style={dynamicStyles.placeholder} />
                </View>

                {/* Form */}
                <View style={dynamicStyles.formContainer}>
                    {/* Item Title */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>
                            Item Title <Text style={dynamicStyles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[dynamicStyles.textInput, errors.name && dynamicStyles.inputError]}
                            placeholder="Enter item title (e.g., Introduction to Algorithms)"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.name}
                            onChangeText={(value) => handleInputChange("name", value)}
                            maxLength={100}
                        />
                        {errors.name ? (
                            <Text style={dynamicStyles.errorText}>{errors.name}</Text>
                        ) : (
                            <Text style={dynamicStyles.helperText}>
                                Be specific about the item you want
                            </Text>
                        )}
                    </View>

                    {/* Categor */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>
                            Category <Text style={dynamicStyles.required}>*</Text>
                        </Text>
                        
                        <TouchableOpacity
                            style={[dynamicStyles.textInput, errors.category && dynamicStyles.inputError]}
                            onPress={() => setShowCategoryPicker(true)}
                        >
                            <Text 
                                style={formData.category ? dynamicStyles.selectedText : dynamicStyles.placeholderText}
                            >
                                {getCategoryName()}
                            </Text>
                        </TouchableOpacity>
                        
                        {errors.category && (
                            <Text style={dynamicStyles.errorText}>{errors.category}</Text>
                        )}
                    </View>

                    {/* Urgency */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>
                            Urgency <Text style={dynamicStyles.required}>*</Text>
                        </Text>
                        <View style={dynamicStyles.urgencyContainer}>
                            {URGENCY_OPTIONS.map(urgency => (
                                <TouchableOpacity
                                    key={urgency}
                                    style={[
                                        dynamicStyles.urgencyButton,
                                        formData.urgency === urgency && dynamicStyles.urgencyButtonActive,
                                        errors.urgency && dynamicStyles.inputError
                                    ]}
                                    onPress={() => handleInputChange("urgency", urgency)}
                                >
                                    <Text
                                        style={[
                                            dynamicStyles.urgencyText,
                                            formData.urgency === urgency && dynamicStyles.urgencyTextActive,
                                        ]}
                                    >
                                        {urgency}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.urgency && (
                            <Text style={dynamicStyles.errorText}>{errors.urgency}</Text>
                        )}
                        <Text style={dynamicStyles.helperText}>
                            How quickly is this item needed?
                        </Text>
                    </View>
                    
                    {/* Needed By Date */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>
                            Needed By Date <Text style={dynamicStyles.required}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={[dynamicStyles.textInput, errors.neededBy && dynamicStyles.inputError]}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Text
                                style={dynamicStyles.selectedText}
                            >
                                {formData.neededBy.toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                        {errors.neededBy && (
                            <Text style={dynamicStyles.errorText}>{errors.neededBy}</Text>
                        )}
                        <Text style={dynamicStyles.helperText}>
                            The latest date you would need this item.
                        </Text>
                    </View>

                    {/* Description (Extra Info) - Optional on UI, kept for user clarity */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>Extra Details (Optional)</Text>
                        <TextInput
                            style={dynamicStyles.textArea}
                            placeholder="Provide any extra details about the item (edition, year, ISBN, etc.)"
                            placeholderTextColor={colors.textSecondary}
                            value={formData.description}
                            onChangeText={(value) => handleInputChange("description", value)}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            maxLength={200}
                        />
                         <View style={dynamicStyles.helperRow}>
                            <Text style={dynamicStyles.helperText}>
                                Optional details that may help locate the exact item
                            </Text>
                            <Text style={dynamicStyles.charCount}>
                                {formData.description.length}/200
                            </Text>
                        </View>
                    </View>

                    {/* Reason for Request (maps to requestedItemDescription - REQUIRED by backend) */}
                    <View style={dynamicStyles.inputGroup}>
                        <Text style={dynamicStyles.label}>
                            Reason for Request <Text style={dynamicStyles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[dynamicStyles.textArea, errors.reason && dynamicStyles.inputError]}
                            placeholder="Explain why you need this item and how it would benefit the library community..."
                            placeholderTextColor={colors.textSecondary}
                            value={formData.reason}
                            onChangeText={(value) => handleInputChange("reason", value)}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        {errors.reason ? (
                            <Text style={dynamicStyles.errorText}>{errors.reason}</Text>
                        ) : (
                            <View style={dynamicStyles.helperRow}>
                                <Text style={dynamicStyles.helperText}>
                                    This description will be reviewed by the admin.
                                </Text>
                                <Text style={dynamicStyles.charCount}>
                                    {formData.reason.length}/500
                                </Text>
                            </View>
                        )}
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
                                    <Ionicons name="send-outline" size={20} color="#FFF" />
                                    <Text style={dynamicStyles.buttonText}>Submit Request</Text>
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
                            Your request will be reviewed by our team. We'll notify you once
                            it's processed.
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
                                {rootCategories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat._id}
                                        style={dynamicStyles.pickerItem}
                                        onPress={() => {
                                            handleCategoryChange(cat._id);
                                            setShowCategoryPicker(false);
                                        }}
                                    >
                                        <Text style={dynamicStyles.pickerItemText}>{cat.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
                
                {/* Date Picker (using @react-native-community/datetimepicker) */}
                {showDatePicker && (
                    <DateTimePicker
                        value={formData.neededBy}
                        mode="date"
                        // Use 'spinner' for iOS (for modal/wheel appearance) or 'default' for Android
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={new Date()}
                        onChange={handleDateChange}
                    />
                )}
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
        minHeight: 120,
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
    // Urgency dynamicStyles
    urgencyContainer: {
        flexDirection: "row",
        gap: 12,
    },
    urgencyButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: "center",
        backgroundColor: colors.cardBackground,
    },
    urgencyButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    urgencyText: {
        fontSize: 14,
        fontWeight: "500",
        color: colors.textPrimary,
    },
    urgencyTextActive: {
        color: "#FFF",
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    pickerContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: '600',
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