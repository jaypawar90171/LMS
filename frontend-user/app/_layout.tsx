import SafeScreen from "@/components/SafeScreen";
import COLORS from "@/constants/color";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  checkAuthAtom,
  isAuthenticatedAtom,
  isCheckingAuthAtom,
  requirePasswordChangeAtom,
} from "@/store/authStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from "react-native-safe-area-context";

function AuthenticatedApp() {
  const checkAuth = useSetAtom(checkAuthAtom);
  const isChecking = useAtomValue(isCheckingAuthAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const requirePasswordChange = useAtomValue(requirePasswordChangeAtom);
  const segments = useSegments();
  const router = useRouter();
  const [hasError, setHasError] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('App starting - checking auth...');
    
    const initAuth = async () => {
      try {
        await checkAuth();
        setInitialized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setInitialized(true);
        setHasError(true);
      }
    };
    
    initAuth();
  }, []);

  useEffect(() => {
    if (initialized && !isChecking) {
      console.log("Auth check complete:", { isAuthenticated });
      
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!isAuthenticated && !inAuthGroup) {
        console.log("Not authenticated - redirecting to login");
        router.replace('/(auth)' as any);
      }  

      if (isAuthenticated && requirePasswordChange) {
        const path = (segments as string[]) || [];
        router.replace("/profile/change-password" as any);
        return;
      }
      
      if (isAuthenticated && !inAuthGroup) {
        // nothing - user is on protected route
      } else if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)/home' as any);
      }
    }
  }, [isAuthenticated, isChecking, initialized, segments]);

  if (hasError) {
    return (
      <SafeScreen>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: COLORS.background,
            padding: 20,
          }}
        >
          <Text style={{ color: COLORS.textPrimary, fontSize: 18, marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
            Please restart the app
          </Text>
        </View>
      </SafeScreen>
    );
  }

  if (!initialized || isChecking) {
    return (
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
          <Text style={{ color: COLORS.textPrimary, marginTop: 10 }}>
            Loading...
          </Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(stack)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="dark" />
    </SafeScreen>
  );
}

// Root component that sets up all providers
export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider>
          <SafeAreaProvider>
            <AuthenticatedApp />
          </SafeAreaProvider>
        </Provider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}