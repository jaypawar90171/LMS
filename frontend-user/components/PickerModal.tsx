import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  loading?: boolean;
  colors: any;
}

const PickerModal: React.FC<PickerModalProps> = ({
  visible,
  onClose,
  title,
  options,
  onSelect,
  loading = false,
  colors,
}) => {
  const styles = createStyles(colors);

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{title}</Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : (
                <ScrollView style={styles.list}>
                  {options.length > 0 ? (
                    options.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.option}
                        onPress={() => {
                          onSelect(item.value);
                          onClose();
                        }}
                      >
                        <Text style={styles.optionText}>{item.label}</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons
                        name="warning-outline"
                        size={22}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.emptyText}>No options found</Text>
                    </View>
                  )}
                </ScrollView>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingVertical: 16,
      maxHeight: "65%",
    },
    modalTitle: {
      textAlign: "center",
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    list: {
      paddingHorizontal: 16,
      marginTop: 10,
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
    emptyState: {
      paddingVertical: 40,
      alignItems: "center",
    },
    emptyText: {
      color: colors.textSecondary,
      marginTop: 8,
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: "center",
    },
    loadingText: {
      marginTop: 10,
      color: colors.textSecondary,
    },
    closeButton: {
      paddingVertical: 16,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
  });

export default PickerModal;
