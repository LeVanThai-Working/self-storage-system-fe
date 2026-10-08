import { create } from "zustand";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import type { AuthUser } from "../types/auth.types";
import { getMeApi, logoutApi } from "../api/auth.api";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  setAuth: (user: AuthUser) => void;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user: AuthUser) => {
    set({
      user,
      isAuthenticated: true,
      isInitializing: false,
    });
  },

  logout: async () => {
    try {
      await logoutApi();
    } finally {
      await tokenStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    }
  },

  initAuth: async () => {
    set({ isInitializing: true });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      if (!accessToken) {
        set({ user: null, isAuthenticated: false, isInitializing: false });
        return;
      }

      // Restore user session by querying the authenticated profile
      const user = await getMeApi();
      set({ user, isAuthenticated: true, isInitializing: false });
    } catch (error) {
      console.warn("Session restore failed or access token expired:", error);
      await tokenStorage.clearTokens();
      set({ user: null, isAuthenticated: false, isInitializing: false });
    }
  },
}));
