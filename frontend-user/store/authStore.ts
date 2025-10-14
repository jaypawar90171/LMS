import { atom } from "jotai";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/constants/api";
import axios from "axios";

export const userAtom = atom<any | null>(null);
export const tokenAtom = atom<string | null>(null);
export const isLoadingAtom = atom(false);
export const isCheckingAuthAtom = atom(true); // Start true on app load

export const isAuthenticatedAtom = atom((get) => !!get(tokenAtom));

// --- Login Action ---
export const loginAtom = atom(
  null,
  async (get, set, { email, password, rememberMe }: any) => {
    set(isLoadingAtom, true);
    try {
      const result = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        rememberMe,
      });

      const { token, user } = result.data;
      await AsyncStorage.setItem("accessToken", token);
      if (user) {
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }

      set(tokenAtom, token);
      set(userAtom, user || null);

      return { success: true };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Login failed. Please try again.";
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
    await axios.post(`${API_BASE_URL}/auth/register`, formData);
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
  try {
    const token = await AsyncStorage.getItem("accessToken");
    const userJson = await AsyncStorage.getItem("user");

    if (token) {
      set(tokenAtom, token);
      set(userAtom, userJson ? JSON.parse(userJson) : null);
    }
  } catch (error) {
    console.error("Failed to check auth status:", error);
  } finally {
    set(isCheckingAuthAtom, false);
  }
});

// --- Logout Action ---
export const logoutAtom = atom(null, async (get, set) => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
  set(tokenAtom, null);
  set(userAtom, null);
});
