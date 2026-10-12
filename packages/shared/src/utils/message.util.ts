import {
  MESSAGE_DICTIONARY_EN,
  MESSAGE_DICTIONARY_VI,
  type MessageCode,
} from "../constants/messageCode";

export type MessageLocale = "vi" | "en";

export type MessageParam = string | number | undefined | null;

/**
 * Dictionary of common entity/field names returned by the Backend in `{0}` placeholders,
 * mapped to human-readable Vietnamese and English labels.
 */
export const ENTITY_SUBJECT_DICTIONARY: Record<string, { vi: string; en: string }> = {
  user: { vi: "Người dùng", en: "User" },
  users: { vi: "Người dùng", en: "Users" },
  account: { vi: "Tài khoản", en: "Account" },
  email: { vi: "Email", en: "Email" },
  password: { vi: "Mật khẩu", en: "Password" },
  phone: { vi: "Số điện thoại", en: "Phone number" },
  phonenumber: { vi: "Số điện thoại", en: "Phone number" },
  "phone number": { vi: "Số điện thoại", en: "Phone number" },
  otp: { vi: "Mã OTP", en: "OTP" },
  token: { vi: "Phiên đăng nhập", en: "Token" },
  role: { vi: "Vai trò", en: "Role" },
  facility: { vi: "Cơ sở kho", en: "Facility" },
  facilities: { vi: "Cơ sở kho", en: "Facilities" },
  unittype: { vi: "Loại kho", en: "Unit type" },
  "unit type": { vi: "Loại kho", en: "Unit type" },
  unit_type: { vi: "Loại kho", en: "Unit type" },
  storageunit: { vi: "Kho lưu trữ", en: "Storage unit" },
  "storage unit": { vi: "Kho lưu trữ", en: "Storage unit" },
  storage_unit: { vi: "Kho lưu trữ", en: "Storage unit" },
  amenity: { vi: "Tiện ích", en: "Amenity" },
  amenities: { vi: "Tiện ích", en: "Amenities" },
  offering: { vi: "Gói thuê kho", en: "Storage offering" },
  "unit type offering": { vi: "Gói loại kho", en: "Unit type offering" },
  "facility unit type offering": {
    vi: "Gói loại kho tại cơ sở",
    en: "Facility unit type offering",
  },
  "amenity offering": { vi: "Gói tiện ích", en: "Amenity offering" },
  "facility amenity offering": { vi: "Gói tiện ích tại cơ sở", en: "Facility amenity offering" },
  reservation: { vi: "Đơn đặt chỗ", en: "Reservation" },
  contract: { vi: "Hợp đồng", en: "Contract" },
  invoice: { vi: "Hóa đơn", en: "Invoice" },
  payment: { vi: "Thanh toán", en: "Payment" },
  manager: { vi: "Quản lý", en: "Manager" },
};

/**
 * Translates an entity/field subject (e.g., "Facility", "Email", "User") into the target locale.
 */
export function translateMessageSubject(
  subject: string | number,
  locale: MessageLocale = "vi"
): string {
  if (typeof subject === "number") {
    return String(subject);
  }
  const trimmed = subject.trim();
  if (!trimmed) return "";

  const normalizedKey = trimmed
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .trim();

  const matched =
    ENTITY_SUBJECT_DICTIONARY[normalizedKey] ?? ENTITY_SUBJECT_DICTIONARY[trimmed.toLowerCase()];

  if (matched) {
    return matched[locale];
  }

  return trimmed;
}

/**
 * Replaces positional placeholders `{0}`, `{1}`, `{2}`, ... in a message template.
 *
 * Examples:
 * - `formatMessage("{0} already exists", "Email")` -> `"Email already exists"`
 * - `formatMessage("{0} already exists", "Facility")` -> `"Facility already exists"`
 * - `formatMessage("{0} đã tồn tại trong hệ thống", ["Email"])` -> `"Email đã tồn tại trong hệ thống"`
 */
export function formatMessage(
  template: string,
  ...args: (MessageParam | MessageParam[])[]
): string {
  if (!template) return "";

  const flatArgs: MessageParam[] =
    args.length === 1 && Array.isArray(args[0]) ? args[0] : (args as MessageParam[]);

  const replaced = template.replace(/\{(\d+)\}/g, (_match, indexStr: string) => {
    const idx = Number(indexStr);
    const val = flatArgs[idx];
    if (val === undefined || val === null || val === "") {
      return "";
    }
    return String(val);
  });

  return replaced.replace(/\s{2,}/g, " ").trim();
}

/**
 * Extracts dynamic positional arguments (such as `{0}`) by matching the backend's raw English
 * message (e.g. "Email Already Exists" or "Facility Not Found") against `MESSAGE_DICTIONARY_EN`.
 */
export function extractMessageParamsFromRaw(
  rawMessage?: string | null,
  messageCode?: MessageCode | string | null
): string[] {
  if (!rawMessage || !messageCode) return [];

  const enTemplate = MESSAGE_DICTIONARY_EN[messageCode];
  if (!enTemplate || !enTemplate.includes("{0}")) return [];

  const escapedTemplate = enTemplate
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\{\d+\\\}/g, "(.+?)");

  const regex = new RegExp(`^${escapedTemplate}[.!]*$`, "i");
  const match = rawMessage.trim().match(regex);
  if (match && match.length > 1) {
    return match.slice(1).map((item) => item.trim());
  }

  if (messageCode === "MESSAGE_CODE_307") {
    const altMatch = rawMessage
      .trim()
      .match(
        /insufficient(?:\s+available)?\s+(?:amenity\s+)?quantity\s+for(?:\s+amenity)?\s+(.+?)[.!]*$/i
      );
    if (altMatch?.[1]) {
      return [altMatch[1].trim()];
    }
  }

  return [];
}

export interface ResolveMessageCodeOptions {
  locale?: MessageLocale;
  params?: MessageParam | MessageParam[];
  rawMessage?: string | null;
  defaultSubject?: string;
  customDictionary?: Record<string, string>;
}

/**
 * Resolves a backend `MESSAGE_CODE_*` into a localized, human-readable message with `{0}` replaced.
 *
 * Priority for `{0}` replacement:
 * 1. Explicit `options.params` passed by the caller (e.g., `"Email"` or `["Facility"]`).
 * 2. Extracted subject from `options.rawMessage` returned by the Backend (e.g., `"Email Already Exists"` -> `"Email"`).
 * 3. `options.defaultSubject` fallback if provided.
 */
export function resolveMessageCode(
  messageCode?: MessageCode | string | null,
  options: ResolveMessageCodeOptions = {}
): string {
  const { locale = "vi", params, rawMessage, defaultSubject, customDictionary } = options;

  const dictionary =
    customDictionary ?? (locale === "en" ? MESSAGE_DICTIONARY_EN : MESSAGE_DICTIONARY_VI);

  const template = messageCode ? dictionary[messageCode] : undefined;

  if (!template) {
    return rawMessage?.trim() || "";
  }

  if (!template.includes("{0}")) {
    return template;
  }

  const explicitParams: MessageParam[] =
    params !== undefined ? (Array.isArray(params) ? params : [params]) : [];

  const hasExplicitParams = explicitParams.some(
    (p) => p !== undefined && p !== null && String(p).trim() !== ""
  );

  let resolvedParams: string[] = [];

  if (hasExplicitParams) {
    resolvedParams = explicitParams.map((p) =>
      p !== undefined && p !== null ? translateMessageSubject(p, locale) : ""
    );
  } else {
    const extracted = extractMessageParamsFromRaw(rawMessage, messageCode);
    if (extracted.length > 0) {
      resolvedParams = extracted.map((item) => translateMessageSubject(item, locale));
    } else if (defaultSubject) {
      resolvedParams = [translateMessageSubject(defaultSubject, locale)];
    } else {
      resolvedParams = [locale === "en" ? "Data" : "Dữ liệu"];
    }
  }

  return formatMessage(template, resolvedParams);
}
