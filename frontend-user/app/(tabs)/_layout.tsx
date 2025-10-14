import React from "react";
import { Tabs } from "expo-router";
import COLORS from "@/constants/color";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, Text } from "react-native";

export default function _layout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.cardBackground,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? styles.iconContainerActive : styles.iconContainer
              }
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? styles.iconContainerActive : styles.iconContainer
              }
            >
              <Ionicons
                name={focused ? "compass" : "compass-outline"}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? styles.iconContainerActive : styles.iconContainer
              }
            >
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? styles.iconContainerActive : styles.iconContainer
              }
            >
              <Ionicons
                name={focused ? "notifications" : "notifications-outline"}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? styles.iconContainerActive : styles.iconContainer
              }
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? 24 : 22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    padding: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}15`,
  },
});
