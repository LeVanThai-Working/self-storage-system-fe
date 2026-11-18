"use client";

import React from "react";
import {
  Boxes,
  Building2,
  CalendarCheck,
  CalendarClock,
  FileSignature,
  FileText,
  Headset,
  LayoutDashboard,
  Receipt,
  ReceiptText,
  RotateCcw,
  TriangleAlert,
  ArrowLeftRight,
  BarChart3,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { useMyFacility } from "@/features/storage-unit-management/hooks";

interface FacilityManagerLayoutProps {
  children: React.ReactNode;
}

export const FacilityManagerLayout = ({ children }: FacilityManagerLayoutProps) => {
  const locale = useLocale();
  const t = useTranslations("facilityManager");
  const { data: facility } = useMyFacility();

  const navItems = [
    {
      href: `/${locale}/facility-manager/dashboard`,
      label: t("nav.dashboard"),
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/facility-manager/analytics`,
      label: locale === "en" ? "Analytics & Reports" : "Báo cáo & Thống kê",
      icon: BarChart3,
    },
    {
      href: `/${locale}/facility-manager/reservations`,
      label: t("nav.reservations"),
      icon: CalendarCheck,
    },
    {
      href: `/${locale}/facility-manager/contracts`,
      label: t("nav.contracts"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/facility-manager/signing-authorizations`,
      label: t("nav.signingAuthorizations"),
      icon: FileSignature,
    },
    {
      href: `/${locale}/facility-manager/storage-units`,
      label: t("nav.storageUnits"),
      icon: Boxes,
    },
    {
      href: `/${locale}/facility-manager/access-schedules`,
      label: t("nav.accessSchedules"),
      icon: CalendarClock,
    },
    {
      href: `/${locale}/facility-manager/incidents`,
      label: t("nav.incidents"),
      icon: TriangleAlert,
    },
    {
      href: `/${locale}/facility-manager/support-tickets`,
      label: t("nav.supportTickets"),
      icon: Headset,
    },
    {
      href: `/${locale}/facility-manager/requests`,
      label: t("nav.requests"),
      icon: FileText,
    },
    {
      href: `/${locale}/facility-manager/payments`,
      label: locale === "en" ? "Payments" : "Thanh toán",
      icon: Receipt,
    },
    {
      href: `/${locale}/facility-manager/invoices`,
      label: locale === "en" ? "Invoices & Fees" : "Hóa đơn & Phụ phí",
      icon: ReceiptText,
    },
    {
      href: `/${locale}/facility-manager/reconciliation`,
      label: locale === "en" ? "Reconciliation" : "Đối soát ngân hàng",
      icon: ArrowLeftRight,
    },
    {
      href: `/${locale}/facility-manager/refunds`,
      label: locale === "en" ? "Refund Approvals" : "Phê duyệt hoàn tiền",
      icon: RotateCcw,
    },
  ];

  return (
    <PortalLayout
      homeHref={`/${locale}/facility-manager/dashboard`}
      portalLabel="Facility Portal"
      roleLabel="Facility Manager"
      navSectionLabel={t("nav.sectionFacility")}
      navItems={navItems}
      headerStart={
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-bg px-2.5 py-1 text-xs font-bold text-neutral-main">
          <Building2 className="size-3.5 text-brand" />
          {facility?.name || "Chi nhánh"}
        </span>
      }
    >
      {children}
    </PortalLayout>
  );
};
