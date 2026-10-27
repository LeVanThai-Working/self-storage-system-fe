import { setRequestLocale } from "next-intl/server";
import { CustomerLayout } from "@/features/customer/components/CustomerLayout";

export default async function CustomerRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CustomerLayout>{children}</CustomerLayout>;
}
