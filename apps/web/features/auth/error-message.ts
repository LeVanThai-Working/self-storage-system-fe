"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  extractMessageParamsFromRaw,
  resolveMessageCode,
  translateMessageSubject,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";

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
  const locale = useLocale() === "en" ? "en" : "vi";

  return (error: unknown, overrides: ErrorOverrides = {}) => {
    if (error instanceof AppApiError) {
      // statusCode 0 = no response from the server (see axios interceptor)
      if (error.statusCode === 0) return tCommon("networkError");
      const code = error.messageCode;
      if (code && overrides[code]) return overrides[code];
      if (code && tApi.has(code)) {
        const extracted = extractMessageParamsFromRaw(error.message, code);
        const param0 = extracted[0] ? translateMessageSubject(extracted[0], locale) : "";
        return tApi(code, { 0: param0 })
          .replace(/\s{2,}/g, " ")
          .trim();
      }
      if (code) {
        const resolved = resolveMessageCode(code, {
          locale,
          rawMessage: error.message,
        });
        if (resolved) return resolved;
      }
      if (error.message) return error.message;
    }
    return tCommon("error");
  };
}
