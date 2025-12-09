import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function _layout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const dynamicStyles = useMemo(() => createDynamicStyles(colors), [colors]);
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
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
                focused ? dynamicStyles.iconContainerActive : dynamicStyles.iconContainer
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
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/home');
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? dynamicStyles.iconContainerActive : dynamicStyles.iconContainer
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
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/explore');
          },
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? dynamicStyles.iconContainerActive : dynamicStyles.iconContainer
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
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/search');
          },
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? dynamicStyles.iconContainerActive : dynamicStyles.iconContainer
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
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/requests');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <View
              style={
                focused ? dynamicStyles.iconContainerActive : dynamicStyles.iconContainer
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
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/profile');
          },
        }}
      />
    </Tabs>
  );
}

function createDynamicStyles(colors: any) {
  return StyleSheet.create({
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
      backgroundColor: `${colors.primary}15`,
    },
  });
}