// Client-safe locale constants (no server-only imports), shared by the
// request config, middleware and client components such as the locale switcher.
export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

/** Locale names are always shown in their own language. */
export const localeLabels: Record<Locale, { label: string; short: string }> = {
  vi: { label: "Tiếng Việt", short: "VI" },
  en: { label: "English", short: "EN" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
