import { getRequestConfig } from "next-intl/server";

export const locales = ["vi", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve locale from request, fall back to defaultLocale if invalid
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
