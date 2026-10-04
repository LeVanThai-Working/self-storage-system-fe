import * as SecureStore from "expo-secure-store";

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";

export const tokenStorage = {
  getAccessToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to read Access Token from SecureStore:", error);
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to read Refresh Token from SecureStore:", error);
      return null;
    }
  },

  setTokens: async (accessToken: string, refreshToken?: string): Promise<void> => {
    try {
      if (!accessToken || typeof accessToken !== "string") {
        throw new Error(`Invalid accessToken (expected string, received: ${typeof accessToken})`);
      }
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);

      if (refreshToken && typeof refreshToken === "string") {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error("Failed to persist tokens into SecureStore:", error);
      throw error;
    }
  },

  clearTokens: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Failed to clear tokens from SecureStore:", error);
    }
  },
};
