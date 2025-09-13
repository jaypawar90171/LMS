import Cookies from "js-cookie";

const AUTH_KEYS = {
  ACCESS_TOKEN: "accessToken",
  REFRESH_TOKEN: "refreshToken",
} as const;

export const auth = {
  setTokens(accessToken: string, refreshToken: string, rememberMe: boolean) {
    sessionStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
    Cookies.set(AUTH_KEYS.REFRESH_TOKEN, refreshToken, {
      expires: rememberMe ? 30 : undefined,
      secure: true,
      sameSite: "strict",
    });
  },

  setAccessToken(accessToken: string) {
    sessionStorage.setItem(AUTH_KEYS.ACCESS_TOKEN, accessToken);
  },

  getAccessToken() {
    return sessionStorage.getItem(AUTH_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken() {
    return Cookies.get(AUTH_KEYS.REFRESH_TOKEN);
  },

  clearTokens() {
    sessionStorage.removeItem(AUTH_KEYS.ACCESS_TOKEN);
    Cookies.remove(AUTH_KEYS.REFRESH_TOKEN);
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
