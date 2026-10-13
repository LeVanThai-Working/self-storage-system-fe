import { create } from "zustand";
import type { AuthUser } from "@self-storage-system-fe/shared";
import type { AuthState } from "./types";

function normalizeAuthUser(raw: AuthUser | null): AuthUser | null {
  if (!raw) return null;
  const record = raw as unknown as Record<string, unknown>;
  const nestedUser =
    record.user && typeof record.user === "object"
      ? (record.user as Record<string, unknown>)
      : record;

  const resolvedId =
    typeof nestedUser.id === "string" && nestedUser.id.trim()
      ? nestedUser.id.trim()
      : nestedUser._id != null
        ? String(nestedUser._id)
        : undefined;

  return {
    ...(nestedUser as unknown as AuthUser),
    ...(resolvedId ? { id: resolvedId } : {}),
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  setCurrentUser: (user) => {
    const normalized = normalizeAuthUser(user);
    set({
      currentUser: normalized,
      isAuthenticated: Boolean(normalized),
      isLoading: false,
    });
  },
  clearAuth: () => set({ currentUser: null, isAuthenticated: false, isLoading: false }),
}));
