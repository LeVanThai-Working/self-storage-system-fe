import {
  formatMessage,
  resolveMessageCode,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { AppApiError } from "@/lib/api/axios";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const VALIDATION_MESSAGE_ALIAS: Record<string, string> = {
  "OTP must be 6 digits": "otpInvalid",
  "New password must be different from current password": "newPasswordDifferent",
};

function isMissingTranslationResult(result: string, key: string): boolean {
  if (!result) return true;
  const lower = result.toLowerCase();
  return (
    result === key || lower.includes("missing") || (result.startsWith("[") && result.endsWith("]"))
  );
}

/**
 * Translates a Zod field validation error message (which may be a camelCase key
 * like `emailRequired`, `passwordMin`, `fullNameMin`, `phoneInvalid`, etc.)
 * into a localized human-readable sentence.
 */
export function translateValidationError(rawMessage: string | undefined, t: TranslateFn): string {
  if (!rawMessage) return "";

  const normalizedKey = VALIDATION_MESSAGE_ALIAS[rawMessage] ?? rawMessage;

  // 1. Check `validation.<key>` in locale JSON
  const validationKey = `validation.${normalizedKey}`;
  const translatedValidation = t(validationKey);
  if (!isMissingTranslationResult(translatedValidation, validationKey)) {
    return translatedValidation;
  }

  // 2. Check `auth.<key>` in locale JSON
  const authKey = `auth.${normalizedKey}`;
  const translatedAuth = t(authKey);
  if (!isMissingTranslationResult(translatedAuth, authKey)) {
    return translatedAuth;
  }

  return rawMessage;
}

export interface ResolveMobileApiErrorOptions {
  locale?: MessageLocale;
  defaultSubject?: string;
  params?: (string | number)[];
  fallbackMessage?: string;
}

/**
 * Resolves an API error into a localized message using the shared `resolveMessageCode`
 * and `formatMessage` utilities from `@self-storage-system-fe/shared`.
 */
export function resolveMobileApiError(
  error: unknown,
  t: TranslateFn,
  options: ResolveMobileApiErrorOptions = {}
): string {
  const { locale = "vi", defaultSubject, params, fallbackMessage = t("common.error") } = options;

  if (error instanceof AppApiError) {
    if (error.messageCode) {
      const apiTranslationKey = `api.${error.messageCode}`;
      const localizedTemplate = t(apiTranslationKey);
      const hasCustomTemplate = !isMissingTranslationResult(localizedTemplate, apiTranslationKey);

      const resolved = resolveMessageCode(error.messageCode, {
        locale,
        params,
        rawMessage: error.message,
        defaultSubject,
        customDictionary: hasCustomTemplate
          ? { [error.messageCode]: localizedTemplate }
          : undefined,
      });

      if (resolved) {
        return resolved;
      }
    }

    if (error.message) {
      if (error.message.includes("{0}") && (params?.length || defaultSubject)) {
        return formatMessage(error.message, params ?? [defaultSubject]);
      }
      return error.message;
    }
  } else if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
