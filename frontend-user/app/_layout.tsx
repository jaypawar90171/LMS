import SafeScreen from "@/components/SafeScreen";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  checkAuthAtom,
  isCheckingAuthAtom,
  isAuthenticatedAtom,
} from "@/store/authStore";
import { ActivityIndicator, View } from "react-native";
import { useSetAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import COLORS from "@/constants/color";

export default function RootLayout() {
  const checkAuth = useSetAtom(checkAuthAtom);
  const isChecking = useAtomValue(isCheckingAuthAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isChecking) {
      const inAuthGroup = segments[0] === "(auth)";

      console.log("Auth State:", { isAuthenticated, segments, inAuthGroup });

      if (isAuthenticated) {
        if (inAuthGroup) {
          console.log("Redirecting authenticated user to tabs");
          router.replace("/(tabs)/home");
        }
      } else {
        if (!inAuthGroup) {
          console.log("Redirecting unauthenticated user to login");
          router.replace("/");
        }
      }
    }
  }, [isAuthenticated, segments, isChecking]);

  // Show loading indicator while checking auth
  if (isChecking) {
    return (
      <SafeAreaProvider>
        <SafeScreen>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: COLORS.background,
            }}
          >
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </SafeScreen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth group screens */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          {/* Tab group screens */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </SafeScreen>
    </SafeAreaProvider>
  );
}
