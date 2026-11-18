import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHECK_IN_DATE_VALIDATION_STORAGE_KEY,
  formatVietnamDateLabel,
  getVietnamDateKey,
  isBeforeScheduledDateVN,
  isBlockedByCheckInDateValidation,
  readStoredCheckInDateValidation,
  useCheckInDateValidationStore,
  writeStoredCheckInDateValidation,
} from "../../apps/web/features/system-admin/checkInDateValidation";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => store.get(key) ?? null,
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
}

describe("Check-in date validation helpers", () => {
  it("normalizes Vietnam UTC+7 ISO timestamps and YYYY-MM-DD strings to the same date key", () => {
    expect(getVietnamDateKey("2026-11-20T00:00:00+07:00")).toBe("2026-11-20");
    expect(getVietnamDateKey("2026-11-19T17:00:00.000Z")).toBe("2026-11-20");
    expect(getVietnamDateKey("2026-11-20T00:00:00.000Z")).toBe("2026-11-20");
    expect(getVietnamDateKey("2026-11-20")).toBe("2026-11-20");
    expect(getVietnamDateKey("")).toBeNull();
    expect(getVietnamDateKey("not-a-date")).toBeNull();
  });

  it("formats Vietnam calendar dates as DD/MM/YYYY", () => {
    expect(formatVietnamDateLabel("2026-11-19T17:00:00.000Z")).toBe("20/11/2026");
    expect(formatVietnamDateLabel("2026-11-20")).toBe("20/11/2026");
    expect(formatVietnamDateLabel(null)).toBe("—");
  });

  it("detects when current Vietnam date is before scheduled check-in date", () => {
    const scheduledVnMidnight = "2026-11-19T17:00:00.000Z"; // 2026-11-20 00:00 VN
    const scheduledUtcMidnight = "2026-11-20T00:00:00.000Z"; // 2026-11-20 07:00 VN

    const vnNov19Late = Date.parse("2026-11-19T23:59:00+07:00");
    const vnNov20Early = Date.parse("2026-11-20T00:01:00+07:00");
    const vnNov21 = Date.parse("2026-11-21T09:00:00+07:00");

    expect(isBeforeScheduledDateVN(scheduledVnMidnight, vnNov19Late)).toBe(true);
    expect(isBeforeScheduledDateVN(scheduledUtcMidnight, vnNov19Late)).toBe(true);

    expect(isBeforeScheduledDateVN(scheduledVnMidnight, vnNov20Early)).toBe(false);
    expect(isBeforeScheduledDateVN(scheduledUtcMidnight, vnNov20Early)).toBe(false);

    expect(isBeforeScheduledDateVN(scheduledVnMidnight, vnNov21)).toBe(false);
  });

  it("only blocks early check-in when validation is enabled", () => {
    const scheduled = "2026-11-20T00:00:00+07:00";
    const before = Date.parse("2026-11-18T10:00:00+07:00");
    const onDate = Date.parse("2026-11-20T08:00:00+07:00");

    expect(isBlockedByCheckInDateValidation(scheduled, true, before)).toBe(true);
    expect(isBlockedByCheckInDateValidation(scheduled, false, before)).toBe(false);
    expect(isBlockedByCheckInDateValidation(scheduled, true, onDate)).toBe(false);
    expect(isBlockedByCheckInDateValidation(null, true, before)).toBe(false);
  });
});

describe("Check-in date validation store & localStorage persistence", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
    useCheckInDateValidationStore.setState({ enabled: true, hydrated: false });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to enabled (true) when localStorage has no value or invalid value", () => {
    expect(readStoredCheckInDateValidation()).toBe(true);
    localStorage.setItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY, "unexpected");
    expect(readStoredCheckInDateValidation()).toBe(true);
  });

  it("persists toggle changes to localStorage and hydrates cleanly", () => {
    writeStoredCheckInDateValidation(false);
    expect(localStorage.getItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY)).toBe("false");
    expect(readStoredCheckInDateValidation()).toBe(false);

    useCheckInDateValidationStore.getState().hydrate();
    expect(useCheckInDateValidationStore.getState().enabled).toBe(false);
    expect(useCheckInDateValidationStore.getState().hydrated).toBe(true);

    useCheckInDateValidationStore.getState().toggle();
    expect(useCheckInDateValidationStore.getState().enabled).toBe(true);
    expect(localStorage.getItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY)).toBe("true");

    useCheckInDateValidationStore.getState().setEnabled(false);
    expect(useCheckInDateValidationStore.getState().enabled).toBe(false);
    expect(localStorage.getItem(CHECK_IN_DATE_VALIDATION_STORAGE_KEY)).toBe("false");
  });
});
