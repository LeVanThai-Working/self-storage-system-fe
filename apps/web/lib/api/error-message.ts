"use client";

import { useTranslations } from "next-intl";
import { AppApiError } from "./axios";

type ErrorOverrides = Partial<Record<string, string>>;

/** True when the backend rejected the request body (MESSAGE_CODE_101 with Zod issues). */
export function isValidationError(error: unknown) {
  return error instanceof AppApiError && Array.isArray(error.errors);
}

/**
 * Resolves a user-facing message for an API error: a context-specific override
 * for the messageCode, then the translated messageCode, then the backend message,
 * then a generic fallback.
 */
export function useApiErrorMessage() {
  const tApi = useTranslations("api");
  const tCommon = useTranslations("common");

  return (error: unknown, overrides: ErrorOverrides = {}) => {
    if (error instanceof AppApiError) {
      // statusCode 0 = no response from the server (see axios interceptor)
      if (error.statusCode === 0) return tCommon("networkError");
      const code = error.messageCode;
      if (code && overrides[code]) return overrides[code];
      if (code && tApi.has(code)) return tApi(code, { 0: "" }).trim();
      if (error.message) return error.message;
    }
    return tCommon("error");
  };
}
