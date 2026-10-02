import { SystemAdminLayout } from "@/features/system-admin/components/SystemAdminLayout";
import { setRequestLocale } from "next-intl/server";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <SystemAdminLayout>{children}</SystemAdminLayout>;
}
