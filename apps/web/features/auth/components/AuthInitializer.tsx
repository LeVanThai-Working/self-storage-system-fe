"use client";

import { useCurrentUser } from "@/features/auth/hooks";

/** Loads the session user into the auth store once on app start. */
export function AuthInitializer() {
  useCurrentUser();
  return null;
}
