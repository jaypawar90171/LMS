import { atom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/services";
import { STORAGE_KEYS } from "@/constants";

export const userAtom = atom<any | null>(null);
export const tokenAtom = atom<string | null>(null);
export const isLoadingAtom = atom(false);
export const isCheckingAuthAtom = atom(true); // Start true on app load
export const requirePasswordChangeAtom  = atom(false);

export const isAuthenticatedAtom = atom((get) => !!get(tokenAtom));

// --- Login Action ---
export const loginAtom = atom(
  null,
  async (get, set, { email, password, rememberMe }: any) => {
    console.log('Login attempt started for:', email);
    set(isLoadingAtom, true);
    
    try {
      console.log('Calling auth service login...');
      const result = await authService.login({ email, password });
      console.log('Auth service response:', result);

      if (result.data.requirePasswordChange) {
        const { token, message } = result.data;
        await AsyncStorage.setItem("temp_auth_token", token);
        // await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        set(tokenAtom, token);
        set(requirePasswordChangeAtom, true);
        return {
          success: true,
          requirePasswordChange: true,
          message: message || "Password change required.",
        };
      }

      const { token, user } = result.data;
      console.log("token", token)
      console.log('Login successful, storing token and user data');
      await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }

      set(tokenAtom, token);
      set(userAtom, user || null);

      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      let errorMessage = "Login failed. Please try again.";
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      return { success: false, error: errorMessage };
    } finally {
      set(isLoadingAtom, false);
    }
  }
);

// --- Register Action ---
export const registerAtom = atom(null, async (get, set, formData: any) => {
  set(isLoadingAtom, true);
  try {
    await authService.register(formData);
    return { success: true };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error || "Registration failed. Please try again.";
    return { success: false, error: errorMessage };
  } finally {
    set(isLoadingAtom, false);
  }
});

// --- Check Auth Action ---
export const checkAuthAtom = atom(null, async (get, set) => {
  console.log('Starting auth check...');
  
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    console.log("token", token)
    console.log("userJson", userJson)
    
    console.log('Auth check - Token exists:', !!token);
    console.log('Auth check - User data exists:', !!userJson);
    
    if (token) {
      set(tokenAtom, token);
      
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          set(userAtom, user);
          console.log('User authenticated with stored data');
        } catch (parseError) {
          console.error('Failed to parse user data:', parseError);
          set(userAtom, null);
        }
      } else {
        console.log('Token exists but no user data');
        set(userAtom, null);
      }
    } else {
      set(tokenAtom, null);
      set(userAtom, null);
      console.log('No token found - user not authenticated');
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    set(tokenAtom, null);
    set(userAtom, null);
  } finally {
    set(isCheckingAuthAtom, false);
    console.log('Auth check completed');
  }
});

// --- Logout Action ---
export const logoutAtom = atom(null, async (get, set) => {
  try {
    await authService.logout();
  } catch (error) {
    console.error('Logout API call failed:', error);
  }
  
  await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  set(tokenAtom, null);
  set(userAtom, null);
});
