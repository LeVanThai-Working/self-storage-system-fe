import { useEffect } from "react";
import { create } from "zustand";

export const CHECK_IN_DATE_VALIDATION_STORAGE_KEY = "storagehub:check-in-date-validation-enabled";

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

function getSafeLocalStorage(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  try {
    return "localStorage" in globalThis && globalThis.localStorage ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function formatVnEpochToDateKey(epochMs: number): string {
  const vnDate = new Date(epochMs + VN_OFFSET_MS);
  const y = vnDate.getUTCFullYear();
  const m = String(vnDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(vnDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Returns today's calendar date key (YYYY-MM-DD) in Vietnam time (UTC+7).
 */
export function getTodayVietnamDateKey(referenceNowMs = Date.now()): string {
  return formatVnEpochToDateKey(referenceNowMs);
}

/**
 * Converts a date input (ISO string, YYYY-MM-DD, or Date) to a Vietnam (UTC+7) YYYY-MM-DD key.
 */
export function getVietnamDateKey(input?: string | Date | null): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const ms = Date.parse(trimmed);
    return Number.isNaN(ms) ? null : formatVnEpochToDateKey(ms);
  }

  const ms = input.getTime();
  return Number.isNaN(ms) ? null : formatVnEpochToDateKey(ms);
}

/**
 * Formats a scheduled date as DD/MM/YYYY in Vietnam calendar time (UTC+7).
 */
export function formatVietnamDateLabel(targetDate?: string | null): string {
  const key = getVietnamDateKey(targetDate);
  if (!key) return "—";
  const [year, month, day] = key.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Returns true when today's Vietnam calendar date is strictly before the scheduled date.
 */
export function isBeforeScheduledDateVN(
  targetDate?: string | null,
  referenceNowMs = Date.now()
): boolean {
  const targetKey = getVietnamDateKey(targetDate);
  if (!targetKey) return false;
  return getTodayVietnamDateKey(referenceNowMs) < targetKey;
}

/**
 * Returns true when check-in date validation is active and the scheduled date has not arrived yet.
 */
export function isBlockedByCheckInDateValidation(
  targetDate?: string | null,
  validationEnabled = true,
  referenceNowMs = Date.now()
): boolean {
  return Boolean(validationEnabled) && isBeforeScheduledDateVN(targetDate, referenceNowMs);
}

/**
 * Reads persisted toggle state from localStorage. Defaults to `true` (strict validation ON).
 */
export function readStoredCheckInDateValidation(): boolean {
  const storage = getSafeLocalStorage();
  if (!storage) return true;
  try {
    return storage.getItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function writeStoredCheckInDateValidation(enabled: boolean): void {
  const storage = getSafeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY, String(enabled));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

interface CheckInDateValidationState {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => void;
  setEnabled: (enabled: boolean) => void;
  toggle: () => void;
}

export const useCheckInDateValidationStore = create<CheckInDateValidationState>((set, get) => ({
  enabled: true,
  hydrated: false,
  hydrate: () => {
    const stored = readStoredCheckInDateValidation();
    set({ enabled: stored, hydrated: true });
  },
  setEnabled: (enabled) => {
    writeStoredCheckInDateValidation(enabled);
    set({ enabled, hydrated: true });
  },
  toggle: () => {
    const next = !get().enabled;
    writeStoredCheckInDateValidation(next);
    set({ enabled: next, hydrated: true });
  },
}));

/**
 * Subscribes to check-in date validation state, hydrating from localStorage after mount
 * and syncing across open browser tabs via the `storage` event.
 */
export function useCheckInDateValidation() {
  const enabled = useCheckInDateValidationStore((s) => s.enabled);
  const hydrated = useCheckInDateValidationStore((s) => s.hydrated);
  const hydrate = useCheckInDateValidationStore((s) => s.hydrate);
  const setEnabled = useCheckInDateValidationStore((s) => s.setEnabled);
  const toggle = useCheckInDateValidationStore((s) => s.toggle);

  useEffect(() => {
    hydrate();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === CHECK_IN_DATE_VALIDATION_STORAGE_KEY) {
        hydrate();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrate]);

  return { enabled, hydrated, setEnabled, toggle };
}
