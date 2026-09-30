import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate the incoming locale value
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering optimization with Next.js
  setRequestLocale(locale);

  // Load the corresponding translation messages
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
