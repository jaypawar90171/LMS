import React, { useEffect } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CustomToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onHide?: () => void;
}

const CustomToast: React.FC<CustomToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Hide toast
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onHide?.();
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return { backgroundColor: "#4CAF50" };
      case "error":
        return { backgroundColor: "#F44336" };
      case "warning":
        return { backgroundColor: "#FF9800" };
      case "info":
        return { backgroundColor: "#2196F3" };
      default:
        return { backgroundColor: "#2196F3" };
    }
  };

  const getIconName = () => {
    switch (type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      case "warning":
        return "warning";
      case "info":
        return "information-circle";
      default:
        return "information-circle";
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getToastStyle(),
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Ionicons name={getIconName()} size={20} color="#FFF" />
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
        <Ionicons name="close" size={16} color="#FFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  toastText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
});

export default CustomToast;
