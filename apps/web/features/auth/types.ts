import type { AuthUser } from "@self-storage-system-fe/shared";

export interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  /** True until the first /auth/me request settles. */
  isLoading: boolean;
  setCurrentUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
}
