import { create } from "zustand";
import type { AuthState } from "./types";

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  setCurrentUser: (user) =>
    set({ currentUser: user, isAuthenticated: Boolean(user), isLoading: false }),
  clearAuth: () => set({ currentUser: null, isAuthenticated: false, isLoading: false }),
}));
