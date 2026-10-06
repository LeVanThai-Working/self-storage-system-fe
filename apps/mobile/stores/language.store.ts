import { create } from "zustand";
import i18n from "@/lib/i18n/config";

export type SupportedLocale = "vi" | "en";

interface LanguageState {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  toggleLocale: () => void;
}

const getInitialLocale = (): SupportedLocale => {
  return i18n.locale && i18n.locale.toLowerCase().startsWith("en") ? "en" : "vi";
};

export const useLanguageStore = create<LanguageState>((set, get) => ({
  locale: getInitialLocale(),

  setLocale: (locale: SupportedLocale) => {
    i18n.locale = locale;
    set({ locale });
  },

  toggleLocale: () => {
    const nextLocale: SupportedLocale = get().locale === "vi" ? "en" : "vi";
    i18n.locale = nextLocale;
    set({ locale: nextLocale });
  },
}));

/**
 * Hook providing reactive translation function synchronized with locale state.
 */
export function useTranslation() {
  const { locale, setLocale, toggleLocale } = useLanguageStore();

  const t = (key: string, options?: Record<string, unknown>): string => {
    // Ensure active i18n instance reflects current selected locale
    i18n.locale = locale;
    return i18n.t(key, options);
  };

  return { t, locale, setLocale, toggleLocale };
}
