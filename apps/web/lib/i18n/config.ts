import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale } from "./locales";

export { locales, defaultLocale, type Locale } from "./locales";

export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve locale from request, fall back to defaultLocale if invalid
  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
