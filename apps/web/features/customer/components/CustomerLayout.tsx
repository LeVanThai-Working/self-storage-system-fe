"use client";

import { useLocale, useTranslations } from "next-intl";
import { Building2, CalendarCheck, Search } from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";

export function CustomerLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("customer");
  const locale = useLocale();

  const navItems = [
    { href: `/${locale}/customer/facilities`, label: t("nav.facilities"), icon: Building2 },
    { href: `/${locale}/customer/search`, label: t("nav.search"), icon: Search },
    {
      href: `/${locale}/customer/reservations`,
      label: t("nav.reservations"),
      icon: CalendarCheck,
    },
  ];

  return (
    <PortalLayout
      homeHref={`/${locale}/customer`}
      portalLabel={t("roleLabel")}
      roleLabel={t("roleLabel")}
      navItems={navItems}
      showNotifications={false}
      profileEditable={false}
      contentClassName="mx-auto max-w-[1280px]"
    >
      {children}
    </PortalLayout>
  );
}
